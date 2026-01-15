import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role, SchrittStatus } from '@prisma/client';

// Helper function to create audit log entries
async function createAuditLog(
	userId: string,
	aktion: string,
	details: Record<string, unknown>,
	projektId?: string,
	schrittId?: string
) {
	await prisma.auditLog.create({
		data: {
			userId,
			aktion,
			details: JSON.stringify(details),
			projektId,
			schrittId
		}
	});
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	// 1. AUTH CHECK
	if (!locals.user && !locals.projekt) throw redirect(303, '/');
	if (locals.projekt && locals.projekt.id !== id) throw error(403, 'Zugriff verweigert.');

	// For Handwerker: Check if they are assigned to this project
	if (locals.user && locals.user.role === Role.HANDWERKER) {
		const project = await prisma.projekt.findFirst({
			where: {
				id,
				mitarbeiter: {
					some: { id: locals.user.id }
				}
			}
		});
		if (!project) throw error(403, 'Sie sind diesem Projekt nicht zugeordnet.');
	}

	// 2. DB ABFRAGE
	const p = await prisma.projekt.findUnique({
		where: { id },
		include: {
			adresse: true,
			mitarbeiter: {
				select: { id: true, vorname: true, nachname: true, role: true }
			},
			schritte: {
				orderBy: { reihenfolge: 'asc' },
				include: {
					materialien: { include: { material: true } },
					bilder: {
						// For customers, only show approved images
						where: locals.projekt ? { freigegeben: true } : {},
						orderBy: { hochgeladenAm: 'desc' }
					},
					notizen: {
						// For customers, only show approved notes
						where: locals.projekt ? { sichtbarFuerKunde: true } : {},
						orderBy: { erstelltAm: 'desc' },
						include: {
							autor: {
								select: { vorname: true, nachname: true }
							}
						}
					},
					// Load pending updates for staff view
					pendingUpdates: locals.user
						? {
								where: { status: 'ausstehend' },
								include: {
									bearbeiter: {
										select: { vorname: true, nachname: true }
									},
									bild: true
								},
								orderBy: { eingereichtAm: 'desc' }
							}
						: undefined
				}
			}
		}
	});

	if (!p) throw error(404, 'Projekt nicht gefunden');

	// Materialliste aggregieren
	const materialListe = p.schritte.flatMap((s) =>
		s.materialien.map((m) => ({
			id: m.material.id,
			name: m.material.name,
			menge: m.menge,
			einheit: m.material.einheit,
			bemerkung: m.bemerkung ?? undefined
		}))
	);

	// Verfügbare Handwerker laden (nur für Admin/Innendienst relevant)
	let availableHandwerker: { id: string; vorname: string; nachname: string }[] = [];
	if (locals.user && (locals.user.role === Role.ADMIN || locals.user.role === Role.INNENDIENST)) {
		availableHandwerker = await prisma.user.findMany({
			where: { role: Role.HANDWERKER },
			select: { id: true, vorname: true, nachname: true }
		});
	}

	// Count pending updates for this project (for Innendienst badge)
	let pendingUpdatesCount = 0;
	if (locals.user && (locals.user.role === Role.ADMIN || locals.user.role === Role.INNENDIENST)) {
		pendingUpdatesCount = await prisma.handwerkerUpdate.count({
			where: {
				schritt: { projektId: id },
				status: 'ausstehend'
			}
		});
	}

	return {
		isStaff: !!locals.user,
		userRole: locals.user?.role,
		userId: locals.user?.id,
		availableHandwerker,
		pendingUpdatesCount,

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
					name: m.material.name,
					menge: m.menge,
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
				pendingUpdates: (schritt.pendingUpdates as unknown as Array<{
					id: string;
					typ: string;
					neuerStatus: string | null;
					neuerFortschritt: number | null;
					notizText: string | null;
					eingereichtAm: Date;
					eingereichtVon: string;
					bearbeiter: { vorname: string; nachname: string };
					bild: { id: string; mimeType: string; daten: Buffer; beschreibung: string | null } | null;
				}> | undefined)?.map((update) => ({
					id: update.id,
					typ: update.typ,
					neuerStatus: update.neuerStatus,
					neuerFortschritt: update.neuerFortschritt,
					notizText: update.notizText,
					eingereichtAm: update.eingereichtAm.toISOString(),
					bearbeiterName: `${update.bearbeiter.vorname} ${update.bearbeiter.nachname}`,
					eingereichtVonId: update.eingereichtVon,
					bild: update.bild ? {
						id: update.bild.id,
						url: `data:${update.bild.mimeType};base64,${Buffer.from(update.bild.daten).toString('base64')}`,
						beschreibung: update.bild.beschreibung
					} : null
				})) ?? []
			})),
			materialListe: materialListe,
			erstelltAm: p.erstelltAm.toISOString(),
			aktualisiertAm: p.aktualisiertAm.toISOString()
		}
	};
};

