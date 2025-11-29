<script>
    import { slide, fade } from 'svelte/transition';

    let materials = [];
    let showOnlyPending = false;
    let loading = false;

    async function loadMaterials() {
        loading = true;
        await new Promise(r => setTimeout(r, 800));
        materials = [
            { id: 1, name: 'Zementsäcke (25kg)', done: true },
            { id: 2, name: 'Dämmwolle (Steinwolle)', done: false },
            { id: 3, name: 'Rigipsplatten 200x60', done: false },
            { id: 4, name: 'Fliesenkleber Flex', done: true },
            { id: 5, name: 'Fugenbunt Grau', done: false }
        ];
        loading = false;
    }

    function toggleStatus(id) {
        materials = materials.map(m =>
            m.id === id ? { ...m, done: !m.done } : m
        );
    }

    $: filteredMaterials = showOnlyPending
        ? materials.filter(m => !m.done)
        : materials;
</script>

<div class="card">
    <h2>Svelte Material-Liste</h2>
    <div class="controls">
        <button on:click={loadMaterials} disabled={loading}>
            {loading ? 'Lade...' : 'Material laden'}
        </button>
        <label>
            <input type="checkbox" bind:checked={showOnlyPending}>
            Nur offene zeigen
        </label>
    </div>

    <ul>
        {#each filteredMaterials as item (item.id)}
            <li transition:slide|local={{ duration: 300 }} class:done={item.done}>
                <span>{item.name}</span>
                <button on:click={() => toggleStatus(item.id)}>
                    {item.done ? '✓' : '○'}
                </button>
            </li>
        {:else}
            {#if !loading && materials.length > 0}
                <li transition:fade>Alles erledigt!</li>
            {:else if !loading}
                <li>Liste leer. Bitte laden.</li>
            {/if}
        {/each}
    </ul>
</div>

<style>
    .card { font-family: sans-serif; max-width: 400px; border: 1px solid #ddd; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .controls { display: flex; justify-content: space-between; margin-bottom: 1rem; align-items: center; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { display: flex; justify-content: space-between; padding: 0.8rem; border-bottom: 1px solid #eee; background: #242424; align-items: center; }
    .done span { text-decoration: line-through; color: #999; }
    button { cursor: pointer; padding: 0.5rem 1rem; }
</style>
