<script lang="ts">
	import type { PageData } from './$types';
	import type { ProjectMetadata, ProjectStep, Material } from '$lib/types/project';
	import ProjectMetadataCard from '$lib/components/ProjectMetadataCard.svelte';
	import ProjectTimeline from '$lib/components/ProjectTimeline.svelte';

	interface Props {
		data: {
			project: any;
			isStaff: boolean;
			userRole?: 'ADMIN' | 'INNENDIENST' | 'HANDWERKER';
		};
	}

	let { data }: Props = $props();

	const canEdit = $derived(
			data.isStaff && (data.userRole === 'ADMIN' || data.userRole === 'INNENDIENST')
	);

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
			data.project.schritte.map((schritt: any) => ({
				id: schritt.id,
				titel: schritt.titel,
				beschreibung: schritt.beschreibung ?? undefined,
				startDatum: new Date(schritt.startDatum),
				endDatum: new Date(schritt.endDatum),
				status: schritt.status,
				fortschritt: schritt.fortschritt,
				material: schritt.material,
				reihenfolge: schritt.reihenfolge,
				bilder: schritt.bilder.map((bild: any) => ({
					id: bild.id,
					url: bild.url,
					beschreibung: bild.beschreibung ?? undefined,
					hochgeladenAm: new Date(bild.hochgeladenAm),
					hochgeladenVon: bild.hochgeladenVon
				}))
			}))
	);

	const materialListe: Material[] = $derived(data.project.materialListe);
	const gesamtfortschritt = $derived(schritte.length > 0 ? Math.round(schritte.reduce((sum, s) => sum + s.fortschritt, 0) / schritte.length) : 0);
	const fertigeSchritte = $derived(schritte.filter((s) => s.status === 'fertig').length);
	const inArbeitSchritte = $derived(schritte.filter((s) => s.status === 'in_arbeit').length);
	const offeneSchritte = $derived(schritte.filter((s) => s.status === 'offen').length);


	// --- MODAL LOGIK ---
	let projectModal: HTMLDialogElement;
	let stepModal: HTMLDialogElement;

	function toInputDate(date: Date) {
		return date.toISOString().split('T')[0];
	}
</script>

<svelte:head>
	<title>{metadata.projektbezeichnung}</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">{metadata.projektbezeichnung}</h1>
				<div class="flex items-center gap-2 mt-1">
					<p class="text-sm text-gray-500">{metadata.kundenname} · {metadata.auftragsnummer}</p>
					{#if canEdit}
						<button onclick={() => projectModal.showModal()} class="text-blue-600 hover:text-blue-800 text-xs font-semibold uppercase tracking-wide border border-blue-200 px-2 py-0.5 rounded bg-blue-50">
							Bearbeiten
						</button>
					{/if}
				</div>
			</div>
			<div class="flex items-center gap-4">
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

		<div class="mb-8">
			<ProjectMetadataCard {metadata} {materialListe} />
		</div>

		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold text-gray-900">Projektverlauf</h2>
			{#if canEdit}
				<button
						onclick={() => stepModal.showModal()}
						class="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 flex items-center gap-1 shadow-sm"
				>
					<span>+ Schritt hinzufügen</span>
				</button>
			{/if}
		</div>

		<div>
			<ProjectTimeline {schritte} isStaff={data.isStaff} userRole={data.userRole} />
		</div>
	</main>
</div>


<dialog bind:this={projectModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-2xl backdrop:bg-black/50">
	<div class="p-6">
		<h3 class="text-lg font-bold mb-4">Projekt bearbeiten</h3>
		<form action="?/updateProject" method="POST" class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="proj-bez" class="block text-sm font-medium text-gray-700">Bezeichnung</label>
					<input id="proj-bez" type="text" name="projektbezeichnung" value={metadata.projektbezeichnung} class="w-full border-gray-300 rounded-md" required />
				</div>
				<div>
					<label for="proj-start" class="block text-sm font-medium text-gray-700">Geplanter Start</label>
					<input id="proj-start" type="date" name="geplanterStart" value={toInputDate(metadata.geplanterStart!)} class="w-full border-gray-300 rounded-md" required />
				</div>
				<div>
					<label for="proj-end" class="block text-sm font-medium text-gray-700">Geplantes Ende</label>
					<input id="proj-end" type="date" name="geplantesEnde" value={toInputDate(metadata.geplantesEnde!)} class="w-full border-gray-300 rounded-md" required />
				</div>
			</div>

			<div class="border-t pt-4 mt-2">
				<h4 class="text-sm font-semibold mb-2">Adresse</h4>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="addr-strasse" class="sr-only">Straße</label>
						<input id="addr-strasse" type="text" name="strasse" value={metadata.projektadresse.strasse} placeholder="Straße" class="w-full border-gray-300 rounded-md" />
					</div>
					<div>
						<label for="addr-nr" class="sr-only">Nr</label>
						<input id="addr-nr" type="text" name="hausnummer" value={metadata.projektadresse.hausnummer} placeholder="Nr" class="w-full border-gray-300 rounded-md" />
					</div>
					<div>
						<label for="addr-plz" class="sr-only">PLZ</label>
						<input id="addr-plz" type="text" name="plz" value={metadata.projektadresse.plz} placeholder="PLZ" class="w-full border-gray-300 rounded-md" />
					</div>
					<div>
						<label for="addr-ort" class="sr-only">Ort</label>
						<input id="addr-ort" type="text" name="ort" value={metadata.projektadresse.ort} placeholder="Ort" class="w-full border-gray-300 rounded-md" />
					</div>
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
		<form action="?/createSchritt" method="POST" class="space-y-4">
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
