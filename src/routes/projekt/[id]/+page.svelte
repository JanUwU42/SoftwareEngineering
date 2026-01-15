<script lang="ts">
	import type { ProjectMetadata, ProjectStep, Material, ProjectStepStatus } from '$lib/types/project';
	import ProjectMetadataCard from '$lib/components/ProjectMetadataCard.svelte';
	import ProjectTimeline from '$lib/components/ProjectTimeline.svelte';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	interface ProjectData {
		mitarbeiter: { id: string; vorname: string; nachname: string; role: string }[];
		metadata: {
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
			geplanterStart: string;
			geplantesEnde: string;
		};
		schritte: Array<{
			id: string;
			titel: string;
			beschreibung?: string;
			startDatum: string;
			endDatum: string;
			status: ProjectStepStatus;
			fortschritt: number;
			reihenfolge: number;
			material: Material[];
			bilder: Array<{
				id: string;
				url: string;
				beschreibung?: string;
				hochgeladenAm: string;
				hochgeladenVon?: string;
				freigegeben: boolean;
			}>;
			notizen?: Array<{
				id: string;
				text: string;
				erstelltAm: string;
				autorName: string;
				sichtbarFuerKunde: boolean;
			}>;
			pendingUpdates?: Array<{
				id: string;
				typ: 'STATUS_AENDERUNG' | 'FOTO_UPLOAD' | 'NOTIZ';
				neuerStatus: ProjectStepStatus | null;
				neuerFortschritt: number | null;
				notizText: string | null;
				eingereichtAm: string;
				bearbeiterName: string;
				eingereichtVonId: string;
				bild: {
					id: string;
					url: string;
					beschreibung?: string;
				} | null;
			}>;
		}>;
		materialListe: Material[];
	}

	interface Props {
		data: {
			project: ProjectData;
			isStaff: boolean;
			userRole?: 'ADMIN' | 'INNENDIENST' | 'HANDWERKER';
			userId?: string;
			availableHandwerker: { id: string; vorname: string; nachname: string }[];
			pendingUpdatesCount: number;
		};
		form: { success?: boolean; message?: string } | null;
	}

	let { data, form }: Props = $props();

	// Success/error message state
	let showMessage = $state(false);
	let messageText = $state('');
	let messageType = $state<'success' | 'error'>('success');

	// Watch for form changes to show messages
	$effect(() => {
		if (form?.message) {
			messageText = form.message;
			messageType = form.success ? 'success' : 'error';
			showMessage = true;
			setTimeout(() => { showMessage = false; }, 5000);
		} else if (form?.success) {
			messageText = 'Änderungen erfolgreich gespeichert.';
			messageType = 'success';
			showMessage = true;
			setTimeout(() => { showMessage = false; }, 3000);
		}
	});

	const canEdit = $derived(data.isStaff && (data.userRole === 'ADMIN' || data.userRole === 'INNENDIENST'));
	const isHandwerker = $derived(data.userRole === 'HANDWERKER');
	const isInnendienst = $derived(data.userRole === 'ADMIN' || data.userRole === 'INNENDIENST');

	const metadata: ProjectMetadata = $derived({
		auftragsnummer: data.project.metadata.auftragsnummer,
		kundenname: data.project.metadata.kundenname,
		projektadresse: data.project.metadata.projektadresse,
		projektbezeichnung: data.project.metadata.projektbezeichnung,
		projektbeschreibung: data.project.metadata.projektbeschreibung,
		geplanterStart: data.project.metadata.geplanterStart ? new Date(data.project.metadata.geplanterStart) : undefined,
		geplantesEnde: data.project.metadata.geplantesEnde ? new Date(data.project.metadata.geplantesEnde) : undefined
	});

	const schritte: ProjectStep[] = $derived(
		data.project.schritte.map((schritt) => ({
			id: schritt.id,
			titel: schritt.titel,
			beschreibung: schritt.beschreibung ?? undefined,
			startDatum: new Date(schritt.startDatum),
			endDatum: new Date(schritt.endDatum),
			status: schritt.status,
			fortschritt: schritt.fortschritt,
			material: schritt.material,
			reihenfolge: schritt.reihenfolge,
			bilder: schritt.bilder.map((bild) => ({
				id: bild.id,
				url: bild.url,
				beschreibung: bild.beschreibung ?? undefined,
				hochgeladenAm: new Date(bild.hochgeladenAm),
				hochgeladenVon: bild.hochgeladenVon,
				freigegeben: bild.freigegeben
			})),
			notizen: schritt.notizen ?? [],
			pendingUpdates: schritt.pendingUpdates ?? []
		}))
	);

	const materialListe: Material[] = $derived(data.project.materialListe);
	const gesamtfortschritt = $derived(schritte.length > 0 ? Math.round(schritte.reduce((sum, s) => sum + s.fortschritt, 0) / schritte.length) : 0);
	const fertigeSchritte = $derived(schritte.filter((s) => s.status === 'fertig').length);
	const inArbeitSchritte = $derived(schritte.filter((s) => s.status === 'in_arbeit').length);
	const offeneSchritte = $derived(schritte.filter((s) => s.status === 'offen').length);

	let projectModal: HTMLDialogElement;
	let stepModal: HTMLDialogElement;

	function toInputDate(date: Date | undefined): string {
		if (!date) return '';
		return date.toISOString().split('T')[0];
	}

	function dismissMessage() {
		showMessage = false;
	}
