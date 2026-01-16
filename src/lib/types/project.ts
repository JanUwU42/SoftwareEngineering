/**
 * Status eines Projektschritts
 */
export type ProjectStepStatus = 'offen' | 'in_arbeit' | 'fertig';

/**
 * Bild-Eintrag für Projektschritte
 */
export interface ProjectImage {
	id: string;
	/** URL oder Pfad zum Bild */
	url: string;
	/** Optionale Beschreibung/Alt-Text */
	beschreibung?: string;
	/** Wann das Bild hochgeladen wurde */
	hochgeladenAm: Date;
	/** Wer das Bild hochgeladen hat (z.B. Handwerker-Name) */
	hochgeladenVon?: string;
	/** Ob das Bild freigegeben ist */
	freigegeben?: boolean;
}

/**
 * Material-Eintrag
 */
export interface Material {
	id: string;
	name: string;
	menge: number;
	einheit: string;
	bemerkung?: string;
	bestand?: number; // Aktueller Gesamtbestand im Lager (DB Wert)
	linkId?: string; // ID der Verknüpfung (zum Löschen)

	// Berechnete Werte für die Anzeige
	mengeBestellen?: number;
	mengeImLager?: number;
}

/**
 * Notiz-Eintrag für Projektschritte
 */
export interface ProjectNote {
	id: string;
	text: string;
	erstelltAm: string;
	autorName: string;
	sichtbarFuerKunde: boolean;
}

/**
 * Pending Update von Handwerker
 */
export interface PendingUpdate {
	id: string;
	typ: 'STATUS_AENDERUNG' | 'FOTO_UPLOAD' | 'NOTIZ' | 'MATERIAL_ANFORDERUNG';
	neuerStatus: ProjectStepStatus | null;
	neuerFortschritt: number | null;
	notizText: string | null;
	eingereichtAm: string;
	bearbeiterName: string;
	/** ID of the user who submitted this update (for ownership check) */
	eingereichtVonId: string;
	bild: {
		id: string;
		url: string;
		beschreibung?: string;
	} | null;
	/** Material request fields */
	menge?: number | null;
	materialName?: string | null;
	materialEinheit?: string | null;
}

/**
 * Ein einzelner Projektschritt im Zeitstrahl
 */
export interface ProjectStep {
	id: string;
	titel: string;
	beschreibung?: string;
	startDatum: Date;
	endDatum: Date;
	status: ProjectStepStatus;
	/** Fortschritt in Prozent (0-100) */
	fortschritt: number;
	/** Benötigtes Material für diesen Schritt */
	material: Material[];
	/** Reihenfolge im Zeitstrahl */
	reihenfolge: number;
	/** Bilder/Fotos zu diesem Schritt */
	bilder: ProjectImage[];
	/** Notizen zu diesem Schritt */
	notizen?: ProjectNote[];
	/** Ausstehende Updates von Handwerkern */
	pendingUpdates?: PendingUpdate[];
}

/**
 * Projekt-Metadaten
 */
export interface ProjectMetadata {
	auftragsnummer: string;
	kundenname: string;
	projektadresse: {
		strasse: string;
		hausnummer: string;
		plz: string;
		ort: string;
	};
	projektbezeichnung: string;
	projektbeschreibung?: string;
	geplanterStart?: Date;
	geplantesEnde?: Date;
}

/**
 * Vollständiges Projekt mit Metadaten und Schritten
 */
export interface Project {
	id: string;
	metadata: ProjectMetadata;
	schritte: ProjectStep[];
	/** Gesamte Materialliste für das Projekt */
	materialListe: Material[];
	/** Erstellungsdatum des Projekts */
	erstelltAm: Date;
	/** Letztes Aktualisierungsdatum */
	aktualisiertAm: Date;
}

/**
 * Hilfsfunktion: Status-Label für Anzeige
 */
export function getStatusLabel(status: ProjectStepStatus): string {
	const labels: Record<ProjectStepStatus, string> = {
		offen: 'Offen',
		in_arbeit: 'In Arbeit',
		fertig: 'Fertig'
	};
	return labels[status];
}

/**
 * Hilfsfunktion: Status-Farbe für visuelle Darstellung
 */
export function getStatusColor(status: ProjectStepStatus): string {
	const colors: Record<ProjectStepStatus, string> = {
		offen: 'gray',
		in_arbeit: 'blue',
		fertig: 'green'
	};
	return colors[status];
}
