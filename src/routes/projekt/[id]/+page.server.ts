import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role, SchrittStatus } from '@prisma/client';

// Helper: Audit Log erstellen
async function createAuditLog(userId: string, aktion: string, details: Record<string, unknown>, projektId?: string, schrittId?: string) {
	await prisma.auditLog.create({
		data: { userId, aktion, details: JSON.stringify(details), projektId, schrittId }
	});
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	// 1. AUTH CHECK
	if (!locals.user && !locals.projekt) throw redirect(303, '/');
	if (locals.projekt && locals.projekt.id !== id) throw error(403, 'Zugriff verweigert.');

	// Handwerker Check
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
							include: { bearbeiter: { select: { vorname: true, nachname: true } }, bild: true },
							orderBy: { eingereichtAm: 'desc' }
						}
						: undefined
				}
			}
		}
	});

	if (!p) throw error(404, 'Projekt nicht gefunden');

	// 3. MATERIAL LOGIK: AGGREGATION & LAGER-CHECK
	// Wir fassen gleiche Materialien aus verschiedenen Schritten zusammen
	const materialMap = new Map<string, { id: string; name: string; menge: number; einheit: string; bestand: number; bemerkung?: string }>();

	for (const s of p.schritte) {
		for (const m of s.materialien) {
			if (!m.material) continue;

			const menge = Number(m.menge);
			// Das ist der aktuelle Lagerbestand in der DB (bereits reduziert um das, was wir hier verbrauchen!)
			const bestand = Number(m.material.bestand);

			const existing = materialMap.get(m.material.id);
			if (existing) {
				existing.menge += menge;
			} else {
				materialMap.set(m.material.id, {
					id: m.material.id,
					name: m.material.name,
					menge: menge,
					einheit: m.material.einheit,
					bestand: bestand,
					bemerkung: m.bemerkung ?? undefined
				});
			}
		}
	}

	// BERECHNUNG: Was kommt aus Lager (Grün), was muss bestellt werden (Rot)?
	const materialListe = Array.from(materialMap.values()).map(mat => {
		let mengeBestellen = 0;
		let mengeImLager = mat.menge;

		// Wenn der Bestand negativ ist (z.B. -5), bedeutet das, wir haben 5 zu viel verplant -> Nachbestellen
		if (mat.bestand < 0) {
			const fehlmengeGlobal = Math.abs(mat.bestand);

			// Wir bestellen maximal so viel wie wir für DIESES Projekt brauchen,
			// aber nicht mehr als insgesamt fehlt.
			mengeBestellen = Math.min(mat.menge, fehlmengeGlobal);

			// Der Rest kommt aus dem Lager (kann rechnerisch 0 sein)
			mengeImLager = Math.max(0, mat.menge - mengeBestellen);
		}

		return { ...mat, mengeBestellen, mengeImLager };
	});

	// 4. STAMMDATEN LADEN (für Dropdowns)
	const allMaterials = await prisma.material.findMany({ orderBy: { name: 'asc' } });

	let availableHandwerker: any[] = [];
	let pendingUpdatesCount = 0;
	if (locals.user && (locals.user.role === Role.ADMIN || locals.user.role === Role.INNENDIENST)) {
		availableHandwerker = await prisma.user.findMany({ where: { role: Role.HANDWERKER }, select: { id: true, vorname: true, nachname: true } });
		pendingUpdatesCount = await prisma.handwerkerUpdate.count({ where: { schritt: { projektId: id }, status: 'ausstehend' } });
	}

	// 5. RETURN
	return {
		isStaff: !!locals.user,
		userRole: locals.user?.role,
		userId: locals.user?.id,
		availableHandwerker,
		pendingUpdatesCount,
		// WICHTIG: allMaterials (mit aktuellem Bestand) für die Timeline übergeben
		allMaterials: allMaterials.map(m => ({...m, bestand: Number(m.bestand)})),

		project: {
			id: p.id,
			mitarbeiter: p.mitarbeiter,
			metadata: {
				auftragsnummer: p.auftragsnummer,
				kundenname: p.kundenname,
				projektadresse: { strasse: p.adresse?.strasse ?? '', hausnummer: p.adresse?.hausnummer ?? '', plz: p.adresse?.plz ?? '', ort: p.adresse?.ort ?? '' },
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

				// Mapping Material für Timeline (mit linkId zum Löschen)
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
				notizen: schritt.notizen?.map((notiz) => ({
					id: notiz.id,
					text: notiz.text,
					erstelltAm: notiz.erstelltAm.toISOString(),
					autorName: `${notiz.autor.vorname} ${notiz.autor.nachname}`,
					sichtbarFuerKunde: notiz.sichtbarFuerKunde
				})) ?? [],
				pendingUpdates: (schritt.pendingUpdates as any)?.map((update: any) => ({
					id: update.id,
					typ: update.typ,
					neuerStatus: update.neuerStatus,
					neuerFortschritt: update.neuerFortschritt,
					notizText: update.notizText,
					eingereichtAm: update.eingereichtAm.toISOString(),
					bearbeiterName: `${update.bearbeiter.vorname} ${update.bearbeiter.nachname}`,
					eingereichtVonId: update.eingereichtVon,
					bild: update.bild ? { id: update.bild.id, url: `data:${update.bild.mimeType};base64,${Buffer.from(update.bild.daten).toString('base64')}`, beschreibung: update.bild.beschreibung } : null
				})) ?? []
			})),
			materialListe: materialListe,
			erstelltAm: p.erstelltAm.toISOString(),
			aktualisiertAm: p.aktualisiertAm.toISOString()
		}
	};
};

