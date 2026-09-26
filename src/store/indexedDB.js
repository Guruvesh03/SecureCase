// ============================================================
// IndexedDB — File Blob Storage
// ============================================================

const DB_NAME = 'securecase_files';
const DB_VERSION = 1;
const STORE = 'files';

let db = null;

const openDB = () =>
  new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'docId' });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });

export const saveFileBlob = async (docId, file) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const arrayBuffer = file.arrayBuffer
      ? file.arrayBuffer()
      : Promise.resolve(new ArrayBuffer(0));
    arrayBuffer.then((buffer) => {
      const tx = database.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const req = store.put({
        docId,
        buffer,
        name: file.name,
        type: file.type,
        size: file.size,
      });
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  });
};

export const getFileBlob = async (docId) => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(docId);
    req.onsuccess = (e) => {
      const record = e.target.result;
      if (!record) return resolve(null);
      const blob = new Blob([record.buffer], { type: record.type });
      resolve({ blob, name: record.name, type: record.type });
    };
    req.onerror = (e) => reject(e.target.error);
  });
};
