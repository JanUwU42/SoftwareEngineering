<script lang="ts">
	import type { PageData } from './$types';
	import { fade, scale } from 'svelte/transition';
	import { enhance } from '$app/forms';

	interface MaterialWithStock {
		id: string;
		name: string;
		einheit: string;
		bestand: number;
		reserviert: number;
		verfuegbar: number;
		mussBestellen: boolean;
		bestellMenge: number;
	}

	interface Props {
		data: PageData;
		form: { message?: string } | null;
	}

	let { data, form }: Props = $props();

	// --- STATE MIT RUNES ($state) ---

	let showCreateModal = $state(false);
	let editingMaterial = $state<MaterialWithStock | null>(null);

	function openEditModal(material: MaterialWithStock) {
		editingMaterial = material;
	}

	function closeEditModal() {
		editingMaterial = null;
	}
</script>

<div class="mx-auto max-w-7xl p-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Materialverwaltung & Lagerbestand</h1>
			<p class="mt-1 text-sm text-gray-500">
				Physischen Bestand verwalten und Bestellbedarf prüfen
			</p>
		</div>
		<div class="flex gap-3">
			<a
				href="/admin/uebersicht"
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
			>
				Zurück
			</a>
			<button
				class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-700"
				onclick={() => (showCreateModal = true)}
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/></svg
				>
				Neues Material
			</button>
		</div>
	</div>

	{#if form?.message}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-100 p-4 text-red-700" role="alert">
			{form.message}
		</div>
	{/if}

	<div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Material</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Physisch (Lager)</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Reserviert (Projekte)</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Verfügbar</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Aktionen</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each data.materials as material (material.id)}
					<tr class="transition-colors hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-medium text-gray-900">{material.name}</div>
							<div class="text-xs text-gray-500">Einheit: {material.einheit}</div>
						</td>

						<td class="px-6 py-4 text-right whitespace-nowrap">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
							>
								{material.bestand}
							</span>
						</td>

						<td class="px-6 py-4 text-right whitespace-nowrap">
							{#if material.reserviert > 0}
								<span
									class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
								>
									{material.reserviert}
								</span>
							{:else}
								<span class="text-sm text-gray-400">-</span>
							{/if}
						</td>

						<td class="px-6 py-4 text-right whitespace-nowrap">
							{#if material.mussBestellen}
								<div class="flex flex-col items-end">
									<span class="text-sm font-bold text-red-600">
										{material.verfuegbar}
									</span>
									<span
										class="inline-flex animate-pulse items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
									>
										⚠ Nachbestellen: {material.bestellMenge}
									</span>
								</div>
							{:else}
								<span class="text-sm font-bold text-green-600">
									{material.verfuegbar}
								</span>
							{/if}
						</td>

						<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
							<button
								onclick={() => openEditModal(material)}
								class="mr-4 text-blue-600 hover:text-blue-900"
							>
								Bearbeiten
							</button>
							<form
								action="?/deleteMaterial"
								method="POST"
								class="inline"
								onsubmit={(e) => !confirm('Wirklich löschen?') && e.preventDefault()}
							>
								<input type="hidden" name="id" value={material.id} />
								<button type="submit" class="text-red-600 hover:text-red-900">Löschen</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if data.materials.length === 0}
			<div class="py-12 text-center text-gray-500">Noch keine Materialien angelegt.</div>
		{/if}
	</div>
</div>

{#if showCreateModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		transition:fade
	>
		<div class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" transition:scale>
			<div class="border-b border-gray-100 bg-gray-50 px-6 py-4">
				<h3 class="text-lg font-bold text-gray-900">Neues Material anlegen</h3>
			</div>
			<form
				action="?/createMaterial"
				method="POST"
				class="space-y-4 p-6"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						showCreateModal = false;
					};
				}}
			>
				<div>
					<label for="c-name" class="mb-1 block text-sm font-medium text-gray-700"
						>Bezeichnung</label
					>
					<input
						id="c-name"
						name="name"
						type="text"
						required
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="c-bestand" class="mb-1 block text-sm font-medium text-gray-700"
							>Physischer Bestand</label
						>
						<input
							id="c-bestand"
							name="bestand"
							type="number"
							step="0.01"
							min="0"
							value="0"
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="c-einheit" class="mb-1 block text-sm font-medium text-gray-700"
							>Einheit</label
						>
						<input
							id="c-einheit"
							name="einheit"
							type="text"
							required
							list="einheiten"
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
							placeholder="Stk, m, m²"
						/>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100">Abbrechen</button
					>
					<button
						type="submit"
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Speichern</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if editingMaterial}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		transition:fade
	>
		<div class="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl" transition:scale>
			<div class="border-b border-gray-100 bg-gray-50 px-6 py-4">
				<h3 class="text-lg font-bold text-gray-900">Material bearbeiten</h3>
			</div>
			<form
				action="?/updateMaterial"
				method="POST"
				class="space-y-4 p-6"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeEditModal();
					};
				}}
			>
				<input type="hidden" name="id" value={editingMaterial.id} />

				<div>
					<label for="e-name" class="mb-1 block text-sm font-medium text-gray-700"
						>Bezeichnung</label
					>
					<input
						id="e-name"
						name="name"
						type="text"
						required
						value={editingMaterial.name}
						class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="e-bestand" class="mb-1 block text-sm font-medium text-gray-700"
							>Physischer Bestand</label
						>
						<input
							id="e-bestand"
							name="bestand"
							type="number"
							step="0.01"
							min="0"
							value={editingMaterial.bestand}
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label for="e-einheit" class="mb-1 block text-sm font-medium text-gray-700"
							>Einheit</label
						>
						<input
							id="e-einheit"
							name="einheit"
							type="text"
							required
							value={editingMaterial.einheit}
							list="einheiten"
							class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div class="rounded bg-blue-50 p-3 text-xs text-blue-800">
					Hinweis: Ändern Sie hier nur, was tatsächlich im Lager liegt (Inventur). Reservierungen
					aus Projekten werden automatisch abgezogen.
				</div>

				<div class="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onclick={closeEditModal}
						class="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100">Abbrechen</button
					>
					<button
						type="submit"
						class="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
						>Änderungen speichern</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}

<datalist id="einheiten">
	<option value="Stk"></option>
	<option value="m"></option>
	<option value="m²"></option>
	<option value="kg"></option>
	<option value="l"></option>
	<option value="Sack"></option>
	<option value="Paket"></option>
</datalist>
