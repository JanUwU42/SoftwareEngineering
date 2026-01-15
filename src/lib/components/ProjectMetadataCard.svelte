<script lang="ts">
	import type { ProjectMetadata, Material } from '$lib/types/project';

	interface Props {
		metadata: ProjectMetadata;
		materialListe: Material[];
	}

	let { metadata, materialListe }: Props = $props();

	function formatDate(date: Date | undefined): string {
		if (!date) return '–';
		return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
	function formatAddress(addr: ProjectMetadata['projektadresse']): string {
		return `${addr.strasse} ${addr.hausnummer}, ${addr.plz} ${addr.ort}`;
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-md">
	<h2 class="mb-6 text-2xl font-bold text-gray-800">Projektübersicht</h2>

	<div class="grid gap-6 md:grid-cols-2">
		<div class="space-y-4">
			<div><span class="text-sm font-medium text-gray-500">Kundenname</span><p class="text-lg font-semibold text-gray-900">{metadata.kundenname}</p></div>
			<div><span class="text-sm font-medium text-gray-500">Projektbezeichnung</span><p class="text-lg font-semibold text-gray-900">{metadata.projektbezeichnung}</p></div>
			<div><span class="text-sm font-medium text-gray-500">Adresse</span><p class="text-gray-900">{formatAddress(metadata.projektadresse)}</p></div>
			{#if metadata.projektbeschreibung}<div><span class="text-sm font-medium text-gray-500">Beschreibung</span><p class="text-gray-700">{metadata.projektbeschreibung}</p></div>{/if}
			<div class="flex gap-8">
				<div><span class="text-sm font-medium text-gray-500">Start</span><p class="text-lg text-gray-900">{formatDate(metadata.geplanterStart)}</p></div>
				<div><span class="text-sm font-medium text-gray-500">Ende</span><p class="text-lg text-gray-900">{formatDate(metadata.geplantesEnde)}</p></div>
			</div>
		</div>

		<div>
			<h3 class="mb-4 text-lg font-semibold text-gray-800">Materialliste</h3>
			{#if materialListe.length > 0}
				<div class="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
					<table class="w-full text-sm">
						<thead class="sticky top-0 bg-gray-50">
						<tr>
							<th class="px-4 py-2 text-left font-medium text-gray-600">Material</th>
							<th class="px-4 py-2 text-right font-medium text-gray-600">Menge</th>
							<th class="px-4 py-2 text-right font-medium text-gray-600"></th>
						</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
						{#each materialListe as material (material.id)}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-2 align-top"><span class="font-medium text-gray-900">{material.name}</span></td>
								<td class="px-4 py-2 text-right align-top text-gray-900">{material.menge} {material.einheit}</td>
								<td class="px-4 py-2 text-right align-top">
									{#if (material.mengeBestellen ?? 0) > 0}
                                    <span class="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">
                                        Nachbestellen: {material.mengeBestellen}
                                    </span>
									{:else}
										<span class="text-gray-400 text-xs">Verfügbar</span>
									{/if}
								</td>
							</tr>
						{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="text-gray-500">Keine Materialien hinterlegt.</p>
			{/if}
		</div>
	</div>
</div>