// --- ACTIONS ---

export const actions: Actions = {
	// Upload image - behavior differs based on role
	uploadBild: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403, { message: 'Nicht angemeldet.' });

		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const file = data.get('bild') as File;
		const beschreibung = data.get('beschreibung') as string;

		if (!schrittId || !file || file.size === 0) {
			return fail(400, { message: 'Bild und Schritt-ID erforderlich.' });
		}

		// Check file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			return fail(400, { message: 'Datei zu groß. Maximal 10MB erlaubt.' });
		}

		// Check mime type
		if (!file.type.startsWith('image/')) {
			return fail(400, { message: 'Nur Bilddateien erlaubt.' });
		}

		const buffer = Buffer.from(await file.arrayBuffer());

		// Get user info for audit log
		const user = await prisma.user.findUnique({
			where: { id: locals.user.id },
			select: { vorname: true, nachname: true }
		});

		const uploaderName = user ? `${user.vorname} ${user.nachname}` : 'Unbekannt';

		// For Handwerker: Create image with freigegeben=false and create pending update
		if (locals.user.role === Role.HANDWERKER) {
			const bild = await prisma.bild.create({
				data: {
					daten: buffer,
					mimeType: file.type,
					beschreibung: beschreibung || null,
					hochgeladenVon: uploaderName,
					schrittId,
					freigegeben: false
				}
			});

			// Create pending update for review
			await prisma.handwerkerUpdate.create({
				data: {
					typ: 'FOTO_UPLOAD',
					schrittId,
					bildId: bild.id,
					eingereichtVon: locals.user.id
				}
			});

			// Create audit log
			await createAuditLog(
				locals.user.id,
				'FOTO_HOCHGELADEN_PENDING',
				{ bildId: bild.id, beschreibung, schrittId },
				params.id,
				schrittId
			);

			return { success: true, message: 'Foto erfolgreich hochgeladen. Wartet auf Freigabe durch den Innendienst.' };
		}

		// For Admin/Innendienst: Create image directly with freigegeben=true
		const bild = await prisma.bild.create({
			data: {
				daten: buffer,
				mimeType: file.type,
				beschreibung: beschreibung || null,
				hochgeladenVon: uploaderName,
				schrittId,
				freigegeben: true
			}
		});

		await createAuditLog(
			locals.user.id,
			'FOTO_HOCHGELADEN',
			{ bildId: bild.id, beschreibung, schrittId },
			params.id,
			schrittId
		);

		return { success: true };
	},

	deleteBild: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);

		const data = await request.formData();
		const bildId = data.get('bildId') as string;

		if (!bildId) return fail(400);

		const bild = await prisma.bild.findUnique({ where: { id: bildId } });
		
		await prisma.bild.delete({ where: { id: bildId } });

		await createAuditLog(
			locals.user.id,
			'FOTO_GELOESCHT',
			{ bildId, beschreibung: bild?.beschreibung },
			params.id
		);

		return { success: true };
	},

	// Handwerker submits a status/progress update for review
	submitUpdate: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403, { message: 'Nicht angemeldet.' });

		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const neuerStatus = data.get('status') as string | null;
		const neuerFortschritt = data.get('fortschritt') as string | null;

		if (!schrittId) return fail(400, { message: 'Schritt-ID erforderlich.' });

		// Get current step values for audit
		const currentStep = await prisma.schritt.findUnique({
			where: { id: schrittId },
			select: { status: true, fortschritt: true, titel: true }
		});

		if (!currentStep) return fail(404, { message: 'Schritt nicht gefunden.' });

		// For Handwerker: Create pending update
		if (locals.user.role === Role.HANDWERKER) {
			await prisma.handwerkerUpdate.create({
				data: {
					typ: 'STATUS_AENDERUNG',
					schrittId,
					neuerStatus: neuerStatus ? (neuerStatus as SchrittStatus) : null,
					neuerFortschritt: neuerFortschritt ? parseInt(neuerFortschritt) : null,
					eingereichtVon: locals.user.id
				}
			});

			await createAuditLog(
				locals.user.id,
				'STATUS_UPDATE_EINGEREICHT',
				{
					schrittId,
					schrittTitel: currentStep.titel,
					alterStatus: currentStep.status,
					neuerStatus,
					alterFortschritt: currentStep.fortschritt,
					neuerFortschritt: neuerFortschritt ? parseInt(neuerFortschritt) : null
				},
				params.id,
				schrittId
			);

			return { success: true, message: 'Aktualisierung eingereicht. Wartet auf Freigabe durch den Innendienst.' };
		}

		// For Admin/Innendienst: Apply directly
		await prisma.schritt.update({
			where: { id: schrittId },
			data: {
				...(neuerStatus && { status: neuerStatus as SchrittStatus }),
				...(neuerFortschritt && { fortschritt: parseInt(neuerFortschritt) })
			}
		});

		await createAuditLog(
			locals.user.id,
			'STATUS_GEAENDERT',
			{
				schrittId,
				schrittTitel: currentStep.titel,
				alterStatus: currentStep.status,
				neuerStatus,
				alterFortschritt: currentStep.fortschritt,
				neuerFortschritt: neuerFortschritt ? parseInt(neuerFortschritt) : null
			},
			params.id,
			schrittId
		);

		return { success: true };
	},

	// Handwerker adds a note
	addNotiz: async ({ request, locals, params }) => {
		if (!locals.user) return fail(403, { message: 'Nicht angemeldet.' });

		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const text = data.get('text') as string;

		if (!schrittId || !text?.trim()) {
			return fail(400, { message: 'Schritt-ID und Notiztext erforderlich.' });
		}

		// For Handwerker: Create pending update with note
		if (locals.user.role === Role.HANDWERKER) {
			await prisma.handwerkerUpdate.create({
				data: {
					typ: 'NOTIZ',
					schrittId,
					notizText: text.trim(),
					eingereichtVon: locals.user.id
				}
			});

			await createAuditLog(
				locals.user.id,
				'NOTIZ_EINGEREICHT',
				{ schrittId, textVorschau: text.substring(0, 100) },
				params.id,
				schrittId
			);

			return { success: true, message: 'Notiz eingereicht. Wartet auf Freigabe durch den Innendienst.' };
		}

		// For Admin/Innendienst: Create note directly (visible internally, not to customer by default)
		const notiz = await prisma.notiz.create({
			data: {
				text: text.trim(),
				schrittId,
				erstelltVon: locals.user.id,
				sichtbarFuerKunde: false
			}
		});

		await createAuditLog(
			locals.user.id,
			'NOTIZ_ERSTELLT',
			{ notizId: notiz.id, schrittId, textVorschau: text.substring(0, 100) },
			params.id,
			schrittId
		);

		return { success: true };
	},

	// Toggle note visibility for customer
	toggleNotizSichtbarkeit: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);

		const data = await request.formData();
		const notizId = data.get('notizId') as string;

		if (!notizId) return fail(400);

		const notiz = await prisma.notiz.findUnique({ where: { id: notizId } });
		if (!notiz) return fail(404);

		await prisma.notiz.update({
			where: { id: notizId },
			data: { sichtbarFuerKunde: !notiz.sichtbarFuerKunde }
		});

		await createAuditLog(
			locals.user.id,
			'NOTIZ_SICHTBARKEIT_GEAENDERT',
			{ notizId, neueSichtbarkeit: !notiz.sichtbarFuerKunde },
			params.id
		);

		return { success: true };
	},

	// Innendienst approves a pending update
	approveUpdate: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) {
			return fail(403, { message: 'Keine Berechtigung.' });
		}

		const data = await request.formData();
		const updateId = data.get('updateId') as string;

		if (!updateId) return fail(400, { message: 'Update-ID erforderlich.' });

		const update = await prisma.handwerkerUpdate.findUnique({
			where: { id: updateId },
			include: { schritt: true, bild: true }
		});

		if (!update) return fail(404, { message: 'Update nicht gefunden.' });
		if (update.status !== 'ausstehend') return fail(400, { message: 'Update wurde bereits bearbeitet.' });

		// Apply the update based on type
		if (update.typ === 'STATUS_AENDERUNG') {
			await prisma.schritt.update({
				where: { id: update.schrittId },
				data: {
					...(update.neuerStatus && { status: update.neuerStatus }),
					...(update.neuerFortschritt !== null && { fortschritt: update.neuerFortschritt })
				}
			});
		} else if (update.typ === 'FOTO_UPLOAD' && update.bildId) {
			await prisma.bild.update({
				where: { id: update.bildId },
				data: { freigegeben: true }
			});
		} else if (update.typ === 'NOTIZ' && update.notizText) {
			await prisma.notiz.create({
				data: {
					text: update.notizText,
					schrittId: update.schrittId,
					erstelltVon: update.eingereichtVon,
					sichtbarFuerKunde: false
				}
			});
		}

		// Mark update as approved
		await prisma.handwerkerUpdate.update({
			where: { id: updateId },
			data: {
				status: 'genehmigt',
				bearbeitetVon: locals.user.id,
				bearbeitetAm: new Date()
			}
		});

		await createAuditLog(
			locals.user.id,
			'UPDATE_GENEHMIGT',
			{
				updateId,
				typ: update.typ,
				schrittId: update.schrittId,
				eingereichtVon: update.eingereichtVon
			},
			params.id,
			update.schrittId
		);

		return { success: true };
	},

	// Innendienst rejects a pending update
	rejectUpdate: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) {
			return fail(403, { message: 'Keine Berechtigung.' });
		}

		const data = await request.formData();
		const updateId = data.get('updateId') as string;
		const grund = data.get('grund') as string;

		if (!updateId) return fail(400, { message: 'Update-ID erforderlich.' });

		const update = await prisma.handwerkerUpdate.findUnique({
			where: { id: updateId },
			include: { bild: true }
		});

		if (!update) return fail(404, { message: 'Update nicht gefunden.' });
		if (update.status !== 'ausstehend') return fail(400, { message: 'Update wurde bereits bearbeitet.' });

		// If it's a photo upload, delete the unfreigegeben image
		if (update.typ === 'FOTO_UPLOAD' && update.bildId) {
			await prisma.bild.delete({ where: { id: update.bildId } });
		}

		// Mark update as rejected
		await prisma.handwerkerUpdate.update({
			where: { id: updateId },
			data: {
				status: 'abgelehnt',
				bearbeitetVon: locals.user.id,
				bearbeitetAm: new Date(),
				ablehnungsgrund: grund || null
			}
		});

		await createAuditLog(
			locals.user.id,
			'UPDATE_ABGELEHNT',
			{
				updateId,
				typ: update.typ,
				grund,
				schrittId: update.schrittId,
				eingereichtVon: update.eingereichtVon
			},
			params.id,
			update.schrittId
		);

		return { success: true };
	},

	// Mitarbeiter zuweisen (Admin/Innendienst only)
	assignMitarbeiter: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) return fail(400);

		await prisma.projekt.update({
			where: { id: params.id },
			data: {
				mitarbeiter: {
					connect: { id: userId }
				}
			}
		});

		await createAuditLog(
			locals.user.id,
			'MITARBEITER_ZUGEWIESEN',
			{ projektId: params.id, mitarbeiterId: userId },
			params.id
		);

		return { success: true };
	},

	// Mitarbeiter entfernen (Admin/Innendienst only)
	removeMitarbeiter: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) return fail(400);

		await prisma.projekt.update({
			where: { id: params.id },
			data: {
				mitarbeiter: {
					disconnect: { id: userId }
				}
			}
		});

		await createAuditLog(
			locals.user.id,
			'MITARBEITER_ENTFERNT',
			{ projektId: params.id, mitarbeiterId: userId },
			params.id
		);

		return { success: true };
	},

	updateProject: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) {
			return fail(403, { message: 'Keine Berechtigung.' });
		}
		const data = await request.formData();
		const bezeichnung = data.get('projektbezeichnung') as string;
		const beschreibung = data.get('projektbeschreibung') as string;
		const start = data.get('geplanterStart') as string;
		const ende = data.get('geplantesEnde') as string;
		const strasse = data.get('strasse') as string;
		const hausnummer = data.get('hausnummer') as string;
		const plz = data.get('plz') as string;
		const ort = data.get('ort') as string;

		await prisma.projekt.update({
			where: { id: params.id },
			data: {
				projektbezeichnung: bezeichnung,
				projektbeschreibung: beschreibung,
				geplanterStart: new Date(start),
				geplantesEnde: new Date(ende),
				adresse: {
					update: { strasse, hausnummer, plz, ort }
				}
			}
		});

		await createAuditLog(
			locals.user.id,
			'PROJEKT_AKTUALISIERT',
			{ bezeichnung, start, ende },
			params.id
		);

		return { success: true };
	},

	createSchritt: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const titel = data.get('titel') as string;
		const start = data.get('startDatum') as string;
		const ende = data.get('endDatum') as string;
		const beschreibung = data.get('beschreibung') as string;

		const lastStep = await prisma.schritt.findFirst({
			where: { projektId: params.id },
			orderBy: { reihenfolge: 'desc' }
		});
		const neueReihenfolge = (lastStep?.reihenfolge ?? 0) + 1;

		const schritt = await prisma.schritt.create({
			data: {
				projektId: params.id!,
				titel,
				beschreibung,
				startDatum: new Date(start),
				endDatum: new Date(ende),
				reihenfolge: neueReihenfolge,
				status: 'offen',
				fortschritt: 0
			}
		});

		await createAuditLog(
			locals.user.id,
			'SCHRITT_ERSTELLT',
			{ schrittId: schritt.id, titel },
			params.id,
			schritt.id
		);

		return { success: true };
	},

	updateSchritt: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		const titel = data.get('titel') as string;
		const status = data.get('status') as SchrittStatus;
		const fortschritt = parseInt(data.get('fortschritt') as string);
		const start = data.get('startDatum') as string;
		const ende = data.get('endDatum') as string;

		const oldSchritt = await prisma.schritt.findUnique({ where: { id: schrittId } });

		await prisma.schritt.update({
			where: { id: schrittId },
			data: { titel, status, fortschritt, startDatum: new Date(start), endDatum: new Date(ende) }
		});

		await createAuditLog(
			locals.user.id,
			'SCHRITT_AKTUALISIERT',
			{
				schrittId,
				titel,
				alterStatus: oldSchritt?.status,
				neuerStatus: status,
				alterFortschritt: oldSchritt?.fortschritt,
				neuerFortschritt: fortschritt
			},
			params.id,
			schrittId
		);

		return { success: true };
	},

	deleteSchritt: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;

		const schritt = await prisma.schritt.findUnique({ where: { id: schrittId } });

		await prisma.schritt.delete({ where: { id: schrittId } });

		await createAuditLog(
			locals.user.id,
			'SCHRITT_GELOESCHT',
			{ schrittId, titel: schritt?.titel },
			params.id,
			schrittId
		);

		return { success: true };
	}
};