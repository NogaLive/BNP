import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext'; // IMPORTAR
import { BookOpen, Monitor, LogOut, User, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { openAuthModal } = useModal(); // USAR EL HOOK

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <span className="text-white font-bold text-xl">BNP</span>
            </div>
            <span className="font-semibold text-secondary text-lg hidden sm:block">
              Portal de Servicios
            </span>
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link to="/libros" className="flex items-center gap-1 text-neutral-600 hover:text-primary transition font-medium">
              <BookOpen size={18} /> Libros
            </Link>
            <Link to="/recursos" className="flex items-center gap-1 text-neutral-600 hover:text-primary transition font-medium">
              <Monitor size={18} /> Salas y Equipos
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'ADMIN' && (
                  <Link to="/admin/dashboard" className="flex items-center gap-1 text-accent font-medium hover:underline">
                    <LayoutDashboard size={18} /> Admin
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-neutral-700 border-l pl-4 border-neutral-200">
                  <User size={16} />
                  <span className="font-mono font-medium">{user.dni}</span>
                </div>
                <button onClick={logout} className="p-2 text-neutral-400 hover:text-primary hover:bg-red-50 rounded-full transition" title="Salir">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              /* AQUI ESTA EL CAMBIO PRINCIPAL: Botón en lugar de Link */
              <button 
                onClick={() => openAuthModal('LOGIN')} 
                className="btn-secondary shadow-none py-2 px-5 rounded-full text-sm"
              >
                Ingresar
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}