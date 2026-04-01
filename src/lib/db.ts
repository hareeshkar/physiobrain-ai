import { CaseConfig, BookCaseDetails } from '../types';

// Session types
export interface ChatMessage {
  id: string;
  role: 'user' | 'patient' | 'system';
  content: string;
}

export interface SessionHistory {
  id: string;
  type: 'simulator' | 'exam';
  config: CaseConfig;
  caseDetails?: any;
  messages?: ChatMessage[];
  clinicalNotes?: string;
  studentAnswers?: string;
  feedback?: string;
  diagnosis?: string;
  completedAt: number;
  duration: number; // seconds
  ended: boolean; // true if user clicked "End & Evaluate"
}

export interface ActiveSession {
  id: string;
  type: 'simulator' | 'exam';
  config: CaseConfig;
  caseDetails?: any;
  messages: ChatMessage[];
  clinicalNotes: string;
  studentAnswers: string;
  startedAt: number;
  lastUpdatedAt: number;
  ended: boolean; // true if user clicked "End & Evaluate"
}

const DB_NAME = 'PhysioBrainDB';
const DB_VERSION = 2;

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store completed session history
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('completedAt', 'completedAt', { unique: false });
        historyStore.createIndex('type', 'type', { unique: false });
      }

      // Store active sessions for resume (includes generated case data)
      if (!db.objectStoreNames.contains('activeSessions')) {
        const activeStore = db.createObjectStore('activeSessions', { keyPath: 'id' });
        activeStore.createIndex('lastUpdatedAt', 'lastUpdatedAt', { unique: false });
        activeStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

// History operations
export async function saveSessionToHistory(session: SessionHistory): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSessionHistory(limit = 50): Promise<SessionHistory[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const index = store.index('completedAt');
    const request = index.openCursor(null, 'prev');

    const results: SessionHistory[] = [];
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getSessionById(id: string): Promise<SessionHistory | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const request = tx.objectStore('history').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearHistory(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    tx.objectStore('history').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Active session operations
export async function saveActiveSession(session: ActiveSession): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeSessions', 'readwrite');
    tx.objectStore('activeSessions').put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getActiveSession(type: 'simulator' | 'exam'): Promise<ActiveSession | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeSessions', 'readonly');
    const store = tx.objectStore('activeSessions');
    const index = store.index('lastUpdatedAt');
    const request = index.openCursor(null, 'prev');

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const session = cursor.value;
        if (session.type === type) {
          resolve(session);
        } else {
          cursor.continue();
        }
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getActiveSessionById(id: string): Promise<ActiveSession | undefined> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeSessions', 'readonly');
    const request = tx.objectStore('activeSessions').get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getActiveSessions(limit = 50): Promise<ActiveSession[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeSessions', 'readonly');
    const store = tx.objectStore('activeSessions');
    const index = store.index('lastUpdatedAt');
    const request = index.openCursor(null, 'prev');

    const results: ActiveSession[] = [];
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteActiveSession(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeSessions', 'readwrite');
    tx.objectStore('activeSessions').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearActiveSessions(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activeSessions', 'readwrite');
    tx.objectStore('activeSessions').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
