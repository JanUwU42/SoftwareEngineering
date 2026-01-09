import type { Project, Material } from '$lib/types/project';

/**
 * Mock-Materialliste für Beispielprojekt
 */
const mockMaterialListe: Material[] = [
	{
		id: 'mat-001',
		name: 'Betonmischung C25/30',
		menge: 15,
		einheit: 'm³',
		bemerkung: 'Für Fundament und Bodenplatte'
	},
	{
		id: 'mat-002',
		name: 'Bewehrungsstahl B500B',
		menge: 2500,
		einheit: 'kg'
	},
	{
		id: 'mat-003',
		name: 'Schalungsplatten',
		menge: 80,
		einheit: 'Stück'
	},
	{
		id: 'mat-004',
		name: 'Dachziegel Ton',
		menge: 1200,
		einheit: 'Stück',
		bemerkung: 'Farbe: Naturrot'
	},
	{
		id: 'mat-005',
		name: 'Dämmplatten EPS 035',
		menge: 180,
		einheit: 'm²'
	},
	{
		id: 'mat-006',
		name: 'Fenster 3-fach verglast',
		menge: 12,
		einheit: 'Stück',
		bemerkung: 'Verschiedene Größen lt. Plan'
	},
	{
		id: 'mat-007',
		name: 'Elektrokabel NYM-J',
		menge: 500,
		einheit: 'm'
	},
	{
		id: 'mat-008',
		name: 'Sanitärrohre PP',
		menge: 120,
		einheit: 'm'
	}
];

/**
 * Mock-Projekte für Entwicklung
 * Diese Daten werden später aus einer PostgreSQL-Datenbank geladen
 */
