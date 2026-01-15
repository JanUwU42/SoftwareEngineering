<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);

	// Dynamic steps management
	interface StepForm {
		titel: string;
		beschreibung: string;
		start: string;
		ende: string;
	}

	let schritte = $state<StepForm[]>(
		form?.values?.schritte ?? []
	);

	function addSchritt() {
		schritte = [...schritte, { titel: '', beschreibung: '', start: '', ende: '' }];
	}

	function removeSchritt(index: number) {
		schritte = schritte.filter((_, i) => i !== index);
	}

	function moveSchritt(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			const temp = schritte[index];
			schritte[index] = schritte[index - 1];
			schritte[index - 1] = temp;
			schritte = [...schritte];
		} else if (direction === 'down' && index < schritte.length - 1) {
			const temp = schritte[index];
			schritte[index] = schritte[index + 1];
			schritte[index + 1] = temp;
			schritte = [...schritte];
		}
	}
</script>

<svelte:head>
	<title>Neues Projekt erstellen – Smart Builders</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight text-gray-900">Neues Projekt erstellen</h1>
					<p class="mt-1 text-sm text-gray-500">Erfassen Sie alle Projektdaten und planen Sie die Arbeitsschritte</p>
				</div>
				<a
					href="/admin/uebersicht"
					class="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
				>
					← Zurück zur Übersicht
				</a>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-8"
		>
			{#if form?.errors?.general}
				<div class="rounded-md bg-red-50 p-4 border-l-4 border-red-500">
					<p class="text-sm text-red-700">{form.errors.general}</p>
				</div>
			{/if}

			<!-- Projekt-Grunddaten -->
			<div class="rounded-xl bg-white p-6 shadow-md">
				<h2 class="mb-6 text-xl font-semibold text-gray-900">Projektdaten</h2>

				<div class="grid gap-6 sm:grid-cols-2">
					<div>
						<label for="auftragsnummer" class="block text-sm font-medium text-gray-700">
							Auftragsnummer
						</label>
						<div class="mt-1 flex items-center gap-2">
							<input
								type="text"
								id="auftragsnummer"
								value={data.nextAuftragsnummer}
								readonly
								class="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 shadow-sm cursor-not-allowed"
							/>
							<span class="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
								Auto
							</span>
						</div>
						<p class="mt-1 text-xs text-gray-500">Wird automatisch generiert</p>
					</div>

					<div>
						<label for="kundenname" class="block text-sm font-medium text-gray-700">
							Kundenname *
						</label>
						<input
							type="text"
							id="kundenname"
							name="kundenname"
							value={form?.values?.kundenname ?? ''}
							placeholder="Vor- und Nachname des Kunden"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.kundenname}
							<p class="mt-1 text-sm text-red-600">{form.errors.kundenname}</p>
						{/if}
					</div>

					<div class="sm:col-span-2">
						<label for="projektbezeichnung" class="block text-sm font-medium text-gray-700">
							Projektbezeichnung *
						</label>
						<input
							type="text"
							id="projektbezeichnung"
							name="projektbezeichnung"
							value={form?.values?.projektbezeichnung ?? ''}
							placeholder="z.B. Badsanierung Gästebad"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.projektbezeichnung}
							<p class="mt-1 text-sm text-red-600">{form.errors.projektbezeichnung}</p>
						{/if}
					</div>

					<div class="sm:col-span-2">
						<label for="projektbeschreibung" class="block text-sm font-medium text-gray-700">
							Projektbeschreibung
						</label>
						<textarea
							id="projektbeschreibung"
							name="projektbeschreibung"
							rows="3"
							placeholder="Optionale Beschreibung des Projekts..."
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						>{form?.values?.projektbeschreibung ?? ''}</textarea>
					</div>

					<div>
						<label for="geplanterStart" class="block text-sm font-medium text-gray-700">
							Geplanter Start *
						</label>
						<input
							type="date"
							id="geplanterStart"
							name="geplanterStart"
							value={form?.values?.geplanterStart ?? ''}
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.geplanterStart}
							<p class="mt-1 text-sm text-red-600">{form.errors.geplanterStart}</p>
						{/if}
					</div>

					<div>
						<label for="geplantesEnde" class="block text-sm font-medium text-gray-700">
							Geplantes Ende *
						</label>
						<input
							type="date"
							id="geplantesEnde"
							name="geplantesEnde"
							value={form?.values?.geplantesEnde ?? ''}
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.geplantesEnde}
							<p class="mt-1 text-sm text-red-600">{form.errors.geplantesEnde}</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Adresse -->
			<div class="rounded-xl bg-white p-6 shadow-md">
				<h2 class="mb-6 text-xl font-semibold text-gray-900">Projektadresse</h2>

				<div class="grid gap-6 sm:grid-cols-4">
					<div class="sm:col-span-2">
						<label for="strasse" class="block text-sm font-medium text-gray-700">
							Straße *
						</label>
						<input
							type="text"
							id="strasse"
							name="strasse"
							value={form?.values?.strasse ?? ''}
							placeholder="Straßenname"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.strasse}
							<p class="mt-1 text-sm text-red-600">{form.errors.strasse}</p>
						{/if}
					</div>

					<div>
						<label for="hausnummer" class="block text-sm font-medium text-gray-700">
							Hausnummer *
						</label>
						<input
							type="text"
							id="hausnummer"
							name="hausnummer"
							value={form?.values?.hausnummer ?? ''}
							placeholder="Nr."
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.hausnummer}
							<p class="mt-1 text-sm text-red-600">{form.errors.hausnummer}</p>
						{/if}
					</div>

					<div>
						<label for="plz" class="block text-sm font-medium text-gray-700">
							PLZ *
						</label>
						<input
							type="text"
							id="plz"
							name="plz"
							value={form?.values?.plz ?? ''}
							placeholder="PLZ"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.plz}
							<p class="mt-1 text-sm text-red-600">{form.errors.plz}</p>
						{/if}
					</div>

					<div class="sm:col-span-2">
						<label for="ort" class="block text-sm font-medium text-gray-700">
							Ort *
						</label>
						<input
							type="text"
							id="ort"
							name="ort"
							value={form?.values?.ort ?? ''}
							placeholder="Stadt/Ort"
							required
							class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						{#if form?.errors?.ort}
							<p class="mt-1 text-sm text-red-600">{form.errors.ort}</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Projektschritte (Zeitstrahl) -->
			<div class="rounded-xl bg-white p-6 shadow-md">
				<div class="mb-6 flex items-center justify-between">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">Projektschritte (Zeitstrahl)</h2>
						<p class="mt-1 text-sm text-gray-500">Planen Sie die einzelnen Arbeitsschritte für die Zeitstrahl-Ansicht</p>
					</div>
					<button
						type="button"
						onclick={addSchritt}
						class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Schritt hinzufügen
					</button>
				</div>

				{#if schritte.length === 0}
					<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
						<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
						</svg>
						<h3 class="mt-4 text-lg font-medium text-gray-900">Noch keine Schritte geplant</h3>
						<p class="mt-2 text-sm text-gray-500">
							Fügen Sie Arbeitsschritte hinzu, um den Projektzeitplan zu erstellen.
						</p>
						<button
							type="button"
							onclick={addSchritt}
							class="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
						>
							Ersten Schritt hinzufügen
						</button>
					</div>
				{:else}
					<div class="space-y-4">
						{#each schritte as schritt, index (index)}
							<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
								<div class="mb-4 flex items-center justify-between">
									<span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
										Schritt {index + 1}
									</span>
									<div class="flex items-center gap-2">
										<button
											type="button"
											onclick={() => moveSchritt(index, 'up')}
											disabled={index === 0}
											class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Nach oben verschieben"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
											</svg>
										</button>
										<button
											type="button"
											onclick={() => moveSchritt(index, 'down')}
											disabled={index === schritte.length - 1}
											class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
											title="Nach unten verschieben"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										</button>
										<button
											type="button"
											onclick={() => removeSchritt(index)}
											class="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
											title="Schritt entfernen"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</div>
								</div>

								<div class="grid gap-4 sm:grid-cols-2">
									<div class="sm:col-span-2">
										<label for="schritt_titel_{index}" class="block text-sm font-medium text-gray-700">
											Titel *
										</label>
										<input
											type="text"
											id="schritt_titel_{index}"
											name="schritt_titel"
											bind:value={schritt.titel}
											placeholder="z.B. Demontage Altinstallation"
											required
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>

									<div class="sm:col-span-2">
										<label for="schritt_beschreibung_{index}" class="block text-sm font-medium text-gray-700">
											Beschreibung
										</label>
										<textarea
											id="schritt_beschreibung_{index}"
											name="schritt_beschreibung"
											bind:value={schritt.beschreibung}
											rows="2"
											placeholder="Optionale Beschreibung des Arbeitsschritts..."
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										></textarea>
									</div>

									<div>
										<label for="schritt_start_{index}" class="block text-sm font-medium text-gray-700">
											Startdatum *
										</label>
										<input
											type="date"
											id="schritt_start_{index}"
											name="schritt_start"
											bind:value={schritt.start}
											required
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label for="schritt_ende_{index}" class="block text-sm font-medium text-gray-700">
											Enddatum *
										</label>
										<input
											type="date"
											id="schritt_ende_{index}"
											name="schritt_ende"
											bind:value={schritt.ende}
											required
											class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end gap-4">
				<a
					href="/admin/uebersicht"
					class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					Abbrechen
				</a>
				<button
					type="submit"
					disabled={loading}
					class="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Wird erstellt...
					{:else}
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						Projekt erstellen
					{/if}
				</button>
			</div>
		</form>
	</main>
</div>
