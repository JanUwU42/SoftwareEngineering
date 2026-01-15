import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
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
