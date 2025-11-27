import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import client from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({ dni: decoded.sub, role: decoded.role || 'USER' });
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // --- 1. LOGIN ---
  const login = async (dni, password) => {
    const formData = new URLSearchParams();
    formData.append('username', dni);
    formData.append('password', password);

    const { data } = await client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    localStorage.setItem('token', data.access_token);
    const decoded = jwtDecode(data.access_token);
    
    const userData = { dni: decoded.sub, role: decoded.role || 'USER' };
    setUser(userData);
    
    return userData; // Retornamos datos para que el modal pueda redirigir si es ADMIN
  };

  // --- 2. REGISTRO ---
  const register = async (datos) => {
    await client.post('/auth/register', datos);
    // Auto-login después del registro
    return await login(datos.dni, datos.password);
  };

  // --- 3. LOGOUT (Definido ANTES del return) ---
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  // --- 4. RECUPERACIÓN DE CONTRASEÑA ---
  const forgotPassword = async (dni, email) => {
    await client.post('/auth/forgot', { dni, email });
  };

  const verifyCode = async (dni, email, code) => {
    await client.post('/auth/forgot/verify', { dni, email, code });
  };

  const resetPassword = async (dni, email, code, newPassword) => {
    await client.post('/auth/forgot/reset', { dni, email, code, new_password: newPassword });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      login, 
      logout,        // Ahora 'logout' ya existe aquí
      register, 
      forgotPassword, 
      verifyCode, 
      resetPassword 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);