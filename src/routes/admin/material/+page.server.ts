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
    const materialsRaw = await prisma.material.findMany({
        orderBy: { name: 'asc' }
    });

    // 3. Globale Reservierungen laden (Alles in nicht-fertigen Schritten)
    const reservations = await prisma.materialBedarf.groupBy({
        by: ['materialId'],
        where: {
            schritt: { status: { not: 'fertig' } } // Nur laufende Projekte reservieren
        },
        _sum: { menge: true }
    });

    // Map für schnellen Zugriff: ID -> Menge
    const reservationMap = new Map<string, number>();
    reservations.forEach(r => reservationMap.set(r.materialId, r._sum.menge ?? 0));

    // 4. Daten zusammenfügen
    const materials = materialsRaw.map(m => {
        const physisch = Number(m.bestand); // Was liegt im Regal (DB)
        const reserviert = reservationMap.get(m.id) ?? 0; // Was ist verplant
        const verfuegbar = physisch - reserviert; // Was ist "frei"

        return {
            ...m,
            bestand: physisch,
            reserviert,
            verfuegbar,
            mussBestellen: verfuegbar < 0,
            bestellMenge: verfuegbar < 0 ? Math.abs(verfuegbar) : 0
        };
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
        const rawBestand = (data.get('bestand') as string)?.replace(',', '.') || '0';
        const bestand = Math.max(0, parseFloat(rawBestand)); // Bestand darf nicht < 0 sein beim Anlegen

        if (!name || !einheit) return fail(400, { message: 'Pflichtfelder fehlen.' });

        await prisma.material.create({
            data: { name, einheit, bestand: isNaN(bestand) ? 0 : bestand }
        });

        return { success: true };
    },

    // --- BEARBEITEN (Lagerbestand Korrektur) ---
    updateMaterial: async ({ request, locals }) => {
        if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);

        const data = await request.formData();
        const id = data.get('id') as string;
        const name = data.get('name') as string;
        const einheit = data.get('einheit') as string;
        const rawBestand = (data.get('bestand') as string)?.replace(',', '.') || '0';
        const bestand = Math.max(0, parseFloat(rawBestand)); // Bestand nicht < 0

        if (!id || !name) return fail(400);

        await prisma.material.update({
            where: { id },
            data: { name, einheit, bestand: isNaN(bestand) ? 0 : bestand }
        });

        return { success: true };
    },

    // --- LÖSCHEN ---
    deleteMaterial: async ({ request, locals }) => {
        if (!locals.user || (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST)) return fail(403);
        const data = await request.formData();
        const id = data.get('id') as string;

        try {
            await prisma.$transaction([
                prisma.materialBedarf.deleteMany({ where: { materialId: id } }),
                prisma.material.delete({ where: { id } })
            ]);
        } catch (error) {
            return fail(500, { message: 'Fehler beim Löschen.' });
        }
        return { success: true };
    }
};
