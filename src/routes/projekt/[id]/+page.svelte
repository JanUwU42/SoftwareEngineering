<script lang="ts">
	import type { PageData } from './$types';
	import type { ProjectMetadata, ProjectStep, Material } from '$lib/types/project';
	import ProjectMetadataCard from '$lib/components/ProjectMetadataCard.svelte';
	import ProjectTimeline from '$lib/components/ProjectTimeline.svelte';

	let { data }: { data: PageData } = $props();

	// Konvertiere ISO-Strings zurück zu Date-Objekten
	const metadata: ProjectMetadata = $derived({
		auftragsnummer: data.project.metadata.auftragsnummer,
		kundenname: data.project.metadata.kundenname,
		projektadresse: data.project.metadata.projektadresse,
		projektbezeichnung: data.project.metadata.projektbezeichnung,
		projektbeschreibung: data.project.metadata.projektbeschreibung,
		geplanterStart: data.project.metadata.geplanterStart
				? new Date(data.project.metadata.geplanterStart)
				: undefined,
		geplantesEnde: data.project.metadata.geplantesEnde
				? new Date(data.project.metadata.geplantesEnde)
				: undefined
	});

	const schritte: ProjectStep[] = $derived(
			data.project.schritte.map((schritt) => ({
				id: schritt.id,
				titel: schritt.titel,
				beschreibung: schritt.beschreibung,
				startDatum: new Date(schritt.startDatum),
				endDatum: new Date(schritt.endDatum),
				status: schritt.status as 'offen' | 'in_arbeit' | 'fertig', // Type Cast für Enum Sicherheit
				fortschritt: schritt.fortschritt,
				material: schritt.material,
				reihenfolge: schritt.reihenfolge,
				bilder: schritt.bilder.map((bild) => ({
					id: bild.id,
					url: bild.url,
					beschreibung: bild.beschreibung,
					hochgeladenAm: new Date(bild.hochgeladenAm),
					hochgeladenVon: bild.hochgeladenVon
				}))
			}))
	);

	const materialListe: Material[] = $derived(data.project.materialListe);

	// Berechne Gesamtfortschritt
	const gesamtfortschritt = $derived(
			schritte.length > 0
					? Math.round(schritte.reduce((sum, s) => sum + s.fortschritt, 0) / schritte.length)
					: 0
	);

	const fertigeSchritte = $derived(schritte.filter((s) => s.status === 'fertig').length);
	const inArbeitSchritte = $derived(schritte.filter((s) => s.status === 'in_arbeit').length);
	const offeneSchritte = $derived(schritte.filter((s) => s.status === 'offen').length);
</script>

<svelte:head>
	<title>{metadata.projektbezeichnung} – Projektübersicht</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight text-gray-900">
						{metadata.projektbezeichnung}
					</h1>
					<p class="mt-1 text-sm text-gray-500">
						{metadata.kundenname} · {metadata.auftragsnummer}
					</p>
				</div>
				<div class="flex items-center gap-4">
					{#if data.isStaff}
						<a
								href="/admin/uebersicht"
								class="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
						>
							← Zurück zur Übersicht
						</a>
					{:else}
						<form action="/?/logout" method="POST">
							<button
									type="submit"
									class="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700"
							>
								Abmelden
							</button>
						</form>
					{/if}
				</div>
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

		<div class="mb-8">
			<ProjectMetadataCard {metadata} {materialListe} />
		</div>

		<div>
			<ProjectTimeline {schritte} />
		</div>
	</main>

	<footer class="mt-auto border-t border-gray-200 bg-white py-4">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<p class="text-center text-sm text-gray-500">
				Zuletzt aktualisiert: {new Date(data.project.aktualisiertAm).toLocaleDateString(
					'de-DE',
					{
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					}
			)}
			</p>
		</div>
	</footer>
</div>
