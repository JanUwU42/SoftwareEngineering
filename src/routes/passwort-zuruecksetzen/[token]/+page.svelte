<script lang="ts">
    import type { ActionData, PageData } from './$types';
    import { enhance } from '$app/forms';
    import { slide } from 'svelte/transition';

    export let data: PageData;
    export let form: ActionData;

    let password = '';
    let passwordConfirm = '';
    let loading = false;

    $: passwordsMatch = password === passwordConfirm;
    $: passwordLongEnough = password.length >= 8;
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-sans">
    <div class="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">

        <div class="text-center">
            <h2 class="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">
                Neues Passwort setzen
            </h2>
            {#if data.valid}
                <p class="mt-2 text-sm text-slate-600">
                    Geben Sie ein neues Passwort fuer <strong>{data.email}</strong> ein.
                </p>
            {/if}
        </div>

        {#if !data.valid}
            <div transition:slide class="rounded-md bg-red-50 p-4 border-l-4 border-red-500">
                <div class="flex">
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Link ungueltig</h3>
                        <div class="mt-2 text-sm text-red-700">
                            {data.error}
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center space-y-4">
                <a href="/passwort-vergessen" class="inline-block w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors text-center">
                    Neuen Link anfordern
                </a>
                <a href="/" class="block text-sm font-medium text-indigo-600 hover:text-indigo-500">
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
                action="?/resetPassword"
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
                    <label for="password" class="block text-sm font-medium text-slate-700 mb-1">
                        Neues Passwort
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        bind:value={password}
                        required
                        minlength="8"
                        class="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all"
                        placeholder="Mindestens 8 Zeichen"
                    />
                    {#if password && !passwordLongEnough}
                        <p class="mt-1 text-xs text-red-500">Mindestens 8 Zeichen erforderlich</p>
                    {/if}
                </div>

                <div>
                    <label for="passwordConfirm" class="block text-sm font-medium text-slate-700 mb-1">
                        Passwort bestaetigen
                    </label>
                    <input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type="password"
                        bind:value={passwordConfirm}
                        required
                        class="appearance-none relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-all"
                        placeholder="Passwort wiederholen"
                    />
                    {#if passwordConfirm && !passwordsMatch}
                        <p class="mt-1 text-xs text-red-500">Passwoerter stimmen nicht ueberein</p>
                    {/if}
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading || !passwordsMatch || !passwordLongEnough}
                        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {#if loading}
                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Wird gespeichert...
                        {:else}
                            Passwort speichern
                        {/if}
                    </button>
                </div>
            </form>
        {/if}
    </div>

    <div class="absolute bottom-4 text-center text-xs text-slate-400 w-full">
        2026 Smart Builders GmbH
    </div>
</div>
