// Store full local practice worlds in IndexedDB, never in Preferences.
export class PracticeStore {
  private db: Promise<IDBDatabase> | null = null;
  private open() {
    if (!this.db) this.db = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('consequences-device-practice', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('worlds', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => { this.db = null; reject(new Error('Practice storage is unavailable on this device.')); };
    });
    return this.db;
  }
  async get(id: string) {
    const db = await this.open();
    return new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction('worlds', 'readonly'), request = tx.objectStore('worlds').get(id);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
  }
  async put(row: unknown) {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('worlds', 'readwrite'); tx.objectStore('worlds').put(row);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
  async clear() {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('worlds', 'readwrite'); tx.objectStore('worlds').clear();
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  }
}
