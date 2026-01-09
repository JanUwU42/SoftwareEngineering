<script lang="ts">
	import type { ProjectStep } from '$lib/types/project';
	import { getStatusLabel } from '$lib/types/project';

	interface Props {
		schritte: ProjectStep[];
	}

	let { schritte }: Props = $props();

	// Schritte nach Reihenfolge sortieren
	const sortierteSchritte = $derived([...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge));

	function formatDate(date: Date): string {
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function getStatusStyles(status: ProjectStep['status']): {
		bgColor: string;
		textColor: string;
		borderColor: string;
		dotColor: string;
		progressBarColor: string;
	} {
		switch (status) {
			case 'fertig':
				return {
					bgColor: 'bg-green-50',
					textColor: 'text-green-700',
					borderColor: 'border-green-200',
					dotColor: 'bg-green-500',
					progressBarColor: 'bg-green-500'
				};
			case 'in_arbeit':
				return {
					bgColor: 'bg-blue-50',
					textColor: 'text-blue-700',
					borderColor: 'border-blue-200',
					dotColor: 'bg-blue-500',
					progressBarColor: 'bg-blue-500'
				};
			case 'offen':
			default:
				return {
					bgColor: 'bg-gray-50',
					textColor: 'text-gray-600',
					borderColor: 'border-gray-200',
					dotColor: 'bg-gray-400',
					progressBarColor: 'bg-gray-400'
				};
		}
	}

	function getStatusIcon(status: ProjectStep['status']): string {
		switch (status) {
			case 'fertig':
				return '✓';
			case 'in_arbeit':
				return '⚙';
			case 'offen':
			default:
				return '○';
		}
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-md">
	<h2 class="mb-6 text-2xl font-bold text-gray-800">Projektzeitstrahl</h2>

	<div class="relative">
		<!-- Vertikale Linie -->
		<div class="absolute left-6 top-0 h-full w-0.5 bg-gray-200"></div>

		<div class="space-y-6">
			{#each sortierteSchritte as schritt, index (schritt.id)}
				{@const styles = getStatusStyles(schritt.status)}
				<div class="relative flex gap-4">
					<!-- Timeline Dot -->
					<div
						class="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-white {styles.dotColor} text-xl text-white shadow-md"
					>
						{getStatusIcon(schritt.status)}
					</div>

					<!-- Content Card -->
					<div
						class="flex-1 rounded-lg border {styles.borderColor} {styles.bgColor} p-4 transition-all hover:shadow-md"
					>
						<div class="mb-2 flex flex-wrap items-start justify-between gap-2">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">
									{schritt.reihenfolge}. {schritt.titel}
								</h3>
								{#if schritt.beschreibung}
									<p class="mt-1 text-sm text-gray-600">{schritt.beschreibung}</p>
								{/if}
							</div>
							<span
								class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium {styles.bgColor} {styles.textColor} border {styles.borderColor}"
							>
								{getStatusLabel(schritt.status)}
							</span>
						</div>

						<!-- Datum -->
						<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span>{formatDate(schritt.startDatum)} – {formatDate(schritt.endDatum)}</span>
						</div>

						<!-- Fortschrittsbalken -->
						<div class="mb-3">
							<div class="mb-1 flex justify-between text-sm">
								<span class="text-gray-600">Fortschritt</span>
								<span class="font-medium {styles.textColor}">{schritt.fortschritt}%</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div
									class="h-full transition-all duration-500 {styles.progressBarColor}"
									style="width: {schritt.fortschritt}%"
								></div>
							</div>
						</div>

						<!-- Material für diesen Schritt -->
						{#if schritt.material.length > 0}
							<div class="border-t border-gray-200 pt-3">
								<p class="mb-2 text-sm font-medium text-gray-700">Benötigtes Material:</p>
								<div class="flex flex-wrap gap-2">
									{#each schritt.material as mat (mat.id)}
										<span
											class="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200 ring-inset"
										>
											{mat.name}
											<span class="ml-1 text-gray-500">({mat.menge} {mat.einheit})</span>
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Legende -->
	<div class="mt-8 flex flex-wrap justify-center gap-6 border-t border-gray-200 pt-4">
		<div class="flex items-center gap-2">
			<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-xs text-white"
				>○</span
			>
			<span class="text-sm text-gray-600">Offen</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white"
				>⚙</span
			>
			<span class="text-sm text-gray-600">In Arbeit</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs text-white"
				>✓</span
			>
			<span class="text-sm text-gray-600">Fertig</span>
		</div>
	</div>
</div>
