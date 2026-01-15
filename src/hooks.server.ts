import { type Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionId = event.cookies.get('session');

    if (!sessionId) {
        event.locals.user = null;
        event.locals.projekt = null;
        return resolve(event);
    }

    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true, projekt: true }
    });

    if (session && session.expiresAt > new Date()) {
        if (session.user) {
            //Mitarbeiter
            event.locals.user = {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role
            };
            event.locals.projekt = null;
        } else if (session.projekt) {
            //Kunde
            event.locals.projekt = {
                id: session.projekt.id,
                auftragsnummer: session.projekt.auftragsnummer,
                kundenname: session.projekt.kundenname
            };
            event.locals.user = null;
        }
    } else {
        // Session ungültig/abgelaufen -> Cookie löschen
        event.cookies.delete('session', { path: '/' });
        event.locals.user = null;
        event.locals.projekt = null;
    }

    return resolve(event);
};
