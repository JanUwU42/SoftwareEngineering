import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

// 1. Laden der User-Liste
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user || locals.user.role !== Role.ADMIN) throw redirect(303, '/');

    const users = await prisma.user.findMany({
        orderBy: { erstelltAm: 'desc' },
        select: {
            id: true, email: true, vorname: true, nachname: true, role: true, erstelltAm: true,
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
    // --- USER ANLEGEN ---
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
            data: {
                email,
                passwordHash,
                role,
                vorname,
                nachname
            }
        });

        return { success: true };
    },

    // --- USER BEARBEITEN (Rolle, Email, Namen, Passwort) ---
    updateUser: async ({ request, locals }) => {
        if (locals.user?.role !== Role.ADMIN) return fail(403);

        const data = await request.formData();
        const userId = data.get('userId') as string;

        // Daten auslesen
        const role = data.get('role') as Role;
        const email = data.get('email') as string;
        const vorname = data.get('vorname') as string; // NEU
        const nachname = data.get('nachname') as string; // NEU
        const newPassword = data.get('password') as string;

        const selectedProjectIds = data.getAll('projectIds') as string[];

        // Objekt für das Update bauen
        const updateData: any = {
            role,
            email,
            vorname, // NEU: Wird jetzt aktualisiert
            nachname // NEU: Wird jetzt aktualisiert
        };

        // Passwort nur ändern, wenn das Feld nicht leer ist
        if (newPassword && newPassword.trim() !== '') {
            updateData.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        if (role === Role.HANDWERKER) {
            updateData.projekte = {
                set: selectedProjectIds.map(id => ({ id })) // 'set' überschreibt die Liste mit der neuen Auswahl
            };
        } else {
            // Wenn er kein Handwerker ist, Verknüpfungen löschen (optional, aber sauber)
            updateData.projekte = { set: [] };
        }

        await prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return { success: true };
    },

    // --- USER LÖSCHEN ---
    deleteUser: async ({ request, locals }) => {
        if (locals.user?.role !== Role.ADMIN) return fail(403);

        const data = await request.formData();
        const userId = data.get('userId') as string;

        if (userId === locals.user.id) {
            return fail(400, { message: 'Du kannst dich nicht selbst löschen.' });
        }

        await prisma.user.delete({ where: { id: userId } });
        return { success: true };
    }
};
