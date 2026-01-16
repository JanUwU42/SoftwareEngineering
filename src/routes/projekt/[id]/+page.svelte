<script lang="ts">
	import type {
		ProjectMetadata,
		ProjectStep,
		Material,
		ProjectStepStatus
	} from '$lib/types/project';
	import ProjectMetadataCard from '$lib/components/ProjectMetadataCard.svelte';
	import ProjectTimeline from '$lib/components/ProjectTimeline.svelte';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	interface Props {
		data: {
			project: {
				mitarbeiter: { id: string; vorname: string; nachname: string; role: string }[];
				metadata: {
					auftragsnummer: string;
					kundenname: string;
					projektadresse: { strasse: string; hausnummer: string; plz: string; ort: string };
					projektbezeichnung: string;
					projektbeschreibung?: string;
					geplanterStart: string;
					geplantesEnde: string;
				};
				schritte: {
					id: string;
					titel: string;
					beschreibung?: string;
					startDatum: string;
					endDatum: string;
					status: string;
					fortschritt: number;
					reihenfolge: number;
					material: {
						id: string;
						linkId: string;
						name: string;
						menge: number;
						einheit: string;
						bemerkung?: string;
					}[];
					bilder: {
						id: string;
						url: string;
						beschreibung?: string;
						hochgeladenAm: string;
						hochgeladenVon: string;
						freigegeben: boolean;
					}[];
					notizen: {
						id: string;
						text: string;
						erstelltAm: string;
						autorName: string;
						sichtbarFuerKunde: boolean;
					}[];
					pendingUpdates: {
						id: string;
						typ: string;
						neuerStatus?: string;
						neuerFortschritt?: number;
						notizText?: string;
						eingereichtAm: string;
						bearbeiterName: string;
						eingereichtVonId: string;
						bild?: { id: string; url: string; beschreibung?: string };
						menge?: number;
						materialName?: string;
						materialEinheit?: string;
					}[];
				}[];
				materialListe: Material[];
			};
			isStaff: boolean;
			userRole?: 'ADMIN' | 'INNENDIENST' | 'HANDWERKER';
			availableHandwerker: { id: string; vorname: string; nachname: string }[];
			allMaterials: Material[];
			pendingUpdatesCount: number;
		};
		form: {
			success?: boolean;
			message?: string;
			notification?: {
				type: string;
				an: string;
				betreff: string;
				auftragsnummer: string;
				projektschritt: string;
				neuerStatus: string;
				fortschritt: number;
				projektLink: string;
				nachricht: string;
			};
		} | null;
	}

	let { data, form }: Props = $props();

	let showMessage = $state(false);
	let messageText = $state('');
	let messageType = $state<'success' | 'error'>('success');

	$effect(() => {
		if (form?.message) {
			messageText = form.message;
			messageType = form.success ? 'success' : 'error';
			showMessage = true;
			setTimeout(() => (showMessage = false), 5000);
		} else if (form?.success) {
			messageText = 'Gespeichert.';
			messageType = 'success';
			showMessage = true;
			setTimeout(() => (showMessage = false), 3000);
		}

		if (form?.notification) {
			const n = form.notification;
			console.log('═'.repeat(60));
			console.log('📧 KUNDENBENACHRICHTIGUNG - Projektschritt aktualisiert');
			console.log('═'.repeat(60));
			console.log('An: ' + n.an);
			console.log('Betreff: ' + n.betreff);
			console.log('─'.repeat(60));
			console.log('📋 Auftragsnummer: ' + n.auftragsnummer);
			console.log('🔧 Projektschritt: ' + n.projektschritt);
			console.log('✅ Neuer Status: ' + n.neuerStatus);
			console.log('📊 Fortschritt: ' + n.fortschritt + '%');
			console.log('🔗 Link: ' + n.projektLink);
			console.log('═'.repeat(60));
		}
	});

	function dismissMessage() {
		showMessage = false;
	}

	const canEdit = $derived(
		data.isStaff && (data.userRole === 'ADMIN' || data.userRole === 'INNENDIENST')
	);
	const isInnendienst = $derived(data.userRole === 'ADMIN' || data.userRole === 'INNENDIENST');

	const metadata: ProjectMetadata = $derived({
		auftragsnummer: data.project.metadata.auftragsnummer,
		kundenname: data.project.metadata.kundenname,
		projektadresse: data.project.metadata.projektadresse,
		projektbezeichnung: data.project.metadata.projektbezeichnung,
		projektbeschreibung: data.project.metadata.projektbeschreibung,
		geplanterStart: new Date(data.project.metadata.geplanterStart),
		geplantesEnde: new Date(data.project.metadata.geplantesEnde)
	});

	const schritte: ProjectStep[] = $derived(
		data.project.schritte.map((schritt) => ({
			id: schritt.id,
			titel: schritt.titel,
			beschreibung: schritt.beschreibung ?? undefined,
			startDatum: new Date(schritt.startDatum),
			endDatum: new Date(schritt.endDatum),
			status: schritt.status as ProjectStepStatus,
			fortschritt: schritt.fortschritt,
			reihenfolge: schritt.reihenfolge,
			material: schritt.material || [],
			bilder: schritt.bilder.map((bild) => ({
				id: bild.id,
				url: bild.url,
				beschreibung: bild.beschreibung ?? undefined,
				hochgeladenAm: new Date(bild.hochgeladenAm),
				hochgeladenVon: bild.hochgeladenVon,
				freigegeben: bild.freigegeben
			})),
			notizen: schritt.notizen ?? [],
			pendingUpdates:
				schritt.pendingUpdates?.map((u) => ({
					id: u.id,
					typ: u.typ as 'STATUS_AENDERUNG' | 'FOTO_UPLOAD' | 'NOTIZ' | 'MATERIAL_ANFORDERUNG',
					neuerStatus: (u.neuerStatus ?? null) as 'offen' | 'in_arbeit' | 'fertig' | null,
					neuerFortschritt: u.neuerFortschritt ?? null,
					notizText: u.notizText ?? null,
					eingereichtAm: u.eingereichtAm,
					bearbeiterName: u.bearbeiterName,
					eingereichtVonId: u.eingereichtVonId,
					bild: u.bild ?? null,
					materialName: u.materialName ?? null,
					materialEinheit: u.materialEinheit ?? null,
					menge: u.menge ?? null
				})) ?? []
		}))
	);

	const materialListe: Material[] = $derived(data.project.materialListe);
	const gesamtfortschritt = $derived(
		schritte.length > 0
			? Math.round(schritte.reduce((sum, s) => sum + s.fortschritt, 0) / schritte.length)
			: 0
	);
	const fertigeSchritte = $derived(schritte.filter((s) => s.status === 'fertig').length);
	const inArbeitSchritte = $derived(schritte.filter((s) => s.status === 'in_arbeit').length);
	const offeneSchritte = $derived(schritte.filter((s) => s.status === 'offen').length);

	let projectModal: HTMLDialogElement;
	let stepModal: HTMLDialogElement;

	function toInputDate(date: Date) {
		return date ? date.toISOString().split('T')[0] : '';
	}
