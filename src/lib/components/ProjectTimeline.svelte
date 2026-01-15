<script lang="ts">
	import type { ProjectStep, Material } from '$lib/types/project';
	import { getStatusLabel } from '$lib/types/project';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		schritte: ProjectStep[];
		isStaff?: boolean;
		userRole?: 'ADMIN' | 'INNENDIENST' | 'HANDWERKER';
		userId?: string;
		allMaterials?: Material[];
	}

	let { schritte, isStaff = false, userRole, userId, allMaterials = [] }: Props = $props();

	const canManage = $derived(isStaff && (userRole === 'ADMIN' || userRole === 'INNENDIENST'));
	const isHandwerker = $derived(userRole === 'HANDWERKER');
	const isInnendienst = $derived(userRole === 'ADMIN' || userRole === 'INNENDIENST');
	const sortierteSchritte = $derived([...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge));

	// States
	let expandedSteps = new SvelteSet<string>();
	let lightboxImage = $state<{ url: string; beschreibung?: string } | null>(null);
	let editModal: HTMLDialogElement;
	let editingStep = $state<ProjectStep | null>(null);

	// Form Visibility
	let showUpdateForm = $state<Record<string, boolean>>({});
	let showNotizForm = $state<Record<string, boolean>>({});
	let showMaterialForm = $state<Record<string, boolean>>({});

	let editingMaterialId = $state<string | null>(null);

	function toggleStep(stepId: string) { if (expandedSteps.has(stepId)) expandedSteps.delete(stepId); else expandedSteps.add(stepId); }
	function isExpanded(stepId: string): boolean { return expandedSteps.has(stepId); }
	function expandAll() { sortierteSchritte.forEach((s) => expandedSteps.add(s.id)); }
	function collapseAll() { expandedSteps.clear(); }

	function openLightbox(url: string, beschreibung?: string) { lightboxImage = { url, beschreibung }; }
	function closeLightbox() { lightboxImage = null; }
	function openEditModal(step: ProjectStep) { editingStep = step; editModal.showModal(); }

	function toggleUpdateForm(id: string) { showUpdateForm[id] = !showUpdateForm[id]; }
	function toggleNotizForm(id: string) { showNotizForm[id] = !showNotizForm[id]; }
	function toggleMaterialForm(id: string) { showMaterialForm[id] = !showMaterialForm[id]; }

	function startEditMaterial(linkId: string) { editingMaterialId = linkId; }
	function cancelEditMaterial() { editingMaterialId = null; }

	function toInputDate(date: Date) { return date.toISOString().split('T')[0]; }
	function formatDate(date: Date) { return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

	function getStatusStyles(status: string) {
		switch (status) {
			case 'fertig': return { bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', dotColor: 'bg-green-500', progressBarColor: 'bg-green-500' };
			case 'in_arbeit': return { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', dotColor: 'bg-blue-500', progressBarColor: 'bg-blue-500' };
			default: return { bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200', dotColor: 'bg-gray-400', progressBarColor: 'bg-gray-400' };
		}
	}
	function getStatusIcon(status: string) { return status === 'fertig' ? '✓' : status === 'in_arbeit' ? '⚙' : '○'; }
</script>

{#if lightboxImage}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onclick={closeLightbox} role="dialog">
		<button class="absolute top-4 right-4 text-3xl text-white">✕</button>
		<div onclick={(e) => e.stopPropagation()} role="presentation"><img src={lightboxImage.url} alt={lightboxImage.beschreibung} class="max-h-[85vh] max-w-full rounded-lg" />{#if lightboxImage.beschreibung}<p class="mt-2 text-center text-white">{lightboxImage.beschreibung}</p>{/if}</div>
	</div>
{/if}

<dialog bind:this={editModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-lg backdrop:bg-black/50">
	{#if editingStep}
		<div class="p-6">
			<h3 class="text-lg font-bold mb-4">Schritt bearbeiten</h3>
			<form action="?/updateSchritt" method="POST" class="space-y-4">
				<input type="hidden" name="schrittId" value={editingStep.id} />
				<input type="text" name="titel" value={editingStep.titel} class="w-full border-gray-300 rounded-md" />
				<div class="grid grid-cols-2 gap-4">
					<select name="status" value={editingStep.status} class="w-full border-gray-300 rounded-md"><option value="offen">Offen</option><option value="in_arbeit">In Arbeit</option><option value="fertig">Fertig</option></select>
					<input type="number" name="fortschritt" value={editingStep.fortschritt} class="w-full border-gray-300 rounded-md" />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<input type="date" name="startDatum" value={toInputDate(editingStep.startDatum)} class="w-full border-gray-300 rounded-md" />
					<input type="date" name="endDatum" value={toInputDate(editingStep.endDatum)} class="w-full border-gray-300 rounded-md" />
				</div>
				<div class="flex justify-end gap-2 mt-6"><button type="button" onclick={() => editModal.close()} class="px-4 py-2 bg-gray-100 rounded">Abbrechen</button><button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded">Speichern</button></div>
			</form>
		</div>
	{/if}
</dialog>

<div class="rounded-xl bg-white p-6 shadow-md">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-2xl font-bold text-gray-800">Projektzeitstrahl</h2>
		<div class="flex gap-2"><button onclick={expandAll} class="bg-gray-100 px-3 py-1.5 text-sm rounded">Alle aufklappen</button><button onclick={collapseAll} class="bg-gray-100 px-3 py-1.5 text-sm rounded">Alle zuklappen</button></div>
	</div>

	<div class="relative">
		<div class="absolute top-0 left-6 h-full w-0.5 bg-gray-200"></div>
		<div class="space-y-4">
			{#each sortierteSchritte as schritt (schritt.id)}
				{@const styles = getStatusStyles(schritt.status)}
				{@const expanded = isExpanded(schritt.id)}
				{@const availableMaterials = allMaterials.filter(m => !schritt.material.some(sm => sm.id === m.id))}

				{@const isStepFinished = schritt.status === 'fertig'}

				<div class="relative flex gap-4">
					<div class="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-xl text-white shadow-md {styles.dotColor}">{getStatusIcon(schritt.status)}</div>
					<div class="flex-1 overflow-hidden rounded-lg border {styles.borderColor} {styles.bgColor}">
						<button onclick={() => toggleStep(schritt.id)} class="flex w-full items-start justify-between gap-2 p-4 text-left hover:bg-white/50">
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-gray-900">{schritt.reihenfolge}. {schritt.titel}</h3>
									<span class="rounded-full border px-2.5 py-0.5 text-xs {styles.bgColor} {styles.textColor} {styles.borderColor}">{getStatusLabel(schritt.status)}</span>
									{#if schritt.bilder.length > 0}<span class="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-700">📷 {schritt.bilder.length}</span>{/if}
									{#if schritt.material.length > 0}<span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700">📦 {schritt.material.length}</span>{/if}
									{#if isInnendienst && schritt.pendingUpdates.length > 0}<span class="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs text-orange-700">⏳ {schritt.pendingUpdates.length} Updates</span>{/if}
								</div>
								<div class="mt-1 flex items-center gap-4 text-sm text-gray-500"><span>{formatDate(schritt.startDatum)} – {formatDate(schritt.endDatum)}</span><span class="{styles.textColor}">{schritt.fortschritt}%</span></div>
							</div>
							<svg class="h-5 w-5 text-gray-400 transition-transform {expanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
						</button>

						{#if expanded}
							<div class="border-t p-4 {styles.borderColor} bg-white/30">
								{#if canManage}
									<div class="flex justify-end gap-2 mb-4 border-b border-gray-200 pb-2">
										{#if !isStepFinished}
											<button onclick={() => toggleMaterialForm(schritt.id)} class="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs flex gap-1">➕ Material</button>
										{/if}

										<button onclick={() => openEditModal(schritt)} class="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs flex gap-1">✎ Bearbeiten</button>
										<form action="?/deleteSchritt" method="POST" onsubmit={(e) => !confirm('Löschen?') && e.preventDefault()}><input type="hidden" name="schrittId" value={schritt.id} /><button class="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs">🗑 Löschen</button></form>
									</div>

									{#if showMaterialForm[schritt.id] && !isStepFinished}
										<div class="mb-4 bg-green-50 rounded p-4 border border-green-200" transition:slide>
											<form action="?/addMaterialToStep" method="POST" use:enhance class="grid grid-cols-1 sm:grid-cols-3 gap-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<div class="sm:col-span-2">
													<label class="text-xs">Material</label>
													<select name="materialId" class="w-full text-sm rounded" required>
														<option value="" disabled selected>Wählen...</option>
														{#each availableMaterials as m}
															<option value={m.id}>{m.name} (Bestand: {m.bestand} {m.einheit})</option>
														{/each}
													</select>
												</div>
												<div><label class="text-xs">Menge</label><input type="number" step="0.01" name="menge" class="w-full text-sm rounded" required /></div>
												<div class="sm:col-span-3 flex justify-end gap-2">
													<button type="button" onclick={() => toggleMaterialForm(schritt.id)} class="text-xs text-gray-500">Abbrechen</button>
													<button class="bg-green-600 text-white px-3 py-1 text-xs rounded" disabled={availableMaterials.length === 0}>Hinzufügen</button>
												</div>
											</form>
										</div>
									{/if}
								{/if}

								{#if isHandwerker}
									<div class="flex gap-2 mb-4"><button onclick={() => toggleUpdateForm(schritt.id)} class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Status Update</button><button onclick={() => toggleNotizForm(schritt.id)} class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Notiz</button></div>
									{#if showUpdateForm[schritt.id]}<div class="mb-4 p-3 bg-blue-50 rounded"><form action="?/submitUpdate" method="POST" use:enhance class="space-y-2"><input type="hidden" name="schrittId" value={schritt.id} /><select name="status" class="w-full text-sm rounded"><option value="">Status...</option><option value="offen">Offen</option><option value="in_arbeit">In Arbeit</option><option value="fertig">Fertig</option></select><input type="number" name="fortschritt" placeholder="%" class="w-full text-sm rounded" /><button class="bg-blue-600 text-white w-full py-1 text-xs rounded">Senden</button></form></div>{/if}
									{#if showNotizForm[schritt.id]}<div class="mb-4 p-3 bg-yellow-50 rounded"><form action="?/addNotiz" method="POST" use:enhance class="space-y-2"><input type="hidden" name="schrittId" value={schritt.id} /><textarea name="text" class="w-full text-sm rounded"></textarea><button class="bg-yellow-600 text-white w-full py-1 text-xs rounded">Senden</button></form></div>{/if}
								{/if}

								{#if schritt.beschreibung}<p class="mb-4 text-gray-600">{schritt.beschreibung}</p>{/if}
								<div class="mb-4"><div class="flex justify-between text-sm mb-1"><span>Fortschritt</span><span class="font-medium">{schritt.fortschritt}%</span></div><div class="h-2 bg-gray-200 rounded-full"><div class="h-full {styles.progressBarColor}" style="width: {schritt.fortschritt}%"></div></div></div>

								{#if schritt.material.length > 0}
									<div class="mb-4">
										<p class="text-sm font-medium mb-2">Material:</p>
										<div class="flex flex-wrap gap-2">
											{#each schritt.material as mat}
												<div class="inline-flex items-center bg-white px-2 py-1 text-xs border rounded gap-2 shadow-sm">
													<span class="font-medium text-gray-700">{mat.name}</span>

													{#if editingMaterialId === mat.linkId && !isStepFinished}
														<form action="?/updateMaterialInStep" method="POST" use:enhance={() => {
                                                 return async ({ update }) => {
                                                     await update();
                                                     cancelEditMaterial();
                                                 };
                                             }} class="flex items-center gap-1">
															<input type="hidden" name="linkId" value={mat.linkId} />
															<input
																	type="number"
																	step="0.01"
																	name="menge"
																	value={mat.menge}
																	class="w-16 h-6 text-xs border-gray-300 rounded px-1 py-0"
																	autofocus
															/>
															<span class="text-gray-500">{mat.einheit}</span>
															<button class="text-green-600 hover:text-green-800 bg-green-50 p-0.5 rounded">✓</button>
															<button type="button" onclick={cancelEditMaterial} class="text-gray-400 hover:text-gray-600 px-1">✕</button>
														</form>

													{:else}
														<span class="text-gray-500">({mat.menge} {mat.einheit})</span>

														{#if canManage && mat.linkId && !isStepFinished}
															<div class="flex items-center gap-1 ml-1 pl-1 border-l border-gray-200">
																<button onclick={() => startEditMaterial(mat.linkId!)} class="text-blue-400 hover:text-blue-600 p-0.5">✎</button>
																<form action="?/removeMaterialFromStep" method="POST" use:enhance class="inline-flex">
																	<input type="hidden" name="linkId" value={mat.linkId} />
																	<button class="text-red-400 hover:text-red-600 p-0.5">🗑</button>
																</form>
															</div>
														{/if}
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								{#if schritt.bilder.length > 0}
									<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
										{#each schritt.bilder as bild}
											<div class="relative group aspect-square bg-gray-100 rounded overflow-hidden">
												<img src={bild.url} alt="Foto" class="h-full w-full object-cover cursor-pointer" onclick={() => openLightbox(bild.url, bild.beschreibung)} />
												{#if canManage}<form action="?/deleteBild" method="POST" class="absolute top-1 right-1 opacity-0 group-hover:opacity-100"><input type="hidden" name="bildId" value={bild.id} /><button class="bg-red-600 text-white p-1 rounded-full text-xs">🗑</button></form>{/if}
											</div>
										{/each}
									</div>
								{/if}

								{#if isStaff}
									<div class="border-t pt-3 bg-white/50 p-2 rounded"><form action="?/uploadBild" method="POST" enctype="multipart/form-data" use:enhance class="flex gap-2"><input type="hidden" name="schrittId" value={schritt.id} /><input type="file" name="bild" class="text-xs" required /><input type="text" name="beschreibung" placeholder="Beschreibung" class="text-xs border rounded flex-1" /><button class="bg-blue-600 text-white px-2 py-1 text-xs rounded">Upload</button></form></div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
