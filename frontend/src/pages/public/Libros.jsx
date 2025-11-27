import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ReservaModal from '../../components/modals/ReservaModal';
import { Search, Filter, BookOpen, MapPin, AlertCircle } from 'lucide-react';

export default function Libros() {
  const [libros, setLibros] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Estados para filtros
  const [sedes, setSedes] = useState([]);
  const [filtroSede, setFiltroSede] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let url = `/catalogo/libros?q=${busqueda}`;
      if (filtroSede) url += `&sede_id=${filtroSede}`;
      const res = await client.get(url);
      setLibros(res.data);
    } catch (error) {
      console.error("Error cargando libros", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    client.get('/catalogo/sedes').then(res => setSedes(res.data));
    cargarDatos();
  }, []);

  const handleReservarClick = (libro) => {
    setSelectedBook(libro);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header de Sección */}
      <div className="bg-secondary text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="text-red-500" size={32} />
            Catálogo Bibliográfico
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Explora nuestra colección física disponible para préstamo en sala o a domicilio.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        
        {/* Barra de Filtros (Flotante) */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5 ml-1">Búsqueda</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-neutral-400" size={20} />
              <input 
                placeholder="Título, autor o ISBN..." 
                className="w-full pl-10 p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition bg-neutral-50 focus:bg-white"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cargarDatos()}
              />
            </div>
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5 ml-1">Sede</label>
            <div className="relative">
              <Filter className="absolute left-3 top-3 text-neutral-400" size={20} />
              <select 
                className="w-full pl-10 p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-secondary outline-none bg-neutral-50 focus:bg-white appearance-none cursor-pointer"
                value={filtroSede}
                onChange={e => setFiltroSede(e.target.value)}
              >
                <option value="">Todas las sedes</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={cargarDatos} 
            className="w-full md:w-auto bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 transition shadow-md flex justify-center items-center gap-2"
          >
            <Search size={18} /> Buscar
          </button>
        </div>

        {/* Resultados */}
        <div className="py-10">
          {loading ? (
            <div className="text-center py-20 text-neutral-500 animate-pulse">Cargando catálogo...</div>
          ) : libros.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-neutral-300">
              <BookOpen size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500 font-medium">No se encontraron libros con esos criterios.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libros.map(libro => (
                <div key={libro.id} className="group bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                      <MapPin size={12} /> {libro.nombre_sede}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${libro.disponible ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {libro.disponible ? 'DISPONIBLE' : 'AGOTADO'}
                    </span>
                  </div>

                  <h3 className="font-bold text-xl text-neutral-900 mb-1 leading-tight group-hover:text-primary transition-colors">
                    {libro.titulo}
                  </h3>
                  <p className="text-neutral-600 text-sm mb-4 font-medium">{libro.autor}</p>
                  
                  <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-mono">ISBN: {libro.isbn || 'N/A'}</span>
                    
                    <button 
                      onClick={() => handleReservarClick(libro)}
                      disabled={!libro.disponible}
                      className="bg-neutral-900 text-white text-sm px-5 py-2.5 rounded-lg font-bold hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Solicitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Reutilizable */}
      <ReservaModal 
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        type="LIBRO"
        item={selectedBook}
        onSuccess={cargarDatos}
      />
    </div>
  );
}