</script>

<svelte:head>
	<title>{metadata.projektbezeichnung}</title>
</svelte:head>

{#if showMessage}
	<div transition:slide class="fixed top-4 right-4 z-50 max-w-md">
		<div class="rounded-lg shadow-lg p-4 flex items-start gap-3 {messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
			{#if messageType === 'success'}
				<svg class="w-6 h-6 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{:else}
				<svg class="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{/if}
			<div class="flex-1">
				<p class="text-sm font-medium {messageType === 'success' ? 'text-green-800' : 'text-red-800'}">{messageText}</p>
			</div>
			<button onclick={dismissMessage} class="text-gray-400 hover:text-gray-600" aria-label="Nachricht schließen">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{metadata.projektbezeichnung}</h1>
				<div class="flex items-center gap-2 mt-1 flex-wrap">
					<p class="text-sm text-gray-500">{metadata.kundenname} · {metadata.auftragsnummer}</p>
					{#if canEdit}
						<button onclick={() => projectModal.showModal()} class="text-blue-600 hover:text-blue-800 text-xs font-semibold uppercase tracking-wide border border-blue-200 px-2 py-0.5 rounded bg-blue-50">Bearbeiten</button>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-3 flex-wrap">
				{#if isInnendienst && data.pendingUpdatesCount > 0}
					<a href="/admin/aktualisierungen" class="relative inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium">
						<span>Aktualisierungen</span>
						<span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-orange-500 rounded-full">{data.pendingUpdatesCount}</span>
					</a>
				{/if}
				{#if data.isStaff}
					<a href="/admin/uebersicht" class="text-sm font-medium text-gray-700 hover:bg-gray-200 px-3 py-2 rounded">← Zurück</a>
				{:else}
					<form action="/?/logout" method="POST"><button class="text-sm text-red-600">Logout</button></form>
				{/if}
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-xl bg-white p-6 shadow-md">
				<p class="text-sm font-medium text-gray-500">Gesamtfortschritt</p>
				<div class="mt-2 flex items-end gap-2">
					<span class="text-4xl font-bold text-gray-900">{gesamtfortschritt}%</span>
				</div>
				<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
					<div class="h-full bg-blue-500 transition-all duration-500" style="width: {gesamtfortschritt}%"></div>
				</div>
			</div>
			<div class="rounded-xl bg-white p-6 shadow-md">
				<p class="text-sm font-medium text-gray-500">Fertig</p>
				<div class="mt-2 flex items-end gap-2">
					<span class="text-4xl font-bold text-green-600">{fertigeSchritte}</span>
					<span class="mb-1 text-gray-500">von {schritte.length}</span>
				</div>
			</div>
			<div class="rounded-xl bg-white p-6 shadow-md">
				<p class="text-sm font-medium text-gray-500">In Arbeit</p>
				<div class="mt-2 flex items-end gap-2">
					<span class="text-4xl font-bold text-blue-600">{inArbeitSchritte}</span>
					<span class="mb-1 text-gray-500">Schritte</span>
				</div>
			</div>
			<div class="rounded-xl bg-white p-6 shadow-md">
				<p class="text-sm font-medium text-gray-500">Offen</p>
				<div class="mt-2 flex items-end gap-2">
					<span class="text-4xl font-bold text-gray-600">{offeneSchritte}</span>
					<span class="mb-1 text-gray-500">Schritte</span>
				</div>
			</div>
		</div>

		{#if data.isStaff && canEdit}
			<div class="mb-8 rounded-xl bg-white p-6 shadow-md border-l-4 border-orange-400">
				<h3 class="text-lg font-bold text-gray-900 mb-4">Zugewiesene Handwerker</h3>
				{#if data.project.mitarbeiter && data.project.mitarbeiter.length > 0}
					<div class="flex flex-wrap gap-3 mb-4">
						{#each data.project.mitarbeiter as ma (ma.id)}
							<div class="flex items-center gap-2 bg-gray-50 rounded-full pl-3 pr-1 py-1 border border-gray-200">
								<span class="text-sm font-medium text-gray-700">{ma.vorname} {ma.nachname}</span>
								<form action="?/removeMitarbeiter" method="POST" use:enhance>
									<input type="hidden" name="userId" value={ma.id} />
									<button type="submit" class="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50" title="Entfernen">
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
											<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
										</svg>
									</button>
								</form>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500 italic mb-4">Keine Handwerker zugewiesen.</p>
				{/if}
				<form action="?/assignMitarbeiter" method="POST" use:enhance class="flex gap-2 max-w-md">
					<select name="userId" class="flex-1 text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500" required>
						<option value="" disabled selected>Handwerker auswählen...</option>
						{#each data.availableHandwerker as h (h.id)}
							{#if !data.project.mitarbeiter?.some((m) => m.id === h.id)}
								<option value={h.id}>{h.vorname} {h.nachname}</option>
							{/if}
						{/each}
					</select>
					<button type="submit" class="bg-orange-600 text-white px-3 py-2 rounded-md text-sm hover:bg-orange-700 shadow-sm">Hinzufügen</button>
				</form>
			</div>
		{/if}

		{#if isHandwerker}
			<div class="mb-8 rounded-xl bg-blue-50 p-6 shadow-md border-l-4 border-blue-400">
				<div class="flex items-start gap-3">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-blue-600 shrink-0 mt-0.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
					</svg>
					<div>
						<h3 class="text-lg font-bold text-blue-900">Handwerker-Modus</h3>
						<p class="text-sm text-blue-700 mt-1">Sie können Status-Updates, Fotos und Notizen zu Ihren zugewiesenen Projektschritten hinzufügen. Alle Änderungen werden vom Innendienst geprüft, bevor sie für den Kunden sichtbar werden.</p>
					</div>
				</div>
			</div>
		{/if}

		<div class="mb-8">
			<ProjectMetadataCard {metadata} {materialListe} />
		</div>

		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-gray-900">Projektverlauf</h2>
			{#if canEdit}
				<button onclick={() => stepModal.showModal()} class="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 flex items-center gap-1 shadow-sm">
					<span>+ Schritt hinzufügen</span>
				</button>
			{/if}
		</div>

		<div>
			<ProjectTimeline {schritte} isStaff={data.isStaff} userRole={data.userRole} userId={data.userId} />
		</div>
	</main>
</div>

<dialog bind:this={projectModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-2xl backdrop:bg-black/50">
	<div class="p-6">
		<h3 class="text-lg font-bold mb-4">Projekt bearbeiten</h3>
		<form action="?/updateProject" method="POST" use:enhance class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="proj-bez" class="block text-sm font-medium text-gray-700">Bezeichnung</label>
					<input id="proj-bez" type="text" name="projektbezeichnung" value={metadata.projektbezeichnung} class="w-full border-gray-300 rounded-md" required />
				</div>
				<div>
					<label for="proj-start" class="block text-sm font-medium text-gray-700">Geplanter Start</label>
					<input id="proj-start" type="date" name="geplanterStart" value={toInputDate(metadata.geplanterStart)} class="w-full border-gray-300 rounded-md" required />
				</div>
				<div>
					<label for="proj-end" class="block text-sm font-medium text-gray-700">Geplantes Ende</label>
					<input id="proj-end" type="date" name="geplantesEnde" value={toInputDate(metadata.geplantesEnde)} class="w-full border-gray-300 rounded-md" required />
				</div>
			</div>
			<div class="border-t pt-4 mt-2">
				<h4 class="text-sm font-semibold mb-2">Adresse</h4>
				<div class="grid grid-cols-2 gap-4">
					<div><input type="text" name="strasse" value={metadata.projektadresse.strasse} placeholder="Straße" class="w-full border-gray-300 rounded-md" /></div>
					<div><input type="text" name="hausnummer" value={metadata.projektadresse.hausnummer} placeholder="Nr" class="w-full border-gray-300 rounded-md" /></div>
					<div><input type="text" name="plz" value={metadata.projektadresse.plz} placeholder="PLZ" class="w-full border-gray-300 rounded-md" /></div>
					<div><input type="text" name="ort" value={metadata.projektadresse.ort} placeholder="Ort" class="w-full border-gray-300 rounded-md" /></div>
				</div>
			</div>
			<div class="border-t pt-4 mt-2">
				<label for="proj-desc" class="block text-sm font-medium text-gray-700">Beschreibung</label>
				<textarea id="proj-desc" name="projektbeschreibung" rows="3" class="w-full border-gray-300 rounded-md">{metadata.projektbeschreibung || ''}</textarea>
			</div>
			<div class="flex justify-end gap-2 mt-6">
				<button type="button" onclick={() => projectModal.close()} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
				<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Speichern</button>
			</div>
		</form>
	</div>
</dialog>

<dialog bind:this={stepModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-lg backdrop:bg-black/50">
	<div class="p-6">
		<h3 class="text-lg font-bold mb-4">Neuen Schritt anlegen</h3>
		<form action="?/createSchritt" method="POST" use:enhance class="space-y-4">
			<div>
				<label for="step-titel" class="block text-sm font-medium text-gray-700">Titel</label>
				<input id="step-titel" type="text" name="titel" placeholder="z.B. Rohbauarbeiten" class="w-full border-gray-300 rounded-md" required />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="step-start" class="block text-sm font-medium text-gray-700">Start</label>
					<input id="step-start" type="date" name="startDatum" class="w-full border-gray-300 rounded-md" required />
				</div>
				<div>
					<label for="step-end" class="block text-sm font-medium text-gray-700">Ende</label>
					<input id="step-end" type="date" name="endDatum" class="w-full border-gray-300 rounded-md" required />
				</div>
			</div>
			<div>
				<label for="step-desc" class="block text-sm font-medium text-gray-700">Beschreibung</label>
				<textarea id="step-desc" name="beschreibung" rows="2" class="w-full border-gray-300 rounded-md"></textarea>
			</div>
			<div class="flex justify-end gap-2 mt-6">
				<button type="button" onclick={() => stepModal.close()} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
				<button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Erstellen</button>
			</div>
		</form>
	</div>
</dialog>
