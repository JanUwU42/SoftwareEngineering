import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	// 1. AUTH CHECK
	if (!locals.user && !locals.projekt) throw redirect(303, '/');
	if (locals.projekt && locals.projekt.id !== id) throw error(403, 'Zugriff verweigert.');

	// 2. DB ABFRAGE
	const p = await prisma.projekt.findUnique({
		where: { id },
		include: {
			adresse: true,
			// NEU: Mitarbeiter laden
			mitarbeiter: {
				select: { id: true, vorname: true, nachname: true, role: true }
			},
			schritte: {
				orderBy: { reihenfolge: 'asc' },
				include: {
					materialien: { include: { material: true } },
					bilder: true
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

	// NEU: Verfügbare Handwerker laden (nur für Admin/Innendienst relevant)
	let availableHandwerker: { id: string; vorname: string; nachname: string }[] = [];
	if (locals.user && (locals.user.role === Role.ADMIN || locals.user.role === Role.INNENDIENST)) {
		availableHandwerker = await prisma.user.findMany({
			where: { role: Role.HANDWERKER },
			select: { id: true, vorname: true, nachname: true }
		});
	}

	return {
		isStaff: !!locals.user,
		userRole: locals.user?.role,
		availableHandwerker, // Liste für das Dropdown

		project: {
			id: p.id,
			// NEU: Zugewiesene Mitarbeiter weitergeben
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
					hochgeladenVon: bild.hochgeladenVon
				}))
			})),
			materialListe: materialListe,
			erstelltAm: p.erstelltAm.toISOString(),
			aktualisiertAm: p.aktualisiertAm.toISOString()
		}
	};
};

// --- ACTIONS ---

export const actions: Actions = {
	uploadBild: async ({ request, locals }) => { /* ... Dein Upload Code ... */ },
	deleteBild: async ({ request, locals }) => { /* ... Dein Delete Code ... */ },

	// NEU: MITARBEITER ZUWEISEN
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
		return { success: true };
	},

	// NEU: MITARBEITER ENTFERNEN
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
		return { success: true };
	},

	updateProject: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) {
			return fail(403, { message: 'Keine Berechtigung.' });
		}
		const data = await request.formData();
		// ... Daten auslesen ...
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
		return { success: true };
	},

	createSchritt: async ({ request, params, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		// ... Daten auslesen ...
		const titel = data.get('titel') as string;
		const start = data.get('startDatum') as string;
		const ende = data.get('endDatum') as string;
		const beschreibung = data.get('beschreibung') as string;

		const lastStep = await prisma.schritt.findFirst({
			where: { projektId: params.id },
			orderBy: { reihenfolge: 'desc' }
		});
		const neueReihenfolge = (lastStep?.reihenfolge ?? 0) + 1;

		await prisma.schritt.create({
			data: {
				projektId: params.id!,
				titel, beschreibung, startDatum: new Date(start), endDatum: new Date(ende),
				reihenfolge: neueReihenfolge, status: 'offen', fortschritt: 0
			}
		});
		return { success: true };
	},

	updateSchritt: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		// ... Daten auslesen ...
		const schrittId = data.get('schrittId') as string;
		const titel = data.get('titel') as string;
		const status = data.get('status') as any;
		const fortschritt = parseInt(data.get('fortschritt') as string);
		const start = data.get('startDatum') as string;
		const ende = data.get('endDatum') as string;

		await prisma.schritt.update({
			where: { id: schrittId },
			data: { titel, status, fortschritt, startDatum: new Date(start), endDatum: new Date(ende) }
		});
		return { success: true };
	},

	deleteSchritt: async ({ request, locals }) => {
		if (!locals.user || locals.user.role === Role.HANDWERKER) return fail(403);
		const data = await request.formData();
		const schrittId = data.get('schrittId') as string;
		await prisma.schritt.delete({ where: { id: schrittId } });
		return { success: true };
	}
};
