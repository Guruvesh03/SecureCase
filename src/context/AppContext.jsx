import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  getCases,
  getDocuments,
  getAuditLogs,
  getVersions,
  saveCase,
  saveDocument,
  addAuditLog as storeAddAudit,
  updateDocument,
  updateCase,
} from '../store/localStorage.js';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [cases, setCases] = useState(() => getCases());
  const [documents, setDocuments] = useState(() => getDocuments());
  const [auditLogs, setAuditLogs] = useState(() => getAuditLogs());
  const [versions, setVersions] = useState(() => getVersions());

  const refreshAll = useCallback(() => {
    setCases(getCases());
    setDocuments(getDocuments());
    setAuditLogs(getAuditLogs());
    setVersions(getVersions());
  }, []);

  const addAuditLog = useCallback((log) => {
    storeAddAudit(log);
    setAuditLogs(getAuditLogs());
  }, []);

  const addCase = useCallback((caseObj) => {
    saveCase(caseObj);
    setCases(getCases());
  }, []);

  const addDocument = useCallback((doc) => {
    saveDocument(doc);
    setDocuments(getDocuments());
  }, []);

  const patchDocument = useCallback((id, updates) => {
    updateDocument(id, updates);
    setDocuments(getDocuments());
  }, []);

  const patchCase = useCallback((id, updates) => {
    updateCase(id, updates);
    setCases(getCases());
  }, []);

  return (
    <AppContext.Provider
      value={{
        cases,
        documents,
        auditLogs,
        versions,
        refreshAll,
        addAuditLog,
        addCase,
        addDocument,
        patchDocument,
        patchCase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
