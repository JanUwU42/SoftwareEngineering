import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role, SchrittStatus } from '@prisma/client';
import { notifyCustomerAboutStepUpdate } from '$lib/server/email';

// Helper: Audit Log erstellen
async function createAuditLog(
	userId: string,
	aktion: string,
	details: Record<string, unknown>,
	projektId?: string,
	schrittId?: string
) {
	await prisma.auditLog.create({
		data: { userId, aktion, details: JSON.stringify(details), projektId, schrittId }
	});
}

async function getOrCreateMaterialId(formData: FormData): Promise<string | null> {
	const isNew = formData.get('isNew') === 'true';

	if (isNew) {
		const name = formData.get('newMaterialName') as string;
		const einheit = formData.get('newMaterialUnit') as string;

		if (!name || !einheit) return null;

		// Check ob es das schon gibt (Case insensitive wäre besser, aber hier simple)
		const existing = await prisma.material.findFirst({
			where: { name: { equals: name, mode: 'insensitive' } }
		});
		if (existing) return existing.id;

		// Neu anlegen mit Bestand 0
		const newMat = await prisma.material.create({
			data: { name, einheit, bestand: 0 }
		});
		return newMat.id;
	} else {
		return formData.get('materialId') as string;
	}
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	// 1. AUTH CHECK
	if (!locals.user && !locals.projekt) throw redirect(303, '/');
	if (locals.projekt && locals.projekt.id !== id) throw error(403, 'Zugriff verweigert.');

	if (locals.user && locals.user.role === Role.HANDWERKER) {
		const project = await prisma.projekt.findFirst({
			where: { id, mitarbeiter: { some: { id: locals.user.id } } }
		});
		if (!project) throw error(403, 'Sie sind diesem Projekt nicht zugeordnet.');
	}

	// 2. DB ABFRAGE
	const p = await prisma.projekt.findUnique({
		where: { id },
		include: {
			adresse: true,
			mitarbeiter: { select: { id: true, vorname: true, nachname: true, role: true } },
			schritte: {
				orderBy: { reihenfolge: 'asc' },
				include: {
					materialien: { include: { material: true } },
					bilder: {
						where: locals.projekt ? { freigegeben: true } : {},
						orderBy: { hochgeladenAm: 'desc' }
					},
					notizen: {
						where: locals.projekt ? { sichtbarFuerKunde: true } : {},
						orderBy: { erstelltAm: 'desc' },
						include: { autor: { select: { vorname: true, nachname: true } } }
					},
					pendingUpdates: locals.user
						? {
								where: { status: 'ausstehend' },
								// Hier laden wir auch das Material für Material-Anträge
								include: {
									bearbeiter: { select: { vorname: true, nachname: true } },
									bild: true,
									material: true
								},
								orderBy: { eingereichtAm: 'desc' }
							}
						: undefined
				}
			}
		}
	});

	if (!p) throw error(404, 'Projekt nicht gefunden');

	// 3. GLOBALE RESERVIERUNGEN BERECHNEN
	const activeMaterialsInProject = Array.from(
		new Set(p.schritte.flatMap((s) => s.materialien.map((m) => m.materialId)))
	);

	const reservations = await prisma.materialBedarf.groupBy({
		by: ['materialId'],
		where: {
			materialId: { in: activeMaterialsInProject },
			schritt: { status: { not: 'fertig' } }
		},
		_sum: { menge: true }
	});

	const reservationMap = new Map<string, number>();
	reservations.forEach((r) => reservationMap.set(r.materialId, r._sum.menge ?? 0));

	// 4. MATERIAL AGGREGATION
	const materialMap = new Map<
		string,
		{
			id: string;
			name: string;
			menge: number;
			einheit: string;
			bestand: number;
			globalReserviert: number;
		}
	>();

	for (const s of p.schritte) {
		for (const m of s.materialien) {
			if (!m.material) continue;

			const menge = Number(m.menge);
			const physischerBestand = Number(m.material.bestand);
			const globalReserviert = reservationMap.get(m.material.id) ?? 0;

			const existing = materialMap.get(m.material.id);
			if (existing) {
				existing.menge += menge;
			} else {
				materialMap.set(m.material.id, {
					id: m.material.id,
					name: m.material.name,
					menge: menge,
					einheit: m.material.einheit,
					bestand: physischerBestand,
					globalReserviert: globalReserviert
				});
			}
		}
	}

	// 5. BERECHNUNG
	const materialListe = Array.from(materialMap.values()).map((mat) => {
		const verfuegbarNachReservierung = mat.bestand - mat.globalReserviert;
		let mengeBestellen = 0;

		if (verfuegbarNachReservierung < 0) {
			mengeBestellen = Math.abs(verfuegbarNachReservierung);
		}

		return { ...mat, mengeBestellen };
	});

	const allMaterials = await prisma.material.findMany({ orderBy: { name: 'asc' } });

	let availableHandwerker: any[] = [];
	let pendingUpdatesCount = 0;
	if (locals.user && (locals.user.role === Role.ADMIN || locals.user.role === Role.INNENDIENST)) {
		availableHandwerker = await prisma.user.findMany({
			where: { role: Role.HANDWERKER },
			select: { id: true, vorname: true, nachname: true }
		});
		pendingUpdatesCount = await prisma.handwerkerUpdate.count({
			where: { schritt: { projektId: id }, status: 'ausstehend' }
		});
	}

	// Mapping für Frontend
	return {
		isStaff: !!locals.user,
		userRole: locals.user?.role,
		userId: locals.user?.id,
		availableHandwerker,
		pendingUpdatesCount,
		allMaterials: allMaterials.map((m) => ({ ...m, bestand: Number(m.bestand) })),

		project: {
			id: p.id,
			mitarbeiter: p.mitarbeiter,
			metadata: {
				auftragsnummer: p.auftragsnummer,
				kundenname: p.kundenname,
				projektadresse: {
					strasse: p.adresse?.strasse ?? '',
					hausnummer: p.adresse?.hausnummer ?? '',
					plz: p.adresse?.plz ?? '',
					ort: p.adresse?.ort ?? ''
				},
				projektbezeichnung: p.projektbezeichnung,
				projektbeschreibung: p.projektbeschreibung ?? undefined,
				geplanterStart: p.geplanterStart.toISOString(),
				geplantesEnde: p.geplantesEnde.toISOString()
			},
			schritte: p.schritte.map((schritt) => ({
				id: schritt.id,
				titel: schritt.titel,
				beschreibung: schritt.beschreibung,
				startDatum: schritt.startDatum.toISOString(),
				endDatum: schritt.endDatum.toISOString(),
				status: schritt.status,
				fortschritt: schritt.fortschritt,
				reihenfolge: schritt.reihenfolge,
				material: schritt.materialien.map((m) => ({
					id: m.material.id,
					linkId: m.id,
					name: m.material.name,
					menge: Number(m.menge),
					einheit: m.material.einheit,
					bemerkung: m.bemerkung ?? undefined
				})),
				bilder: schritt.bilder.map((bild) => ({
					id: bild.id,
					url: `data:${bild.mimeType};base64,${Buffer.from(bild.daten).toString('base64')}`,
					beschreibung: bild.beschreibung ?? undefined,
					hochgeladenAm: bild.hochgeladenAm.toISOString(),
					hochgeladenVon: bild.hochgeladenVon,
					freigegeben: bild.freigegeben
				})),
				notizen:
					schritt.notizen?.map((notiz) => ({
						id: notiz.id,
						text: notiz.text,
						erstelltAm: notiz.erstelltAm.toISOString(),
						autorName: `${notiz.autor.vorname} ${notiz.autor.nachname}`,
						sichtbarFuerKunde: notiz.sichtbarFuerKunde
					})) ?? [],

				// PENDING UPDATES MAPPING
				pendingUpdates:
					(schritt.pendingUpdates as any)?.map((update: any) => ({
						id: update.id,
						typ: update.typ,
						neuerStatus: update.neuerStatus,
						neuerFortschritt: update.neuerFortschritt,
						notizText: update.notizText,
						eingereichtAm: update.eingereichtAm.toISOString(),
						bearbeiterName: `${update.bearbeiter.vorname} ${update.bearbeiter.nachname}`,
						eingereichtVonId: update.eingereichtVon,
						bild: update.bild
							? {
									id: update.bild.id,
									url: `data:${update.bild.mimeType};base64,${Buffer.from(update.bild.daten).toString('base64')}`,
									beschreibung: update.bild.beschreibung
								}
							: null,
						// Material Infos
						menge: update.menge,
						materialName: update.material?.name,
						materialEinheit: update.material?.einheit
					})) ?? []
			})),
			materialListe: materialListe,
			erstelltAm: p.erstelltAm.toISOString(),
			aktualisiertAm: p.aktualisiertAm.toISOString()
		}
	};
};

