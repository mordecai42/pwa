// src/utils/idb.ts

// 💡 CORRECCIÓN 1: Importación de Tipo
import { openDB } from 'idb';
import type { IDBPDatabase, DBSchema } from 'idb';

/**
 * Define y EXPORTA la Interfaz 'Entry' (Necesario para OfflineForm.tsx)
 * (Hemos renombrado IDBEntry a Entry para sincronizar con el componente)
 */
export interface Entry {
    id: number; 
    title: string;
    note: string;
    createdAt: string; // El componente usa new Date().toISOString()
}

// 2. Define el ESQUEMA de la Base de Datos para inferencia de tipos
interface MyDB extends DBSchema {
    entries: {
        key: number;
        value: Entry;
    };
}

const DB_NAME = 'offline-db';
const STORE_NAME = 'entries';
const DB_VERSION = 1;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
    return openDB<MyDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        },
    });
}

export async function saveEntry(entry: Entry): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, entry);
}

/**
 * 💡 CORRECCIÓN 2: Se eliminó la palabra clave 'function' duplicada.
 */
export async function getAllEntries(): Promise<Entry[]> {
    const db = await getDB();
    // El retorno es correcto (Promise<Entry[]>) gracias a getDB<MyDB>
    return await db.getAll(STORE_NAME);
}

export async function deleteEntry(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);    
}