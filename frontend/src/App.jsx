import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext'; // IMPORTAR

// Layouts & Modals
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import AdminLayout from './components/Layout/AdminLayout';
import AuthModal from './components/modals/AuthModal'; // EL MODAL

// Pages
import Home from './pages/public/Home';
import Libros from './pages/public/Libros';
import Recursos from './pages/public/Recursos'; 
// import Login from './pages/auth/Login'; // YA NO ES NECESARIO

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import SedesAdmin from './pages/admin/SedesAdmin';
import LibrosAdmin from './pages/admin/LibrosAdmin';
import RecursosAdmin from './pages/admin/RecursosAdmin';
import ValidarQR from './pages/admin/Validar';

export default function App() {
  return (
    <ModalProvider> {/* 1. MODAL PROVIDER PRIMERO */}
      <AuthProvider>
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-800">
          <Header />
          
          {/* 2. EL MODAL GLOBAL SE RENDERIZA AQUÍ */}
          <AuthModal />

          <main className="pb-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/libros" element={<Libros />} />
              <Route path="/recursos" element={<Recursos />} /> 
              
              {/* La ruta /login ya no existe, si alguien intenta entrar, al home */}
              <Route path="/login" element={<Navigate to="/" replace />} />

              {/* Rutas Admin */}
              <Route path="/admin" element={
                <PrivateRoute roleRequired="ADMIN"><AdminLayout /></PrivateRoute>
              }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sedes" element={<SedesAdmin />} />
                <Route path="libros" element={<LibrosAdmin />} />
                <Route path="recursos" element={<RecursosAdmin />} />
                <Route path="validar" element={<ValidarQR />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </ModalProvider>
  );
}