export const actions: Actions = {
	// 1. MATERIAL HINZUFÜGEN (Admin Direkt)
	addMaterialToStep: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);

		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const rawMenge = (data.get('menge') as string).replace(',', '.');
		const menge = parseFloat(rawMenge);

		// NEU: Helper nutzen um Material ID zu bekommen (Entweder aus Dropdown oder neu erstellt)
		const materialId = await getOrCreateMaterialId(data);

		if (!schrittId || !materialId || isNaN(menge))
			return fail(400, { message: 'Bitte alle Felder ausfüllen.' });

		const schritt = await prisma.schritt.findUnique({ where: { id: schrittId } });
		if (schritt?.status === 'fertig') return fail(400, { message: 'Schritt ist bereits fertig.' });

		const existing = await prisma.materialBedarf.findUnique({
			where: { schrittId_materialId: { schrittId, materialId } }
		});
		if (existing) return fail(400, { message: 'Material existiert bereits in diesem Schritt.' });

		await prisma.materialBedarf.create({ data: { schrittId, materialId, menge } });

		await createAuditLog(
			locals.user!.id,
			'MATERIAL_HINZUGEFUEGT',
			{ schrittId, materialId, menge },
			params.id,
			schrittId
		);
		return { success: true };
	},

	// 2. MATERIAL EDITIEREN
	updateMaterialInStep: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);
		const data = await request.formData();
		const linkId = data.get('linkId') as string;
		const neueMenge = parseFloat((data.get('menge') as string).replace(',', '.'));

		if (!linkId || isNaN(neueMenge)) return fail(400);

		const alterBedarf = await prisma.materialBedarf.findUnique({
			where: { id: linkId },
			include: { schritt: true }
		});
		if (!alterBedarf) return fail(404);

		if (alterBedarf.schritt.status === 'fertig')
			return fail(400, { message: 'Schritt ist bereits fertig.' });

		await prisma.materialBedarf.update({ where: { id: linkId }, data: { menge: neueMenge } });

		await createAuditLog(
			locals.user!.id,
			'MATERIAL_MENGE_GEAENDERT',
			{ linkId, neueMenge },
			params.id
		);
		return { success: true };
	},

	// 3. MATERIAL ENTFERNEN
	removeMaterialFromStep: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);
		const data = await request.formData();
		const linkId = data.get('linkId') as string;

		const bedarf = await prisma.materialBedarf.findUnique({
			where: { id: linkId },
			include: { schritt: true }
		});
		if (!bedarf) return fail(404);

		if (bedarf.schritt.status === 'fertig')
			return fail(400, { message: 'Schritt ist bereits fertig.' });

		await prisma.materialBedarf.delete({ where: { id: linkId } });

		await createAuditLog(locals.user!.id, 'MATERIAL_ENTFERNT', { linkId }, params.id);
		return { success: true };
	},

	// 4. SCHRITT UPDATE (Admin Direkt)
	updateSchritt: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);

		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const neuerStatus = data.get('status') as SchrittStatus;
		const fortschritt = parseInt(data.get('fortschritt') as string);
		const start = new Date(data.get('startDatum') as string);
		const ende = new Date(data.get('endDatum') as string);
		const titel = data.get('titel') as string;

		const alterSchritt = await prisma.schritt.findUnique({
			where: { id: schrittId },
			include: { materialien: { include: { material: true } } }
		});

		if (!alterSchritt) return fail(404);

		// Check bei Admin: Genug Material da?
		if (neuerStatus === 'fertig' && alterSchritt.status !== 'fertig') {
			const missing: string[] = [];
			for (const m of alterSchritt.materialien) {
				if (m.material.bestand < m.menge) {
					missing.push(`${m.material.name} (Lager: ${m.material.bestand}, Benötigt: ${m.menge})`);
				}
			}
			if (missing.length > 0) {
				return fail(400, { message: `Nicht genügend Material: ${missing.join(', ')}` });
			}
		}

		await prisma.$transaction(async (tx) => {
			await tx.schritt.update({
				where: { id: schrittId },
				data: { titel, status: neuerStatus, fortschritt, startDatum: start, endDatum: ende }
			});

			if (alterSchritt.status !== 'fertig' && neuerStatus === 'fertig') {
				for (const m of alterSchritt.materialien) {
					await tx.material.update({
						where: { id: m.materialId },
						data: { bestand: { decrement: m.menge } }
					});
				}
			} else if (alterSchritt.status === 'fertig' && neuerStatus !== 'fertig') {
				for (const m of alterSchritt.materialien) {
					await tx.material.update({
						where: { id: m.materialId },
						data: { bestand: { increment: m.menge } }
					});
				}
			}
		});

		await createAuditLog(
			locals.user!.id,
			'SCHRITT_AKTUALISIERT',
			{ schrittId, status: neuerStatus },
			params.id,
			schrittId
		);
		return { success: true };
	},

	// 5. APPROVE UPDATE (Innendienst)
	approveUpdate: async ({ request, locals, params, url }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const updateId = data.get('updateId') as string;
		const update = await prisma.handwerkerUpdate.findUnique({
			where: { id: updateId },
			include: {
				schritt: {
					include: {
						materialien: true,
						projekt: {
							select: {
								id: true,
								auftragsnummer: true,
								kundenname: true
							}
						}
					}
				}
			}
		});

		if (!update || update.status !== 'ausstehend') return fail(400);

		// Check bei Approval: Genug Material da für Statuswechsel?
		if (
			update.typ === 'STATUS_AENDERUNG' &&
			update.neuerStatus === 'fertig' &&
			update.schritt.status !== 'fertig'
		) {
			const missing: string[] = [];
			for (const m of update.schritt.materialien) {
				const mat = await prisma.material.findUnique({ where: { id: m.materialId } });
				if (mat && mat.bestand < m.menge) missing.push(`${mat.name}`);
			}
			if (missing.length > 0) {
				return fail(400, {
					message: `Genehmigung nicht möglich: Material fehlt im Lager (${missing.join(', ')}).`
				});
			}
		}

		// Check bei Approval: Genug Material da für Material-Anforderung in bereits fertigem Schritt?
		if (
			update.typ === 'MATERIAL_ANFORDERUNG' &&
			update.schritt.status === 'fertig' &&
			update.materialId &&
			update.menge
		) {
			const mat = await prisma.material.findUnique({ where: { id: update.materialId } });
			if (mat && mat.bestand < update.menge)
				return fail(400, {
					message: `Schritt ist fertig, aber Material nicht im Lager verfügbar.`
				});
		}

		await prisma.$transaction(async (tx) => {
			if (update.typ === 'STATUS_AENDERUNG') {
				await tx.schritt.update({
					where: { id: update.schrittId },
					data: {
						...(update.neuerStatus && { status: update.neuerStatus }),
						...(update.neuerFortschritt !== null && { fortschritt: update.neuerFortschritt })
					}
				});

				const alterStatus = update.schritt.status;
				const neuerStatus = update.neuerStatus;

				if (neuerStatus && alterStatus !== 'fertig' && neuerStatus === 'fertig') {
					for (const m of update.schritt.materialien) {
						await tx.material.update({
							where: { id: m.materialId },
							data: { bestand: { decrement: m.menge } }
						});
					}
				}
			} else if (update.typ === 'MATERIAL_ANFORDERUNG' && update.materialId && update.menge) {
				const exists = await tx.materialBedarf.findUnique({
					where: {
						schrittId_materialId: { schrittId: update.schrittId, materialId: update.materialId }
					}
				});

				if (!exists) {
					await tx.materialBedarf.create({
						data: {
							schrittId: update.schrittId,
							materialId: update.materialId,
							menge: update.menge
						}
					});
					// Falls Schritt schon fertig -> Abbuchen
					if (update.schritt.status === 'fertig') {
						await tx.material.update({
							where: { id: update.materialId },
							data: { bestand: { decrement: update.menge } }
						});
					}
				}
			} else if (update.typ === 'FOTO_UPLOAD' && update.bildId) {
				await tx.bild.update({ where: { id: update.bildId }, data: { freigegeben: true } });
			} else if (update.typ === 'NOTIZ' && update.notizText) {
				await tx.notiz.create({
					data: {
						text: update.notizText,
						schrittId: update.schrittId,
						erstelltVon: update.eingereichtVon,
						sichtbarFuerKunde: false
					}
				});
			}

			await tx.handwerkerUpdate.update({
				where: { id: updateId },
				data: { status: 'genehmigt', bearbeitetVon: locals.user!.id, bearbeitetAm: new Date() }
			});
		});

		// Send notification to customer about the approved update
		const baseUrl = `${url.protocol}//${url.host}`;
		const neuerStatus = update.neuerStatus || update.schritt.status;
		const fortschritt = update.neuerFortschritt ?? update.schritt.fortschritt;

		const notification = notifyCustomerAboutStepUpdate({
			auftragsnummer: update.schritt.projekt.auftragsnummer,
			schrittTitel: update.schritt.titel,
			neuerStatus: neuerStatus,
			fortschritt: fortschritt,
			projektId: update.schritt.projekt.id,
			kundenname: update.schritt.projekt.kundenname,
			baseUrl
		});

		return { success: true, notification };
	},

	// 6. SUBMIT UPDATE (HANDWERKER)
	submitUpdate: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;

		// Prüfen ob es ein Material-Antrag ist (Entweder ID da oder "isNew" Flag)
		const isNew = data.get('isNew') === 'true';
		const materialIdParam = data.get('materialId') as string | null;

		if (materialIdParam || isNew) {
			const rawMenge = (data.get('menge') as string).replace(',', '.');
			const menge = parseFloat(rawMenge);
			if (isNaN(menge)) return fail(400, { message: 'Ungültige Menge.' });

			const schritt = await prisma.schritt.findUnique({ where: { id: schrittId } });
			if (schritt?.status === 'fertig')
				return fail(400, { message: 'Schritt ist fertig. Keine Änderungen möglich.' });

			// NEU: Material ID ermitteln (Erstellt Material, falls es neu ist)
			const finalMaterialId = await getOrCreateMaterialId(data);
			if (!finalMaterialId)
				return fail(400, { message: 'Material konnte nicht erstellt/gefunden werden.' });

			// Duplikat Check
			const existing = await prisma.materialBedarf.findUnique({
				where: { schrittId_materialId: { schrittId, materialId: finalMaterialId } }
			});
			if (existing)
				return fail(400, { message: 'Material ist in diesem Schritt bereits vorhanden.' });

			await prisma.handwerkerUpdate.create({
				data: {
					typ: 'MATERIAL_ANFORDERUNG',
					schrittId,
					materialId: finalMaterialId,
					menge,
					eingereichtVon: locals.user!.id
				}
			});
			return { success: true, message: 'Materialanforderung eingereicht.' };
		}

		// Status Update
		const statusValue = data.get('status') as string | null;
		const neuerStatus =
			statusValue && statusValue.trim() !== '' ? (statusValue as SchrittStatus) : null;
		const fortschrittValue = data.get('fortschritt') as string | null;
		const neuerFortschritt =
			fortschrittValue && fortschrittValue.trim() !== '' ? parseInt(fortschrittValue) : null;

		// Validate that at least one field is provided
		if (!neuerStatus && neuerFortschritt === null) {
			return fail(400, {
				message: 'Bitte geben Sie einen Status oder Fortschritt an.'
			});
		}

		// Lager Check vor Antrag
		if (neuerStatus === 'fertig') {
			const schritt = await prisma.schritt.findUnique({
				where: { id: schrittId },
				include: { materialien: { include: { material: true } } }
			});
			if (schritt) {
				const missing: string[] = [];
				for (const m of schritt.materialien) {
					if (m.material.bestand < m.menge) missing.push(`${m.material.name}`);
				}
				if (missing.length > 0)
					return fail(400, {
						message: `Antrag abgelehnt: Material fehlt im Lager! (${missing.join(', ')}).`
					});
			}
		}

		await prisma.handwerkerUpdate.create({
			data: {
				typ: 'STATUS_AENDERUNG',
				schrittId,
				neuerStatus,
				neuerFortschritt,
				eingereichtVon: locals.user!.id
			}
		});
		return { success: true, message: 'Update eingereicht.' };
	},

	// --- RESTLICHE ACTIONS ---
	uploadBild: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const file = data.get('bild') as File;
		const beschreibung = data.get('beschreibung') as string;

		if (!schrittId || !file || file.size === 0) return fail(400);
		const buffer = Buffer.from(await file.arrayBuffer());

		const user = await prisma.user.findUnique({ where: { id: locals.user!.id } });
		const uploaderName = user ? `${user.vorname} ${user.nachname}` : 'Unbekannt';
		const isHandwerker = locals.user!.role === Role.HANDWERKER;

		const bild = await prisma.bild.create({
			data: {
				daten: buffer,
				mimeType: file.type,
				beschreibung: beschreibung || null,
				hochgeladenVon: uploaderName,
				schrittId,
				freigegeben: !isHandwerker
			}
		});

		if (isHandwerker) {
			await prisma.handwerkerUpdate.create({
				data: { typ: 'FOTO_UPLOAD', schrittId, bildId: bild.id, eingereichtVon: locals.user!.id }
			});
			await createAuditLog(
				locals.user!.id,
				'FOTO_HOCHGELADEN_PENDING',
				{ bildId: bild.id, schrittId },
				params.id,
				schrittId
			);
			return { success: true, message: 'Wartet auf Freigabe.' };
		}

		await createAuditLog(
			locals.user!.id,
			'FOTO_HOCHGELADEN',
			{ bildId: bild.id, schrittId },
			params.id,
			schrittId
		);
		return { success: true };
	},

	deleteBild: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const bildId = data.get('bildId') as string;
		await prisma.bild.delete({ where: { id: bildId } });
		await createAuditLog(locals.user!.id, 'FOTO_GELOESCHT', { bildId }, params.id);
		return { success: true };
	},

	addNotiz: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const text = data.get('text') as string;

		if (locals.user.role === Role.HANDWERKER) {
			await prisma.handwerkerUpdate.create({
				data: { typ: 'NOTIZ', schrittId, notizText: text, eingereichtVon: locals.user!.id }
			});
		} else {
			await prisma.notiz.create({
				data: { text, schrittId, erstelltVon: locals.user!.id, sichtbarFuerKunde: false }
			});
		}
		return { success: true };
	},

	toggleNotizSichtbarkeit: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const notizId = data.get('notizId') as string;
		const notiz = await prisma.notiz.findUnique({ where: { id: notizId } });
		if (notiz)
			await prisma.notiz.update({
				where: { id: notizId },
				data: { sichtbarFuerKunde: !notiz.sichtbarFuerKunde }
			});
		return { success: true };
	},

	rejectUpdate: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const updateId = data.get('updateId') as string;
		const update = await prisma.handwerkerUpdate.findUnique({ where: { id: updateId } });
		if (update?.typ === 'FOTO_UPLOAD' && update.bildId)
			await prisma.bild.delete({ where: { id: update.bildId } });

		await prisma.handwerkerUpdate.update({
			where: { id: updateId },
			data: { status: 'abgelehnt', bearbeitetVon: locals.user!.id, bearbeitetAm: new Date() }
		});
		return { success: true };
	},

	assignMitarbeiter: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const userId = data.get('userId') as string;
		await prisma.projekt.update({
			where: { id: params.id },
			data: { mitarbeiter: { connect: { id: userId } } }
		});
		return { success: true };
	},

	removeMitarbeiter: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const userId = data.get('userId') as string;
		await prisma.projekt.update({
			where: { id: params.id },
			data: { mitarbeiter: { disconnect: { id: userId } } }
		});
		return { success: true };
	},

	updateProject: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		await prisma.projekt.update({
			where: { id: params.id },
			data: {
				projektbezeichnung: data.get('projektbezeichnung') as string,
				projektbeschreibung: data.get('projektbeschreibung') as string,
				geplanterStart: new Date(data.get('geplanterStart') as string),
				geplantesEnde: new Date(data.get('geplantesEnde') as string),
				adresse: {
					update: {
						strasse: data.get('strasse') as string,
						hausnummer: data.get('hausnummer') as string,
						plz: data.get('plz') as string,
						ort: data.get('ort') as string
					}
				}
			}
		});
		return { success: true };
	},

	createSchritt: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const lastStep = await prisma.schritt.findFirst({
			where: { projektId: params.id },
			orderBy: { reihenfolge: 'desc' }
		});
		await prisma.schritt.create({
			data: {
				projektId: params.id!,
				titel: data.get('titel') as string,
				beschreibung: data.get('beschreibung') as string,
				startDatum: new Date(data.get('startDatum') as string),
				endDatum: new Date(data.get('endDatum') as string),
				reihenfolge: (lastStep?.reihenfolge ?? 0) + 1,
				status: 'offen'
			}
		});
		return { success: true };
	},

	deleteSchritt: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		await prisma.schritt.delete({ where: { id: data.get('schrittId') as string } });
		return { success: true };
	}
};
