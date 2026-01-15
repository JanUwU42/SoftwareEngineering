<script lang="ts">
	import type { ProjectStep } from '$lib/types/project';
	import { getStatusLabel } from '$lib/types/project';

	interface Props {
		schritte: ProjectStep[];
		isStaff?: boolean;
	}

	let { schritte, isStaff = false }: Props = $props();

	const sortierteSchritte = $derived([...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge));

	let expandedSteps = $state<Set<string>>(new Set());
	let lightboxImage = $state<{ url: string; beschreibung?: string } | null>(null);

	function toggleStep(stepId: string) {
		const newSet = new Set(expandedSteps);
		if (newSet.has(stepId)) {
			newSet.delete(stepId);
		} else {
			newSet.add(stepId);
		}
		expandedSteps = newSet;
	}

	function isExpanded(stepId: string): boolean {
		return expandedSteps.has(stepId);
	}

	function expandAll() {
		expandedSteps = new Set(sortierteSchritte.map((s) => s.id));
	}

	function collapseAll() {
		expandedSteps = new Set();
	}

	function openLightbox(url: string, beschreibung?: string) {
		lightboxImage = { url, beschreibung };
	}

	function closeLightbox() {
		lightboxImage = null;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function getStatusStyles(status: ProjectStep['status']) {
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
			default:
				return '○';
		}
	}
</script>

