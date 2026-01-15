import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	// Find the token
	const resetToken = await prisma.passwordResetToken.findUnique({
		where: { token },
		include: { user: true }
	});

	// Check if token exists and is valid
	if (!resetToken) {
		return {
			valid: false,
			error: 'Dieser Link ist ungültig.'
		};
	}

	if (resetToken.used) {
		return {
			valid: false,
			error: 'Dieser Link wurde bereits verwendet.'
		};
	}

	if (resetToken.expiresAt < new Date()) {
		return {
			valid: false,
			error: 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen Link an.'
		};
	}

	return {
		valid: true,
		email: resetToken.email
	};
};

export const actions: Actions = {
	resetPassword: async ({ request, params }) => {
		const { token } = params;
		const data = await request.formData();
		const password = data.get('password') as string;
		const passwordConfirm = data.get('passwordConfirm') as string;

		// Validate password
		if (!password || password.length < 8) {
			return fail(400, {
				error: 'Das Passwort muss mindestens 8 Zeichen lang sein.'
			});
		}

		if (password !== passwordConfirm) {
			return fail(400, {
				error: 'Die Passwörter stimmen nicht überein.'
			});
		}

		// Find and validate the token again
		const resetToken = await prisma.passwordResetToken.findUnique({
			where: { token },
			include: { user: true }
		});

		if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
			return fail(400, {
				error: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.'
			});
		}

		// Hash the new password
		const passwordHash = await bcrypt.hash(password, 12);

		// Update the user's password and mark the token as used
		await prisma.$transaction([
			prisma.user.update({
				where: { id: resetToken.userId },
				data: { passwordHash }
			}),
			prisma.passwordResetToken.update({
				where: { id: resetToken.id },
				data: { used: true }
			}),
			// Also invalidate all other reset tokens for this user
			prisma.passwordResetToken.updateMany({
				where: {
					userId: resetToken.userId,
					id: { not: resetToken.id },
					used: false
				},
				data: { used: true }
			}),
			// Delete all active sessions for this user (security measure)
			prisma.session.deleteMany({
				where: { userId: resetToken.userId }
			})
		]);

		// Redirect to login with success message
		throw redirect(303, '/?passwordReset=success');
	}
};