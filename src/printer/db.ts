/**
 * IndexedDB – Print Engine persistence layer
 * Database is namespaced per store_id for multi-tenant isolation.
 */

const DB_PREFIX = "print-engine";
const DB_VERSION = 1;

export const STORES = {
  DEVICES: "devices",
  PRINTED_ORDERS: "printed-orders",
  QUEUE: "queue",
} as const;

const dbCache: Record<string, Promise<IDBDatabase>> = {};

/** Current active store_id – must be set before any DB operation */
let activeStoreId: string | null = null;

export function setActiveStoreId(storeId: string): void {
  activeStoreId = storeId;
}

export function getActiveStoreId(): string | null {
  return activeStoreId;
}

function getDBName(): string {
  if (!activeStoreId) throw new Error("[PrintDB] No active store_id set. Call setActiveStoreId() first.");
  return `${DB_PREFIX}-${activeStoreId}`;
}

export function getDB(): Promise<IDBDatabase> {
  const name = getDBName();
  if (dbCache[name]) return dbCache[name];

  dbCache[name] = new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.DEVICES)) {
        db.createObjectStore(STORES.DEVICES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.PRINTED_ORDERS)) {
        db.createObjectStore(STORES.PRINTED_ORDERS, { keyPath: "orderId" });
      }
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const store = db.createObjectStore(STORES.QUEUE, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      delete dbCache[name];
      reject(request.error);
    };
  });

  return dbCache[name];
}

/** Generic IndexedDB transaction helper */
export async function idbGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbClear(storeName: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
