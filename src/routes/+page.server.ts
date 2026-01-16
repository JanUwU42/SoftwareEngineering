import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		const istMitarbeiter =
			locals.user.role === Role.ADMIN ||
			locals.user.role === Role.HANDWERKER ||
			locals.user.role === Role.INNENDIENST;

		if (istMitarbeiter) {
			throw redirect(303, '/admin/uebersicht');
		}
	}
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const identifier = data.get('identifier') as string;
		const secret = data.get('secret') as string;

		if (!identifier || !secret) {
			return fail(400, { identifier, missing: true });
		}

		const isStaffLogin = identifier.includes('@');

		if (isStaffLogin) {
			const user = await prisma.user.findUnique({ where: { email: identifier } });

			if (!user || !(await bcrypt.compare(secret, user.passwordHash))) {
				return fail(400, { identifier, invalid: true, type: 'staff' });
			}

			const sessionId = crypto.randomUUID();
			await prisma.session.create({
				data: {
					id: sessionId,
					expiresAt: new Date(Date.now() + 60 * 60 * 24 * 7 * 1000),
					userId: user.id
				}
			});

			cookies.set('session', sessionId, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7
			});

			throw redirect(303, '/admin/uebersicht');
		} else {
			const projekt = await prisma.projekt.findUnique({
				where: { auftragsnummer: identifier }
			});

			if (!projekt || !projekt.kundenname.toLowerCase().includes(secret.toLowerCase())) {
				return fail(400, { identifier, invalid: true, type: 'customer' });
			}

			const sessionId = crypto.randomUUID();
			await prisma.session.create({
				data: {
					id: sessionId,
					expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
					projektId: projekt.id
				}
			});

			cookies.set('session', sessionId, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24
			});

			throw redirect(303, `/projekt/${projekt.id}`);
		}
	},

	logout: async ({ cookies }) => {
		const sessionId = cookies.get('session');
		if (sessionId) {
			await prisma.session.deleteMany({ where: { id: sessionId } });
			cookies.delete('session', { path: '/' });
		}
		throw redirect(303, '/');
	}
};
