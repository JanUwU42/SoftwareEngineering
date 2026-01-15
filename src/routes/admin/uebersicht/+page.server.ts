import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	// 1. Auth Check
	if (!locals.user) throw redirect(303, '/');

	const userRole = locals.user.role;

	// 2. Filter-Logik definieren
	let whereCondition = {};

	// Wenn Handwerker -> Nur Projekte laden, wo er zugeordnet ist
	if (userRole === Role.HANDWERKER) {
		whereCondition = {
			mitarbeiter: {
				some: {
					id: locals.user.id
				}
			}
		};
	}
	// Admin & Innendienst -> whereCondition bleibt leer {} (Alles sehen)

	// 3. Projekte laden
	const projectsRaw = await prisma.projekt.findMany({
		where: whereCondition,
		orderBy: { geplanterStart: 'desc' },
		include: {
			adresse: true,
			schritte: true
		}
	});

	// 4. Daten mappen (wie bisher)
	const projects = projectsRaw.map((p) => {
		const gesamtSchritte = p.schritte.length;
		const fertigeSchritte = p.schritte.filter((s) => s.status === 'fertig').length;
		const fortschritt = gesamtSchritte > 0
			? Math.round((p.schritte.reduce((acc, s) => acc + s.fortschritt, 0) / gesamtSchritte))
			: 0;

		return {
			id: p.id,
			auftragsnummer: p.auftragsnummer,
			projektbezeichnung: p.projektbezeichnung,
			kundenname: p.kundenname,
			ort: p.adresse?.ort ?? 'Unbekannt',
			geplanterStart: p.geplanterStart.toISOString(),
			geplantesEnde: p.geplantesEnde.toISOString(),
			fortschritt,
			fertigeSchritte,
			gesamtSchritte
		};
	});

	// 5. Count pending updates for Innendienst/Admin
	let pendingUpdatesCount = 0;
	if (userRole === Role.ADMIN || userRole === Role.INNENDIENST) {
		pendingUpdatesCount = await prisma.handwerkerUpdate.count({
			where: { status: 'ausstehend' }
		});
	}

	return {
		projects,
		userRole,
		pendingUpdatesCount
	};
};
