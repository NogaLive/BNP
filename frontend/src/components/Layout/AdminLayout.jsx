import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, Book, Monitor, Building2, 
  QrCode, TrendingUp, Menu, X 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Validar QR', to: '/admin/validar', icon: QrCode },
  { name: '— Gestión de Inventario —', divider: true },
  { name: 'Sedes (Ubicación)', to: '/admin/sedes', icon: Building2 },
  { name: 'Libros', to: '/admin/libros', icon: Book },
  { name: 'Salas y Equipos', to: '/admin/recursos', icon: Monitor },
  { name: '— Analítica y Reportes —', divider: true },
  { name: 'Reportes KPI', to: '/admin/dashboard', icon: TrendingUp }, // Apunta al mismo dash por ahora
];

const AdminLayout = ({ children }) => {
  // Estado para controlar el menú en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-neutral-50 relative">
      
      {/* --- BACKDROP (Fondo oscuro en móvil) --- */}
      {/* Solo visible si el sidebar está abierto en móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Adaptable) --- */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 shadow-xl transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:shadow-none md:block
        `}
      >
        {/* Cabecera del Sidebar (Solo móvil) para cerrar */}
        <div className="flex justify-between items-center p-4 md:hidden border-b border-neutral-100">
          <span className="font-bold text-secondary text-lg">Menú Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="text-neutral-500">
            <X size={24} />
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav className="p-4 space-y-1 h-full overflow-y-auto">
          {navItems.map((item, index) => (
            item.divider ? (
              <p key={index} className="text-[10px] text-neutral-400 font-bold uppercase mt-6 mb-2 tracking-wider">
                {item.name}
              </p>
            ) : (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setSidebarOpen(false)} // Cerrar menú al hacer click (móvil)
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-secondary text-white shadow-md font-medium' 
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-secondary'
                  }`
                }
              >
                <item.icon size={20} className={({ isActive }) => isActive ? "text-white mr-3" : "text-neutral-400 mr-3"} />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            )
          ))}
        </nav>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Botón Hamburguesa (Solo visible en móvil) */}
        <div className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center gap-3 sticky top-0 z-20">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-neutral-800">Administración</span>
        </div>

        {/* El contenido real de la página */}
        <div className="p-4 lg:p-8 overflow-x-auto">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;