import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== Role.ADMIN) throw redirect(303, '/');

	const users = await prisma.user.findMany({
		orderBy: { erstelltAm: 'desc' },
		select: {
			id: true,
			email: true,
			vorname: true,
			nachname: true,
			role: true,
			erstelltAm: true,
			projekte: { select: { id: true, projektbezeichnung: true } }
		}
	});

	const allProjects = await prisma.projekt.findMany({
		select: { id: true, projektbezeichnung: true, auftragsnummer: true },
		orderBy: { erstelltAm: 'desc' }
	});

	return { users, allProjects };
};

export const actions: Actions = {
	createUser: async ({ request, locals }) => {
		if (locals.user?.role !== Role.ADMIN) return fail(403);

		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const role = data.get('role') as Role;
		const vorname = data.get('vorname') as string;
		const nachname = data.get('nachname') as string;

		if (!email || !password || !role || !vorname || !nachname) {
			return fail(400, { message: 'Bitte alle Felder ausfüllen.' });
		}

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) return fail(400, { message: 'Email vergeben.' });

		const passwordHash = await bcrypt.hash(password, 10);

		await prisma.user.create({
			data: { email, passwordHash, role, vorname, nachname }
		});

		return { success: true };
	},

	updateUser: async ({ request, locals }) => {
		if (locals.user?.role !== Role.ADMIN) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const role = data.get('role') as Role;
		const email = data.get('email') as string;
		const vorname = data.get('vorname') as string;
		const nachname = data.get('nachname') as string;
		const newPassword = data.get('password') as string;
		const selectedProjectIds = data.getAll('projectIds') as string[];

		const updateData: {
			role: Role;
			email: string;
			vorname: string;
			nachname: string;
			passwordHash?: string;
			projekte?: { set: { id: string }[] };
		} = { role, email, vorname, nachname };

		if (newPassword && newPassword.trim() !== '') {
			updateData.passwordHash = await bcrypt.hash(newPassword, 10);
		}

		if (role === Role.HANDWERKER) {
			updateData.projekte = { set: selectedProjectIds.map((id) => ({ id })) };
		} else {
			updateData.projekte = { set: [] };
		}

		await prisma.user.update({ where: { id: userId }, data: updateData });

		return { success: true };
	},

	deleteUser: async ({ request, locals }) => {
		if (locals.user?.role !== Role.ADMIN) return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (locals.user && userId === locals.user.id) {
			return fail(400, { message: 'Du kannst dich nicht selbst löschen.' });
		}

		await prisma.user.delete({ where: { id: userId } });
		return { success: true };
	}
};
