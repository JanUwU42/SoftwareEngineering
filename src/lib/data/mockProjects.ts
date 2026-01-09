import type { Project, Material, ProjectImage } from '$lib/types/project';

/**
 * Mock-Bilder für Beispielprojekte
 */
const mockBilder: Record<string, ProjectImage[]> = {
	'step-001': [
		{
			id: 'img-001',
			url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
			beschreibung: 'Bauzaun aufgestellt',
			hochgeladenAm: new Date('2024-03-02'),
			hochgeladenVon: 'Thomas Müller'
		},
		{
			id: 'img-002',
			url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800',
			beschreibung: 'Baucontainer geliefert',
			hochgeladenAm: new Date('2024-03-05'),
			hochgeladenVon: 'Thomas Müller'
		}
	],
	'step-002': [
		{
			id: 'img-003',
			url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800',
			beschreibung: 'Bagger bei Aushubarbeiten',
			hochgeladenAm: new Date('2024-03-12'),
			hochgeladenVon: 'Stefan Weber'
		},
		{
			id: 'img-004',
			url: 'https://images.unsplash.com/photo-1599619585752-c3edb42a414c?w=800',
			beschreibung: 'Baugrube fertig ausgehoben',
			hochgeladenAm: new Date('2024-03-20'),
			hochgeladenVon: 'Stefan Weber'
		}
	],
	'step-003': [
		{
			id: 'img-005',
			url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
			beschreibung: 'Bewehrung eingebracht',
			hochgeladenAm: new Date('2024-04-02'),
			hochgeladenVon: 'Klaus Schmidt'
		},
		{
			id: 'img-006',
			url: 'https://images.unsplash.com/photo-1590644365607-1c5a8796115e?w=800',
			beschreibung: 'Beton wird gegossen',
			hochgeladenAm: new Date('2024-04-08'),
			hochgeladenVon: 'Klaus Schmidt'
		},
		{
			id: 'img-007',
			url: 'https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=800',
			beschreibung: 'Bodenplatte fertiggestellt',
			hochgeladenAm: new Date('2024-04-12'),
			hochgeladenVon: 'Klaus Schmidt'
		}
	],
	'step-004': [
		{
			id: 'img-008',
			url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
			beschreibung: 'Mauerarbeiten Erdgeschoss',
			hochgeladenAm: new Date('2024-04-25'),
			hochgeladenVon: 'Peter Hoffmann'
		},
		{
			id: 'img-009',
			url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
			beschreibung: 'Erdgeschoss Rohbau abgeschlossen',
			hochgeladenAm: new Date('2024-05-22'),
			hochgeladenVon: 'Peter Hoffmann'
		}
	],
	'step-005': [
		{
			id: 'img-010',
			url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
			beschreibung: 'Obergeschoss im Bau',
			hochgeladenAm: new Date('2024-06-10'),
			hochgeladenVon: 'Peter Hoffmann'
		}
	],
	'step-006': [
		{
			id: 'img-011',
			url: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800',
			beschreibung: 'Dachstuhl wird errichtet',
			hochgeladenAm: new Date('2024-07-08'),
			hochgeladenVon: 'Hans Zimmermann'
		}
	],
	'step-101': [
		{
			id: 'img-101',
			url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800',
			beschreibung: 'Alte Böden entfernt',
			hochgeladenAm: new Date('2024-06-05'),
			hochgeladenVon: 'Michael Bauer'
		}
	],
	'step-102': [
		{
			id: 'img-102',
			url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
			beschreibung: 'Neue Kabelkanäle verlegt',
			hochgeladenAm: new Date('2024-06-28'),
			hochgeladenVon: 'Frank Elektro'
		}
	]
};

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
				reihenfolge: 1,
				bilder: mockBilder['step-001'] || []
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
				reihenfolge: 2,
				bilder: mockBilder['step-002'] || []
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
				reihenfolge: 3,
				bilder: mockBilder['step-003'] || []
			},
			{
				id: 'step-004',
				titel: 'Rohbau Erdgeschoss',
				beschreibung: 'Mauerwerk EG, Decke über EG',
				startDatum: new Date('2024-04-15'),
				endDatum: new Date('2024-05-24'),
				status: 'fertig',
				fortschritt: 100,
				material: [{ id: 'mat-002', name: 'Bewehrungsstahl B500B', menge: 500, einheit: 'kg' }],
				reihenfolge: 4,
				bilder: mockBilder['step-004'] || []
			},
			{
				id: 'step-005',
				titel: 'Rohbau Obergeschoss',
				beschreibung: 'Mauerwerk OG, Decke über OG',
				startDatum: new Date('2024-05-27'),
				endDatum: new Date('2024-06-28'),
				status: 'fertig',
				fortschritt: 100,
				material: [{ id: 'mat-002', name: 'Bewehrungsstahl B500B', menge: 500, einheit: 'kg' }],
				reihenfolge: 5,
				bilder: mockBilder['step-005'] || []
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
				reihenfolge: 6,
				bilder: mockBilder['step-006'] || []
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
				reihenfolge: 7,
				bilder: []
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
				reihenfolge: 8,
				bilder: []
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
				reihenfolge: 9,
				bilder: []
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
				reihenfolge: 10,
				bilder: []
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
				reihenfolge: 11,
				bilder: []
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
				reihenfolge: 12,
				bilder: []
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
				reihenfolge: 13,
				bilder: []
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
				reihenfolge: 1,
				bilder: mockBilder['step-101'] || []
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
				reihenfolge: 2,
				bilder: mockBilder['step-102'] || []
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
				reihenfolge: 3,
				bilder: []
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
				reihenfolge: 4,
				bilder: []
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
				reihenfolge: 5,
				bilder: []
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
