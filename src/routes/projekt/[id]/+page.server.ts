import {error, fail, redirect} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	// 1. AUTH CHECK
	if (!locals.user && !locals.projekt) {
		throw redirect(303, '/');
	}
	if (locals.projekt && locals.projekt.id !== id) {
		throw error(403, 'Zugriff verweigert: Dies ist nicht Ihr Projekt.');
	}

	// 2. DB ABFRAGE
	const p = await prisma.projekt.findUnique({
		where: { id },
		include: {
			adresse: true,
			schritte: {
				orderBy: { reihenfolge: 'asc' },
				include: {
					materialien: { include: { material: true } },
					bilder: true
				}
			}
		}
	});

	if (!p) {
		throw error(404, 'Projekt nicht gefunden');
	}

	// 3. DATEN AUFBEREITUNG
	// Wir nennen das Objekt hier explizit "project" (Englisch),
	// damit es sich nicht mit "locals.projekt" beißt!
	return {
		isStaff: !!locals.user,
		project: {
			id: p.id,
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
				// Dates werden hier zu Strings
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
			// Materialliste aggregieren
			materialListe: p.schritte.flatMap((s) =>
				s.materialien.map((m) => ({
					id: m.material.id,
					name: m.material.name,
					menge: m.menge,
					einheit: m.material.einheit,
					bemerkung: m.bemerkung ?? undefined
				}))
			),
			erstelltAm: p.erstelltAm.toISOString(),
			aktualisiertAm: p.aktualisiertAm.toISOString()
		}
	};
};

export const actions: Actions = {
	uploadBild: async ({ request, locals, params }) => {
		// 1. Security Check: Nur Mitarbeiter dürfen hochladen!
		if (!locals.user) {
			return fail(403, { message: 'Nur Mitarbeiter dürfen Bilder hochladen.' });
		}

		const data = await request.formData();
		const file = data.get('bild') as File;
		const schrittId = data.get('schrittId') as string;
		const beschreibung = data.get('beschreibung') as string;

		// 2. Validierung
		if (!file || file.size === 0) {
			return fail(400, { message: 'Keine Datei ausgewählt.' });
		}
		if (!schrittId) {
			return fail(400, { message: 'Kein Projektschritt zugeordnet.' });
		}

		// Optional: Prüfen ob es ein Bild ist
		if (!file.type.startsWith('image/')) {
			return fail(400, { message: 'Nur Bilddateien sind erlaubt.' });
		}

		try {
			// 3. Konvertierung: File -> ArrayBuffer -> Buffer (für Prisma Bytes)
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// 4. Speichern in DB
			await prisma.bild.create({
				data: {
					daten: buffer,
					mimeType: file.type,
					beschreibung: beschreibung || file.name,
					hochgeladenVon: 'Mitarbeiter', // Oder locals.user.email
					schrittId: schrittId
				}
			});

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { message: 'Fehler beim Speichern des Bildes.' });
		}
	},
	deleteBild: async ({ request, locals }) => {
		// 1. Security: Nur Mitarbeiter!
		if (!locals.user) {
			return fail(403, { message: 'Nur Mitarbeiter dürfen Bilder löschen.' });
		}

		const data = await request.formData();
		const bildId = data.get('bildId') as string;

		if (!bildId) {
			return fail(400, { message: 'Keine Bild-ID übergeben.' });
		}

		try {
			// 2. Löschen aus der DB
			await prisma.bild.delete({
				where: { id: bildId }
			});

			return { success: true };
		} catch (err) {
			console.error(err);
			return fail(500, { message: 'Fehler beim Löschen des Bildes.' });
		}
	}
};
