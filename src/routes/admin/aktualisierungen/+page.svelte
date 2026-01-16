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

	interface Notification {
		type: string;
		an: string;
		betreff: string;
		auftragsnummer: string;
		projektschritt: string;
		neuerStatus: string;
		fortschritt: number;
		projektLink: string;
		nachricht: string;
	}

	interface Props {
		data: {
			updates: Update[];
		};
		form: { success?: boolean; message?: string; notification?: Notification } | null;
	}

	let { data, form }: Props = $props();

	$effect(() => {
		if (form?.notification) {
			const n = form.notification;
			console.log('═'.repeat(60));
			console.log('📧 KUNDENBENACHRICHTIGUNG - Projektschritt aktualisiert');
			console.log('═'.repeat(60));
			console.log('An: ' + n.an);
			console.log('Betreff: ' + n.betreff);
			console.log('─'.repeat(60));
			console.log('📋 Auftragsnummer: ' + n.auftragsnummer);
			console.log('🔧 Projektschritt: ' + n.projektschritt);
			console.log('✅ Neuer Status: ' + n.neuerStatus);
			console.log('📊 Fortschritt: ' + n.fortschritt + '%');
			console.log('🔗 Link: ' + n.projektLink);
			console.log('═'.repeat(60));
		}
	});

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
			setTimeout(() => {
				showMessage = false;
			}, 3000);
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
			case 'STATUS_AENDERUNG':
				return 'Status-Update';
			case 'FOTO_UPLOAD':
				return 'Foto-Upload';
			case 'NOTIZ':
				return 'Notiz';
		}
	}

	function getTypColor(typ: Update['typ']): string {
		switch (typ) {
			case 'STATUS_AENDERUNG':
				return 'bg-blue-100 text-blue-800';
			case 'FOTO_UPLOAD':
				return 'bg-purple-100 text-purple-800';
			case 'NOTIZ':
				return 'bg-yellow-100 text-yellow-800';
		}
	}

	function getStatusLabel(status: string): string {
		switch (status) {
			case 'offen':
				return 'Offen';
			case 'in_arbeit':
				return 'In Arbeit';
			case 'fertig':
				return 'Fertig';
			default:
				return status;
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
		<div
			class="flex items-start gap-3 rounded-lg p-4 shadow-lg {messageType === 'success'
				? 'border border-green-200 bg-green-50'
				: 'border border-red-200 bg-red-50'}"
		>
			{#if messageType === 'success'}
				<svg
					class="h-6 w-6 shrink-0 text-green-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			{:else}
				<svg
					class="h-6 w-6 shrink-0 text-red-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			{/if}
			<p
				class="text-sm font-medium {messageType === 'success' ? 'text-green-800' : 'text-red-800'}"
			>
				{messageText}
			</p>
		</div>
	</div>
{/if}

{#if lightboxImage}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		onclick={closeLightbox}
		onkeydown={(e) => e.key === 'Escape' && closeLightbox()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<button
			type="button"
			class="absolute top-4 right-4 text-3xl text-white hover:text-gray-300"
			onclick={closeLightbox}>✕</button
		>
		<div
			class="max-h-[90vh] max-w-[90vw]"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<img
				src={lightboxImage.url}
				alt={lightboxImage.beschreibung || 'Bild'}
				class="max-h-[85vh] max-w-full rounded-lg"
			/>
			{#if lightboxImage.beschreibung}
				<p class="mt-2 text-center text-white">{lightboxImage.beschreibung}</p>
			{/if}
		</div>
	</div>
{/if}

{#if rejectModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="presentation"
		>
			<h3 class="mb-4 text-lg font-bold">Aktualisierung ablehnen</h3>
			<form action="?/reject" method="POST" use:enhance onsubmit={() => closeRejectModal()}>
				<input type="hidden" name="updateId" value={rejectingUpdateId} />
				<div class="mb-4">
					<label for="grund" class="mb-1 block text-sm font-medium text-gray-700"
						>Ablehnungsgrund (optional)</label
					>
					<textarea
						id="grund"
						name="grund"
						bind:value={rejectReason}
						rows="3"
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
						placeholder="Warum wird diese Aktualisierung abgelehnt?"
					></textarea>
				</div>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={closeRejectModal}
						class="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100">Abbrechen</button
					>
					<button type="submit" class="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
						>Ablehnen</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
					Handwerker-Aktualisierungen
				</h1>
				<p class="mt-1 text-sm text-gray-500">
					Prüfen und genehmigen Sie Änderungen von Handwerkern
				</p>
			</div>
			<a
				href="/admin/uebersicht"
				class="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">← Zurück</a
			>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if data.updates.length === 0}
			<div
				class="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-md"
			>
				<svg
					class="mx-auto h-12 w-12 text-green-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">Alles erledigt!</h3>
				<p class="mt-2 text-gray-500">Es gibt keine ausstehenden Aktualisierungen zur Prüfung.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.updates as update (update.id)}
					<div class="overflow-hidden rounded-xl bg-white shadow-md" transition:slide>
						<div class="p-4 sm:p-6">
							<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
								<div class="flex-1">
									<div class="mb-2 flex flex-wrap items-center gap-2">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getTypColor(
												update.typ
											)}"
										>
											{getTypLabel(update.typ)}
										</span>
										<span class="text-sm text-gray-500">{formatDate(update.eingereichtAm)}</span>
									</div>

									<div class="mb-3">
										<a
											href="/projekt/{update.projekt.id}"
											class="text-lg font-semibold text-gray-900 hover:text-blue-600"
										>
											{update.projekt.bezeichnung}
										</a>
										<p class="text-sm text-gray-500">
											{update.projekt.kundenname} · {update.projekt.auftragsnummer}
										</p>
									</div>

									<div class="mb-3 rounded-lg bg-gray-50 p-3">
										<p class="mb-1 text-sm font-medium text-gray-700">
											Schritt: {update.schritt.titel}
										</p>
										<p class="text-xs text-gray-500">
											Aktueller Status: {getStatusLabel(update.schritt.status)} · {update.schritt
												.fortschritt}%
										</p>
									</div>

									{#if update.typ === 'STATUS_AENDERUNG'}
										<div class="rounded-lg bg-blue-50 p-3">
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
										<div class="rounded-lg bg-yellow-50 p-3">
											<p class="text-sm font-medium text-yellow-900">Notiz:</p>
											<p class="mt-1 text-sm whitespace-pre-wrap text-yellow-700">
												{update.notizText}
											</p>
										</div>
									{:else if update.typ === 'FOTO_UPLOAD' && update.bild}
										<div class="rounded-lg bg-purple-50 p-3">
											<p class="mb-2 text-sm font-medium text-purple-900">Hochgeladenes Foto:</p>
											<button
												type="button"
												onclick={() => {
													if (update.bild)
														openLightbox(update.bild.url, update.bild.beschreibung ?? undefined);
												}}
												class="block"
											>
												<img
													src={update.bild.url}
													alt={update.bild.beschreibung || 'Foto'}
													class="h-32 w-auto rounded-lg object-cover transition-opacity hover:opacity-90"
												/>
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

								<div class="flex gap-2 sm:flex-col">
									<form action="?/approve" method="POST" use:enhance class="flex-1 sm:flex-none">
										<input type="hidden" name="updateId" value={update.id} />
										<button
											type="submit"
											class="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 13l4 4L19 7"
												/>
											</svg>
											Genehmigen
										</button>
									</form>
									<button
										type="button"
										onclick={() => openRejectModal(update.id)}
										class="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 sm:flex-none"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
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
