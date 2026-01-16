import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	const resetToken = await prisma.passwordResetToken.findUnique({
		where: { token },
		include: { user: true }
	});

	if (!resetToken) {
		return { valid: false, error: 'Dieser Link ist ungültig.' };
	}

	if (resetToken.used) {
		return { valid: false, error: 'Dieser Link wurde bereits verwendet.' };
	}

	if (resetToken.expiresAt < new Date()) {
		return {
			valid: false,
			error: 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.'
		};
	}

	return { valid: true, email: resetToken.email };
};

export const actions: Actions = {
	resetPassword: async ({ request, params }) => {
		const { token } = params;
		const data = await request.formData();
		const password = data.get('password') as string;
		const passwordConfirm = data.get('passwordConfirm') as string;

		if (!password || password.length < 8) {
			return fail(400, { error: 'Das Passwort muss mindestens 8 Zeichen lang sein.' });
		}

		if (password !== passwordConfirm) {
			return fail(400, { error: 'Die Passwörter stimmen nicht überein.' });
		}

		const resetToken = await prisma.passwordResetToken.findUnique({
			where: { token },
			include: { user: true }
		});

		if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
			return fail(400, { error: 'Dieser Link ist ungültig oder abgelaufen.' });
		}

		const passwordHash = await bcrypt.hash(password, 12);

		await prisma.$transaction([
			prisma.user.update({
				where: { id: resetToken.userId },
				data: { passwordHash }
			}),
			prisma.passwordResetToken.update({
				where: { id: resetToken.id },
				data: { used: true }
			}),
			prisma.passwordResetToken.updateMany({
				where: { userId: resetToken.userId, id: { not: resetToken.id }, used: false },
				data: { used: true }
			}),
			prisma.session.deleteMany({
				where: { userId: resetToken.userId }
			})
		]);

		throw redirect(303, '/?passwordReset=success');
	}
};
