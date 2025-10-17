// src/components/OfflineForm.tsx

// Importamos el Hook 'FormEvent' de React para el tipado de eventos
import { useEffect, useState, type FormEvent } from 'react'; 
// Importamos Entry desde idb.ts (asumiendo que ahora la exporta)
import { saveEntry, getAllEntries, deleteEntry, type Entry } from '../utils/idb'; 


// Función auxiliar (El tipado está asegurado para evitar errores de compilación)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

export default function OfflineForm() {
    // ----------------------------------------------------
    // ESTADOS
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    // Aseguramos que 'entries' sea un array del tipo importado 'Entry'
    const [entries, setEntries] = useState<Entry[]>([]); 

    // ----------------------------------------------------
    async function loadEntries() {
        // La coerción de tipos (as Entry[]) es innecesaria si getAllEntries() 
        // está correctamente tipado para devolver Promise<Entry[]>
        const all = await getAllEntries(); 
        setEntries(all);
    }

    // ----------------------------------------------------
    
    useEffect(() => {
        const updateOnline = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnline);
        window.addEventListener('offline', updateOnline);
        loadEntries(); 
        return () => {
            window.removeEventListener('online', updateOnline);
            window.removeEventListener('offline', updateOnline);
        };
    }, []);


    // Manejo de envío del formulario (Tipado con React.FormEvent)
    // Usamos 'FormEvent' importado para tipar el evento
    async function handleSubmit(e: FormEvent<HTMLFormElement>) { 
        e.preventDefault();
        
        // El tipo del objeto creado debe ser consistente con la interfaz Entry
        const baseData: Omit<Entry, 'id'> = { title, note, createdAt: new Date().toISOString() };
        
        if (!navigator.onLine) {
            // 💡 Corrección de Tipos: El objeto offlineData ahora coincide exactamente con Entry
            const offlineData: Entry = { ...baseData, id: Date.now() };
            
            await saveEntry(offlineData); 
            
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                
                // Corrección para el error 'sync does not exist' de TS
                if ('sync' in reg) { 
                    try {
                        // Se usa as any porque TypeScript no reconoce la propiedad 'sync' nativamente
                        await (reg as any).sync.register('sync-entries'); 
                        alert('Guardado offline. Se sincronizará cuando haya conexión.');
                    } catch (err) {
                        console.warn('Sync register failed', err);
                    }
                } else {
                    alert('Guardado offline. (Este navegador no soporta Background Sync).');
                }
            }
            
            setTitle(''); setNote(''); 
            loadEntries();
            return;
        }

        // ONLINE: enviar al servidor directamente
        try {
            await fetch('/api/sync-entries', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(baseData), 
            });
            alert('Enviado al servidor correctamente.');
        } catch (err) {
            alert('Error al enviar. Guardado localmente como fallback.');
            // 💡 Corrección de Tipos: El objeto fallbackData ahora coincide exactamente con Entry
            const fallbackData: Entry = { ...baseData, id: Date.now() };
            await saveEntry(fallbackData);
            
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                if ('sync' in reg) {
                    await (reg as any).sync.register('sync-entries');
                }
            }
        }
        
        setTitle(''); setNote('');
        loadEntries();
    }

    // Corregimos el tipo de 'id' (Debe ser 'number' según tu interfaz Entry)
    async function handleClear(id: number) { 
        await deleteEntry(id);
        loadEntries();
    }

    // Push subscription
    async function subscribePush() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('Push no soportado en este navegador.');
            return;
        }

        const reg = await navigator.serviceWorker.ready;
        try {
            const resp = await fetch('/api/vapidPublicKey');
            const { publicKey } = await resp.json();
            
            // 💡 Corrección: La llamada a urlBase64ToUint8Array() ya no causa error 
            // porque está correctamente definida en el archivo y utiliza 'publicKey'
          const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    // Coercionamos a 'BufferSource' para satisfacer al tipado de la API
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
});
            await fetch('/api/subscribe', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(sub)
            });
            alert('Suscripción push registrada correctamente.');
        } catch (err) {
            console.error('subscribePush error', err);
            alert('No se pudo registrar la suscripción push.');
        }
    }

    return (
        <div style={{maxWidth:600, margin:'1rem auto', padding:'1rem', border:'1px solid #ddd', borderRadius:8}}>
            <h3>Reporte / Tarea</h3>
            <p>Estado conexión: <strong style={{color: isOnline ? 'green' : 'red'}}>{isOnline ? 'Online' : 'Offline'}</strong></p>
            <form onSubmit={handleSubmit}>
                <div style={{marginBottom:8}}>
                    <input placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} required style={{width:'100%', padding:8}} />
                </div>
                <div style={{marginBottom:8}}>
                    <textarea placeholder="Nota" value={note} onChange={e=>setNote(e.target.value)} required style={{width:'100%', padding:8}} />
                </div>
                <div style={{display:'flex', gap:8}}>
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={subscribePush}>Suscribirme a Notificaciones</button>
                </div>
            </form>

            <hr />
            <h4>Entradas guardadas localmente</h4>
            {entries.length === 0 && <p>No hay entradas locales.</p>}
            <ul>
                {entries.map(en => (
                    <li key={en.id} style={{marginBottom:6}}>
                        <strong>{en.title}</strong> — {new Date(en.createdAt).toLocaleString()}
                        <div>{en.note}</div>
                        {/* El ID es de tipo 'number' */}
                        <button onClick={()=>handleClear(en.id)}>Eliminar</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}