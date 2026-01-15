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

		// Find the user by email
		const user = await prisma.user.findUnique({
			where: { email: email.toLowerCase().trim() }
		});

		// Always show success message to prevent email enumeration attacks
		if (!user) {
			// Wait a bit to simulate processing time (prevent timing attacks)
			await new Promise((resolve) => setTimeout(resolve, 500));
			return { success: true, email };
		}

		// Invalidate any existing reset tokens for this user
		await prisma.passwordResetToken.updateMany({
			where: {
				userId: user.id,
				used: false
			},
			data: {
				used: true
			}
		});

		// Create a new reset token
		const token = crypto.randomBytes(32).toString('hex');
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await prisma.passwordResetToken.create({
			data: {
				token,
				email: user.email,
				userId: user.id,
				expiresAt
			}
		});

		// Get the base URL for the reset link
		const baseUrl = url.origin;

		// Send the password reset email
		const emailSent = await sendPasswordResetEmail(user.email, token, baseUrl);

		if (!emailSent) {
			return fail(500, {
				email,
				error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.'
			});
		}

		return { success: true, email };
	}
};