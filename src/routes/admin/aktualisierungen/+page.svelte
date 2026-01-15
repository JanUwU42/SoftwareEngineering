<script lang="ts">
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	interface Update {
		id: string;
		typ: 'STATUS_AENDERUNG' | 'FOTO_UPLOAD' | 'NOTIZ';
		neuerStatus: string | null;
		neuerFortschritt: number | null;
		notizText: string | null;
		eingereichtAm: string;
		bearbeiter: { id: string; name: string };
		schritt: { id: string; titel: string; status: string; fortschritt: number };
		projekt: { id: string; bezeichnung: string; kundenname: string; auftragsnummer: string };
		bild: { id: string; url: string; beschreibung: string | null } | null;
	}

	interface Props {
		data: {
			updates: Update[];
		};
		form: { success?: boolean; message?: string } | null;
	}

	let { data, form }: Props = $props();

	let showMessage = $state(false);
	let messageText = $state('');
	let messageType = $state<'success' | 'error'>('success');
	let rejectModalOpen = $state(false);
	let rejectingUpdateId = $state<string | null>(null);
	let rejectReason = $state('');
	let lightboxImage = $state<{ url: string; beschreibung?: string } | null>(null);

	$effect(() => {
		if (form?.message) {
			messageText = form.message;
			messageType = form.success ? 'success' : 'error';
			showMessage = true;
			setTimeout(() => { showMessage = false; }, 3000);
		}
	});

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getTypLabel(typ: Update['typ']): string {
		switch (typ) {
			case 'STATUS_AENDERUNG': return 'Status-Update';
			case 'FOTO_UPLOAD': return 'Foto-Upload';
			case 'NOTIZ': return 'Notiz';
		}
	}

	function getTypColor(typ: Update['typ']): string {
		switch (typ) {
			case 'STATUS_AENDERUNG': return 'bg-blue-100 text-blue-800';
			case 'FOTO_UPLOAD': return 'bg-purple-100 text-purple-800';
			case 'NOTIZ': return 'bg-yellow-100 text-yellow-800';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'offen': return 'Offen';
			case 'in_arbeit': return 'In Arbeit';
			case 'fertig': return 'Fertig';
			default: return status;
		}
	}

	function openRejectModal(updateId: string) {
		rejectingUpdateId = updateId;
		rejectReason = '';
		rejectModalOpen = true;
	}

	function closeRejectModal() {
		rejectModalOpen = false;
		rejectingUpdateId = null;
		rejectReason = '';
	}

	function openLightbox(url: string, beschreibung?: string) {
		lightboxImage = { url, beschreibung };
	}

	function closeLightbox() {
		lightboxImage = null;
	}
</script>

<svelte:head>
	<title>Handwerker-Aktualisierungen - SmartBuilders</title>
</svelte:head>

