// src/utils/idb.d.ts

// Declaramos el módulo '../utils/idb' para que TypeScript lo reconozca
declare module '../utils/idb' {
  // Define aquí los tipos esperados de cada función
 export interface Entry {
    id: number; 
    title: string;
    note: string;
    createdAt: string; 
}

  export function saveEntry(entry: Entry): Promise<void>;
  export function getAllEntries(): Promise<Entry[]>;
  export function deleteEntry(id: number): Promise<void>;
}
