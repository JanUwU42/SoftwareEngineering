<script lang="ts">
    import type { PageData } from './$types';
    import { fade, scale } from 'svelte/transition';
    import { enhance } from '$app/forms';

    interface Props {
        data: PageData;
        form: { message?: string } | null;
    }

    let { data, form }: Props = $props();

    // --- STATE MIT RUNES ($state) ---
    // WICHTIG: In Svelte 5 müssen Variablen, die die UI ändern, mit $state definiert werden.
    let showCreateModal = $state(false);
    let editingMaterial = $state<any>(null);

    function openEditModal(material: any) {
        editingMaterial = material;
    }

    function closeEditModal() {
        editingMaterial = null;
    }
</script>

<div class="p-8 max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Materialverwaltung & Lagerbestand</h1>
            <p class="text-gray-500 text-sm mt-1">Physischen Bestand verwalten und Bestellbedarf prüfen</p>
        </div>
        <div class="flex gap-3">
            <a href="/admin/uebersicht" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Zurück
            </a>
            <button
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
                    onclick={() => showCreateModal = true}
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Neues Material
            </button>
        </div>
    </div>

    {#if form?.message}
        <div class="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200" role="alert">
            {form.message}
        </div>
    {/if}

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Physisch (Lager)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reserviert (Projekte)</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Verfügbar</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
            {#each data.materials as material (material.id)}
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{material.name}</div>
                        <div class="text-xs text-gray-500">Einheit: {material.einheit}</div>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-right">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {material.bestand}
                            </span>
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        {#if material.reserviert > 0}
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {material.reserviert}
                                </span>
                        {:else}
                            <span class="text-gray-400 text-sm">-</span>
                        {/if}
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        {#if material.mussBestellen}
                            <div class="flex flex-col items-end">
                                    <span class="text-red-600 font-bold text-sm">
                                        {material.verfuegbar}
                                    </span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                                        ⚠ Nachbestellen: {material.bestellMenge}
                                    </span>
                            </div>
                        {:else}
                                <span class="text-green-600 font-bold text-sm">
                                    {material.verfuegbar}
                                </span>
                        {/if}
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                                onclick={() => openEditModal(material)}
                                class="text-blue-600 hover:text-blue-900 mr-4"
                        >
                            Bearbeiten
                        </button>
                        <form action="?/deleteMaterial" method="POST" class="inline" onsubmit={(e) => !confirm('Wirklich löschen?') && e.preventDefault()}>
                            <input type="hidden" name="id" value={material.id}>
                            <button type="submit" class="text-red-600 hover:text-red-900">Löschen</button>
                        </form>
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
        {#if data.materials.length === 0}
            <div class="text-center py-12 text-gray-500">
                Noch keine Materialien angelegt.
            </div>
        {/if}
    </div>
</div>

{#if showCreateModal}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" transition:fade>
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" transition:scale>
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-bold text-gray-900">Neues Material anlegen</h3>
            </div>
            <form action="?/createMaterial" method="POST" class="p-6 space-y-4" use:enhance={() => {
                return async ({ update }) => {
                    await update();
                    showCreateModal = false;
                };
            }}>
                <div>
                    <label for="c-name" class="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</label>
                    <input id="c-name" name="name" type="text" required class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="c-bestand" class="block text-sm font-medium text-gray-700 mb-1">Physischer Bestand</label>
                        <input id="c-bestand" name="bestand" type="number" step="0.01" min="0" value="0" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="c-einheit" class="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
                        <input id="c-einheit" name="einheit" type="text" required list="einheiten" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Stk, m, m²">
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <button type="button" onclick={() => showCreateModal = false} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Speichern</button>
                </div>
            </form>
        </div>
    </div>
{/if}

{#if editingMaterial}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" transition:fade>
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" transition:scale>
            <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 class="text-lg font-bold text-gray-900">Material bearbeiten</h3>
            </div>
            <form action="?/updateMaterial" method="POST" class="p-6 space-y-4" use:enhance={() => {
                return async ({ update }) => {
                    await update();
                    closeEditModal();
                };
            }}>
                <input type="hidden" name="id" value={editingMaterial.id}>

                <div>
                    <label for="e-name" class="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</label>
                    <input id="e-name" name="name" type="text" required value={editingMaterial.name} class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="e-bestand" class="block text-sm font-medium text-gray-700 mb-1">Physischer Bestand</label>
                        <input
                                id="e-bestand"
                                name="bestand"
                                type="number"
                                step="0.01"
                                min="0"
                                value={editingMaterial.bestand}
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                    </div>
                    <div>
                        <label for="e-einheit" class="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
                        <input id="e-einheit" name="einheit" type="text" required value={editingMaterial.einheit} list="einheiten" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                </div>

                <div class="bg-blue-50 p-3 rounded text-xs text-blue-800">
                    Hinweis: Ändern Sie hier nur, was tatsächlich im Lager liegt (Inventur). Reservierungen aus Projekten werden automatisch abgezogen.
                </div>

                <div class="flex justify-end gap-3 mt-6">
                    <button type="button" onclick={closeEditModal} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Änderungen speichern</button>
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
