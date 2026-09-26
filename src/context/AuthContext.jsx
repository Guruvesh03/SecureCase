import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getSession,
  setSession,
  clearSession,
  getUserByEmail,
  addAuditLog,
} from '../store/localStorage.js';
import { PERMISSIONS } from '../store/seedData.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const found = getUserByEmail(email);
    if (!found || found.password !== password) {
      return { success: false, error: 'Invalid credentials' };
    }
    const session = { ...found };
    delete session.password;
    setSession(session);
    setUser(session);
    addAuditLog({
      action: 'USER_LOGIN',
      user: found.name,
      userId: found.id,
      role: found.role,
      caseId: null,
      documentId: null,
      documentName: null,
      description: `${found.name} (${found.role}) authenticated successfully`,
      type: 'auth',
      severity: 'info',
    });
    return { success: true, user: session };
  };

  const logout = () => {
    if (user) {
      addAuditLog({
        action: 'USER_LOGOUT',
        user: user.name,
        userId: user.id,
        role: user.role,
        caseId: null,
        documentId: null,
        documentName: null,
        description: `${user.name} session terminated`,
        type: 'auth',
        severity: 'info',
      });
    }
    clearSession();
    setUser(null);
  };

  const can = (action) => {
    if (!user) return false;
    const perms = PERMISSIONS[user.role];
    return perms ? !!perms[action] : false;
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
