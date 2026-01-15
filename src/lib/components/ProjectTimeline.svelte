<script lang="ts">
	import type { ProjectStep, PendingUpdate } from '$lib/types/project';
	import { getStatusLabel } from '$lib/types/project';
	import { enhance } from '$app/forms';

	// 1. Definition der Props
	interface Props {
		schritte: ProjectStep[];
		isStaff?: boolean;
		userRole?: 'ADMIN' | 'INNENDIENST' | 'HANDWERKER' | undefined;
		userId?: string;
	}

	// 2. Props entgegennehmen
	let { schritte, isStaff = false, userRole, userId }: Props = $props();

	// 3. Berechnungen basierend auf den Props
	const canManage = $derived(isStaff && (userRole === 'ADMIN' || userRole === 'INNENDIENST'));
	const isHandwerker = $derived(userRole === 'HANDWERKER');
	const isInnendienst = $derived(userRole === 'ADMIN' || userRole === 'INNENDIENST');

	// Sortierung
	const sortierteSchritte = $derived([...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge));

	// State
	import { SvelteSet } from 'svelte/reactivity';

	let expandedSteps = new SvelteSet<string>();
	let lightboxImage = $state<{ url: string; beschreibung?: string } | null>(null);
	let editModal: HTMLDialogElement;
	let editingStep = $state<ProjectStep | null>(null);
	
	// Handwerker form state
	let showUpdateForm = $state<Record<string, boolean>>({});
	let showNotizForm = $state<Record<string, boolean>>({});

	// --- HELPER FUNKTIONEN ---

	function toggleStep(stepId: string) {
		if (expandedSteps.has(stepId)) {
			expandedSteps.delete(stepId);
		} else {
			expandedSteps.add(stepId);
		}
	}

	function isExpanded(stepId: string): boolean {
		return expandedSteps.has(stepId);
	}

	function expandAll() {
		sortierteSchritte.forEach((s) => expandedSteps.add(s.id));
	}

	function collapseAll() {
		expandedSteps.clear();
	}

	function openLightbox(url: string, beschreibung?: string) {
		lightboxImage = { url, beschreibung };
	}

	function closeLightbox() {
		lightboxImage = null;
	}

	function openEditModal(step: ProjectStep) {
		editingStep = step;
		editModal.showModal();
	}

	function toInputDate(date: Date): string {
		try {
			return date.toISOString().split('T')[0];
		} catch {
			return '';
		}
	}

	function formatDate(date: Date): string {
		try {
			return date.toLocaleDateString('de-DE', {
				day: '2-digit', month: '2-digit', year: 'numeric'
			});
		} catch {
			return 'Ungültiges Datum';
		}
	}

	function formatDateTime(dateString: string): string {
		try {
			return new Date(dateString).toLocaleString('de-DE', {
				day: '2-digit', month: '2-digit', year: 'numeric',
				hour: '2-digit', minute: '2-digit'
			});
		} catch {
			return 'Ungültiges Datum';
		}
	}

	function getStatusStyles(status: ProjectStep['status']) {
		switch (status) {
			case 'fertig': return { bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', dotColor: 'bg-green-500', progressBarColor: 'bg-green-500' };
			case 'in_arbeit': return { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', dotColor: 'bg-blue-500', progressBarColor: 'bg-blue-500' };
			default: return { bgColor: 'bg-gray-50', textColor: 'text-gray-600', borderColor: 'border-gray-200', dotColor: 'bg-gray-400', progressBarColor: 'bg-gray-400' };
		}
	}

	function getStatusIcon(status: ProjectStep['status']): string {
		switch (status) {
			case 'fertig': return '✓';
			case 'in_arbeit': return '⚙';
			default: return '○';
		}
	}

	function getUpdateTypLabel(typ: PendingUpdate['typ']): string {
		switch (typ) {
			case 'STATUS_AENDERUNG': return 'Status-Update';
			case 'FOTO_UPLOAD': return 'Foto-Upload';
			case 'NOTIZ': return 'Notiz';
		}
	}

	function toggleUpdateForm(stepId: string) {
		showUpdateForm = { ...showUpdateForm, [stepId]: !showUpdateForm[stepId] };
	}

	function toggleNotizForm(stepId: string) {
		showNotizForm = { ...showNotizForm, [stepId]: !showNotizForm[stepId] };
	}
</script>

{#if lightboxImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		onclick={closeLightbox}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button
			type="button"
			class="absolute top-4 right-4 text-3xl text-white hover:text-gray-300 focus:outline-none"
			onclick={closeLightbox}
			aria-label="Schließen"
		>✕</button>
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

<dialog bind:this={editModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-lg backdrop:bg-black/50">
	{#if editingStep}
		<div class="p-6">
			<h3 class="text-lg font-bold mb-4">Schritt bearbeiten</h3>
			<form action="?/updateSchritt" method="POST" class="space-y-4">
				<input type="hidden" name="schrittId" value={editingStep.id} />

				<div>
					<label for="edit-titel" class="block text-sm font-medium text-gray-700">Titel</label>
					<input id="edit-titel" type="text" name="titel" value={editingStep.titel} class="w-full border-gray-300 rounded-md" required />
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-status" class="block text-sm font-medium text-gray-700">Status</label>
						<select id="edit-status" name="status" value={editingStep.status} class="w-full border-gray-300 rounded-md">
							<option value="offen">Offen</option>
							<option value="in_arbeit">In Arbeit</option>
							<option value="fertig">Fertig</option>
						</select>
					</div>
					<div>
						<label for="edit-fortschritt" class="block text-sm font-medium text-gray-700">Fortschritt (%)</label>
						<input id="edit-fortschritt" type="number" name="fortschritt" value={editingStep.fortschritt} min="0" max="100" class="w-full border-gray-300 rounded-md" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="edit-start" class="block text-sm font-medium text-gray-700">Start</label>
						<input id="edit-start" type="date" name="startDatum" value={toInputDate(editingStep.startDatum)} class="w-full border-gray-300 rounded-md" required />
					</div>
					<div>
						<label for="edit-end" class="block text-sm font-medium text-gray-700">Ende</label>
						<input id="edit-end" type="date" name="endDatum" value={toInputDate(editingStep.endDatum)} class="w-full border-gray-300 rounded-md" required />
					</div>
				</div>

				<div class="flex justify-end gap-2 mt-6">
					<button type="button" onclick={() => editModal.close()} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
					<button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Speichern</button>
				</div>
			</form>
		</div>
	{/if}
</dialog>

<div class="rounded-xl bg-white p-6 shadow-md">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-2xl font-bold text-gray-800">Projektzeitstrahl</h2>
		<div class="flex gap-2">
			<button onclick={expandAll} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">Alle aufklappen</button>
			<button onclick={collapseAll} class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">Alle zuklappen</button>
		</div>
	</div>

	<div class="relative">
		<div class="absolute top-0 left-6 h-full w-0.5 bg-gray-200"></div>

		<div class="space-y-4">
			{#each sortierteSchritte as schritt (schritt.id)}
				{@const styles = getStatusStyles(schritt.status)}
				{@const expanded = isExpanded(schritt.id)}
				{@const hasPendingUpdates = schritt.pendingUpdates && schritt.pendingUpdates.length > 0}
				<div class="relative flex gap-4">
					<div class="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-xl text-white shadow-md {styles.dotColor}">
						{getStatusIcon(schritt.status)}
					</div>

					<div class="flex-1 overflow-hidden rounded-lg border {styles.borderColor} {styles.bgColor}">
						<button
							onclick={() => toggleStep(schritt.id)}
							class="flex w-full items-start justify-between gap-2 p-4 text-left hover:bg-white/50 focus:outline-none"
						>
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-gray-900">
										{schritt.reihenfolge}. {schritt.titel}
									</h3>
									<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium {styles.bgColor} {styles.textColor} {styles.borderColor}">
										{getStatusLabel(schritt.status)}
									</span>
									{#if schritt.bilder.length > 0}
										<span class="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
											📷 {schritt.bilder.length}
										</span>
									{/if}
									{#if hasPendingUpdates && isInnendienst}
										<span class="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
											⏳ {schritt.pendingUpdates?.length} ausstehend
										</span>
									{/if}
									{#if isHandwerker && schritt.pendingUpdates && schritt.pendingUpdates.filter(u => u.eingereichtVonId === userId).length > 0}
										<span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
											<svg class="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>
											{schritt.pendingUpdates.filter(u => u.eingereichtVonId === userId).length} eingereicht
										</span>
									{/if}
									{#if schritt.notizen && schritt.notizen.length > 0}
										<span class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
											📝 {schritt.notizen.length}
										</span>
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
									<span>{formatDate(schritt.startDatum)} – {formatDate(schritt.endDatum)}</span>
									<span class="font-medium {styles.textColor}">{schritt.fortschritt}%</span>
								</div>
							</div>
							<svg class="h-5 w-5 text-gray-400 transition-transform {expanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{#if expanded}
							<div class="border-t p-4 {styles.borderColor} bg-white/30">
								<!-- Admin/Innendienst Management Buttons -->
								{#if canManage}
									<div class="flex justify-end gap-2 mb-4 border-b border-gray-200 pb-2">
										<button
											onclick={() => openEditModal(schritt)}
											class="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
										>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
											Bearbeiten
										</button>
										<form action="?/deleteSchritt" method="POST" onsubmit={(e) => { if(!confirm('Schritt wirklich löschen?')) e.preventDefault(); }}>
											<input type="hidden" name="schrittId" value={schritt.id} />
											<button type="submit" class="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors">
												<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
												Löschen
											</button>
										</form>
									</div>
								{/if}

								<!-- Handwerker Action Buttons -->
								{#if isHandwerker}
									<div class="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-3">
										<button
											type="button"
											onclick={() => toggleUpdateForm(schritt.id)}
											class="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
											Status aktualisieren
										</button>
										<button
											type="button"
											onclick={() => toggleNotizForm(schritt.id)}
											class="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-yellow-200 flex items-center gap-1"
										>
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
											Notiz hinzufügen
										</button>
									</div>

									<!-- Handwerker Status Update Form -->
									{#if showUpdateForm[schritt.id]}
										<div class="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
											<h4 class="text-sm font-medium text-blue-900 mb-3">Status-Update einreichen</h4>
											<form action="?/submitUpdate" method="POST" use:enhance class="space-y-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<div class="grid grid-cols-2 gap-3">
													<div>
														<label for="status-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Neuer Status</label>
														<select id="status-{schritt.id}" name="status" class="w-full text-sm border-gray-300 rounded-md">
															<option value="">-- Nicht ändern --</option>
															<option value="offen">Offen</option>
															<option value="in_arbeit">In Arbeit</option>
															<option value="fertig">Fertig</option>
														</select>
													</div>
													<div>
														<label for="fortschritt-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Fortschritt (%)</label>
														<input id="fortschritt-{schritt.id}" type="number" name="fortschritt" min="0" max="100" placeholder={String(schritt.fortschritt)} class="w-full text-sm border-gray-300 rounded-md" />
													</div>
												</div>
												<div class="flex justify-end gap-2">
													<button type="button" onclick={() => toggleUpdateForm(schritt.id)} class="text-xs text-gray-600 hover:text-gray-800">Abbrechen</button>
													<button type="submit" class="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-700">Einreichen</button>
												</div>
											</form>
										</div>
									{/if}

									<!-- Handwerker Notiz Form -->
									{#if showNotizForm[schritt.id]}
										<div class="mb-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
											<h4 class="text-sm font-medium text-yellow-900 mb-3">Notiz hinzufügen</h4>
											<form action="?/addNotiz" method="POST" use:enhance class="space-y-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<div>
													<label for="notiz-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Ihre Notiz</label>
													<textarea id="notiz-{schritt.id}" name="text" rows="3" required placeholder="Beschreiben Sie den aktuellen Stand, Probleme oder sonstige Bemerkungen..." class="w-full text-sm border-gray-300 rounded-md"></textarea>
												</div>
												<div class="flex justify-end gap-2">
													<button type="button" onclick={() => toggleNotizForm(schritt.id)} class="text-xs text-gray-600 hover:text-gray-800">Abbrechen</button>
													<button type="submit" class="bg-yellow-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-yellow-700">Einreichen</button>
												</div>
											</form>
										</div>
									{/if}
								{/if}

								<!-- Handwerker's Own Pending Updates Section -->
								{#if isHandwerker && schritt.pendingUpdates && schritt.pendingUpdates.length > 0}
									{@const myUpdates = schritt.pendingUpdates.filter(u => u.eingereichtVonId === userId)}
									{#if myUpdates.length > 0}
										<div class="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
											<h4 class="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
												Ihre eingereichten Änderungen ({myUpdates.length})
												<span class="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Warten auf Freigabe</span>
											</h4>
											<div class="space-y-3">
												{#each myUpdates as update (update.id)}
													<div class="bg-white rounded-md p-3 border border-blue-100 shadow-sm">
														<div class="flex flex-wrap items-center gap-2 mb-2">
															<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
																{update.typ === 'STATUS_AENDERUNG' ? 'bg-blue-100 text-blue-800' : 
																 update.typ === 'FOTO_UPLOAD' ? 'bg-purple-100 text-purple-800' : 
																 'bg-yellow-100 text-yellow-800'}">
																{getUpdateTypLabel(update.typ)}
															</span>
															<span class="text-xs text-gray-400">{formatDateTime(update.eingereichtAm)}</span>
															<span class="inline-flex items-center gap-1 text-xs text-orange-600">
																<svg class="w-3.5 h-3.5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
																	<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
																</svg>
																Ausstehend
															</span>
														</div>

														{#if update.typ === 'STATUS_AENDERUNG'}
															<div class="text-sm text-gray-700">
																{#if update.neuerStatus}
																	<div class="flex items-center gap-2">
																		<span class="text-gray-500">Neuer Status:</span>
																		<span class="font-medium px-2 py-0.5 rounded bg-gray-100">{getStatusLabel(update.neuerStatus)}</span>
																	</div>
																{/if}
																{#if update.neuerFortschritt !== null}
																	<div class="flex items-center gap-2 mt-1">
																		<span class="text-gray-500">Neuer Fortschritt:</span>
																		<span class="font-medium">{update.neuerFortschritt}%</span>
																		<div class="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
																			<div class="h-full bg-blue-500 transition-all" style="width: {update.neuerFortschritt}%"></div>
																		</div>
																	</div>
																{/if}
															</div>
														{:else if update.typ === 'NOTIZ' && update.notizText}
															<p class="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2 border-l-2 border-yellow-400">{update.notizText}</p>
														{:else if update.typ === 'FOTO_UPLOAD' && update.bild}
															<div class="flex items-start gap-3">
																<button type="button" onclick={() => { if (update.bild) openLightbox(update.bild.url, update.bild.beschreibung ?? undefined); }} class="block shrink-0">
																	<img src={update.bild.url} alt={update.bild.beschreibung || 'Foto'} class="h-20 w-20 rounded-md object-cover hover:opacity-90 border border-gray-200" />
																</button>
																<div class="text-sm text-gray-600">
																	{#if update.bild.beschreibung}
																		<p class="font-medium">{update.bild.beschreibung}</p>
																	{/if}
																	<p class="text-xs text-gray-400 mt-1">Foto wartet auf Freigabe</p>
																</div>
															</div>
														{/if}
													</div>
												{/each}
											</div>
											<p class="text-xs text-blue-600 mt-3 flex items-center gap-1">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
												Diese Änderungen werden für den Kunden sichtbar, sobald sie vom Innendienst freigegeben wurden.
											</p>
										</div>
									{/if}
								{/if}

								<!-- Pending Updates Section for Innendienst -->
								{#if isInnendienst && schritt.pendingUpdates && schritt.pendingUpdates.length > 0}
									<div class="mb-4 bg-orange-50 rounded-lg p-4 border border-orange-200">
										<h4 class="text-sm font-medium text-orange-900 mb-3 flex items-center gap-2">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
											Ausstehende Aktualisierungen ({schritt.pendingUpdates.length})
										</h4>
										<div class="space-y-3">
											{#each schritt.pendingUpdates as update (update.id)}
												<div class="bg-white rounded-md p-3 border border-orange-100 shadow-sm">
													<div class="flex flex-wrap items-center gap-2 mb-2">
														<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
															{update.typ === 'STATUS_AENDERUNG' ? 'bg-blue-100 text-blue-800' : 
															 update.typ === 'FOTO_UPLOAD' ? 'bg-purple-100 text-purple-800' : 
															 'bg-yellow-100 text-yellow-800'}">
															{getUpdateTypLabel(update.typ)}
														</span>
														<span class="text-xs text-gray-500">von {update.bearbeiterName}</span>
														<span class="text-xs text-gray-400">{formatDateTime(update.eingereichtAm)}</span>
													</div>

													{#if update.typ === 'STATUS_AENDERUNG'}
														<div class="text-sm text-gray-700 mb-2">
															{#if update.neuerStatus}
																<p>Neuer Status: <strong>{getStatusLabel(update.neuerStatus)}</strong></p>
															{/if}
															{#if update.neuerFortschritt !== null}
																<p>Neuer Fortschritt: <strong>{update.neuerFortschritt}%</strong></p>
															{/if}
														</div>
													{:else if update.typ === 'NOTIZ' && update.notizText}
														<p class="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{update.notizText}</p>
													{:else if update.typ === 'FOTO_UPLOAD' && update.bild}
														<div class="mb-2">
															<button type="button" onclick={() => { if (update.bild) openLightbox(update.bild.url, update.bild.beschreibung ?? undefined); }} class="block">
																<img src={update.bild.url} alt={update.bild.beschreibung || 'Foto'} class="h-24 w-auto rounded-md object-cover hover:opacity-90" />
															</button>
															{#if update.bild.beschreibung}
																<p class="text-xs text-gray-500 mt-1">{update.bild.beschreibung}</p>
															{/if}
														</div>
													{/if}

													<div class="flex gap-2">
														<form action="?/approveUpdate" method="POST" use:enhance>
															<input type="hidden" name="updateId" value={update.id} />
															<button type="submit" class="bg-green-600 text-white px-2.5 py-1 rounded text-xs hover:bg-green-700 flex items-center gap-1">
																<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
																Genehmigen
															</button>
														</form>
														<form action="?/rejectUpdate" method="POST" use:enhance>
															<input type="hidden" name="updateId" value={update.id} />
															<button type="submit" class="bg-red-100 text-red-700 px-2.5 py-1 rounded text-xs hover:bg-red-200 flex items-center gap-1">
																<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
																Ablehnen
															</button>
														</form>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								{#if schritt.beschreibung}
									<p class="mb-4 text-gray-600">{schritt.beschreibung}</p>
								{/if}

								<div class="mb-4">
									<div class="mb-1 flex justify-between text-sm">
										<span class="text-gray-600">Fortschritt</span>
										<span class="font-medium {styles.textColor}">{schritt.fortschritt}%</span>
									</div>
									<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
										<div class="h-full transition-all {styles.progressBarColor}" style="width: {schritt.fortschritt}%"></div>
									</div>
								</div>

								{#if schritt.material.length > 0}
									<div class="mb-4">
										<p class="mb-2 text-sm font-medium text-gray-700">Benötigtes Material:</p>
										<div class="flex flex-wrap gap-2">
											{#each schritt.material as mat (mat.id)}
												<span class="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200 ring-inset">
													{mat.name}
													<span class="ml-1 text-gray-500">({mat.menge} {mat.einheit})</span>
												</span>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Notes Section -->
								{#if isStaff && schritt.notizen && schritt.notizen.length > 0}
									<div class="mb-4">
										<p class="mb-2 text-sm font-medium text-gray-700 flex items-center gap-2">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
											Notizen ({schritt.notizen.length})
										</p>
										<div class="space-y-2">
											{#each schritt.notizen as notiz (notiz.id)}
												<div class="bg-yellow-50 rounded-md p-3 border border-yellow-100">
													<p class="text-sm text-gray-700 whitespace-pre-wrap">{notiz.text}</p>
													<div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
														<span>{notiz.autorName} · {formatDateTime(notiz.erstelltAm)}</span>
														{#if canManage}
															<form action="?/toggleNotizSichtbarkeit" method="POST" use:enhance class="inline">
																<input type="hidden" name="notizId" value={notiz.id} />
																<button type="submit" class="inline-flex items-center gap-1 px-2 py-0.5 rounded {notiz.sichtbarFuerKunde ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} hover:opacity-80">
																	{#if notiz.sichtbarFuerKunde}
																		<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
																		Für Kunde sichtbar
																	{:else}
																		<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
																		Nur intern
																	{/if}
																</button>
															</form>
														{/if}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Photos Section -->
								<div>
									<p class="mb-2 text-sm font-medium text-gray-700">Fotos ({schritt.bilder.length}):</p>

									{#if schritt.bilder.length > 0}
										<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mb-4">
											{#each schritt.bilder as bild (bild.id)}
												<div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
													<button type="button" class="h-full w-full p-0 border-0 bg-transparent cursor-pointer" onclick={() => openLightbox(bild.url, bild.beschreibung)}>
														<img src={bild.url} alt={bild.beschreibung || 'Projektfoto'} class="h-full w-full object-cover transition-transform group-hover:scale-105" />
														<div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-left">
															<p class="truncate text-xs text-white">{bild.beschreibung || 'Foto'}</p>
															{#if bild.hochgeladenVon}
																<p class="truncate text-xs text-gray-300">{bild.hochgeladenVon}</p>
															{/if}
														</div>
													</button>
													{#if canManage}
														<form action="?/deleteBild" method="POST" class="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity" onsubmit={(e) => { if(!confirm('Bild wirklich löschen?')) e.preventDefault(); }}>
															<input type="hidden" name="bildId" value={bild.id} />
															<button type="submit" class="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-md" title="Bild löschen">
																<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
															</button>
														</form>
													{/if}
												</div>
											{/each}
										</div>
									{:else}
										<p class="text-sm text-gray-400 italic mb-4">Noch keine Fotos hochgeladen.</p>
									{/if}

									<!-- Photo Upload Form -->
									{#if isStaff}
										<div class="mt-4 border-t border-gray-200 pt-4 bg-white/50 rounded-md p-3">
											<form action="?/uploadBild" method="POST" enctype="multipart/form-data" use:enhance class="flex flex-col sm:flex-row items-end gap-3">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<div class="flex-1 w-full">
													<label for="file-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Neues Foto</label>
													<input id="file-{schritt.id}" type="file" name="bild" accept="image/*" required class="block w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
												</div>
												<div class="flex-1 w-full">
													<label for="desc-{schritt.id}" class="block text-xs font-medium text-gray-700 mb-1">Beschreibung</label>
													<input id="desc-{schritt.id}" type="text" name="beschreibung" placeholder="Was ist zu sehen?" class="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-1.5" />
												</div>
												<button type="submit" class="w-full sm:w-auto bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 flex items-center justify-center gap-1">
													<span>Hochladen</span>
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
												</button>
											</form>
											{#if isHandwerker}
												<p class="text-xs text-gray-500 mt-2 italic">Fotos werden vom Innendienst geprüft, bevor sie für den Kunden sichtbar sind.</p>
											{/if}
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
