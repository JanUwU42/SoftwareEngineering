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
	let showMaterialRequestForm = $state<Record<string, boolean>>({});

	let isNewMaterialMode = $state<Record<string, boolean>>({});
	let editingMaterialId = $state<string | null>(null);

	function toggleStep(stepId: string) { if (expandedSteps.has(stepId)) expandedSteps.delete(stepId); else expandedSteps.add(stepId); }
	function isExpanded(stepId: string): boolean { return expandedSteps.has(stepId); }
	function expandAll() { sortierteSchritte.forEach((s) => expandedSteps.add(s.id)); }
	function collapseAll() { expandedSteps.clear(); }

	function openLightbox(url: string, beschreibung?: string) { lightboxImage = { url, beschreibung }; }
	function closeLightbox() { lightboxImage = null; }
	function openEditModal(step: ProjectStep) { editingStep = step; editModal.showModal(); }

	function toggleUpdateForm(id: string) { showUpdateForm[id] = !showUpdateForm[id]; showNotizForm[id] = false; showMaterialRequestForm[id] = false; }
	function toggleNotizForm(id: string) { showNotizForm[id] = !showNotizForm[id]; showUpdateForm[id] = false; showMaterialRequestForm[id] = false;}
	function toggleMaterialForm(id: string) { showMaterialForm[id] = !showMaterialForm[id]; isNewMaterialMode[id] = false; }
	function toggleMaterialRequestForm(id: string) { showMaterialRequestForm[id] = !showMaterialRequestForm[id]; isNewMaterialMode[id] = false; showUpdateForm[id] = false; showNotizForm[id] = false; }

	function toggleNewMaterialMode(id: string) { isNewMaterialMode[id] = !isNewMaterialMode[id]; }
	function startEditMaterial(linkId: string) { editingMaterialId = linkId; }
	function cancelEditMaterial() { editingMaterialId = null; }

	function toInputDate(date: Date) { return date.toISOString().split('T')[0]; }
	function formatDate(date: Date) { return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
	function formatDateTime(str: string) { return new Date(str).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }

	function getStatusStyles(status: string) {
		switch (status) {
			case 'fertig': return { bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', dotColor: 'bg-green-500', progressBarColor: 'bg-green-500' };
			case 'in_arbeit': return { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', dotColor: 'bg-blue-500', progressBarColor: 'bg-blue-500' };
			default: return { bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200', dotColor: 'bg-gray-400', progressBarColor: 'bg-gray-400' };
		}
	}
	function getStatusIcon(status: string) { return status === 'fertig' ? '✓' : status === 'in_arbeit' ? '⚙' : '○'; }
	function getUpdateTypLabel(typ: string) {
		if (typ === 'STATUS_AENDERUNG') return 'Status';
		if (typ === 'FOTO_UPLOAD') return 'Foto';
		if (typ === 'MATERIAL_ANFORDERUNG') return 'Material';
		return 'Notiz';
	}
</script>

{#if lightboxImage}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onclick={closeLightbox} role="dialog">
		<button class="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white">✕</button>
		<div onclick={(e) => e.stopPropagation()} role="presentation"><img src={lightboxImage.url} alt={lightboxImage.beschreibung} class="max-h-[85vh] max-w-full rounded-lg object-contain" />{#if lightboxImage.beschreibung}<p class="mt-4 text-center text-white text-lg font-medium">{lightboxImage.beschreibung}</p>{/if}</div>
	</div>
{/if}

<dialog bind:this={editModal} class="m-auto w-[95%] max-w-lg rounded-xl border-0 p-0 shadow-2xl backdrop:bg-black/50">
	{#if editingStep}
		<div class="p-6">
			<h3 class="mb-4 text-lg font-bold">Schritt bearbeiten</h3>
			<form action="?/updateSchritt" method="POST" class="space-y-4">
				<input type="hidden" name="schrittId" value={editingStep.id} />
				<input type="text" name="titel" value={editingStep.titel} class="w-full rounded-md border-gray-300 p-2" />
				<div class="grid grid-cols-2 gap-4">
					<select name="status" value={editingStep.status} class="w-full rounded-md border-gray-300"><option value="offen">Offen</option><option value="in_arbeit">In Arbeit</option><option value="fertig">Fertig</option></select>
					<input type="number" name="fortschritt" value={editingStep.fortschritt} class="w-full rounded-md border-gray-300" />
				</div>
				<div class="grid grid-cols-2 gap-4">
					<input type="date" name="startDatum" value={toInputDate(editingStep.startDatum)} class="w-full rounded-md border-gray-300" />
					<input type="date" name="endDatum" value={toInputDate(editingStep.endDatum)} class="w-full rounded-md border-gray-300" />
				</div>
				<div class="mt-6 flex justify-end gap-2"><button type="button" onclick={() => editModal.close()} class="rounded bg-gray-100 px-4 py-2">Abbrechen</button><button class="rounded bg-blue-600 px-4 py-2 text-white">Speichern</button></div>
			</form>
		</div>
	{/if}
</dialog>

<div class="rounded-xl bg-white p-4 shadow-md sm:p-6">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-xl font-bold text-gray-800 sm:text-2xl">Projektzeitstrahl</h2>
		<div class="flex gap-2">
			<button onclick={expandAll} class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 sm:text-sm">Alle aufklappen</button>
			<button onclick={collapseAll} class="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 sm:text-sm">Alle zuklappen</button>
		</div>
	</div>

	<div class="relative">
		<div class="absolute top-0 left-4 h-full w-0.5 bg-gray-200 sm:left-6"></div>
		<div class="space-y-6">
			{#each sortierteSchritte as schritt (schritt.id)}
				{@const styles = getStatusStyles(schritt.status)}
				{@const expanded = isExpanded(schritt.id)}
				{@const availableMaterials = allMaterials.filter(m => !schritt.material.some(sm => sm.id === m.id))}
				{@const isStepFinished = schritt.status === 'fertig'}

				<div class="relative flex gap-3 sm:gap-4">
					<div class="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white text-sm text-white shadow-md sm:h-12 sm:w-12 sm:text-xl {styles.dotColor}">
						{getStatusIcon(schritt.status)}
					</div>

					<div class="flex-1 overflow-hidden rounded-lg border {styles.borderColor} {styles.bgColor}">
						<button onclick={() => toggleStep(schritt.id)} class="flex w-full items-start justify-between gap-2 p-3 text-left hover:bg-white/50 sm:p-4">
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-base font-bold text-gray-900 sm:text-lg">{schritt.reihenfolge}. {schritt.titel}</h3>
									<span class="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide {styles.bgColor} {styles.textColor} {styles.borderColor}">{getStatusLabel(schritt.status)}</span>
									{#if schritt.material.length > 0}<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">📦 {schritt.material.length}</span>{/if}
									{#if (isInnendienst || isHandwerker) && schritt.pendingUpdates?.length > 0}
										<span class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 animate-pulse">⏳ {schritt.pendingUpdates.length}</span>
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-3 text-xs text-gray-500 sm:text-sm">
									<span>{formatDate(schritt.startDatum)} – {formatDate(schritt.endDatum)}</span>
									<span class="font-bold {styles.textColor}">{schritt.fortschritt}%</span>
								</div>
							</div>
							<svg class="mt-1 h-5 w-5 text-gray-400 transition-transform {expanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
						</button>

						{#if expanded}
							<div class="border-t p-3 sm:p-4 {styles.borderColor} bg-white/50">

								{#if isHandwerker && !isStepFinished}
									<div class="mb-4 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
										<button onclick={() => toggleUpdateForm(schritt.id)} class="flex items-center justify-center gap-2 rounded-lg bg-blue-100 py-3 text-sm font-medium text-blue-800 transition-colors active:bg-blue-200 sm:px-3 sm:py-2">
											<span>⚡ Status Update</span>
										</button>
										<button onclick={() => toggleNotizForm(schritt.id)} class="flex items-center justify-center gap-2 rounded-lg bg-yellow-100 py-3 text-sm font-medium text-yellow-800 transition-colors active:bg-yellow-200 sm:px-3 sm:py-2">
											<span>📝 Notiz</span>
										</button>
										<button onclick={() => toggleMaterialRequestForm(schritt.id)} class="flex items-center justify-center gap-2 rounded-lg bg-green-100 py-3 text-sm font-medium text-green-800 transition-colors active:bg-green-200 sm:px-3 sm:py-2">
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
											<span>Material anfordern</span>
										</button>
									</div>

									{#if showUpdateForm[schritt.id]}
										<div class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4" transition:slide>
											<form action="?/submitUpdate" method="POST" use:enhance class="space-y-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<div>
													<label class="mb-1 block text-xs font-medium text-blue-800">Neuer Status</label>
													<select name="status" class="h-10 w-full rounded-md border-blue-300 text-sm"><option value="">Bitte wählen...</option><option value="offen">Offen</option><option value="in_arbeit">In Arbeit</option><option value="fertig">Fertig (Abgeschlossen)</option></select>
												</div>
												<div>
													<label class="mb-1 block text-xs font-medium text-blue-800">Fortschritt (%)</label>
													<input type="number" name="fortschritt" placeholder="z.B. 50" class="h-10 w-full rounded-md border-blue-300 text-sm" />
												</div>
												<button class="h-10 w-full rounded-md bg-blue-600 font-bold text-white shadow hover:bg-blue-700">Update senden</button>
											</form>
										</div>
									{/if}

									{#if showNotizForm[schritt.id]}
										<div class="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4" transition:slide>
											<form action="?/addNotiz" method="POST" use:enhance class="space-y-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<textarea name="text" class="w-full rounded-md border-yellow-300 p-2 text-sm" rows="3" placeholder="Was gibt es zu berichten?"></textarea>
												<button class="h-10 w-full rounded-md bg-yellow-600 font-bold text-white shadow hover:bg-yellow-700">Notiz speichern</button>
											</form>
										</div>
									{/if}

									{#if showMaterialRequestForm[schritt.id]}
										<div class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4" transition:slide>
											<h4 class="mb-3 text-sm font-bold text-green-800">Material anfordern</h4>
											<form action="?/submitUpdate" method="POST" use:enhance class="space-y-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<input type="hidden" name="isNew" value={isNewMaterialMode[schritt.id] ? 'true' : 'false'} />

												<div class="flex justify-between">
													<span class="text-xs text-green-700">Was wird benötigt?</span>
													<button type="button" onclick={() => toggleNewMaterialMode(schritt.id)} class="text-xs font-medium text-blue-600 underline">
														{isNewMaterialMode[schritt.id] ? 'Aus Liste wählen' : 'Manuell eingeben'}
													</button>
												</div>

												{#if isNewMaterialMode[schritt.id]}
													<input type="text" name="newMaterialName" placeholder="Material Name" class="h-10 w-full rounded-md border-green-300 text-sm" required={isNewMaterialMode[schritt.id]} />
													<input type="text" name="newMaterialUnit" placeholder="Einheit (z.B. Sack, Stk)" class="h-10 w-full rounded-md border-green-300 text-sm" required={isNewMaterialMode[schritt.id]} />
												{:else}
													<select name="materialId" class="h-10 w-full rounded-md border-green-300 text-sm" required={!isNewMaterialMode[schritt.id]}>
														<option value="" disabled selected>Material wählen...</option>
														{#each availableMaterials as m}<option value={m.id}>{m.name} ({m.einheit})</option>{/each}
													</select>
												{/if}

												<input type="number" step="0.01" name="menge" placeholder="Menge" class="h-10 w-full rounded-md border-green-300 text-sm" required />

												<div class="grid grid-cols-2 gap-3 pt-2">
													<button type="button" onclick={() => toggleMaterialRequestForm(schritt.id)} class="h-10 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700">Abbrechen</button>
													<button class="h-10 rounded-md bg-green-600 text-sm font-bold text-white shadow">Anfordern</button>
												</div>
											</form>
										</div>
									{/if}
								{/if}

								{#if canManage}
									<div class="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
										{#if !isStepFinished}
											<button onclick={() => toggleMaterialForm(schritt.id)} class="rounded bg-green-100 px-2 py-1 text-xs text-green-700">➕ Material</button>
										{/if}
										<button onclick={() => openEditModal(schritt)} class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">✎ Bearbeiten</button>
										<form action="?/deleteSchritt" method="POST" onsubmit={(e) => !confirm('Löschen?') && e.preventDefault()} class="ml-auto"><input type="hidden" name="schrittId" value={schritt.id} /><button class="text-xs text-red-600 underline">Löschen</button></form>
									</div>

									{#if showMaterialForm[schritt.id] && !isStepFinished}
										<div class="mb-4 rounded bg-gray-50 p-3">
											<form action="?/addMaterialToStep" method="POST" use:enhance class="space-y-2">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<input type="hidden" name="isNew" value={isNewMaterialMode[schritt.id] ? 'true' : 'false'} />
												<div class="flex justify-between"><span class="text-xs font-bold">Material hinzufügen</span><button type="button" onclick={() => toggleNewMaterialMode(schritt.id)} class="text-xs text-blue-600 underline">{isNewMaterialMode[schritt.id] ? 'Liste' : 'Neu'}</button></div>
												{#if isNewMaterialMode[schritt.id]}
													<input type="text" name="newMaterialName" placeholder="Name" class="w-full rounded text-sm" required />
													<input type="text" name="newMaterialUnit" placeholder="Einheit" class="w-full rounded text-sm" required />
												{:else}
													<select name="materialId" class="w-full rounded text-sm" required><option value="" disabled selected>Wählen...</option>{#each availableMaterials as m}<option value={m.id}>{m.name}</option>{/each}</select>
												{/if}
												<input type="number" step="0.01" name="menge" placeholder="Menge" class="w-full rounded text-sm" required />
												<button class="w-full rounded bg-green-600 py-1 text-xs text-white">Hinzufügen</button>
											</form>
										</div>
									{/if}
								{/if}

								{#if (isInnendienst || isHandwerker) && schritt.pendingUpdates?.length > 0}
									<div class="mb-4 space-y-2">
										{#each schritt.pendingUpdates as update}
											<div class="rounded border border-orange-200 bg-orange-50 p-3 text-sm">
												<div class="flex justify-between"><span class="text-xs font-bold uppercase text-orange-800">{getUpdateTypLabel(update.typ)}</span><span class="text-xs text-gray-500">{formatDateTime(update.eingereichtAm)}</span></div>
												<p class="text-xs text-gray-600 mb-2">Von: {update.bearbeiterName}</p>
												{#if update.typ === 'STATUS_AENDERUNG'}
													{#if update.neuerStatus}<div>Status: <b>{getStatusLabel(update.neuerStatus)}</b></div>{/if}
													{#if update.neuerFortschritt}<div>Fortschritt: <b>{update.neuerFortschritt}%</b></div>{/if}
												{:else if update.typ === 'MATERIAL_ANFORDERUNG'}
													<div class="bg-white p-2 rounded border border-orange-100"><b>{update.menge} {update.materialEinheit}</b> {update.materialName}</div>
												{:else if update.typ === 'NOTIZ'}<div class="italic bg-white p-2 rounded">{update.notizText}</div>
												{:else if update.typ === 'FOTO_UPLOAD' && update.bild}<img src={update.bild.url} alt="Bild" class="h-16 w-16 object-cover rounded" />{/if}

												{#if isInnendienst}
													<div class="mt-2 flex gap-2">
														<form action="?/approveUpdate" method="POST" use:enhance><input type="hidden" name="updateId" value={update.id} /><button class="rounded bg-green-600 px-3 py-1 text-xs text-white">Genehmigen</button></form>
														<form action="?/rejectUpdate" method="POST" use:enhance><input type="hidden" name="updateId" value={update.id} /><button class="rounded bg-red-100 px-3 py-1 text-xs text-red-700">Ablehnen</button></form>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}

								{#if schritt.beschreibung}<p class="mb-4 text-sm text-gray-600">{schritt.beschreibung}</p>{/if}

								{#if schritt.material.length > 0}
									<div class="mb-4">
										<p class="mb-2 text-xs font-bold uppercase text-gray-500">Materialliste:</p>
										<div class="flex flex-col gap-2">
											{#each schritt.material as mat}
												<div class="rounded border bg-white p-2 text-sm shadow-sm">

													{#if editingMaterialId === mat.linkId && !isStepFinished}
														<form action="?/updateMaterialInStep" method="POST" use:enhance={() => {
                                                 return async ({ update }) => { await update(); cancelEditMaterial(); };
                                             }} class="flex items-center gap-2 w-full">
															<input type="hidden" name="linkId" value={mat.linkId} />
															<div class="flex-1 font-medium text-gray-800">{mat.name}</div>
															<input type="number" step="0.01" name="menge" value={mat.menge} class="w-16 rounded border-gray-300 p-1 text-sm text-right" autofocus />
															<span class="text-xs text-gray-500 w-8">{mat.einheit}</span>
															<button class="rounded bg-green-100 p-1 text-green-700">
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
															</button>
															<button type="button" onclick={cancelEditMaterial} class="rounded bg-gray-100 p-1 text-gray-600">
																<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
															</button>
														</form>

													{:else}
														<div class="flex items-center justify-between">
															<div class="font-medium text-gray-800">{mat.name}</div>
															<div class="flex items-center gap-3">
																<span class="text-gray-500">{mat.menge} {mat.einheit}</span>

																{#if canManage && mat.linkId && !isStepFinished}
																	<div class="flex items-center border-l border-gray-200 pl-2 gap-2">
																		<button onclick={() => startEditMaterial(mat.linkId!)} class="text-blue-500 hover:text-blue-700">
																			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>
																		</button>
																		<form action="?/removeMaterialFromStep" method="POST" use:enhance>
																			<input type="hidden" name="linkId" value={mat.linkId} />
																			<button class="text-red-400 hover:text-red-600">
																				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" /></svg>
																			</button>
																		</form>
																	</div>
																{/if}
															</div>
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								{/if}

								{#if schritt.bilder.length > 0}
									<div class="grid grid-cols-3 gap-2 sm:grid-cols-4 mb-4">
										{#each schritt.bilder as bild}<img src={bild.url} alt="Foto" class="aspect-square w-full rounded object-cover" onclick={() => openLightbox(bild.url, bild.beschreibung)} />{/each}
									</div>
								{/if}

								{#if isStaff}
									<div class="border-t pt-3"><form action="?/uploadBild" method="POST" enctype="multipart/form-data" use:enhance class="flex flex-col gap-2"><input type="hidden" name="schrittId" value={schritt.id} /><input type="file" name="bild" class="text-sm" required /><button class="rounded bg-blue-600 py-2 text-sm text-white">Foto hochladen</button></form></div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
