import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ReservaModal from '../../components/modals/ReservaModal';
import { Monitor, Users, MapPin, Search, Filter, LayoutGrid } from 'lucide-react';

export default function Recursos() {
  const [items, setItems] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Filtros
  const [filtroSede, setFiltroSede] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let url = '/catalogo/recursos?';
      if (filtroSede) url += `&sede_id=${filtroSede}`;
      if (filtroTipo) url += `&tipo=${filtroTipo}`;
      const res = await client.get(url);
      setItems(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    client.get('/catalogo/sedes').then(res => setSedes(res.data.filter(s => s.activo)));
    cargarDatos();
  }, []);

  const handleAgendar = (item) => {
    setSelectedItem(item);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* Header */}
      <div className="bg-primary text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <LayoutGrid className="text-white/80" size={32} />
            Reserva de Espacios y Equipos
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Encuentra el lugar ideal para estudiar, investigar o reunirte en nuestras sedes.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        
        {/* Filtros */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-neutral-100 flex flex-col md:flex-row gap-4 items-end">
          
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5 ml-1">Tipo de Recurso</label>
            <div className="relative">
              <Monitor className="absolute left-3 top-3 text-neutral-400" size={20} />
              <select 
                className="w-full pl-10 p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-neutral-50 focus:bg-white appearance-none cursor-pointer"
                value={filtroTipo}
                onChange={e => setFiltroTipo(e.target.value)}
              >
                <option value="">Todos los recursos</option>
                <option value="SALA">Salas de Estudio</option>
                <option value="EQUIPO">Equipos Multimedia</option>
              </select>
            </div>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5 ml-1">Ubicación (Sede)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-neutral-400" size={20} />
              <select 
                className="w-full pl-10 p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-neutral-50 focus:bg-white appearance-none cursor-pointer"
                value={filtroSede}
                onChange={e => setFiltroSede(e.target.value)}
              >
                <option value="">Todas las Sedes</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={cargarDatos} 
            className="w-full md:w-auto flex-1 bg-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-900 transition shadow-md flex justify-center items-center gap-2"
          >
            <Search size={18} /> Filtrar Resultados
          </button>
        </div>

        {/* Grid de Resultados */}
        <div className="py-10">
          {loading ? (
            <div className="text-center py-20 text-neutral-500 animate-pulse">Buscando espacios disponibles...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-neutral-300">
              <LayoutGrid size={48} className="mx-auto text-neutral-200 mb-4" />
              <p className="text-neutral-500 font-medium">No hay recursos disponibles con estos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(item => (
                <div key={item.id} className="group bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl transition-colors ${item.tipo_recurso === 'SALA' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                        {item.tipo_recurso === 'SALA' ? <Users size={24}/> : <Monitor size={24}/>}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide ${item.disponible ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-500'}`}>
                        {item.disponible ? 'DISPONIBLE' : 'OCUPADO'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 mb-2 leading-snug">{item.nombre}</h3>
                    
                    <div className="space-y-2 text-sm text-neutral-600 mb-6">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-neutral-400" />
                        <span className="font-medium">{item.nombre_sede}</span>
                      </div>
                      {item.capacidad > 0 && (
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-neutral-400" />
                          <span>Aforo: <strong>{item.capacidad} personas</strong></span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleAgendar(item)}
                      disabled={!item.disponible}
                      className="w-full py-3 rounded-lg font-bold border-2 border-secondary text-secondary hover:bg-secondary hover:text-white transition-all disabled:opacity-50 disabled:border-neutral-200 disabled:text-neutral-400"
                    >
                      {item.disponible ? 'Ver Horarios' : 'No Disponible'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReservaModal 
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        type="SALA"
        item={selectedItem}
        onSuccess={cargarDatos} 
      />
    </div>
  );
}