import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/');

	const userRole = locals.user.role;

	let whereCondition = {};
	if (userRole === Role.HANDWERKER) {
		whereCondition = { mitarbeiter: { some: { id: locals.user.id } } };
	}

	const projectsRaw = await prisma.projekt.findMany({
		where: whereCondition,
		orderBy: { geplanterStart: 'desc' },
		include: { adresse: true, schritte: true }
	});

	const projects = projectsRaw.map((p) => {
		const gesamtSchritte = p.schritte.length;
		const fertigeSchritte = p.schritte.filter((s) => s.status === 'fertig').length;
		const fortschritt =
			gesamtSchritte > 0
				? Math.round(p.schritte.reduce((acc, s) => acc + s.fortschritt, 0) / gesamtSchritte)
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

	let pendingUpdatesCount = 0;
	if (userRole === Role.ADMIN || userRole === Role.INNENDIENST) {
		pendingUpdatesCount = await prisma.handwerkerUpdate.count({
			where: { status: 'ausstehend' }
		});
	}

	return { projects, userRole, pendingUpdatesCount };
};
