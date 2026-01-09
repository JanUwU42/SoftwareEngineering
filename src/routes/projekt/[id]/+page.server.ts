import type { PageServerLoad } from './$types';
import { getProjectById } from '$lib/data/mockProjects';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	// TODO: Später durch echten PostgreSQL-Query ersetzen
	const project = getProjectById(id);

	if (!project) {
		throw error(404, {
			message: 'Projekt nicht gefunden'
		});
	}

	// Serialisiere Daten für den Client (Dates als ISO-Strings)
	return {
		project: {
			id: project.id,
			metadata: {
				auftragsnummer: project.metadata.auftragsnummer,
				kundenname: project.metadata.kundenname,
				projektadresse: project.metadata.projektadresse,
				projektbezeichnung: project.metadata.projektbezeichnung,
				projektbeschreibung: project.metadata.projektbeschreibung,
				geplanterStart: project.metadata.geplanterStart?.toISOString() ?? null,
				geplantesEnde: project.metadata.geplantesEnde?.toISOString() ?? null
			},
			schritte: project.schritte.map((schritt) => ({
				id: schritt.id,
				titel: schritt.titel,
				beschreibung: schritt.beschreibung,
				startDatum: schritt.startDatum.toISOString(),
				endDatum: schritt.endDatum.toISOString(),
				status: schritt.status,
				fortschritt: schritt.fortschritt,
				material: schritt.material,
				reihenfolge: schritt.reihenfolge
			})),
			materialListe: project.materialListe,
			erstelltAm: project.erstelltAm.toISOString(),
			aktualisiertAm: project.aktualisiertAm.toISOString()
		}
	};
};
