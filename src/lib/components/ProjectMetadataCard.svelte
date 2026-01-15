<script lang="ts">
	import type { ProjectMetadata, Material } from '$lib/types/project';

	interface Props {
		metadata: ProjectMetadata;
		materialListe: Material[];
	}

	let { metadata, materialListe }: Props = $props();

	function formatDate(date: Date | undefined): string {
		if (!date) return '–';
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatAddress(addr: ProjectMetadata['projektadresse']): string {
		return `${addr.strasse} ${addr.hausnummer}, ${addr.plz} ${addr.ort}`;
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-md">
	<h2 class="mb-6 text-2xl font-bold text-gray-800">Projektübersicht</h2>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Linke Spalte: Allgemeine Infos -->
		<div class="space-y-4">
			<div>
				<span class="text-sm font-medium text-gray-500">Auftragsnummer</span>
				<p class="text-lg font-semibold text-gray-900">{metadata.auftragsnummer}</p>
			</div>

			<div>
				<span class="text-sm font-medium text-gray-500">Kundenname</span>
				<p class="text-lg font-semibold text-gray-900">{metadata.kundenname}</p>
			</div>

			<div>
				<span class="text-sm font-medium text-gray-500">Projektadresse</span>
				<p class="text-lg text-gray-900">{formatAddress(metadata.projektadresse)}</p>
			</div>

			<div>
				<span class="text-sm font-medium text-gray-500">Projektbezeichnung</span>
				<p class="text-lg font-semibold text-gray-900">{metadata.projektbezeichnung}</p>
			</div>

			{#if metadata.projektbeschreibung}
				<div>
					<span class="text-sm font-medium text-gray-500">Beschreibung</span>
					<p class="text-gray-700">{metadata.projektbeschreibung}</p>
				</div>
			{/if}

			<div class="flex gap-8">
				<div>
					<span class="text-sm font-medium text-gray-500">Geplanter Start</span>
					<p class="text-lg text-gray-900">{formatDate(metadata.geplanterStart)}</p>
				</div>
				<div>
					<span class="text-sm font-medium text-gray-500">Geplantes Ende</span>
					<p class="text-lg text-gray-900">{formatDate(metadata.geplantesEnde)}</p>
				</div>
			</div>
		</div>

		<!-- Rechte Spalte: Materialliste -->
		<div>
			<h3 class="mb-4 text-lg font-semibold text-gray-800">Materialliste</h3>
			{#if materialListe.length > 0}
				<div class="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
					<table class="w-full text-sm">
						<thead class="sticky top-0 bg-gray-50">
							<tr>
								<th class="px-4 py-2 text-left font-medium text-gray-600">Material</th>
								<th class="px-4 py-2 text-right font-medium text-gray-600">Menge</th>
								<th class="px-4 py-2 text-left font-medium text-gray-600">Einheit</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each materialListe as material (material.id)}
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-2">
										<span class="font-medium text-gray-900">{material.name}</span>
										{#if material.bemerkung}
											<span class="block text-xs text-gray-500">{material.bemerkung}</span>
										{/if}
									</td>
									<td class="px-4 py-2 text-right text-gray-900">{material.menge}</td>
									<td class="px-4 py-2 text-gray-600">{material.einheit}</td>
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
