// src/components/OfflineForm.tsx

import React, { useEffect, useState } from 'react';
// ¡CRÍTICO! Asegúrate que la ruta a idb.js sea correcta
import { saveEntry, getAllEntries, deleteEntry } from '../utils/idb'; 

// Define un tipo básico para las entradas para resolver errores de renderizado
interface Entry {
    id: number;
    title: string;
    note: string;
    createdAt: number | string;
}

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
    const [entries, setEntries] = useState<Entry[]>([]); 

    // ----------------------------------------------------
    async function loadEntries() {
        const all = await getAllEntries() as Entry[]; 
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


    // Manejo de envío del formulario (Tipado para evitar error 'e' implícito)
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) { 
        e.preventDefault();
        
        // 1. Crear el objeto de datos con una marca de tiempo
        const baseData = { title, note, createdAt: new Date().toISOString() };
        
        if (!navigator.onLine) {
            // OFFLINE: Guardar a IndexedDB y registrar Sync
            const offlineData = { ...baseData, id: Date.now() };
            
            await saveEntry(offlineData);
            
            // Registrar background sync
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                
                // Verificación y cast para TypeScript
                if ('sync' in reg) { 
                    try {
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
            // Fallback si la red cae justo después de la verificación inicial
            alert('Error al enviar. Guardado localmente como fallback.');
            const fallbackData = { ...baseData, id: Date.now() };
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

    // Corregimos el tipo de 'id' para evitar error implícito de TS
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
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
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
                        <button onClick={()=>handleClear(en.id)}>Eliminar</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}