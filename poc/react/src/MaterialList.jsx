import React, { useState, useMemo } from 'react';

export default function MaterialList() {
    const [materials, setMaterials] = useState([]);
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadMaterials = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 800));
        setMaterials([
            { id: 1, name: 'Zementsäcke (25kg)', done: true },
            { id: 2, name: 'Dämmwolle (Steinwolle)', done: false },
            { id: 3, name: 'Rigipsplatten 200x60', done: false },
            { id: 4, name: 'Fliesenkleber Flex', done: true },
            { id: 5, name: 'Fugenbunt Grau', done: false }
        ]);
        setLoading(false);
    };

    const toggleStatus = (id) => {
        // Manuelle Immutability erforderlich!
        setMaterials((prev) =>
            prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m))
        );
    };

    const filteredMaterials = useMemo(() => {
        return showOnlyPending ? materials.filter((m) => !m.done) : materials;
    }, [materials, showOnlyPending]);

    return (
        <div style={styles.card}>
            <h2>React Material-Liste</h2>
            <div style={styles.controls}>
                <button onClick={loadMaterials} disabled={loading}>
                    {loading ? 'Lade...' : 'Material laden'}
                </button>
                <label>
                    <input
                        type="checkbox"
                        checked={showOnlyPending}
                        onChange={(e) => setShowOnlyPending(e.target.checked)}
                    />
                    Nur offene zeigen
                </label>
            </div>

            <ul style={styles.ul}>
                {filteredMaterials.map((item) => (
                    <li key={item.id} style={{...styles.li, ...(item.done ? styles.done : {})}}>
                        <span style={item.done ? styles.doneSpan : {}}>{item.name}</span>
                        <button onClick={() => toggleStatus(item.id)} style={styles.btn}>
                            {item.done ? '✓' : '○'}
                        </button>
                    </li>
                ))}
                {!loading && filteredMaterials.length === 0 && (
                    <li style={styles.li}>Liste leer oder alles erledigt.</li>
                )}
            </ul>
        </div>
    );
}

const styles = {
    card: { fontFamily: 'sans-serif', maxWidth: '400px', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    controls: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' },
    ul: { listStyle: 'none', padding: 0, margin: 0 },
    li: { display: 'flex', justifyContent: 'space-between', padding: '0.8rem', borderBottom: '1px solid #eee', alignItems: 'center' },
    done: { backgroundColor: '#242424' },
    doneSpan: { textDecoration: 'line-through', color: '#999' },
    btn: { cursor: 'pointer', padding: '0.5rem 1rem' }
};