export const actions: Actions = {
	// --- MATERIAL HINZUFÜGEN (Mit Duplikat-Check) ---
	addMaterialToStep: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const materialId = data.get('materialId') as string;
		const rawMenge = (data.get('menge') as string).replace(',', '.');
		const menge = parseFloat(rawMenge);

		if (!schrittId || !materialId || isNaN(menge)) return fail(400);

		// 1. Check: Existiert das Material schon in diesem Schritt?
		const existing = await prisma.materialBedarf.findUnique({
			where: {
				schrittId_materialId: { schrittId, materialId }
			}
		});

		if (existing) {
			return fail(400, { message: 'Dieses Material ist in diesem Schritt bereits vorhanden. Bitte bearbeiten Sie stattdessen die Menge.' });
		}

		// 2. Transaktion: Erstellen & Bestand buchen
		await prisma.$transaction([
			prisma.materialBedarf.create({ data: { schrittId, materialId, menge } }),
			prisma.material.update({
				where: { id: materialId },
				data: { bestand: { decrement: menge } }
			})
		]);

		await createAuditLog(locals.user.id, 'MATERIAL_HINZUGEFUEGT', { schrittId, materialId, menge }, params.id, schrittId);
		return { success: true };
	},
	// --- NEU: MATERIAL MENGE BEARBEITEN (Mit Lagerabgleich) ---
	updateMaterialInStep: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

		const data = await request.formData();
		const linkId = data.get('linkId') as string; // ID des MaterialBedarfs
		const rawMenge = (data.get('menge') as string).replace(',', '.');
		const neueMenge = parseFloat(rawMenge);

		if (!linkId || isNaN(neueMenge)) return fail(400);

		// Altes Material laden, um Differenz zu berechnen
		const alterBedarf = await prisma.materialBedarf.findUnique({ where: { id: linkId } });
		if (!alterBedarf) return fail(404, { message: 'Eintrag nicht gefunden' });

		// Differenz berechnen:
		// Wenn alt 5 und neu 8 -> Differenz 3 -> Lager muss um 3 reduziert werden (decrement 3)
		// Wenn alt 5 und neu 2 -> Differenz -3 -> Lager muss um -3 reduziert werden (entspricht increment 3)
		const differenz = neueMenge - alterBedarf.menge;

		if (differenz === 0) return { success: true }; // Keine Änderung

		await prisma.$transaction([
			// 1. Update der Menge im Schritt
			prisma.materialBedarf.update({
				where: { id: linkId },
				data: { menge: neueMenge }
			}),
			// 2. Anpassung des Lagerbestands um die Differenz
			prisma.material.update({
				where: { id: alterBedarf.materialId },
				data: { bestand: { decrement: differenz } }
			})
		]);

		await createAuditLog(locals.user.id, 'MATERIAL_MENGE_GEAENDERT', {
			schrittId: alterBedarf.schrittId,
			materialId: alterBedarf.materialId,
			alteMenge: alterBedarf.menge,
			neueMenge
		}, params.id, alterBedarf.schrittId);

		return { success: true, message: 'Menge aktualisiert.' };
	},

	// --- MATERIAL ENTFERNEN (FREIGEBEN) ---
	removeMaterialFromStep: async ({ request, locals, params }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

		const data = await request.formData();
		const linkId = data.get('linkId') as string;

		const bedarf = await prisma.materialBedarf.findUnique({ where: { id: linkId } });
		if (!bedarf) return fail(404, { message: 'Eintrag nicht gefunden' });

		await prisma.$transaction([
			prisma.material.update({
				where: { id: bedarf.materialId },
				data: { bestand: { increment: bedarf.menge } }
			}),
			prisma.materialBedarf.delete({ where: { id: linkId } })
		]);

		await createAuditLog(locals.user.id, 'MATERIAL_ENTFERNT', { schrittId: bedarf.schrittId, materialId: bedarf.materialId, menge: bedarf.menge }, params.id, bedarf.schrittId);
		return { success: true };
	},


	uploadBild: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const file = data.get('bild') as File;
		const beschreibung = data.get('beschreibung') as string;

		if (!schrittId || !file || file.size === 0) return fail(400);
		const buffer = Buffer.from(await file.arrayBuffer());

		const user = await prisma.user.findUnique({ where: { id: locals.user.id } });
		const uploaderName = user ? `${user.vorname} ${user.nachname}` : 'Unbekannt';
		const isHandwerker = locals.user.role === Role.HANDWERKER;

		const bild = await prisma.bild.create({
			data: {
				daten: buffer, mimeType: file.type, beschreibung: beschreibung || null,
				hochgeladenVon: uploaderName, schrittId, freigegeben: !isHandwerker
			}
		});

		if (isHandwerker) {
			await prisma.handwerkerUpdate.create({ data: { typ: 'FOTO_UPLOAD', schrittId, bildId: bild.id, eingereichtVon: locals.user.id } });
			await createAuditLog(locals.user.id, 'FOTO_HOCHGELADEN_PENDING', { bildId: bild.id, schrittId }, params.id, schrittId);
			return { success: true, message: 'Wartet auf Freigabe.' };
		}

		await createAuditLog(locals.user.id, 'FOTO_HOCHGELADEN', { bildId: bild.id, schrittId }, params.id, schrittId);
		return { success: true };
	},

	deleteBild: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const bildId = data.get('bildId') as string;
		await prisma.bild.delete({ where: { id: bildId } });
		await createAuditLog(locals.user.id, 'FOTO_GELOESCHT', { bildId }, params.id);
		return { success: true };
	},

	submitUpdate: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const neuerStatus = data.get('status') as SchrittStatus | null;
		const neuerFortschritt = data.get('fortschritt') as string | null;

		if (locals.user.role === Role.HANDWERKER) {
			await prisma.handwerkerUpdate.create({
				data: {
					typ: 'STATUS_AENDERUNG', schrittId, neuerStatus,
					neuerFortschritt: neuerFortschritt ? parseInt(neuerFortschritt) : null,
					eingereichtVon: locals.user.id
				}
			});
			return { success: true, message: 'Update eingereicht.' };
		}
		await prisma.schritt.update({
			where: { id: schrittId },
			data: { ...(neuerStatus && { status: neuerStatus }), ...(neuerFortschritt && { fortschritt: parseInt(neuerFortschritt) }) }
		});
		return { success: true };
	},

	addNotiz: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const text = data.get('text') as string;

		if (locals.user.role === Role.HANDWERKER) {
			await prisma.handwerkerUpdate.create({
				data: { typ: 'NOTIZ', schrittId, notizText: text, eingereichtVon: locals.user.id }
			});
			return { success: true, message: 'Notiz eingereicht.' };
		}
		await prisma.notiz.create({
			data: { text, schrittId, erstelltVon: locals.user.id, sichtbarFuerKunde: false }
		});
		return { success: true };
	},

	toggleNotizSichtbarkeit: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const notizId = data.get('notizId') as string;
		const notiz = await prisma.notiz.findUnique({ where: { id: notizId } });
		if (notiz) await prisma.notiz.update({ where: { id: notizId }, data: { sichtbarFuerKunde: !notiz.sichtbarFuerKunde } });
		return { success: true };
	},

	approveUpdate: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const updateId = data.get('updateId') as string;
		const update = await prisma.handwerkerUpdate.findUnique({ where: { id: updateId } });
		if (!update || update.status !== 'ausstehend') return fail(400);

		if (update.typ === 'STATUS_AENDERUNG') {
			await prisma.schritt.update({
				where: { id: update.schrittId },
				data: { ...(update.neuerStatus && { status: update.neuerStatus }), ...(update.neuerFortschritt !== null && { fortschritt: update.neuerFortschritt }) }
			});
		} else if (update.typ === 'FOTO_UPLOAD' && update.bildId) {
			await prisma.bild.update({ where: { id: update.bildId }, data: { freigegeben: true } });
		} else if (update.typ === 'NOTIZ' && update.notizText) {
			await prisma.notiz.create({ data: { text: update.notizText, schrittId: update.schrittId, erstelltVon: update.eingereichtVon, sichtbarFuerKunde: false } });
		}

		await prisma.handwerkerUpdate.update({ where: { id: updateId }, data: { status: 'genehmigt', bearbeitetVon: locals.user.id, bearbeitetAm: new Date() } });
		return { success: true };
	},

	rejectUpdate: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const updateId = data.get('updateId') as string;
		const update = await prisma.handwerkerUpdate.findUnique({ where: { id: updateId } });
		if (update?.typ === 'FOTO_UPLOAD' && update.bildId) await prisma.bild.delete({ where: { id: update.bildId } });
		await prisma.handwerkerUpdate.update({ where: { id: updateId }, data: { status: 'abgelehnt', bearbeitetVon: locals.user.id, bearbeitetAm: new Date() } });
		return { success: true };
	},

	assignMitarbeiter: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const userId = data.get('userId') as string;
		await prisma.projekt.update({ where: { id: params.id }, data: { mitarbeiter: { connect: { id: userId } } } });
		return { success: true };
	},

	removeMitarbeiter: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const userId = data.get('userId') as string;
		await prisma.projekt.update({ where: { id: params.id }, data: { mitarbeiter: { disconnect: { id: userId } } } });
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
				adresse: { update: { strasse: data.get('strasse') as string, hausnummer: data.get('hausnummer') as string, plz: data.get('plz') as string, ort: data.get('ort') as string } }
			}
		});
		return { success: true };
	},

	createSchritt: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const lastStep = await prisma.schritt.findFirst({ where: { projektId: params.id }, orderBy: { reihenfolge: 'desc' } });
		await prisma.schritt.create({
			data: {
				projektId: params.id!, titel: data.get('titel') as string, beschreibung: data.get('beschreibung') as string,
				startDatum: new Date(data.get('startDatum') as string), endDatum: new Date(data.get('endDatum') as string),
				reihenfolge: (lastStep?.reihenfolge ?? 0) + 1, status: 'offen'
			}
		});
		return { success: true };
	},

	updateSchritt: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		await prisma.schritt.update({
			where: { id: data.get('schrittId') as string },
			data: {
				titel: data.get('titel') as string, status: data.get('status') as SchrittStatus,
				fortschritt: parseInt(data.get('fortschritt') as string),
				startDatum: new Date(data.get('startDatum') as string), endDatum: new Date(data.get('endDatum') as string)
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
