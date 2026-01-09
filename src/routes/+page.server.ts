import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const identifier = data.get('identifier') as string; // E-Mail ODER Auftragsnummer
        const secret = data.get('secret') as string;         // Passwort ODER Nachname

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

            throw redirect(303, '/admin/dashboard');

        } else {
            const projekt = await prisma.projekt.findUnique({
                where: { auftragsnummer: identifier }
            });

            if (!projekt || !projekt.kundenname.toLowerCase().includes(secret.toLowerCase())) {
                return fail(400, { identifier, invalid: true, type: 'customer' });
            }

            // Session erstellen
            const sessionId = crypto.randomUUID();
            await prisma.session.create({
                data: {
                    id: sessionId,
                    expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000), // 1 Tag
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

            throw redirect(303, `/projekt/${projekt.auftragsnummer}`);
        }
    },

    logout: async ({ cookies }) => {
        const sessionId = cookies.get('session');
        if (sessionId) {
            await prisma.session.deleteMany({ where: { id: sessionId } });
            cookies.delete('session', { path: '/' });
        }
        throw redirect(303, '/login');
    }
};
