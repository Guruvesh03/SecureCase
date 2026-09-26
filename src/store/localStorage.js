// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
import {
  SEED_USERS,
  SEED_CASES,
  SEED_DOCUMENTS,
  SEED_VERSIONS,
  SEED_AUDIT_LOGS,
} from './seedData.js';

const KEYS = {
  USERS: 'sc_users',
  CASES: 'sc_cases',
  DOCUMENTS: 'sc_documents',
  VERSIONS: 'sc_versions',
  AUDIT_LOGS: 'sc_audit_logs',
  SESSION: 'sc_session',
  SEEDED: 'sc_seeded',
};

const get = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const set = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write error', e);
  }
};

// ─── Seed ───────────────────────────────────────────────────
export const initSeedData = () => {
  if (get(KEYS.SEEDED)) return;
  set(KEYS.USERS, SEED_USERS);
  set(KEYS.CASES, SEED_CASES);
  set(KEYS.DOCUMENTS, SEED_DOCUMENTS);
  set(KEYS.VERSIONS, SEED_VERSIONS);
  set(KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  set(KEYS.SEEDED, true);
};

export const resetSeedData = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  initSeedData();
};

// ─── Session ────────────────────────────────────────────────
export const getSession = () => get(KEYS.SESSION);
export const setSession = (user) => set(KEYS.SESSION, user);
export const clearSession = () => localStorage.removeItem(KEYS.SESSION);

// ─── Users ──────────────────────────────────────────────────
export const getUsers = () => get(KEYS.USERS) || [];
export const getUserByEmail = (email) =>
  getUsers().find((u) => u.email === email);

// ─── Cases ──────────────────────────────────────────────────
export const getCases = () => get(KEYS.CASES) || [];
export const getCaseById = (id) => getCases().find((c) => c.id === id);
export const saveCase = (caseObj) => {
  const cases = getCases();
  const idx = cases.findIndex((c) => c.id === caseObj.id);
  if (idx >= 0) cases[idx] = caseObj;
  else cases.unshift(caseObj);
  set(KEYS.CASES, cases);
};
export const updateCase = (id, updates) => {
  const caseObj = getCaseById(id);
  if (!caseObj) return;
  saveCase({ ...caseObj, ...updates, id });
};

// ─── Documents ──────────────────────────────────────────────
export const getDocuments = () => get(KEYS.DOCUMENTS) || [];
export const getDocsByCase = (caseId) =>
  getDocuments().filter((d) => d.caseId === caseId);
export const getDocById = (id) => getDocuments().find((d) => d.id === id);
export const saveDocument = (doc) => {
  const docs = getDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.unshift(doc);
  set(KEYS.DOCUMENTS, docs);
};
export const updateDocument = (id, updates) => {
  const doc = getDocById(id);
  if (!doc) return;
  saveDocument({ ...doc, ...updates, id });
};

// ─── Versions ───────────────────────────────────────────────
export const getVersions = () => get(KEYS.VERSIONS) || [];
export const getVersionsByDoc = (docId) =>
  getVersions()
    .filter((v) => v.docId === docId)
    .sort((a, b) => b.version - a.version);
export const saveVersion = (ver) => {
  const versions = getVersions();
  versions.unshift(ver);
  set(KEYS.VERSIONS, versions);
};

// ─── Audit Logs ─────────────────────────────────────────────
export const getAuditLogs = () =>
  (get(KEYS.AUDIT_LOGS) || []).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
export const getAuditByCase = (caseId) =>
  getAuditLogs().filter((a) => a.caseId === caseId);
export const addAuditLog = (log) => {
  const logs = get(KEYS.AUDIT_LOGS) || [];
  const entry = {
    id: `AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  logs.unshift(entry);
  set(KEYS.AUDIT_LOGS, logs);
  return entry;
};
