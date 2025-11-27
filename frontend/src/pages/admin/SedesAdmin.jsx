import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { Pencil, Trash2, RotateCcw, Building2, XCircle, MapPin, Phone } from 'lucide-react';

export default function SedesAdmin() {
  const [sedes, setSedes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ 
    nombre: '', 
    direccion: '', 
    telefono: '' 
  });

  const fetchSedes = async () => {
    const res = await client.get('/admin/sedes');
    setSedes(res.data);
  };

  useEffect(() => { fetchSedes(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await client.put(`/admin/sedes/${editingId}`, form);
        alert('Sede actualizada correctamente');
      } else {
        await client.post('/admin/sedes', form);
        alert('Sede creada exitosamente');
      }
      resetForm();
      fetchSedes();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error en la operación');
    }
  };

  const handleEdit = (sede) => {
    setEditingId(sede.id);
    setForm({ 
      nombre: sede.nombre, 
      direccion: sede.direccion, 
      telefono: sede.telefono || '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleState = async (sede) => {
    const action = sede.activo ? 'enviar a papelera' : 'reactivar';
    if (!confirm(`¿Deseas ${action} la sede "${sede.nombre}"?`)) return;

    try {
      if (sede.activo) {
        await client.delete(`/admin/sedes/${sede.id}`);
      } else {
        await client.put(`/admin/sedes/${sede.id}`, { activo: true });
      }
      fetchSedes();
    } catch (err) {
      alert("Error al cambiar estado");
    }
  };

  const handleDestroy = async (sede) => {
    if (!confirm(`⚠️ ¿ELIMINAR DEFINITIVAMENTE "${sede.nombre}"?\n\nEsta acción es irreversible.`)) return;

    try {
      await client.delete(`/admin/sedes/${sede.id}/force`);
      alert("Sede eliminada de la base de datos.");
      fetchSedes();
    } catch (err) {
      alert(err.response?.data?.detail || "No se pudo eliminar.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ nombre: '', direccion: '', telefono: '' });
  };

  // Componente auxiliar para no repetir botones en Móvil y PC
  const ActionButtons = ({ s }) => (
    <div className="flex gap-2 justify-end">
      {s.activo && (
        <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition" title="Editar">
          <Pencil size={18} />
        </button>
      )}
      <button 
        onClick={() => handleToggleState(s)}
        className={`p-2 rounded-lg transition ${s.activo ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
        title={s.activo ? "Mover a Papelera" : "Restaurar"}
      >
        {s.activo ? <Trash2 size={18} /> : <RotateCcw size={18} />}
      </button>
      {!s.activo && (
        <button onClick={() => handleDestroy(s)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition" title="Eliminar Definitivamente">
          <XCircle size={18} />
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-secondary mb-8 flex items-center gap-2">
        <Building2 /> Gestión de Sedes
      </h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Formulario Lateral */}
        <div className="lg:col-span-1 h-fit bg-white p-6 rounded-xl shadow-card border border-neutral-200 sticky top-4">
          <h2 className="text-xl font-bold mb-4 text-neutral-800">
            {editingId ? '✏️ Editar Sede' : '➕ Nueva Sede'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre</label>
              <input 
                placeholder="Ej: Sede Central" 
                value={form.nombre} 
                onChange={e => setForm({...form, nombre: e.target.value})}
                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Dirección</label>
              <input 
                placeholder="Av. Abancay 4ta Cdra" 
                value={form.direccion} 
                onChange={e => setForm({...form, direccion: e.target.value})}
                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Teléfono</label>
              <input 
                placeholder="(01) 513-6900" 
                value={form.telefono} 
                onChange={e => setForm({...form, telefono: e.target.value})}
                className="w-full p-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all" 
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button className={`flex-1 py-2.5 rounded-lg font-bold text-white transition shadow-md ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-secondary hover:bg-secondary/90'}`}>
                {editingId ? 'Actualizar Sede' : 'Guardar Sede'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-600 hover:bg-neutral-100 font-medium">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Listado */}
        <div className="lg:col-span-2">
          
          {/* --- VISTA MÓVIL (TARJETAS) --- */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sedes.map(s => (
              <div key={s.id} className={`bg-white p-5 rounded-xl shadow-sm border border-neutral-200 ${!s.activo ? 'bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className={`font-bold text-lg ${!s.activo ? 'text-gray-500 line-through' : 'text-neutral-800'}`}>{s.nombre}</h3>
                    <span className="text-xs font-mono text-primary bg-red-50 px-2 py-0.5 rounded">{s.codigo}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-neutral-600 mb-4">
                   <p className="flex items-center gap-2"><MapPin size={16} className="text-neutral-400"/> {s.direccion}</p>
                   {s.telefono && <p className="flex items-center gap-2"><Phone size={16} className="text-neutral-400"/> {s.telefono}</p>}
                </div>

                <div className="pt-3 border-t border-neutral-100">
                   <ActionButtons s={s} />
                </div>
              </div>
            ))}
          </div>

          {/* --- VISTA ESCRITORIO (TABLA ORIGINAL) --- */}
          <div className="hidden md:block bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50 text-neutral-600 text-xs uppercase font-bold border-b border-neutral-200">
                <tr>
                  <th className="p-4">Código</th>
                  <th className="p-4">Detalles</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sedes.map(s => (
                  <tr key={s.id} className={`hover:bg-neutral-50 transition ${!s.activo ? 'bg-gray-50' : ''}`}>
                    <td className="p-4 font-mono text-sm text-primary font-bold">{s.codigo}</td>
                    <td className="p-4">
                      <p className={`font-bold ${!s.activo ? 'text-gray-500 line-through' : 'text-neutral-800'}`}>{s.nombre}</p>
                      <p className="text-sm text-neutral-500">{s.direccion}</p>
                      {s.telefono && <p className="text-xs text-neutral-400 mt-1">📞 {s.telefono}</p>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {s.activo ? 'Activo' : 'Papelera'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <ActionButtons s={s} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sedes.length === 0 && (
            <div className="p-10 text-center text-neutral-400 text-sm bg-white rounded-xl border border-dashed border-neutral-300 mt-4">
              <Building2 size={40} className="mx-auto mb-2 opacity-20" />
              <p>No hay sedes registradas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}