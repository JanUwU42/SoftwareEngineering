<script lang="ts">
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    // State für Modals
    let createModal: HTMLDialogElement;
    let editModal: HTMLDialogElement;

    // Welcher User wird gerade bearbeitet?
    let editingUser = $state<any>(null);

    function openEdit(user: any) {
        editingUser = user;
        editModal.showModal();
    }

    // Helper: Prüft für die Checkboxen, ob der User das Projekt schon hat
    function hasProject(user: any, projectId: string) {
        return user?.projekte?.some((p: any) => p.id === projectId) ?? false;
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleDateString('de-DE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    // Farben für die Rollen Badges
    function getRoleBadge(role: string) {
        switch(role) {
            case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
            case 'INNENDIENST': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'HANDWERKER': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
</script>

<svelte:head>
    <title>Benutzerverwaltung</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 p-4 sm:p-8">
    <div class="mx-auto max-w-6xl">

        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-2xl font-bold text-gray-900">Benutzerverwaltung</h1>
                <p class="text-sm text-gray-500">Alle Mitarbeiter im System</p>
            </div>
            <div class="flex gap-3">
                <a href="/admin/uebersicht" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                    Zurück
                </a>
                <button
                        onclick={() => createModal.showModal()}
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
                >
                    + Neuer Benutzer
                </button>
            </div>
        </div>

        <div class="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projekte</th>
                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erstellt am</th>
                        <th scope="col" class="relative px-6 py-3"><span class="sr-only">Aktionen</span></th>
                    </tr>
                    </thead>

                    <tbody class="bg-white divide-y divide-gray-200">
                    {#each data.users as user (user.id)}
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.vorname} {user.nachname}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.email}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border {getRoleBadge(user.role)}">
                                    {user.role}
                                </span>
                            </td>

                            <td class="px-6 py-4 text-sm text-gray-500">
                                {#if user.role === 'HANDWERKER'}
                                    {#if user.projekte.length > 0}
                                        <div class="flex flex-wrap gap-1">
                                            {#each user.projekte as p}
                                                <span class="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                    {p.projektbezeichnung}
                                                </span>
                                            {/each}
                                        </div>
                                    {:else}
                                        <span class="text-gray-400 italic text-xs">– Keine –</span>
                                    {/if}
                                {:else}
                                    <span class="text-gray-300 text-xs">n/a</span>
                                {/if}
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.erstelltAm)}
                            </td>

                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick={() => openEdit(user)} class="text-blue-600 hover:text-blue-900 mr-4">Bearbeiten</button>
                                <form action="?/deleteUser" method="POST" class="inline-block" onsubmit={(e) => !confirm('Benutzer wirklich löschen?') && e.preventDefault()}>
                                    <input type="hidden" name="userId" value={user.id} />
                                    <button type="submit" class="text-red-600 hover:text-red-900">Löschen</button>
                                </form>
                            </td>
                        </tr>
                    {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<dialog bind:this={createModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-md backdrop:bg-black/50">
    <div class="p-6">
        <h3 class="text-lg font-bold mb-4">Neuen Benutzer anlegen</h3>
        <form action="?/createUser" method="POST" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="new-vorname" class="block text-sm font-medium text-gray-700">Vorname</label>
                    <input id="new-vorname" type="text" name="vorname" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label for="new-nachname" class="block text-sm font-medium text-gray-700">Nachname</label>
                    <input id="new-nachname" type="text" name="nachname" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
            </div>
            <div>
                <label for="new-email" class="block text-sm font-medium text-gray-700">Email</label>
                <input id="new-email" type="email" name="email" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label for="new-pw" class="block text-sm font-medium text-gray-700">Passwort</label>
                <input id="new-pw" type="password" name="password" required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label for="new-role" class="block text-sm font-medium text-gray-700">Rolle</label>
                <select id="new-role" name="role" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="HANDWERKER">Handwerker</option>
                    <option value="INNENDIENST">Innendienst</option>
                    <option value="ADMIN">Admin</option>
                </select>
            </div>
            <div class="flex justify-end gap-2 mt-6">
                <button type="button" onclick={() => createModal.close()} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Erstellen</button>
            </div>
        </form>
    </div>
</dialog>

<dialog bind:this={editModal} class="m-auto rounded-xl shadow-2xl border-0 p-0 w-full max-w-lg backdrop:bg-black/50">
    {#if editingUser}
        <div class="p-6">
            <h3 class="text-lg font-bold mb-4">Benutzer bearbeiten</h3>
            <form action="?/updateUser" method="POST" class="space-y-4">
                <input type="hidden" name="userId" value={editingUser.id} />

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label for="edit-vorname" class="block text-sm font-medium text-gray-700">Vorname</label>
                        <input id="edit-vorname" type="text" name="vorname" value={editingUser.vorname} required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label for="edit-nachname" class="block text-sm font-medium text-gray-700">Nachname</label>
                        <input id="edit-nachname" type="text" name="nachname" value={editingUser.nachname} required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                <div>
                    <label for="edit-email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input id="edit-email" type="email" name="email" value={editingUser.email} required class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                    <label for="edit-role" class="block text-sm font-medium text-gray-700">Rolle</label>
                    <select id="edit-role" name="role" bind:value={editingUser.role} class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="HANDWERKER">Handwerker</option>
                        <option value="INNENDIENST">Innendienst</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>

                {#if editingUser.role === 'HANDWERKER'}
                    <div class="border rounded-md p-3 bg-gray-50">
                        <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Zugeordnete Projekte</p>

                        <div class="max-h-40 overflow-y-auto space-y-1">
                            {#each data.allProjects as project}
                                <label class="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1.5 rounded transition-colors">
                                    <input
                                            type="checkbox"
                                            name="projectIds"
                                            value={project.id}
                                            checked={hasProject(editingUser, project.id)}
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div class="flex flex-col">
                                        <span class="text-sm text-gray-700 font-medium">{project.projektbezeichnung}</span>
                                        <span class="text-xs text-gray-400">{project.auftragsnummer}</span>
                                    </div>
                                </label>
                            {/each}
                            {#if data.allProjects.length === 0}
                                <p class="text-xs text-gray-400 italic">Keine Projekte verfügbar.</p>
                            {/if}
                        </div>
                    </div>
                {/if}

                <div class="pt-2 border-t mt-2">
                    <label for="edit-pw" class="block text-sm font-medium text-gray-700">Neues Passwort (optional)</label>
                    <input id="edit-pw" type="password" name="password" placeholder="Leer lassen zum Beibehalten" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div class="flex justify-end gap-2 mt-6">
                    <button type="button" onclick={() => editModal.close()} class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">Abbrechen</button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Speichern</button>
                </div>
            </form>
        </div>
    {/if}
</dialog>