{#if showMessage}
	<div transition:slide class="fixed top-4 right-4 z-50 max-w-md">
		<div class="rounded-lg shadow-lg p-4 flex items-start gap-3 {messageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
			{#if messageType === 'success'}
				<svg class="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{:else}
				<svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{/if}
			<p class="text-sm font-medium {messageType === 'success' ? 'text-green-800' : 'text-red-800'}">{messageText}</p>
		</div>
	</div>
{/if}

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
			class="absolute top-4 right-4 text-3xl text-white hover:text-gray-300"
			onclick={closeLightbox}
		>✕</button>
		<div class="max-h-[90vh] max-w-[90vw]" onclick={(e) => e.stopPropagation()}>
			<img src={lightboxImage.url} alt={lightboxImage.beschreibung || 'Bild'} class="max-h-[85vh] max-w-full rounded-lg" />
			{#if lightboxImage.beschreibung}
				<p class="mt-2 text-center text-white">{lightboxImage.beschreibung}</p>
			{/if}
		</div>
	</div>
{/if}

{#if rejectModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-lg font-bold mb-4">Aktualisierung ablehnen</h3>
			<form action="?/reject" method="POST" use:enhance onsubmit={() => closeRejectModal()}>
				<input type="hidden" name="updateId" value={rejectingUpdateId} />
				<div class="mb-4">
					<label for="grund" class="block text-sm font-medium text-gray-700 mb-1">Ablehnungsgrund (optional)</label>
					<textarea
						id="grund"
						name="grund"
						bind:value={rejectReason}
						rows="3"
						class="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
						placeholder="Warum wird diese Aktualisierung abgelehnt?"
					></textarea>
				</div>
				<div class="flex justify-end gap-2">
					<button type="button" onclick={closeRejectModal} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
					<button type="submit" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Ablehnen</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
			<div>
				<h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Handwerker-Aktualisierungen</h1>
				<p class="text-sm text-gray-500 mt-1">Prüfen und genehmigen Sie Änderungen von Handwerkern</p>
			</div>
			<a href="/admin/uebersicht" class="text-sm font-medium text-gray-700 hover:bg-gray-200 px-3 py-2 rounded">← Zurück</a>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if data.updates.length === 0}
			<div class="rounded-xl bg-white p-12 text-center shadow-md border border-dashed border-gray-300">
				<svg class="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">Alles erledigt!</h3>
				<p class="mt-2 text-gray-500">Es gibt keine ausstehenden Aktualisierungen zur Prüfung.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.updates as update (update.id)}
					<div class="bg-white rounded-xl shadow-md overflow-hidden" transition:slide>
						<div class="p-4 sm:p-6">
							<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
								<div class="flex-1">
									<div class="flex flex-wrap items-center gap-2 mb-2">
										<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getTypColor(update.typ)}">
											{getTypLabel(update.typ)}
										</span>
										<span class="text-sm text-gray-500">{formatDate(update.eingereichtAm)}</span>
									</div>
									
									<div class="mb-3">
										<a href="/projekt/{update.projekt.id}" class="text-lg font-semibold text-gray-900 hover:text-blue-600">
											{update.projekt.bezeichnung}
										</a>
										<p class="text-sm text-gray-500">{update.projekt.kundenname} · {update.projekt.auftragsnummer}</p>
									</div>

									<div class="bg-gray-50 rounded-lg p-3 mb-3">
										<p class="text-sm font-medium text-gray-700 mb-1">Schritt: {update.schritt.titel}</p>
										<p class="text-xs text-gray-500">Aktueller Status: {getStatusLabel(update.schritt.status)} · {update.schritt.fortschritt}%</p>
									</div>

									{#if update.typ === 'STATUS_AENDERUNG'}
										<div class="bg-blue-50 rounded-lg p-3">
											<p class="text-sm font-medium text-blue-900">Vorgeschlagene Änderung:</p>
											<div class="mt-1 text-sm text-blue-700">
												{#if update.neuerStatus}
													<p>Neuer Status: <strong>{getStatusLabel(update.neuerStatus)}</strong></p>
												{/if}
												{#if update.neuerFortschritt !== null}
													<p>Neuer Fortschritt: <strong>{update.neuerFortschritt}%</strong></p>
												{/if}
											</div>
										</div>
									{:else if update.typ === 'NOTIZ' && update.notizText}
										<div class="bg-yellow-50 rounded-lg p-3">
											<p class="text-sm font-medium text-yellow-900">Notiz:</p>
											<p class="mt-1 text-sm text-yellow-700 whitespace-pre-wrap">{update.notizText}</p>
										</div>
									{:else if update.typ === 'FOTO_UPLOAD' && update.bild}
										<div class="bg-purple-50 rounded-lg p-3">
											<p class="text-sm font-medium text-purple-900 mb-2">Hochgeladenes Foto:</p>
											<button type="button" onclick={() => { if (update.bild) openLightbox(update.bild.url, update.bild.beschreibung ?? undefined); }} class="block">
												<img src={update.bild.url} alt={update.bild.beschreibung || 'Foto'} class="h-32 w-auto rounded-lg object-cover hover:opacity-90 transition-opacity" />
											</button>
											{#if update.bild.beschreibung}
												<p class="mt-2 text-sm text-purple-700">{update.bild.beschreibung}</p>
											{/if}
										</div>
									{/if}

									<p class="mt-3 text-sm text-gray-500">
										Eingereicht von <strong>{update.bearbeiter.name}</strong>
									</p>
								</div>

								<div class="flex sm:flex-col gap-2">
									<form action="?/approve" method="POST" use:enhance class="flex-1 sm:flex-none">
										<input type="hidden" name="updateId" value={update.id} />
										<button type="submit" class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 text-sm font-medium">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
											Genehmigen
										</button>
									</form>
									<button type="button" onclick={() => openRejectModal(update.id)} class="flex-1 sm:flex-none bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 flex items-center justify-center gap-2 text-sm font-medium">
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
										Ablehnen
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
