// Types
export * from './types/project';

// Data (Mock-Daten für Entwicklung - später durch echte DB-Aufrufe ersetzen)
export { mockProjects, getProjectById, getAllProjects } from './data/mockProjects';

// Components
export { default as ProjectMetadataCard } from './components/ProjectMetadataCard.svelte';
export { default as ProjectTimeline } from './components/ProjectTimeline.svelte';
