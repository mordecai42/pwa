// src/utils/idb.js
import { openDB } from 'idb';

const DB_NAME = 'pwa-db';
const STORE = 'entries';
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

export async function saveEntry(entry) {
  const db = await getDB();
  return db.add(STORE, { ...entry, createdAt: Date.now() });
}

export async function getAllEntries() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function deleteEntry(id) {
  const db = await getDB();
  return db.delete(STORE, id);
}

export async function clearAll() {
  const db = await getDB();
  return db.clear(STORE);
}
