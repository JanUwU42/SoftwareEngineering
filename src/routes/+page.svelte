<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { fade, slide } from 'svelte/transition';
	import { page } from '$app/stores';

	export let form: ActionData;

	let identifier = '';
	let loading = false;

	$: passwordResetSuccess = $page.url.searchParams.get('passwordReset') === 'success';
	$: isEmail = identifier.includes('@');
</script>

<div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8 rounded-2xl border border-slate-100 bg-white p-10 shadow-xl">
		<div class="text-center">
			<h2 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Smart Builders</h2>
			<p class="mt-2 text-sm text-slate-600">Melden Sie sich an, um Ihr Projekt zu verwalten.</p>
		</div>

		<form method="POST" action="?/login" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; update(); }; }} class="mt-8 space-y-6">
			{#if passwordResetSuccess}
				<div transition:slide class="rounded-md border-l-4 border-green-500 bg-green-50 p-4">
					<div class="flex items-center gap-3">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
						</svg>
						<div>
							<h3 class="text-sm font-medium text-green-800">Passwort geändert!</h3>
							<p class="text-sm text-green-700">Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
						</div>
					</div>
				</div>
			{/if}

			{#if form?.invalid}
				<div transition:slide class="rounded-md border-l-4 border-red-500 bg-red-50 p-4">
					<h3 class="text-sm font-medium text-red-800">Anmeldung fehlgeschlagen</h3>
					<p class="text-sm text-red-700">
						{form.type === 'staff' ? 'E-Mail oder Passwort ist ungültig.' : 'Auftragsnummer oder Nachname nicht korrekt.'}
					</p>
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="identifier" class="mb-1 block text-sm font-medium text-slate-700">E-Mail oder Auftragsnummer</label>
					<input id="identifier" name="identifier" type="text" bind:value={identifier} required class="relative block w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-400 transition-all focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="z.B. max@smartbuilders.de oder 2024-AB-123" />
				</div>
				<div>
					<label for="secret" class="mb-1 block text-sm font-medium text-slate-700">
						{#if isEmail}<span transition:fade>Passwort</span>{:else}<span transition:fade>Nachname</span>{/if}
					</label>
					<input id="secret" name="secret" type={isEmail ? 'password' : 'text'} required class="relative block w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-400 transition-all focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder={isEmail ? '********' : 'Ihr Nachname'} />
				</div>
			</div>

			{#if isEmail}
				<div class="text-right">
					<a href="/passwort-vergessen" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Passwort vergessen?</a>
				</div>
			{/if}

			<div class="flex items-center justify-between px-1 text-xs text-slate-500">
				<div class="flex items-center gap-2">
					<span class="inline-block h-2 w-2 rounded-full {isEmail ? 'bg-indigo-500' : 'bg-slate-300'}"></span>
					<span>Mitarbeiter-Login</span>
				</div>
				<div class="flex items-center gap-2">
					<span>Kunden-Login</span>
					<span class="inline-block h-2 w-2 rounded-full {!isEmail ? 'bg-green-500' : 'bg-slate-300'}"></span>
				</div>
			</div>

			<button type="submit" disabled={loading} class="group relative flex w-full justify-center rounded-lg border border-transparent bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
				{#if loading}
					<svg class="-ml-1 mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Wird angemeldet...
				{:else}
					Anmelden
				{/if}
			</button>
		</form>
	</div>
	<div class="absolute bottom-4 w-full text-center text-xs text-slate-400">© 2026 Smart Builders GmbH</div>
</div>
