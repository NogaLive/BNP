import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { Monitor, Users, Trash2, Pencil, Power, XCircle, RotateCcw } from 'lucide-react';

export default function RecursosAdmin() {
  const [items, setItems] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ 
    nombre: '', tipo_recurso: 'SALA', sede_id: '', capacidad: 4, disponible: true 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [resItems, resSedes] = await Promise.all([
      client.get('/admin/recursos'),
      client.get('/admin/sedes')
    ]);
    setItems(resItems.data);
    setSedes(resSedes.data.filter(s => s.activo));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sede_id) return alert("Selecciona una sede");
    
    try {
      if (editingId) {
        await client.put(`/admin/recursos/${editingId}`, form);
        alert('Recurso actualizado');
      } else {
        await client.post('/admin/recursos', form);
        alert('Recurso creado');
      }
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...item });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleState = async (item) => {
    try { await client.put(`/admin/recursos/${item.id}`, { disponible: !item.disponible }); fetchData(); } 
    catch (e) { alert("Error al cambiar estado"); }
  };

  const handleDestroy = async (item) => {
    if (!confirm("¿Eliminar definitivamente?")) return;
    try { await client.delete(`/admin/recursos/${item.id}/force`); fetchData(); } 
    catch (e) { alert("No se puede eliminar (tiene historial)"); }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ nombre: '', tipo_recurso: 'SALA', sede_id: '', capacidad: 4, disponible: true });
  };

  const ActionButtons = ({ item }) => (
    <div className="flex gap-2 justify-end">
      <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Pencil size={18}/></button>
      <button onClick={() => handleToggleState(item)} className={`p-2 rounded ${item.disponible ? 'text-orange-500 bg-orange-50' : 'text-green-600 bg-green-50'}`}>
        {item.disponible ? <Power size={18}/> : <RotateCcw size={18}/>}
      </button>
      <button onClick={() => handleDestroy(item)} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100"><XCircle size={18}/></button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-secondary flex items-center gap-2">
        <Monitor /> Gestión de Salas y Equipos
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* FORMULARIO */}
        <div className="lg:col-span-1 h-fit bg-white p-6 rounded-xl shadow-card border border-neutral-200 sticky top-4">
          <h2 className="text-lg font-bold mb-4 text-neutral-800">{editingId ? '✏️ Editar Recurso' : '➕ Nuevo Recurso'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Sede</label>
              <select className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white" value={form.sede_id} onChange={e => setForm({...form, sede_id: e.target.value})} required>
                <option value="">-- Seleccionar --</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase">Tipo</label>
                  <select className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white" value={form.tipo_recurso} onChange={e => setForm({...form, tipo_recurso: e.target.value})}>
                    <option value="SALA">Sala</option>
                    <option value="EQUIPO">Equipo</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase">Capacidad</label>
                  <input type="number" min="1" className="w-full p-2.5 border border-neutral-300 rounded-lg" value={form.capacidad} onChange={e => setForm({...form, capacidad: e.target.value})}/>
               </div>
            </div>
            <div>
               <label className="text-xs font-bold text-neutral-500 uppercase">Nombre</label>
               <input className="w-full p-2.5 border border-neutral-300 rounded-lg" required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Sala 101"/>
            </div>
            <div className="flex gap-2 pt-2">
               <button className="flex-1 bg-secondary text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-900 transition">{editingId ? 'Actualizar' : 'Crear'}</button>
               {editingId && <button type="button" onClick={resetForm} className="px-4 border rounded-lg text-neutral-600 hover:bg-neutral-100">Cancelar</button>}
            </div>
          </form>
        </div>

        {/* LISTADO */}
        <div className="lg:col-span-2">
          
          {/* VISTA MÓVIL (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {items.map(item => (
              <div key={item.id} className={`bg-white p-5 rounded-xl shadow-sm border border-neutral-200 ${!item.disponible ? 'bg-gray-50' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${item.tipo_recurso === 'SALA' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {item.tipo_recurso === 'SALA' ? <Users size={20}/> : <Monitor size={20}/>}
                     </div>
                     <div>
                        <h3 className="font-bold text-neutral-900">{item.nombre}</h3>
                        <p className="text-xs text-neutral-500">{item.nombre_sede}</p>
                     </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.disponible ? 'Disp' : 'No Disp'}
                  </span>
                </div>
                <div className="mt-3 mb-4 text-sm text-neutral-600">
                   <p><strong>Capacidad:</strong> {item.capacidad} pax</p>
                   <p className="font-mono text-xs text-neutral-400 mt-1">{item.codigo_inventario}</p>
                </div>
                <div className="pt-3 border-t border-neutral-100">
                  <ActionButtons item={item} />
                </div>
              </div>
            ))}
          </div>

          {/* VISTA ESCRITORIO (Tabla) */}
          <div className="hidden md:block bg-white rounded-xl shadow-card overflow-hidden border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 uppercase font-bold text-xs">
                <tr>
                  <th className="p-4">Recurso</th>
                  <th className="p-4">Detalle</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50">
                    <td className="p-4 font-bold text-neutral-900">{item.nombre}</td>
                    <td className="p-4 text-neutral-600">
                       <span className="block text-xs font-bold text-secondary">{item.tipo_recurso}</span>
                       <span className="text-xs">{item.nombre_sede} • {item.capacidad} pax</span>
                    </td>
                    <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.disponible ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <ActionButtons item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length === 0 && <div className="p-8 text-center text-neutral-400 border border-dashed border-neutral-200 rounded-xl bg-white mt-4">No hay recursos registrados.</div>}
        </div>
      </div>
    </div>
  );
}