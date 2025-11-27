import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { Book, Pencil, Power, RotateCcw, XCircle } from 'lucide-react';

export default function LibrosAdmin() {
  const [libros, setLibros] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ 
    titulo: '', autor: '', isbn: '', stock_total: 1, sede_id: '', disponible: true
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [resLibros, resSedes] = await Promise.all([
      client.get('/admin/libros'),
      client.get('/admin/sedes')
    ]);
    setLibros(resLibros.data);
    setSedes(resSedes.data.filter(s => s.activo));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sede_id) return alert('Debes seleccionar una sede');
    try {
      if (editingId) await client.put(`/admin/libros/${editingId}`, form);
      else await client.post('/admin/libros', form);
      alert('Guardado');
      resetForm();
      fetchData();
    } catch (err) { alert("Error"); }
  };

  const handleEdit = (libro) => {
    setEditingId(libro.id);
    setForm({ ...libro });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleState = async (libro) => {
    try { await client.put(`/admin/libros/${libro.id}`, { disponible: !libro.disponible }); fetchData(); } 
    catch (e) { alert("Error"); }
  };

  const handleDestroy = async (libro) => {
    if (!confirm("¿Eliminar definitivamente?")) return;
    try { await client.delete(`/admin/libros/${libro.id}/force`); fetchData(); } 
    catch (err) { alert("No se puede eliminar (historial existente)"); }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ titulo: '', autor: '', isbn: '', stock_total: 1, sede_id: '', disponible: true });
  };

  const ActionButtons = ({ l }) => (
    <div className="flex gap-2 justify-end">
       <button onClick={() => handleEdit(l)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Pencil size={18}/></button>
       <button onClick={() => handleToggleState(l)} className={`p-2 rounded ${l.disponible ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-600'}`}>
          {l.disponible ? <Power size={18}/> : <RotateCcw size={18}/>}
       </button>
       <button onClick={() => handleDestroy(l)} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><XCircle size={18}/></button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-secondary flex items-center gap-2">
        <Book /> Gestión de Libros
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* FORMULARIO */}
        <div className="lg:col-span-1 h-fit bg-white p-6 rounded-xl shadow-card border border-neutral-200 lg:sticky lg:top-4">
          <h2 className="text-lg font-bold mb-4 text-neutral-800">{editingId ? '✏️ Editar Libro' : '➕ Nuevo Libro'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Sede</label>
              <select className="w-full p-2.5 border border-neutral-300 rounded-lg bg-white" value={form.sede_id} onChange={e => setForm({...form, sede_id: e.target.value})} required>
                <option value="">-- Selecciona Sede --</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Título</label>
              <input className="w-full p-2.5 border border-neutral-300 rounded-lg" required value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase">Autor</label>
              <input className="w-full p-2.5 border border-neutral-300 rounded-lg" required value={form.autor} onChange={e => setForm({...form, autor: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase">ISBN</label>
                  <input className="w-full p-2.5 border border-neutral-300 rounded-lg" value={form.isbn} onChange={e => setForm({...form, isbn: e.target.value})}/>
               </div>
               <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase">Stock</label>
                  <input type="number" min="1" className="w-full p-2.5 border border-neutral-300 rounded-lg" value={form.stock_total} onChange={e => setForm({...form, stock_total: e.target.value})}/>
               </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-primary text-white py-2.5 rounded-lg font-bold shadow-md hover:bg-red-700 transition">{editingId ? 'Actualizar' : 'Guardar'}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 border rounded-lg text-neutral-600 hover:bg-neutral-100">Cancelar</button>}
            </div>
          </form>
        </div>

        {/* LISTADO */}
        <div className="lg:col-span-2">
          
          {/* MÓVIL (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {libros.map(l => (
              <div key={l.id} className={`bg-white p-5 rounded-xl shadow-sm border border-neutral-200 ${!l.disponible ? 'bg-gray-50' : ''}`}>
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-neutral-900 leading-tight pr-2 text-lg">{l.titulo}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${l.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                       {l.disponible ? 'Disp' : 'No Disp'}
                    </span>
                 </div>
                 <p className="text-sm text-neutral-600 mb-2">{l.autor}</p>
                 <div className="text-xs text-neutral-500 flex justify-between items-center mt-2 bg-neutral-50 p-2.5 rounded border border-neutral-100">
                    <span>{l.nombre_sede}</span>
                    <span className="font-mono font-bold text-secondary">Stock: {l.stock_total}</span>
                 </div>
                 <div className="pt-3 mt-3 border-t border-neutral-100">
                    <ActionButtons l={l} />
                 </div>
              </div>
            ))}
          </div>

          {/* ESCRITORIO (Tabla) */}
          <div className="hidden md:block bg-white rounded-xl shadow-card overflow-hidden border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600 uppercase font-bold text-xs">
                <tr>
                  <th className="p-4">Libro</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4 text-center">Stock</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {libros.map(l => (
                  <tr key={l.id} className="hover:bg-neutral-50">
                    <td className="p-4">
                      <div className="font-bold text-neutral-900">{l.titulo}</div>
                      <div className="text-xs text-neutral-500">{l.autor}</div>
                      <div className="text-[10px] text-primary font-mono mt-0.5">{l.codigo_inventario}</div>
                    </td>
                    <td className="p-4 text-neutral-600 text-xs">{l.nombre_sede}</td>
                    <td className="p-4 text-center font-bold text-neutral-700">{l.stock_total}</td>
                    <td className="p-4 text-center">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${l.disponible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {l.disponible ? 'Activo' : 'Baja'}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                       <ActionButtons l={l} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {libros.length === 0 && <div className="p-8 text-center text-neutral-400 border border-dashed border-neutral-200 rounded-xl bg-white mt-4">No hay libros registrados.</div>}
        </div>
      </div>
    </div>
  );
}