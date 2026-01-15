<script lang="ts">
    import type { ActionData } from './$types';
    import { enhance } from '$app/forms';
    import { fade, slide } from 'svelte/transition';

    export let form: ActionData;

    let identifier = '';

    // Reaktivität: Sobald ein '@' getippt wird, gehen wir davon aus, dass es ein Mitarbeiter ist.
    $: isEmail = identifier.includes('@');

    let loading = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
    <div class="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">

        <div class="text-center">
            <h2 class="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                Smart Builders
            </h2>
            <p class="mt-2 text-sm text-slate-600">
                Melden Sie sich an, um Ihr Projekt zu verwalten.
            </p>
        </div>

        <form
                method="POST"
                use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					update();
				};
			}}
                class="mt-8 space-y-6"
        >

            {#if form?.invalid}
                <div transition:slide class="rounded-md bg-red-50 p-4 border-l-4 border-red-500">
                    <div class="flex">
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Anmeldung fehlgeschlagen</h3>
                            <div class="mt-2 text-sm text-red-700">
                                {#if form.type === 'staff'}
                                    E-Mail oder Passwort ist ungültig.
                                {:else}
                                    Auftragsnummer oder Nachname nicht korrekt.
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <div class="rounded-md shadow-sm -space-y-px">

                <div class="relative mb-4">
                    <label for="identifier" class="block text-sm font-medium text-slate-700 mb-1">
                        E-Mail oder Auftragsnummer
                    </label>
                    <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            bind:value={identifier}
                            required
                            class="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all"
                            placeholder="z.B. max@smartbuilders.de oder 2024-AB-123"
                    />
                </div>

                <div class="relative">
                    <label for="secret" class="block text-sm font-medium text-slate-700 mb-1">
                        {#if isEmail}
                            <span transition:fade>Passwort</span>
                        {:else}
                            <span transition:fade>Nachname</span>
                        {/if}
                    </label>

                    <input
                            id="secret"
                            name="secret"
                            type={isEmail ? 'password' : 'text'}
                            required
                            class="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all"
                            placeholder={isEmail ? '••••••••' : 'Ihr Nachname'}
                    />
                </div>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 px-1">
                <div class="flex items-center gap-2">
                    <span class="inline-block w-2 h-2 rounded-full {isEmail ? 'bg-indigo-500' : 'bg-slate-300'}"></span>
                    <span>Mitarbeiter-Login</span>
                </div>
                <div class="flex items-center gap-2">
                    <span>Kunden-Login</span>
                    <span class="inline-block w-2 h-2 rounded-full {!isEmail ? 'bg-green-500' : 'bg-slate-300'}"></span>
                </div>
            </div>

            <div>
                <button
                        type="submit"
                        disabled={loading}
                        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {#if loading}
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Wird angemeldet...
                    {:else}
                        Anmelden
                    {/if}
                </button>
            </div>
        </form>
    </div>

    <div class="absolute bottom-4 text-center text-xs text-slate-400 w-full">
        &copy; 2026 Smart Builders GmbH
    </div>
</div>