{#if lightboxImage}
	<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
			onclick={closeLightbox}
			role="dialog"
			aria-modal="true"
	>
		<button
				type="button"
				class="absolute top-4 right-4 text-3xl text-white hover:text-gray-300 focus:outline-none"
				onclick={closeLightbox}
				aria-label="Schließen"
		>
			✕
		</button>

		<div
				class="max-h-[90vh] max-w-[90vw] focus:outline-none"
				onclick={(e) => e.stopPropagation()}
				role="presentation"
		>
			<img
					src={lightboxImage.url}
					alt={lightboxImage.beschreibung || 'Projektbild'}
					class="max-h-[85vh] max-w-full rounded-lg object-contain"
			/>
			{#if lightboxImage.beschreibung}
				<p class="mt-2 text-center text-white">{lightboxImage.beschreibung}</p>
			{/if}
		</div>
	</div>
{/if}

<div class="rounded-xl bg-white p-6 shadow-md">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-2xl font-bold text-gray-800">Projektzeitstrahl</h2>
		<div class="flex gap-2">
			<button
					onclick={expandAll}
					class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
			>
				Alle aufklappen
			</button>
			<button
					onclick={collapseAll}
					class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
			>
				Alle zuklappen
			</button>
		</div>
	</div>

	<div class="relative">
		<div class="absolute top-0 left-6 h-full w-0.5 bg-gray-200"></div>

		<div class="space-y-4">
			{#each sortierteSchritte as schritt (schritt.id)}
				{@const styles = getStatusStyles(schritt.status)}
				{@const expanded = isExpanded(schritt.id)}
				<div class="relative flex gap-4">
					<div
							class="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-xl text-white shadow-md {styles.dotColor}"
					>
						{getStatusIcon(schritt.status)}
					</div>

					<div
							class="flex-1 overflow-hidden rounded-lg border {styles.borderColor} {styles.bgColor}"
					>
						<button
								onclick={() => toggleStep(schritt.id)}
								class="flex w-full items-start justify-between gap-2 p-4 text-left hover:bg-white/50 focus:outline-none"
						>
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-gray-900">
										{schritt.reihenfolge}. {schritt.titel}
									</h3>
									<span
											class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {styles.bgColor} {styles.textColor} {styles.borderColor}"
									>
                               {getStatusLabel(schritt.status)}
                            </span>
									{#if schritt.bilder.length > 0}
                               <span
									   class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700"
							   >
                                  📷 {schritt.bilder.length}
                               </span>
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
									<span>{formatDate(schritt.startDatum)} – {formatDate(schritt.endDatum)}</span>
									<span class="font-medium {styles.textColor}">{schritt.fortschritt}%</span>
								</div>
							</div>
							<svg
									class="h-5 w-5 text-gray-400 transition-transform {expanded ? 'rotate-180' : ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
							>
								<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if expanded}
							<div class="border-t p-4 {styles.borderColor}">
								{#if schritt.beschreibung}
									<p class="mb-4 text-gray-600">{schritt.beschreibung}</p>
								{/if}

								<div class="mb-4">
									<div class="mb-1 flex justify-between text-sm">
										<span class="text-gray-600">Fortschritt</span>
										<span class="font-medium {styles.textColor}">{schritt.fortschritt}%</span>
									</div>
									<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
										<div
												class="h-full transition-all {styles.progressBarColor}"
												style="width: {schritt.fortschritt}%"
										></div>
									</div>
								</div>

								{#if schritt.material.length > 0}
									<div class="mb-4">
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

								<div>
									<p class="mb-2 text-sm font-medium text-gray-700">
										Fotos ({schritt.bilder.length}):
									</p>

									{#if schritt.bilder.length > 0}
										<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mb-4">
											{#each schritt.bilder as bild (bild.id)}
												<div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-sm hover:shadow-md transition-shadow">

													<button
															type="button"
															class="h-full w-full p-0 border-0 bg-transparent cursor-pointer"
															onclick={() => openLightbox(bild.url, bild.beschreibung)}
															aria-label="Bild vergrößern: {bild.beschreibung || 'Projektfoto'}"
													>
														<img
																src={bild.url}
																alt={bild.beschreibung || 'Projektfoto'}
																class="h-full w-full object-cover transition-transform group-hover:scale-105"
														/>

														<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-left">
															<p class="truncate text-xs text-white">
																{bild.beschreibung || 'Foto'}
															</p>
															{#if bild.hochgeladenVon}
																<p class="truncate text-xs text-gray-300">{bild.hochgeladenVon}</p>
															{/if}
														</div>
													</button>

													{#if isStaff}
														<form
																action="?/deleteBild"
																method="POST"
																class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
																onsubmit={(e) => {
                                                  if(!confirm('Möchtest du dieses Bild wirklich löschen?')) {
                                                     e.preventDefault();
                                                  }
                                               }}
														>
															<input type="hidden" name="bildId" value={bild.id} />
															<button
																	type="submit"
																	class="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-md focus:opacity-100 focus:outline-none"
																	title="Bild löschen"
																	aria-label="Bild löschen"
															>
																<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
																	<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
																</svg>
															</button>
														</form>
													{/if}
												</div>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-gray-400 italic mb-4">Noch keine Fotos hochgeladen.</p>
									{/if}

									{#if isStaff}
										<div class="mt-4 border-t border-gray-200 pt-4 bg-white/50 rounded-md p-3">
											<form
													action="?/uploadBild"
													method="POST"
													enctype="multipart/form-data"
													class="flex flex-col sm:flex-row items-end gap-3"
											>
												<input type="hidden" name="schrittId" value={schritt.id} />

												<div class="flex-1 w-full">
													<label for="file-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Neues Foto</label>
													<input
															id="file-{schritt.id}"
															type="file"
															name="bild"
															accept="image/*"
															required
															class="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
													/>
												</div>

												<div class="flex-1 w-full">
													<label for="desc-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Beschreibung</label>
													<input
															id="desc-{schritt.id}"
															type="text"
															name="beschreibung"
															placeholder="Was ist zu sehen?"
															class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5"
													/>
												</div>

												<button
														type="submit"
														class="w-full sm:w-auto bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 flex items-center justify-center gap-1"
												>
													<span>Hochladen</span>
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
														<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
													</svg>
												</button>
											</form>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="mt-8 flex flex-wrap justify-center gap-6 border-t border-gray-200 pt-4">
		<div class="flex items-center gap-2">
			<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 text-xs text-white">○</span>
			<span class="text-sm text-gray-600">Offen</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">⚙</span>
			<span class="text-sm text-gray-600">In Arbeit</span>
		</div>
		<div class="flex items-center gap-2">
			<span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-xs text-white">✓</span>
			<span class="text-sm text-gray-600">Fertig</span>
		</div>
	</div>
</div>
