import type { PageServerLoad } from './$types';
import { getAllProjects } from '$lib/data/mockProjects';

export const load: PageServerLoad = async () => {
	// TODO: Später durch echten PostgreSQL-Query ersetzen
	const projects = getAllProjects();

	// Serialisiere Projekte für den Client (Dates als ISO-Strings)
	return {
		projects: projects.map((project) => ({
			id: project.id,
			auftragsnummer: project.metadata.auftragsnummer,
			kundenname: project.metadata.kundenname,
			projektbezeichnung: project.metadata.projektbezeichnung,
			ort: project.metadata.projektadresse.ort,
			geplanterStart: project.metadata.geplanterStart?.toISOString() ?? null,
			geplantesEnde: project.metadata.geplantesEnde?.toISOString() ?? null,
			gesamtSchritte: project.schritte.length,
			fertigeSchritte: project.schritte.filter((s) => s.status === 'fertig').length,
			fortschritt:
				project.schritte.length > 0
					? Math.round(
							project.schritte.reduce((sum, s) => sum + s.fortschritt, 0) / project.schritte.length
						)
					: 0
		}))
	};
};
