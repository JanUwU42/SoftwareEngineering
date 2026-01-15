import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
    // 1. Zugriffsschutz
    if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) {
        throw redirect(303, '/');
    }

    // 2. Materialien laden
    const materials = await prisma.material.findMany({
        orderBy: { name: 'asc' }
    });

    return { materials };
};

export const actions: Actions = {
    // --- ERSTELLEN ---
    createMaterial: async ({ request, locals }) => {
        if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

        const data = await request.formData();
        const name = data.get('name') as string;
        const einheit = data.get('einheit') as string;

        // Bestand parsen (Komma zu Punkt für deutsche Eingabe)
        const rawBestand = (data.get('bestand') as string)?.replace(',', '.') || '0';
        const bestand = parseFloat(rawBestand);

        if (!name || !einheit) {
            return fail(400, { message: 'Name und Einheit sind Pflichtfelder.' });
        }

        await prisma.material.create({
            data: {
                name,
                einheit,
                bestand: isNaN(bestand) ? 0 : bestand
            }
        });

        return { success: true };
    },

    // --- BEARBEITEN (Hier fehlte vorher der Bestand) ---
    updateMaterial: async ({ request, locals }) => {
        if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

        const data = await request.formData();
        const id = data.get('id') as string;
        const name = data.get('name') as string;
        const einheit = data.get('einheit') as string;

        // WICHTIG: Bestand auch beim Update auslesen!
        const rawBestand = (data.get('bestand') as string)?.replace(',', '.') || '0';
        const bestand = parseFloat(rawBestand);

        if (!id || !name) return fail(400, { message: 'Daten unvollständig.' });

        await prisma.material.update({
            where: { id },
            data: {
                name,
                einheit,
                // Hier wird der neue Bestand in die DB geschrieben
                bestand: isNaN(bestand) ? 0 : bestand
            }
        });

        return { success: true };
    },

    // --- LÖSCHEN ---
    deleteMaterial: async ({ request, locals }) => {
        if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

        const data = await request.formData();
        const id = data.get('id') as string;

        try {
            await prisma.material.delete({ where: { id } });
        } catch (error) {
            // Fehler fangen, falls Material in Verwendung ist (Foreign Key Constraint)
            return fail(400, { message: 'Material kann nicht gelöscht werden, da es in Projekten verwendet wird.' });
        }
        return { success: true };
    }
};
