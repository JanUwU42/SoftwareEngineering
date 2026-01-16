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
		allMaterials?: Material[];
	}

	let { schritte, isStaff = false, userRole, allMaterials = [] }: Props = $props();

	const canManage = $derived(isStaff && (userRole === 'ADMIN' || userRole === 'INNENDIENST'));
	const isHandwerker = $derived(userRole === 'HANDWERKER');
	const isInnendienst = $derived(userRole === 'ADMIN' || userRole === 'INNENDIENST');
	const sortierteSchritte = $derived([...schritte].sort((a, b) => a.reihenfolge - b.reihenfolge));

	let expandedSteps = new SvelteSet<string>();
	let lightboxImage = $state<{ url: string; beschreibung?: string } | null>(null);
	let editModal: HTMLDialogElement;
	let editingStep = $state<ProjectStep | null>(null);

	let showUpdateForm = $state<Record<string, boolean>>({});
	let showNotizForm = $state<Record<string, boolean>>({});
	let showMaterialForm = $state<Record<string, boolean>>({});
	let showMaterialRequestForm = $state<Record<string, boolean>>({});

	let isNewMaterialMode = $state<Record<string, boolean>>({});

	let editingMaterialId = $state<string | null>(null);

	function toggleStep(stepId: string) {
		if (expandedSteps.has(stepId)) expandedSteps.delete(stepId);
		else expandedSteps.add(stepId);
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

	function toggleUpdateForm(id: string) {
		showUpdateForm[id] = !showUpdateForm[id];
	}
	function toggleNotizForm(id: string) {
		showNotizForm[id] = !showNotizForm[id];
	}
	function toggleMaterialForm(id: string) {
		showMaterialForm[id] = !showMaterialForm[id];
		isNewMaterialMode[id] = false;
	}
	function toggleMaterialRequestForm(id: string) {
		showMaterialRequestForm[id] = !showMaterialRequestForm[id];
		isNewMaterialMode[id] = false;
	}

	function toggleNewMaterialMode(id: string) {
		isNewMaterialMode[id] = !isNewMaterialMode[id];
	}

	function startEditMaterial(linkId: string) {
		editingMaterialId = linkId;
	}
	function cancelEditMaterial() {
		editingMaterialId = null;
	}

	function toInputDate(date: Date) {
		return date.toISOString().split('T')[0];
	}
	function formatDate(date: Date) {
		return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
	function formatDateTime(str: string) {
		return new Date(str).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusStyles(status: string) {
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
	function getStatusIcon(status: string) {
		return status === 'fertig' ? '✓' : status === 'in_arbeit' ? '⚙' : '○';
	}
	function getUpdateTypLabel(typ: string) {
		if (typ === 'STATUS_AENDERUNG') return 'Status';
		if (typ === 'FOTO_UPLOAD') return 'Foto';
		if (typ === 'MATERIAL_ANFORDERUNG') return 'Material';
		return 'Notiz';
	}
</script>

{#if lightboxImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		onclick={closeLightbox}
		onkeydown={(e) => e.key === 'Escape' && closeLightbox()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button type="button" class="absolute top-4 right-4 text-3xl text-white" onclick={closeLightbox}
			>✕</button
		>
		<div
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<img
				src={lightboxImage.url}
				alt={lightboxImage.beschreibung}
				class="max-h-[85vh] max-w-full rounded-lg"
			/>{#if lightboxImage.beschreibung}<p class="mt-2 text-center text-white">
					{lightboxImage.beschreibung}
				</p>{/if}
		</div>
	</div>
{/if}

<dialog
	bind:this={editModal}
	class="m-auto w-full max-w-lg rounded-xl border-0 p-0 shadow-2xl backdrop:bg-black/50"
>
	{#if editingStep}
		<div class="p-6">
			<h3 class="mb-4 text-lg font-bold">Schritt bearbeiten</h3>
			<form action="?/updateSchritt" method="POST" class="space-y-4">
				<input type="hidden" name="schrittId" value={editingStep.id} />
				<input
					type="text"
					name="titel"
					value={editingStep.titel}
					class="w-full rounded-md border-gray-300"
				/>
				<div class="grid grid-cols-2 gap-4">
					<select name="status" value={editingStep.status} class="w-full rounded-md border-gray-300"
						><option value="offen">Offen</option><option value="in_arbeit">In Arbeit</option><option
							value="fertig">Fertig</option
						></select
					>
					<input
						type="number"
						name="fortschritt"
						value={editingStep.fortschritt}
						class="w-full rounded-md border-gray-300"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<input
						type="date"
						name="startDatum"
						value={toInputDate(editingStep.startDatum)}
						class="w-full rounded-md border-gray-300"
					/>
					<input
						type="date"
						name="endDatum"
						value={toInputDate(editingStep.endDatum)}
						class="w-full rounded-md border-gray-300"
					/>
				</div>
				<div class="mt-6 flex justify-end gap-2">
					<button
						type="button"
						onclick={() => editModal.close()}
						class="rounded bg-gray-100 px-4 py-2">Abbrechen</button
					><button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white">Speichern</button>
				</div>
			</form>
		</div>
	{/if}
</dialog>

<div class="rounded-xl bg-white p-6 shadow-md">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<h2 class="text-2xl font-bold text-gray-800">Projektzeitstrahl</h2>
		<div class="flex gap-2">
			<button onclick={expandAll} class="rounded bg-gray-100 px-3 py-1.5 text-sm"
				>Alle aufklappen</button
			><button onclick={collapseAll} class="rounded bg-gray-100 px-3 py-1.5 text-sm"
				>Alle zuklappen</button
			>
		</div>
	</div>

	<div class="relative">
		<div class="absolute top-0 left-6 h-full w-0.5 bg-gray-200"></div>
		<div class="space-y-4">
			{#each sortierteSchritte as schritt (schritt.id)}
				{@const styles = getStatusStyles(schritt.status)}
				{@const expanded = isExpanded(schritt.id)}
				{@const availableMaterials = allMaterials.filter(
					(m) => !schritt.material.some((sm) => sm.id === m.id)
				)}
				{@const isStepFinished = schritt.status === 'fertig'}

				<div class="relative flex gap-4">
					<div
						class="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white text-xl text-white shadow-md {styles.dotColor}"
					>
						{getStatusIcon(schritt.status)}
					</div>
					<div
						class="flex-1 overflow-hidden rounded-lg border {styles.borderColor} {styles.bgColor}"
					>
						<button
							onclick={() => toggleStep(schritt.id)}
							class="flex w-full items-start justify-between gap-2 p-4 text-left hover:bg-white/50"
						>
							<div class="flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<h3 class="text-lg font-semibold text-gray-900">
										{schritt.reihenfolge}. {schritt.titel}
									</h3>
									<span
										class="rounded-full border px-2.5 py-0.5 text-xs {styles.bgColor} {styles.textColor} {styles.borderColor}"
										>{getStatusLabel(schritt.status)}</span
									>
									{#if schritt.bilder.length > 0}<span
											class="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-700"
											>📷 {schritt.bilder.length}</span
										>{/if}
									{#if schritt.material.length > 0}<span
											class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700"
											>📦 {schritt.material.length}</span
										>{/if}
									{#if (isInnendienst || isHandwerker) && schritt.pendingUpdates && schritt.pendingUpdates.length > 0}
										<span class="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs text-orange-700"
											>⏳ {schritt.pendingUpdates.length} Ausstehend</span
										>
									{/if}
								</div>
								<div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
									<span>{formatDate(schritt.startDatum)} – {formatDate(schritt.endDatum)}</span
									><span class={styles.textColor}>{schritt.fortschritt}%</span>
								</div>
							</div>
							<svg
								class="h-5 w-5 text-gray-400 transition-transform {expanded ? 'rotate-180' : ''}"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/></svg
							>
						</button>

						{#if expanded}
							<div class="border-t p-4 {styles.borderColor} bg-white/30">
								{#if canManage}
									<div class="mb-4 flex justify-end gap-2 border-b border-gray-200 pb-2">
										{#if !isStepFinished}
											<button
												onclick={() => toggleMaterialForm(schritt.id)}
												class="flex gap-1 rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
												>➕ Material</button
											>
										{/if}
										<button
											onclick={() => openEditModal(schritt)}
											class="flex gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
											>✎ Bearbeiten</button
										>
										<form
											action="?/deleteSchritt"
											method="POST"
											onsubmit={(e) => !confirm('Löschen?') && e.preventDefault()}
										>
											<input type="hidden" name="schrittId" value={schritt.id} /><button
												class="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
												>🗑 Löschen</button
											>
										</form>
									</div>

									{#if showMaterialForm[schritt.id] && !isStepFinished}
										<div
											class="mb-4 rounded border border-green-200 bg-green-50 p-4"
											transition:slide
										>
											<form
												action="?/addMaterialToStep"
												method="POST"
												use:enhance
												class="grid grid-cols-1 gap-3 sm:grid-cols-3"
											>
												<input type="hidden" name="schrittId" value={schritt.id} />
												<input
													type="hidden"
													name="isNew"
													value={isNewMaterialMode[schritt.id] ? 'true' : 'false'}
												/>

												<div class="mb-1 flex items-center justify-between sm:col-span-3">
													<span class="text-xs font-bold text-green-800">Material hinzufügen</span>
													<button
														type="button"
														onclick={() => toggleNewMaterialMode(schritt.id)}
														class="text-xs text-blue-600 underline"
													>
														{isNewMaterialMode[schritt.id]
															? 'Aus Liste wählen'
															: 'Neues Material anlegen'}
													</button>
												</div>

												{#if isNewMaterialMode[schritt.id]}
													<div class="grid grid-cols-2 gap-2 sm:col-span-2">
														<input
															type="text"
															name="newMaterialName"
															placeholder="Bezeichnung (z.B. Spezialkleber)"
															class="w-full rounded text-sm"
															required={isNewMaterialMode[schritt.id]}
														/>
														<input
															type="text"
															name="newMaterialUnit"
															placeholder="Einheit (z.B. Dose)"
															class="w-full rounded text-sm"
															required={isNewMaterialMode[schritt.id]}
														/>
													</div>
												{:else}
													<div class="sm:col-span-2">
														<select
															name="materialId"
															class="w-full rounded text-sm"
															required={!isNewMaterialMode[schritt.id]}
														>
															<option value="" disabled selected>Wählen...</option>
															{#each availableMaterials as m (m.id)}
																<option value={m.id}
																	>{m.name} (Bestand: {m.bestand} {m.einheit})</option
																>
															{/each}
														</select>
													</div>
												{/if}

												<div>
													<input
														type="number"
														step="0.01"
														name="menge"
														placeholder="Menge"
														class="w-full rounded text-sm"
														required
													/>
												</div>

												<div class="flex justify-end gap-2 sm:col-span-3">
													<button
														type="button"
														onclick={() => toggleMaterialForm(schritt.id)}
														class="text-xs text-gray-500">Abbrechen</button
													>
													<button
														class="rounded bg-green-600 px-3 py-1 text-xs text-white"
														disabled={!isNewMaterialMode[schritt.id] &&
															availableMaterials.length === 0}>Hinzufügen</button
													>
												</div>
											</form>
										</div>
									{/if}
								{/if}

								{#if isHandwerker && !isStepFinished}
									<div class="mb-4 flex flex-wrap gap-2">
										<button
											onclick={() => toggleUpdateForm(schritt.id)}
											class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
											>Status Update</button
										>
										<button
											onclick={() => toggleNotizForm(schritt.id)}
											class="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700 hover:bg-yellow-200"
											>Notiz</button
										>
										<button
											onclick={() => toggleMaterialRequestForm(schritt.id)}
											class="flex items-center gap-1 rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												class="h-3 w-3"
												><path
													d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
												/></svg
											>
											Material anfordern
										</button>
									</div>

									{#if showUpdateForm[schritt.id]}<div
											class="mb-4 rounded border border-blue-100 bg-blue-50 p-3"
										>
											<form action="?/submitUpdate" method="POST" use:enhance class="space-y-2">
												<input type="hidden" name="schrittId" value={schritt.id} /><select
													name="status"
													class="w-full rounded text-sm"
													><option value="">Status...</option><option value="offen">Offen</option
													><option value="in_arbeit">In Arbeit</option><option value="fertig"
														>Fertig</option
													></select
												><input
													type="number"
													name="fortschritt"
													placeholder="%"
													class="w-full rounded text-sm"
												/><button class="w-full rounded bg-blue-600 py-1 text-xs text-white"
													>Senden</button
												>
											</form>
										</div>{/if}

									{#if showNotizForm[schritt.id]}<div
											class="mb-4 rounded border border-yellow-100 bg-yellow-50 p-3"
										>
											<form action="?/addNotiz" method="POST" use:enhance class="space-y-2">
												<input type="hidden" name="schrittId" value={schritt.id} /><textarea
													name="text"
													class="w-full rounded text-sm"
													placeholder="Notiz..."
												></textarea><button
													class="w-full rounded bg-yellow-600 py-1 text-xs text-white"
													>Senden</button
												>
											</form>
										</div>{/if}

									{#if showMaterialRequestForm[schritt.id]}
										<div
											class="mb-4 rounded border border-green-100 bg-green-50 p-3"
											transition:slide
										>
											<form action="?/submitUpdate" method="POST" use:enhance class="space-y-2">
												<input type="hidden" name="schrittId" value={schritt.id} />
												<input
													type="hidden"
													name="isNew"
													value={isNewMaterialMode[schritt.id] ? 'true' : 'false'}
												/>

												<div class="mb-1 flex items-center justify-between">
													<h4 class="text-xs font-bold text-green-800">Material anfordern</h4>
													<button
														type="button"
														onclick={() => toggleNewMaterialMode(schritt.id)}
														class="text-xs text-blue-600 underline"
													>
														{isNewMaterialMode[schritt.id]
															? 'Aus Liste wählen'
															: 'Nicht gefunden? Neu anlegen'}
													</button>
												</div>

												<div class="grid grid-cols-3 gap-2">
													{#if isNewMaterialMode[schritt.id]}
														<div class="col-span-2 grid grid-cols-2 gap-1">
															<input
																type="text"
																name="newMaterialName"
																placeholder="Name"
																class="w-full rounded border-green-300 text-sm"
																required={isNewMaterialMode[schritt.id]}
															/>
															<input
																type="text"
																name="newMaterialUnit"
																placeholder="Einheit"
																class="w-full rounded border-green-300 text-sm"
																required={isNewMaterialMode[schritt.id]}
															/>
														</div>
													{:else}
														<div class="col-span-2">
															<select
																name="materialId"
																class="w-full rounded border-green-300 text-sm"
																required={!isNewMaterialMode[schritt.id]}
															>
																<option value="" disabled selected>Material wählen...</option>
																{#each availableMaterials as m (m.id)}
																	<option value={m.id}>{m.name} ({m.einheit})</option>
																{/each}
															</select>
															{#if availableMaterials.length === 0}
																<p class="mt-1 text-[10px] text-red-500">Liste leer.</p>
															{/if}
														</div>
													{/if}
													<div>
														<input
															type="number"
															step="0.01"
															name="menge"
															placeholder="Menge"
															class="w-full rounded border-green-300 text-sm"
															required
														/>
													</div>
												</div>
												<div class="flex justify-end gap-2">
													<button
														type="button"
														onclick={() => toggleMaterialRequestForm(schritt.id)}
														class="text-xs text-gray-500">Abbrechen</button
													>
													<button
														class="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700"
														disabled={!isNewMaterialMode[schritt.id] &&
															availableMaterials.length === 0}>Anfordern</button
													>
												</div>
											</form>
										</div>
									{/if}
								{/if}

								{#if (isInnendienst || isHandwerker) && schritt.pendingUpdates && schritt.pendingUpdates.length > 0}
									<div class="mb-4 space-y-2">
										{#each schritt.pendingUpdates as update (update.id)}
											<div class="rounded border border-orange-200 bg-orange-50 p-2 text-sm">
												<div class="mb-1 flex items-start justify-between">
													<span class="text-xs font-bold text-orange-800 uppercase"
														>{getUpdateTypLabel(update.typ)}</span
													>
													<span class="text-xs text-orange-400"
														>{formatDateTime(update.eingereichtAm)}</span
													>
												</div>
												<p class="mb-2 text-xs text-gray-700">Von: {update.bearbeiterName}</p>

												{#if update.typ === 'STATUS_AENDERUNG'}
													{#if update.neuerStatus}<div class="text-xs">
															Status: <b>{getStatusLabel(update.neuerStatus)}</b>
														</div>{/if}
													{#if update.neuerFortschritt}<div class="text-xs">
															Fortschritt: <b>{update.neuerFortschritt}%</b>
														</div>{/if}
												{:else if update.typ === 'MATERIAL_ANFORDERUNG'}
													<div class="rounded border border-orange-100 bg-white p-1 text-xs">
														Anforderung: <b>{update.menge} {update.materialEinheit}</b>
														{update.materialName}
													</div>
												{:else if update.typ === 'NOTIZ'}
													<div class="rounded border border-orange-100 bg-white p-1 text-xs italic">
														{update.notizText}
													</div>
												{:else if update.typ === 'FOTO_UPLOAD' && update.bild}
													<img
														src={update.bild.url}
														alt="Vorschau"
														class="h-12 w-12 rounded object-cover"
													/>
												{/if}

												{#if isInnendienst}
													<div class="mt-2 flex gap-2">
														<form action="?/approveUpdate" method="POST" use:enhance>
															<input type="hidden" name="updateId" value={update.id} /><button
																class="rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700"
																>Genehmigen</button
															>
														</form>
														<form action="?/rejectUpdate" method="POST" use:enhance>
															<input type="hidden" name="updateId" value={update.id} /><button
																class="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 hover:bg-red-200"
																>Ablehnen</button
															>
														</form>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}

								{#if schritt.beschreibung}<p class="mb-4 text-gray-600">
										{schritt.beschreibung}
									</p>{/if}
								<div class="mb-4">
									<div class="mb-1 flex justify-between text-sm">
										<span>Fortschritt</span><span class="font-medium">{schritt.fortschritt}%</span>
									</div>
									<div class="h-2 rounded-full bg-gray-200">
										<div
											class="h-full {styles.progressBarColor}"
											style="width: {schritt.fortschritt}%"
										></div>
									</div>
								</div>

								{#if schritt.material.length > 0}
									<div class="mb-4">
										<p class="mb-2 text-sm font-medium">Material:</p>
										<div class="flex flex-wrap gap-2">
											{#each schritt.material as mat (mat.id)}
												<div
													class="inline-flex items-center gap-2 rounded border bg-white px-2 py-1 text-xs shadow-sm"
												>
													<span class="font-medium text-gray-700">{mat.name}</span>
													{#if editingMaterialId === mat.linkId && !isStepFinished}
														<form
															action="?/updateMaterialInStep"
															method="POST"
															use:enhance={() => {
																return async ({ update }) => {
																	await update();
																	cancelEditMaterial();
																};
															}}
															class="flex items-center gap-1"
														>
															<input type="hidden" name="linkId" value={mat.linkId} />
															<input
																type="number"
																step="0.01"
																name="menge"
																value={mat.menge}
																class="h-6 w-16 rounded border-gray-300 px-1 py-0 text-xs"
															/>
															<span class="text-gray-500">{mat.einheit}</span>
															<button class="rounded bg-green-50 p-0.5 text-green-600">✓</button>
															<button
																type="button"
																onclick={cancelEditMaterial}
																class="px-1 text-gray-400">✕</button
															>
														</form>
													{:else}
														<span class="text-gray-500">({mat.menge} {mat.einheit})</span>
														{#if canManage && mat.linkId && !isStepFinished}
															<div
																class="ml-1 flex items-center gap-1 border-l border-gray-200 pl-1"
															>
																<button
																	onclick={() => startEditMaterial(mat.linkId!)}
																	class="p-0.5 text-blue-400 hover:text-blue-600">✎</button
																>
																<form
																	action="?/removeMaterialFromStep"
																	method="POST"
																	use:enhance
																	class="inline-flex"
																>
																	<input type="hidden" name="linkId" value={mat.linkId} />
																	<button class="p-0.5 text-red-400 hover:text-red-600">🗑</button>
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
									<div class="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
										{#each schritt.bilder as bild (bild.id)}
											<div class="group relative aspect-square overflow-hidden rounded bg-gray-100">
												<button
													type="button"
													class="h-full w-full cursor-pointer overflow-hidden border-0 bg-transparent p-0"
													onclick={() => openLightbox(bild.url, bild.beschreibung)}
												>
													<img src={bild.url} alt="Foto" class="h-full w-full object-cover" />
												</button>
												{#if canManage}<form
														action="?/deleteBild"
														method="POST"
														class="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
													>
														<input type="hidden" name="bildId" value={bild.id} /><button
															class="rounded-full bg-red-600 p-1 text-xs text-white">🗑</button
														>
													</form>{/if}
											</div>
										{/each}
									</div>
								{/if}

								{#if isStaff}
									<div class="rounded border-t bg-white/50 p-2 pt-3">
										<form
											action="?/uploadBild"
											method="POST"
											enctype="multipart/form-data"
											use:enhance
											class="flex gap-2"
										>
											<input type="hidden" name="schrittId" value={schritt.id} /><input
												type="file"
												name="bild"
												class="text-xs"
												required
											/><input
												type="text"
												name="beschreibung"
												placeholder="Beschreibung"
												class="flex-1 rounded border text-xs"
											/><button class="rounded bg-blue-600 px-2 py-1 text-xs text-white"
												>Upload</button
											>
										</form>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
