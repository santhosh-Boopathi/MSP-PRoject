import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('msp_token');
    if (token) {
      api.get('/auth/verify')
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('msp_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async (credential) => {
    const r = await api.post('/auth/google', { credential });
    localStorage.setItem('msp_token', r.data.token);
    setUser(r.data.user);
    return r.data;
  };

  const loginDemo = async (email) => {
    const r = await api.post('/auth/demo', { email });
    localStorage.setItem('msp_token', r.data.token);
    setUser(r.data.user);
    return r.data;
  };

  const logout = () => {
    localStorage.removeItem('msp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
