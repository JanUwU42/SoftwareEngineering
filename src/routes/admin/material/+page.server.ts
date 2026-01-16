import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role, type Material } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) {
		throw redirect(303, '/');
	}

	const materialsRaw = await prisma.material.findMany({ orderBy: { name: 'asc' } });

	const reservations = await prisma.materialBedarf.groupBy({
		by: ['materialId'],
		where: { schritt: { status: { not: 'fertig' } } },
		_sum: { menge: true }
	});

	const reservationMap = new Map<string, number>();
	reservations.forEach((r: { materialId: string; _sum: { menge: number | null } }) =>
		reservationMap.set(r.materialId, r._sum.menge ?? 0)
	);

	const materials = materialsRaw.map((m: Material) => {
		const physisch = Number(m.bestand);
		const reserviert = reservationMap.get(m.id) ?? 0;
		const verfuegbar = physisch - reserviert;

		return {
			...m,
			bestand: physisch,
			reserviert,
			verfuegbar,
			mussBestellen: verfuegbar < 0,
			bestellMenge: verfuegbar < 0 ? Math.abs(verfuegbar) : 0
		};
	});

	return { materials };
};

export const actions: Actions = {
	createMaterial: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;
		const einheit = data.get('einheit') as string;
		const rawBestand = (data.get('bestand') as string)?.replace(',', '.') || '0';
		const bestand = Math.max(0, parseFloat(rawBestand));

		if (!name || !einheit) return fail(400, { message: 'Pflichtfelder fehlen.' });

		await prisma.material.create({
			data: { name, einheit, bestand: isNaN(bestand) ? 0 : bestand }
		});

		return { success: true };
	},

	updateMaterial: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);

		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const einheit = data.get('einheit') as string;
		const rawBestand = (data.get('bestand') as string)?.replace(',', '.') || '0';
		const bestand = Math.max(0, parseFloat(rawBestand));

		if (!id || !name) return fail(400);

		await prisma.material.update({
			where: { id },
			data: { name, einheit, bestand: isNaN(bestand) ? 0 : bestand }
		});

		return { success: true };
	},

	deleteMaterial: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST))
			return fail(403);

		const data = await request.formData();
		const id = data.get('id') as string;

		try {
			await prisma.$transaction([
				prisma.materialBedarf.deleteMany({ where: { materialId: id } }),
				prisma.material.delete({ where: { id } })
			]);
		} catch {
			return fail(500, { message: 'Fehler beim Löschen.' });
		}

		return { success: true };
	}
};
