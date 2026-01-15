import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

// Generate a unique Auftragsnummer based on year and sequential number
async function generateAuftragsnummer(): Promise<string> {
	const year = new Date().getFullYear();
	const prefix = `${year}-SB-`;

	// Find the highest existing number for this year
	const lastProject = await prisma.projekt.findFirst({
		where: {
			auftragsnummer: {
				startsWith: prefix
			}
		},
		orderBy: {
			auftragsnummer: 'desc'
		}
	});

	let nextNumber = 1;
	if (lastProject) {
		const lastNumberStr = lastProject.auftragsnummer.replace(prefix, '');
		const lastNumber = parseInt(lastNumberStr, 10);
		if (!isNaN(lastNumber)) {
			nextNumber = lastNumber + 1;
		}
	}

	// Format with leading zeros (e.g., 001, 012, 123)
	return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}

export const load: PageServerLoad = async ({ locals }) => {
	// Auth check: Only logged-in employees can create projects
	if (!locals.user) {
		redirect(303, '/');
	}

	// Generate the next Auftragsnummer for display
	const nextAuftragsnummer = await generateAuftragsnummer();

	return {
		nextAuftragsnummer
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		// Auth check
		if (!locals.user) {
			redirect(303, '/');
		}

		const formData = await request.formData();

		// Extract project data
		const kundenname = formData.get('kundenname') as string;
		const projektbezeichnung = formData.get('projektbezeichnung') as string;
		const projektbeschreibung = formData.get('projektbeschreibung') as string | null;
		const geplanterStart = formData.get('geplanterStart') as string;
		const geplantesEnde = formData.get('geplantesEnde') as string;

		// Extract address data
		const strasse = formData.get('strasse') as string;
		const hausnummer = formData.get('hausnummer') as string;
		const plz = formData.get('plz') as string;
		const ort = formData.get('ort') as string;

		// Validation
		const errors: Record<string, string> = {};

		if (!kundenname?.trim()) {
			errors.kundenname = 'Kundenname ist erforderlich';
		}
		if (!projektbezeichnung?.trim()) {
			errors.projektbezeichnung = 'Projektbezeichnung ist erforderlich';
		}
		if (!geplanterStart) {
			errors.geplanterStart = 'Geplanter Start ist erforderlich';
		}
		if (!geplantesEnde) {
			errors.geplantesEnde = 'Geplantes Ende ist erforderlich';
		}
		if (!strasse?.trim()) {
			errors.strasse = 'Straße ist erforderlich';
		}
		if (!hausnummer?.trim()) {
			errors.hausnummer = 'Hausnummer ist erforderlich';
		}
		if (!plz?.trim()) {
			errors.plz = 'PLZ ist erforderlich';
		}
		if (!ort?.trim()) {
			errors.ort = 'Ort ist erforderlich';
		}

		// Check date validity
		if (geplanterStart && geplantesEnde) {
			const startDate = new Date(geplanterStart);
			const endDate = new Date(geplantesEnde);
			if (endDate < startDate) {
				errors.geplantesEnde = 'Enddatum muss nach dem Startdatum liegen';
			}
		}

		// Extract steps (Schritte)
		const schrittTitel = formData.getAll('schritt_titel') as string[];
		const schrittBeschreibung = formData.getAll('schritt_beschreibung') as string[];
		const schrittStart = formData.getAll('schritt_start') as string[];
		const schrittEnde = formData.getAll('schritt_ende') as string[];

		// Validate steps
		const schritte: Array<{
			titel: string;
			beschreibung: string | null;
			startDatum: Date;
			endDatum: Date;
			reihenfolge: number;
		}> = [];

		for (let i = 0; i < schrittTitel.length; i++) {
			const titel = schrittTitel[i]?.trim();
			const beschreibung = schrittBeschreibung[i]?.trim() || null;
			const start = schrittStart[i];
			const ende = schrittEnde[i];

			if (titel) {
				if (!start) {
					errors[`schritt_${i}_start`] = `Startdatum für Schritt "${titel}" ist erforderlich`;
				}
				if (!ende) {
					errors[`schritt_${i}_ende`] = `Enddatum für Schritt "${titel}" ist erforderlich`;
				}
				if (start && ende) {
					const startDate = new Date(start);
					const endDate = new Date(ende);
					if (endDate < startDate) {
						errors[`schritt_${i}_ende`] = `Enddatum für Schritt "${titel}" muss nach dem Startdatum liegen`;
					}
					schritte.push({
						titel,
						beschreibung,
						startDatum: startDate,
						endDatum: endDate,
						reihenfolge: i + 1
					});
				}
			}
		}

		// Generate the next Auftragsnummer for the form values
		const nextAuftragsnummer = await generateAuftragsnummer();

		// Return errors if any
		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				values: {
					auftragsnummer: nextAuftragsnummer,
					kundenname,
					projektbezeichnung,
					projektbeschreibung,
					geplanterStart,
					geplantesEnde,
					strasse,
					hausnummer,
					plz,
					ort,
					schritte: schrittTitel.map((titel, i) => ({
						titel,
						beschreibung: schrittBeschreibung[i] || '',
						start: schrittStart[i] || '',
						ende: schrittEnde[i] || ''
					}))
				}
			});
		}

		// Generate Auftragsnummer for the new project
		const auftragsnummer = await generateAuftragsnummer();

		// Create the project with address and steps
		let projektId: string;
		try {
			const projekt = await prisma.projekt.create({
				data: {
					auftragsnummer: auftragsnummer,
					kundenname: kundenname.trim(),
					projektbezeichnung: projektbezeichnung.trim(),
					projektbeschreibung: projektbeschreibung?.trim() || null,
					geplanterStart: new Date(geplanterStart),
					geplantesEnde: new Date(geplantesEnde),
					adresse: {
						create: {
							strasse: strasse.trim(),
							hausnummer: hausnummer.trim(),
							plz: plz.trim(),
							ort: ort.trim()
						}
					},
					schritte: {
						create: schritte.map((s) => ({
							titel: s.titel,
							beschreibung: s.beschreibung,
							startDatum: s.startDatum,
							endDatum: s.endDatum,
							status: 'offen',
							fortschritt: 0,
							reihenfolge: s.reihenfolge
						}))
					}
				}
			});

			projektId = projekt.id;
		} catch (error) {
			console.error('Error creating project:', error);
			return fail(500, {
				errors: { general: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' },
				values: {
					auftragsnummer: nextAuftragsnummer,
					kundenname,
					projektbezeichnung,
					projektbeschreibung,
					geplanterStart,
					geplantesEnde,
					strasse,
					hausnummer,
					plz,
					ort,
					schritte: schrittTitel.map((titel, i) => ({
						titel,
						beschreibung: schrittBeschreibung[i] || '',
						start: schrittStart[i] || '',
						ende: schrittEnde[i] || ''
					}))
				}
			});
		}

		// Redirect to the new project page (outside try-catch for proper SvelteKit handling)
		redirect(303, `/projekt/${projektId}`);
	}
};