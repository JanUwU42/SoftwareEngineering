import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { sendPasswordResetEmail } from '$lib/server/email';
import crypto from 'crypto';

export const actions: Actions = {
	requestReset: async ({ request, url }) => {
		const data = await request.formData();
		const email = data.get('email') as string;

		if (!email || !email.includes('@')) {
			return fail(400, { email, error: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
		}

		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase().trim() }
		});

		if (!user) {
			await new Promise((resolve) => setTimeout(resolve, 500));
			return { success: true, email };
		}

		await prisma.passwordResetToken.updateMany({
			where: { userId: user.id, used: false },
			data: { used: true }
		});

		const token = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

		await prisma.passwordResetToken.create({
			data: { token, email: user.email, userId: user.id, expiresAt }
		});

		const { success: emailSent, notification } = await sendPasswordResetEmail(
			user.email,
			token,
			url.origin
		);

		if (!emailSent) {
			return fail(500, {
				email,
				error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.'
			});
		}

		return { success: true, email, notification };
	}
};
