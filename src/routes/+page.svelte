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
</script>

<svelte:head>
	<title>Projektmanagement – Übersicht</title>
</svelte:head>

<div class="min-h-screen bg-gray-100">
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold tracking-tight text-gray-900">Projektmanagement</h1>
			<p class="mt-1 text-sm text-gray-500">Übersicht aller Projekte</p>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if data.projects.length === 0}
			<div class="rounded-xl bg-white p-12 text-center shadow-md">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">Keine Projekte vorhanden</h3>
				<p class="mt-2 text-gray-500">Es wurden noch keine Projekte angelegt.</p>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.projects as project (project.id)}
					<a
						href="/projekt/{project.id}"
						class="group block rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-500"
					>
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h2 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
									{project.projektbezeichnung}
								</h2>
								<p class="text-sm text-gray-500">{project.kundenname}</p>
							</div>
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
							>
								{project.auftragsnummer}
							</span>
						</div>

						<div class="mb-4 text-sm text-gray-600">
							<div class="flex items-center gap-1">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								<span>{project.ort}</span>
							</div>
							<div class="mt-1 flex items-center gap-1">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span
									>{formatDate(project.geplanterStart)} – {formatDate(project.geplantesEnde)}</span
								>
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
