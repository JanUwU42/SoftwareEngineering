<script lang="ts">
    import type { ActionData } from './$types';
    import { enhance } from '$app/forms';
    import { slide } from 'svelte/transition';

    export let form: ActionData;

    let email = '';
    let loading = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
    <div class="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">

        <div class="text-center">
            <h2 class="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                Passwort vergessen?
            </h2>
            <p class="mt-2 text-sm text-slate-600">
                Kein Problem! Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zuruecksetzen.
            </p>
        </div>

        {#if form?.success}
            <div transition:slide class="rounded-md bg-green-50 p-4 border-l-4 border-green-500">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-green-800">E-Mail gesendet!</h3>
                        <div class="mt-2 text-sm text-green-700">
                            Falls ein Konto mit der E-Mail <strong>{form.email}</strong> existiert, erhalten Sie in Kuerze eine E-Mail mit einem Link zum Zuruecksetzen Ihres Passworts.
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center">
                <a href="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Zurueck zur Anmeldung
                </a>
            </div>
        {:else}
            {#if form?.error}
                <div transition:slide class="rounded-md bg-red-50 p-4 border-l-4 border-red-500">
                    <div class="flex">
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">Fehler</h3>
                            <div class="mt-2 text-sm text-red-700">
                                {form.error}
                            </div>
                        </div>
                    </div>
                </div>
            {/if}

            <form
                method="POST"
                action="?/requestReset"
                use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                        loading = false;
                        update();
                    };
                }}
                class="mt-8 space-y-6"
            >
                <div>
                    <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
                        E-Mail-Adresse
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        bind:value={email}
                        required
                        class="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all"
                        placeholder="ihre.email@beispiel.de"
                    />
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
                            Wird gesendet...
                        {:else}
                            Link zum Zuruecksetzen senden
                        {/if}
                    </button>
                </div>

                <div class="text-center">
                    <a href="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        Zurueck zur Anmeldung
                    </a>
                </div>
            </form>
        {/if}
    </div>

    <div class="absolute bottom-4 text-center text-xs text-slate-400 w-full">
        2026 Smart Builders GmbH
    </div>
</div>
