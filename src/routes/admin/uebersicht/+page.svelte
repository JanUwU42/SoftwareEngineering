<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateString: string | null): string {
		if (!dateString) return '–';
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	const userRole = $derived((data as unknown as { userRole: string }).userRole);
	const isAdmin = $derived(userRole === 'ADMIN');
	const isHandwerker = $derived(userRole === 'HANDWERKER');
	const isInnendienst = $derived(userRole === 'ADMIN' || userRole === 'INNENDIENST');
	const pendingUpdatesCount = $derived((data as unknown as { pendingUpdatesCount: number }).pendingUpdatesCount || 0);
</script>

<svelte:head>
	<title>Dashboard – SmartBuilders</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
					<p class="mt-1 text-sm text-gray-500">
						Willkommen zurück!
						<span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 ml-2">
							{userRole}
						</span>
					</p>
				</div>

				<div>
					<form action="/?/logout" method="POST">
						<button
							type="submit"
							class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-red-50 hover:text-red-700 transition-colors"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
							</svg>
							Abmelden
						</button>
					</form>
				</div>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

		{#if !isHandwerker}
			<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

				{#if isAdmin}
					<a href="/admin/users" class="group relative flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm hover:shadow-md hover:ring-2 hover:ring-blue-500 transition-all">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold text-gray-900">Benutzer</h3>
							<p class="text-sm text-gray-500">Mitarbeiter verwalten</p>
						</div>
					</a>
				{/if}

				{#if isInnendienst}
					<a href="/admin/aktualisierungen" class="group relative flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm hover:shadow-md hover:ring-2 hover:ring-orange-500 transition-all">
						<div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="font-semibold text-gray-900">Aktualisierungen</h3>
							<p class="text-sm text-gray-500">Handwerker-Updates prüfen</p>
						</div>
						{#if pendingUpdatesCount > 0}
							<span class="inline-flex items-center justify-center w-7 h-7 text-sm font-bold text-white bg-orange-500 rounded-full">{pendingUpdatesCount}</span>
						{/if}
					</a>
				{/if}

				<a href="/admin/material" class="group relative flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm hover:shadow-md hover:ring-2 hover:ring-purple-500 transition-all">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
							<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-gray-900">Material</h3>
						<p class="text-sm text-gray-500">Katalog & Bestände</p>
					</div>
				</a>

			</div>
		{/if}

		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-bold text-gray-900">
				{#if isHandwerker}
					Meine Projekte
				{:else}
					Aktive Projekte
				{/if}
			</h2>
			{#if !isHandwerker}
				<a href="/admin/neu" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Neues Projekt</a>
			{/if}
		</div>

		{#if data.projects.length === 0}
			<div class="rounded-xl bg-white p-12 text-center shadow-md border border-dashed border-gray-300">
				<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">Keine Projekte gefunden</h3>
				<p class="mt-2 text-gray-500">
					{#if isHandwerker}
						Dir sind aktuell keine Projekte zugewiesen.
					{:else}
						Es wurden noch keine Projekte angelegt.
					{/if}
				</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.projects as project (project.id)}
					<a href="/projekt/{project.id}" class="group block rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-500">
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h2 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">
									{project.projektbezeichnung}
								</h2>
								<p class="text-sm text-gray-500">{project.kundenname}</p>
							</div>
							<span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
								{project.auftragsnummer}
							</span>
						</div>

						<div class="mb-4 text-sm text-gray-600">
							<div class="flex items-center gap-1">
								<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								<span class="truncate">{project.ort}</span>
							</div>
							<div class="mt-1 flex items-center gap-1">
								<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<span>{formatDate(project.geplanterStart)} – {formatDate(project.geplantesEnde)}</span>
							</div>
						</div>

						<div>
							<div class="mb-1 flex justify-between text-sm">
								<span class="text-gray-600">Fortschritt</span>
								<span class="font-medium text-gray-900">{project.fortschritt}%</span>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
								<div
									class="h-full bg-blue-500 transition-all duration-300"
									style="width: {project.fortschritt}%"
								></div>
							</div>
							<p class="mt-1 text-xs text-gray-500">
								{project.fertigeSchritte} von {project.gesamtSchritte} Schritten abgeschlossen
							</p>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>