export const mockProjects: Project[] = [
	{
		id: 'proj-2024-001',
		metadata: {
			auftragsnummer: 'A-2024-00142',
			kundenname: 'Familie Müller',
			projektadresse: {
				strasse: 'Gartenstraße',
				hausnummer: '15a',
				plz: '80331',
				ort: 'München'
			},
			projektbezeichnung: 'Neubau Einfamilienhaus',
			projektbeschreibung:
				'Errichtung eines zweigeschossigen Einfamilienhauses mit Satteldach, inkl. Garage und Gartenanlage. Wohnfläche ca. 180m², Grundstück 650m².',
			geplanterStart: new Date('2024-03-01'),
			geplantesEnde: new Date('2024-11-30')
		},
		schritte: [
			{
				id: 'step-001',
				titel: 'Baustelleneinrichtung',
				beschreibung: 'Absicherung, Bauzaun, Baucontainer aufstellen',
				startDatum: new Date('2024-03-01'),
				endDatum: new Date('2024-03-08'),
				status: 'fertig',
				fortschritt: 100,
				material: [],
				reihenfolge: 1
			},
			{
				id: 'step-002',
				titel: 'Erdarbeiten & Aushub',
				beschreibung: 'Bodenabtrag, Baugrube ausheben, Drainage vorbereiten',
				startDatum: new Date('2024-03-11'),
				endDatum: new Date('2024-03-22'),
				status: 'fertig',
				fortschritt: 100,
				material: [],
				reihenfolge: 2
			},
			{
				id: 'step-003',
				titel: 'Fundament & Bodenplatte',
				beschreibung: 'Schalung erstellen, Bewehrung einbringen, Beton gießen',
				startDatum: new Date('2024-03-25'),
				endDatum: new Date('2024-04-12'),
				status: 'fertig',
				fortschritt: 100,
				material: [
					{ id: 'mat-001', name: 'Betonmischung C25/30', menge: 15, einheit: 'm³' },
					{ id: 'mat-002', name: 'Bewehrungsstahl B500B', menge: 1500, einheit: 'kg' },
					{ id: 'mat-003', name: 'Schalungsplatten', menge: 80, einheit: 'Stück' }
				],
				reihenfolge: 3
			},
			{
				id: 'step-004',
				titel: 'Rohbau Erdgeschoss',
				beschreibung: 'Mauerwerk EG, Decke über EG',
				startDatum: new Date('2024-04-15'),
				endDatum: new Date('2024-05-24'),
				status: 'fertig',
				fortschritt: 100,
				material: [
					{ id: 'mat-002', name: 'Bewehrungsstahl B500B', menge: 500, einheit: 'kg' }
				],
				reihenfolge: 4
			},
			{
				id: 'step-005',
				titel: 'Rohbau Obergeschoss',
				beschreibung: 'Mauerwerk OG, Decke über OG',
				startDatum: new Date('2024-05-27'),
				endDatum: new Date('2024-06-28'),
				status: 'fertig',
				fortschritt: 100,
				material: [
					{ id: 'mat-002', name: 'Bewehrungsstahl B500B', menge: 500, einheit: 'kg' }
				],
				reihenfolge: 5
			},
			{
				id: 'step-006',
				titel: 'Dachstuhl & Eindeckung',
				beschreibung: 'Dachstuhl errichten, Lattung, Dachziegel verlegen',
				startDatum: new Date('2024-07-01'),
				endDatum: new Date('2024-07-26'),
				status: 'in_arbeit',
				fortschritt: 65,
				material: [
					{
						id: 'mat-004',
						name: 'Dachziegel Ton',
						menge: 1200,
						einheit: 'Stück',
						bemerkung: 'Farbe: Naturrot'
					}
				],
				reihenfolge: 6
			},
			{
				id: 'step-007',
				titel: 'Fenster & Außentüren',
				beschreibung: 'Fenstereinbau, Haustür, Terrassentür',
				startDatum: new Date('2024-07-29'),
				endDatum: new Date('2024-08-09'),
				status: 'offen',
				fortschritt: 0,
				material: [
					{
						id: 'mat-006',
						name: 'Fenster 3-fach verglast',
						menge: 12,
						einheit: 'Stück',
						bemerkung: 'Verschiedene Größen lt. Plan'
					}
				],
				reihenfolge: 7
			},
			{
				id: 'step-008',
				titel: 'Wärmedämmung & Fassade',
				beschreibung: 'WDVS anbringen, Putzarbeiten Fassade',
				startDatum: new Date('2024-08-12'),
				endDatum: new Date('2024-09-06'),
				status: 'offen',
				fortschritt: 0,
				material: [{ id: 'mat-005', name: 'Dämmplatten EPS 035', menge: 180, einheit: 'm²' }],
				reihenfolge: 8
			},
			{
				id: 'step-009',
				titel: 'Elektroinstallation',
				beschreibung: 'Leitungen verlegen, Unterverteilung, Steckdosen',
				startDatum: new Date('2024-08-19'),
				endDatum: new Date('2024-09-13'),
				status: 'offen',
				fortschritt: 0,
				material: [{ id: 'mat-007', name: 'Elektrokabel NYM-J', menge: 500, einheit: 'm' }],
				reihenfolge: 9
			},
			{
				id: 'step-010',
				titel: 'Sanitärinstallation',
				beschreibung: 'Rohrleitungen, Anschlüsse, Sanitärobjekte',
				startDatum: new Date('2024-08-26'),
				endDatum: new Date('2024-09-20'),
				status: 'offen',
				fortschritt: 0,
				material: [{ id: 'mat-008', name: 'Sanitärrohre PP', menge: 120, einheit: 'm' }],
				reihenfolge: 10
			},
			{
				id: 'step-011',
				titel: 'Innenputz & Estrich',
				beschreibung: 'Innenputzarbeiten, Estrich einbringen',
				startDatum: new Date('2024-09-23'),
				endDatum: new Date('2024-10-18'),
				status: 'offen',
				fortschritt: 0,
				material: [],
				reihenfolge: 11
			},
			{
				id: 'step-012',
				titel: 'Bodenbeläge & Malerarbeiten',
				beschreibung: 'Fliesen, Parkett, Wandfarben',
				startDatum: new Date('2024-10-21'),
				endDatum: new Date('2024-11-15'),
				status: 'offen',
				fortschritt: 0,
				material: [],
				reihenfolge: 12
			},
			{
				id: 'step-013',
				titel: 'Abschlussarbeiten & Übergabe',
				beschreibung: 'Reinigung, Mängelbehebung, Abnahme',
				startDatum: new Date('2024-11-18'),
				endDatum: new Date('2024-11-30'),
				status: 'offen',
				fortschritt: 0,
				material: [],
				reihenfolge: 13
			}
		],
		materialListe: mockMaterialListe,
		erstelltAm: new Date('2024-01-15'),
		aktualisiertAm: new Date('2024-07-15')
	},
	{
		id: 'proj-2024-002',
		metadata: {
			auftragsnummer: 'A-2024-00187',
			kundenname: 'Schmidt GmbH',
			projektadresse: {
				strasse: 'Industrieweg',
				hausnummer: '42',
				plz: '80939',
				ort: 'München'
			},
			projektbezeichnung: 'Bürorenovierung',
			projektbeschreibung:
				'Komplettrenovierung eines Bürogebäudes über 3 Etagen. Neue Böden, Elektrik, Sanitär und Malerarbeiten.',
			geplanterStart: new Date('2024-06-01'),
			geplantesEnde: new Date('2024-08-31')
		},
		schritte: [
			{
				id: 'step-101',
				titel: 'Demontage Altbestand',
				beschreibung: 'Alte Böden, Sanitär und Elektrik entfernen',
				startDatum: new Date('2024-06-01'),
				endDatum: new Date('2024-06-14'),
				status: 'fertig',
				fortschritt: 100,
				material: [],
				reihenfolge: 1
			},
			{
				id: 'step-102',
				titel: 'Elektroinstallation',
				beschreibung: 'Neue Verkabelung, Netzwerk, Beleuchtung',
				startDatum: new Date('2024-06-17'),
				endDatum: new Date('2024-07-12'),
				status: 'in_arbeit',
				fortschritt: 80,
				material: [{ id: 'mat-007', name: 'Elektrokabel NYM-J', menge: 800, einheit: 'm' }],
				reihenfolge: 2
			},
			{
				id: 'step-103',
				titel: 'Sanitärarbeiten',
				beschreibung: 'WC-Anlagen erneuern, Teeküchen',
				startDatum: new Date('2024-07-01'),
				endDatum: new Date('2024-07-26'),
				status: 'in_arbeit',
				fortschritt: 45,
				material: [{ id: 'mat-008', name: 'Sanitärrohre PP', menge: 60, einheit: 'm' }],
				reihenfolge: 3
			},
			{
				id: 'step-104',
				titel: 'Bodenarbeiten',
				beschreibung: 'Neuer Teppichboden in allen Räumen',
				startDatum: new Date('2024-07-29'),
				endDatum: new Date('2024-08-16'),
				status: 'offen',
				fortschritt: 0,
				material: [],
				reihenfolge: 4
			},
			{
				id: 'step-105',
				titel: 'Malerarbeiten',
				beschreibung: 'Wände und Decken streichen',
				startDatum: new Date('2024-08-12'),
				endDatum: new Date('2024-08-30'),
				status: 'offen',
				fortschritt: 0,
				material: [],
				reihenfolge: 5
			}
		],
		materialListe: [
			{ id: 'mat-007', name: 'Elektrokabel NYM-J', menge: 800, einheit: 'm' },
			{ id: 'mat-008', name: 'Sanitärrohre PP', menge: 60, einheit: 'm' }
		],
		erstelltAm: new Date('2024-04-20'),
		aktualisiertAm: new Date('2024-07-10')
	}
];

/**
 * Hilfsfunktion: Projekt nach ID finden
 * Simuliert einen Datenbankaufruf
 */
export function getProjectById(id: string): Project | undefined {
	// TODO: Später durch echten PostgreSQL-Query ersetzen
	return mockProjects.find((project) => project.id === id);
}

/**
 * Hilfsfunktion: Alle Projekte abrufen
 * Simuliert einen Datenbankaufruf
 */
export function getAllProjects(): Project[] {
	// TODO: Später durch echten PostgreSQL-Query ersetzen
	return mockProjects;
}
