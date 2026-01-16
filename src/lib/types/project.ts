export type ProjectStepStatus = 'offen' | 'in_arbeit' | 'fertig';

export interface ProjectImage {
	id: string;
	url: string;
	beschreibung?: string;
	hochgeladenAm: Date;
	hochgeladenVon?: string;
	freigegeben?: boolean;
}

export interface Material {
	id: string;
	name: string;
	menge: number;
	einheit: string;
	bemerkung?: string;
	bestand?: number;
	linkId?: string;
	mengeBestellen?: number;
	mengeImLager?: number;
}

export interface ProjectNote {
	id: string;
	text: string;
	erstelltAm: string;
	autorName: string;
	sichtbarFuerKunde: boolean;
}

export interface PendingUpdate {
	id: string;
	typ: 'STATUS_AENDERUNG' | 'FOTO_UPLOAD' | 'NOTIZ' | 'MATERIAL_ANFORDERUNG';
	neuerStatus: ProjectStepStatus | null;
	neuerFortschritt: number | null;
	notizText: string | null;
	eingereichtAm: string;
	bearbeiterName: string;
	eingereichtVonId: string;
	bild: { id: string; url: string; beschreibung?: string } | null;
	menge?: number | null;
	materialName?: string | null;
	materialEinheit?: string | null;
}

export interface ProjectStep {
	id: string;
	titel: string;
	beschreibung?: string;
	startDatum: Date;
	endDatum: Date;
	status: ProjectStepStatus;
	fortschritt: number;
	material: Material[];
	reihenfolge: number;
	bilder: ProjectImage[];
	notizen?: ProjectNote[];
	pendingUpdates?: PendingUpdate[];
}

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

export interface Project {
	id: string;
	metadata: ProjectMetadata;
	schritte: ProjectStep[];
	materialListe: Material[];
	erstelltAm: Date;
	aktualisiertAm: Date;
}

export function getStatusLabel(status: ProjectStepStatus): string {
	const labels: Record<ProjectStepStatus, string> = {
		offen: 'Offen',
		in_arbeit: 'In Arbeit',
		fertig: 'Fertig'
	};
	return labels[status];
}

export function getStatusColor(status: ProjectStepStatus): string {
	const colors: Record<ProjectStepStatus, string> = {
		offen: 'gray',
		in_arbeit: 'blue',
		fertig: 'green'
	};
	return colors[status];
}