</script>

<svelte:head>
	<title>{metadata.projektbezeichnung}</title>
</svelte:head>

{#if showMessage}
	<div transition:slide class="fixed top-4 right-4 z-50 max-w-md">
		<div
			class="flex items-start gap-3 rounded-lg p-4 shadow-lg {messageType === 'success'
				? 'border border-green-200 bg-green-50'
				: 'border border-red-200 bg-red-50'}"
		>
			<p
				class="text-sm font-medium {messageType === 'success' ? 'text-green-800' : 'text-red-800'}"
			>
				{messageText}
			</p>
			<button onclick={dismissMessage} class="text-gray-400 hover:text-gray-600">✕</button>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div
			class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-8"
		>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">
					{metadata.projektbezeichnung}
				</h1>
				<div class="mt-1 flex items-center gap-2">
					<p class="text-sm text-gray-500">{metadata.kundenname} · {metadata.auftragsnummer}</p>
					{#if canEdit}
						<button
							onclick={() => projectModal.showModal()}
							class="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-blue-600 uppercase hover:text-blue-800"
							>Bearbeiten</button
						>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-4">
				{#if isInnendienst && data.pendingUpdatesCount > 0}
					<a
						href="/admin/aktualisierungen"
						class="relative inline-flex items-center gap-2 rounded-lg bg-orange-100 px-3 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200"
					>
						<span>Updates</span>
						<span
							class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white"
						>
							{data.pendingUpdatesCount}
						</span>
					</a>
				{/if}
				{#if data.isStaff}
					<a
						href="/admin/uebersicht"
						class="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
						>← Zurück</a
					>
				{:else}
					<form action="/?/logout" method="POST">
						<button class="text-sm text-red-600">Logout</button>
					</form>
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
					<div
						class="h-full bg-blue-500 transition-all duration-500"
						style="width: {gesamtfortschritt}%"
					></div>
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
			<div class="mb-8 rounded-xl border-l-4 border-orange-400 bg-white p-6 shadow-md">
				<h3 class="mb-4 text-lg font-bold text-gray-900">Zugewiesene Handwerker</h3>
				{#if data.project.mitarbeiter && data.project.mitarbeiter.length > 0}
					<div class="mb-4 flex flex-wrap gap-3">
						{#each data.project.mitarbeiter as ma (ma.id)}
							<div
								class="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 py-1 pr-1 pl-3"
							>
								<span class="text-sm font-medium text-gray-700">{ma.vorname} {ma.nachname}</span>
								<form action="?/removeMitarbeiter" method="POST" use:enhance>
									<input type="hidden" name="userId" value={ma.id} />
									<button
										type="submit"
										class="rounded-full p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
										>✕</button
									>
								</form>
							</div>
						{/each}
					</div>
				{:else}
					<p class="mb-4 text-sm text-gray-500 italic">Keine Handwerker zugewiesen.</p>
				{/if}
				<form action="?/assignMitarbeiter" method="POST" use:enhance class="flex max-w-md gap-2">
					<select
						name="userId"
						class="flex-1 rounded-md border-gray-300 text-sm focus:border-orange-500 focus:ring-orange-500"
						required
					>
						<option value="" disabled selected>Handwerker auswählen...</option>
						{#each data.availableHandwerker as h (h.id)}
							{#if !data.project.mitarbeiter?.some((m) => m.id === h.id)}
								<option value={h.id}>{h.vorname} {h.nachname}</option>
							{/if}
						{/each}
					</select>
					<button
						type="submit"
						class="rounded-md bg-orange-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-orange-700"
					>
						Hinzufügen
					</button>
				</form>
			</div>
		{/if}

		<div class="mb-8">
			<ProjectMetadataCard {metadata} {materialListe} />
		</div>

		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-900">Projektverlauf</h2>
			{#if canEdit}
				<button
					onclick={() => stepModal.showModal()}
					class="flex items-center gap-1 rounded-md bg-green-600 px-3 py-2 text-sm text-white shadow-sm hover:bg-green-700"
				>
					<span>+ Schritt hinzufügen</span>
				</button>
			{/if}
		</div>

		<div>
			<ProjectTimeline
				{schritte}
				isStaff={data.isStaff}
				userRole={data.userRole}
				allMaterials={data.allMaterials}
			/>
		</div>
	</main>
</div>

<dialog
	bind:this={projectModal}
	class="m-auto w-full max-w-2xl rounded-xl border-0 p-0 shadow-2xl backdrop:bg-black/50"
>
	<div class="p-6">
		<h3 class="mb-4 text-lg font-bold">Projekt bearbeiten</h3>
		<form action="?/updateProject" method="POST" use:enhance class="space-y-4">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div>
					<label for="proj-bez" class="block text-sm font-medium text-gray-700">Bezeichnung</label>
					<input
						id="proj-bez"
						type="text"
						name="projektbezeichnung"
						value={metadata.projektbezeichnung}
						class="w-full rounded-md border-gray-300"
						required
					/>
				</div>
				<div>
					<label for="proj-start" class="block text-sm font-medium text-gray-700"
						>Geplanter Start</label
					>
					<input
						id="proj-start"
						type="date"
						name="geplanterStart"
						value={toInputDate(metadata.geplanterStart!)}
						class="w-full rounded-md border-gray-300"
						required
					/>
				</div>
				<div>
					<label for="proj-end" class="block text-sm font-medium text-gray-700"
						>Geplantes Ende</label
					>
					<input
						id="proj-end"
						type="date"
						name="geplantesEnde"
						value={toInputDate(metadata.geplantesEnde!)}
						class="w-full rounded-md border-gray-300"
						required
					/>
				</div>
			</div>
			<div class="mt-2 border-t pt-4">
				<h4 class="mb-2 text-sm font-semibold">Adresse</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<input
							type="text"
							name="strasse"
							value={metadata.projektadresse.strasse}
							placeholder="Straße"
							class="w-full rounded-md border-gray-300"
						/>
					</div>
					<div>
						<input
							type="text"
							name="hausnummer"
							value={metadata.projektadresse.hausnummer}
							placeholder="Nr"
							class="w-full rounded-md border-gray-300"
						/>
					</div>
					<div>
						<input
							type="text"
							name="plz"
							value={metadata.projektadresse.plz}
							placeholder="PLZ"
							class="w-full rounded-md border-gray-300"
						/>
					</div>
					<div>
						<input
							type="text"
							name="ort"
							value={metadata.projektadresse.ort}
							placeholder="Ort"
							class="w-full rounded-md border-gray-300"
						/>
					</div>
				</div>
			</div>
			<div class="mt-2 border-t pt-4">
				<label for="projektbeschreibung" class="block text-sm font-medium text-gray-700"
					>Beschreibung</label
				>
				<textarea
					id="projektbeschreibung"
					name="projektbeschreibung"
					rows="3"
					class="w-full rounded-md border-gray-300">{metadata.projektbeschreibung || ''}</textarea
				>
			</div>
			<div class="mt-6 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => projectModal.close()}
					class="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100">Abbrechen</button
				>
				<button type="submit" class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
					>Speichern</button
				>
			</div>
		</form>
	</div>
</dialog>

<dialog
	bind:this={stepModal}
	class="m-auto w-full max-w-lg rounded-xl border-0 p-0 shadow-2xl backdrop:bg-black/50"
>
	<div class="p-6">
		<h3 class="mb-4 text-lg font-bold">Neuen Schritt anlegen</h3>
		<form action="?/createSchritt" method="POST" use:enhance class="space-y-4">
			<div>
				<label for="schritt-titel" class="block text-sm font-medium text-gray-700">Titel</label>
				<input
					id="schritt-titel"
					type="text"
					name="titel"
					class="w-full rounded-md border-gray-300"
					required
				/>
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="schritt-start" class="block text-sm font-medium text-gray-700">Start</label>
					<input
						id="schritt-start"
						type="date"
						name="startDatum"
						class="w-full rounded-md border-gray-300"
						required
					/>
				</div>
				<div>
					<label for="schritt-ende" class="block text-sm font-medium text-gray-700">Ende</label>
					<input
						id="schritt-ende"
						type="date"
						name="endDatum"
						class="w-full rounded-md border-gray-300"
						required
					/>
				</div>
			</div>
			<div>
				<label for="schritt-beschreibung" class="block text-sm font-medium text-gray-700"
					>Beschreibung</label
				>
				<textarea
					id="schritt-beschreibung"
					name="beschreibung"
					rows="2"
					class="w-full rounded-md border-gray-300"
				></textarea>
			</div>
			<div class="mt-6 flex justify-end gap-2">
				<button
					type="button"
					onclick={() => stepModal.close()}
					class="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100">Abbrechen</button
				>
				<button
					type="submit"
					class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">Erstellen</button
				>
			</div>
		</form>
	</div>
</dialog>
