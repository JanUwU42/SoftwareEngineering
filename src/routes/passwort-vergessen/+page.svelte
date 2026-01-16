<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { slide } from 'svelte/transition';

	export let form: ActionData;

	let email = '';
	let loading = false;

	$: if (form?.notification) {
		const n = form.notification;
		console.log('═'.repeat(60));
		console.log('📧 PASSWORT-RESET E-MAIL');
		console.log('═'.repeat(60));
		console.log('An: ' + n.an);
		console.log('Betreff: ' + n.betreff);
		console.log('─'.repeat(60));
		console.log('🔗 Reset-Link: ' + n.resetLink);
		console.log('─'.repeat(60));
		console.log('Nachricht:');
		console.log(n.nachricht);
		console.log('═'.repeat(60));
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 font-sans sm:px-6 lg:px-8"
>
	<div
		class="w-full max-w-md space-y-8 rounded-2xl border border-slate-100 bg-white p-10 shadow-xl"
	>
		<div class="text-center">
			<h2 class="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
				Passwort vergessen?
			</h2>
			<p class="mt-2 text-sm text-slate-600">
				Kein Problem! Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum
				Zuruecksetzen.
			</p>
		</div>

		{#if form?.success}
			<div transition:slide class="rounded-md border-l-4 border-green-500 bg-green-50 p-4">
				<div class="flex">
					<div class="shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-green-800">E-Mail gesendet!</h3>
						<div class="mt-2 text-sm text-green-700">
							Falls ein Konto mit der E-Mail <strong>{form.email}</strong> existiert, erhalten Sie in
							Kuerze eine E-Mail mit einem Link zum Zuruecksetzen Ihres Passworts.
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
				<div transition:slide class="rounded-md border-l-4 border-red-500 bg-red-50 p-4">
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
					<label for="email" class="mb-1 block text-sm font-medium text-slate-700">
						E-Mail-Adresse
					</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						required
						class="relative block w-full appearance-none rounded-lg border border-slate-300 px-3 py-3 text-slate-900 placeholder-slate-400 transition-all focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="ihre.email@beispiel.de"
					/>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="group relative flex w-full justify-center rounded-lg border border-transparent bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
					>
						{#if loading}
							<svg
								class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
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

	<div class="absolute bottom-4 w-full text-center text-xs text-slate-400">
		2026 Smart Builders GmbH
	</div>
</div>
