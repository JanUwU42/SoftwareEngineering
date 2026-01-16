import { dev } from '$app/environment';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function createSession(userId: string | null, projectId: string | null) {
	const token = crypto.randomUUID();

	return await prisma.session.create({
		data: {
			id: token,
			userId,
			projektId: projectId,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
		}
	});
}

export function setSessionCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set('session', token, {
		httpOnly: true,
		path: '/',
		secure: !dev,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function deleteSessionCookie(event: RequestEvent) {
	event.cookies.delete('session', { path: '/' });
}
