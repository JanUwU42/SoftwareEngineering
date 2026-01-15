// src/routes/admin/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Zugriffsschutz: Nur eingeloggte User
	if (!locals.user) {
		throw redirect(303, '/');
	}

	// 2. Daten aus der DB holen
	// Wir brauchen die Adresse für den Ort und die Schritte für den Fortschritt
	const dbProjects = await prisma.projekt.findMany({
		orderBy: { erstelltAm: 'desc' },
		include: {
			adresse: true,
			schritte: true
		}
	});

	// 3. Mapping: DB-Format -> Frontend-Format
	const projects = dbProjects.map((p) => {
		// Berechnung des Gesamtfortschritts
		const totalSteps = p.schritte.length;
		const progressSum = p.schritte.reduce((sum, s) => sum + s.fortschritt, 0);
		const avgProgress = totalSteps > 0 ? Math.round(progressSum / totalSteps) : 0;

		return {
			id: p.id,
			auftragsnummer: p.auftragsnummer,
			kundenname: p.kundenname,
			projektbezeichnung: p.projektbezeichnung,
			// Hier greifen wir auf die relationale Tabelle "Adresse" zu
			ort: p.adresse?.ort ?? 'Unbekannt',

			geplanterStart: p.geplanterStart.toISOString(),
			geplantesEnde: p.geplantesEnde.toISOString(),

			gesamtSchritte: totalSteps,
			// Filtert Schritte, deren Status (Enum) 'fertig' ist
			fertigeSchritte: p.schritte.filter((s) => s.status === 'fertig').length,
			fortschritt: avgProgress
		};
	});

	return { projects };
};
