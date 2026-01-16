import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { Role } from '@prisma/client';
import { notifyCustomerAboutStepUpdate } from '$lib/server/email';

async function createAuditLog(
	userId: string,
	aktion: string,
	details: Record<string, unknown>,
	projektId?: string,
	schrittId?: string
) {
	await prisma.auditLog.create({
		data: { userId, aktion, details: JSON.stringify(details), projektId, schrittId }
	});
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/');
	if (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST) {
		throw error(403, 'Zugriff verweigert.');
	}

	const pendingUpdates = await prisma.handwerkerUpdate.findMany({
		where: { status: 'ausstehend' },
		include: {
			schritt: {
				include: {
					projekt: {
						select: { id: true, projektbezeichnung: true, kundenname: true, auftragsnummer: true }
					}
				}
			},
			bearbeiter: { select: { id: true, vorname: true, nachname: true } },
			bild: true
		},
		orderBy: { eingereichtAm: 'desc' }
	});

	const updates = pendingUpdates.map((update) => ({
		id: update.id,
		typ: update.typ,
		neuerStatus: update.neuerStatus,
		neuerFortschritt: update.neuerFortschritt,
		notizText: update.notizText,
		eingereichtAm: update.eingereichtAm.toISOString(),
		bearbeiter: {
			id: update.bearbeiter.id,
			name: `${update.bearbeiter.vorname} ${update.bearbeiter.nachname}`
		},
		schritt: {
			id: update.schritt.id,
			titel: update.schritt.titel,
			status: update.schritt.status,
			fortschritt: update.schritt.fortschritt
		},
		projekt: {
			id: update.schritt.projekt.id,
			bezeichnung: update.schritt.projekt.projektbezeichnung,
			kundenname: update.schritt.projekt.kundenname,
			auftragsnummer: update.schritt.projekt.auftragsnummer
		},
		bild: update.bild
			? {
					id: update.bild.id,
					url: `data:${update.bild.mimeType};base64,${Buffer.from(update.bild.daten).toString('base64')}`,
					beschreibung: update.bild.beschreibung
				}
			: null
	}));

	return { updates, userRole: locals.user.role };
};

export const actions: Actions = {
	approve: async ({ request, locals, url }) => {
		if (!locals.user) return fail(403, { message: 'Nicht angemeldet.' });
		if (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST) {
			return fail(403, { message: 'Keine Berechtigung.' });
		}

		const data = await request.formData();
		const updateId = data.get('updateId') as string;

		if (!updateId) return fail(400, { message: 'Update-ID erforderlich.' });

		const update = await prisma.handwerkerUpdate.findUnique({
			where: { id: updateId },
			include: {
				schritt: {
					include: {
						projekt: { select: { id: true, auftragsnummer: true, kundenname: true } }
					}
				},
				bild: true
			}
		});

		if (!update) return fail(404, { message: 'Update nicht gefunden.' });
		if (update.status !== 'ausstehend') return fail(400, { message: 'Update bereits bearbeitet.' });

		if (update.typ === 'STATUS_AENDERUNG') {
			await prisma.schritt.update({
				where: { id: update.schrittId },
				data: {
					...(update.neuerStatus && { status: update.neuerStatus }),
					...(update.neuerFortschritt !== null && { fortschritt: update.neuerFortschritt })
				}
			});
		} else if (update.typ === 'FOTO_UPLOAD' && update.bildId) {
			await prisma.bild.update({
				where: { id: update.bildId },
				data: { freigegeben: true }
			});
		} else if (update.typ === 'NOTIZ' && update.notizText) {
			await prisma.notiz.create({
				data: {
					text: update.notizText,
					schrittId: update.schrittId,
					erstelltVon: update.eingereichtVon,
					sichtbarFuerKunde: false
				}
			});
		}

		await prisma.handwerkerUpdate.update({
			where: { id: updateId },
			data: { status: 'genehmigt', bearbeitetVon: locals.user.id, bearbeitetAm: new Date() }
		});

		await createAuditLog(
			locals.user.id,
			'UPDATE_GENEHMIGT',
			{
				updateId,
				typ: update.typ,
				schrittId: update.schrittId,
				eingereichtVon: update.eingereichtVon
			},
			update.schritt.projektId,
			update.schrittId
		);

		const baseUrl = `${url.protocol}//${url.host}`;
		const neuerStatus = update.neuerStatus || update.schritt.status;
		const fortschritt = update.neuerFortschritt ?? update.schritt.fortschritt;

		const notification = notifyCustomerAboutStepUpdate({
			auftragsnummer: update.schritt.projekt.auftragsnummer,
			schrittTitel: update.schritt.titel,
			neuerStatus,
			fortschritt,
			projektId: update.schritt.projekt.id,
			kundenname: update.schritt.projekt.kundenname,
			baseUrl
		});

		return { success: true, message: 'Aktualisierung genehmigt.', notification };
	},

	reject: async ({ request, locals }) => {
		if (!locals.user) return fail(403, { message: 'Nicht angemeldet.' });
		if (locals.user.role !== Role.ADMIN && locals.user.role !== Role.INNENDIENST) {
			return fail(403, { message: 'Keine Berechtigung.' });
		}

		const data = await request.formData();
		const updateId = data.get('updateId') as string;
		const grund = data.get('grund') as string;

		if (!updateId) return fail(400, { message: 'Update-ID erforderlich.' });

		const update = await prisma.handwerkerUpdate.findUnique({
			where: { id: updateId },
			include: { schritt: true, bild: true }
		});

		if (!update) return fail(404, { message: 'Update nicht gefunden.' });
		if (update.status !== 'ausstehend') return fail(400, { message: 'Update bereits bearbeitet.' });

		if (update.typ === 'FOTO_UPLOAD' && update.bildId) {
			await prisma.bild.delete({ where: { id: update.bildId } });
		}

		await prisma.handwerkerUpdate.update({
			where: { id: updateId },
			data: {
				status: 'abgelehnt',
				bearbeitetVon: locals.user.id,
				bearbeitetAm: new Date(),
				ablehnungsgrund: grund || null
			}
		});

		await createAuditLog(
			locals.user.id,
			'UPDATE_ABGELEHNT',
			{
				updateId,
				typ: update.typ,
				schrittId: update.schrittId,
				eingereichtVon: update.eingereichtVon,
				grund
			},
			update.schritt.projektId,
			update.schrittId
		);

		return { success: true, message: 'Aktualisierung abgelehnt.' };
	}
};
