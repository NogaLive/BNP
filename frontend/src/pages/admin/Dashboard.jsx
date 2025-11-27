import React, { useEffect, useState } from 'react'; // <-- IMPORT REACT AÑADIDO
import client from '../../api/client';
import { Download } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [topLibros, setTopLibros] = useState([]);
  const [riskUsers, setRiskUsers] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resKpi, resLibros, resUsers] = await Promise.all([
          client.get('/admin/reportes/general'),
          client.get('/admin/reportes/top-libros'),
          client.get('/admin/reportes/usuarios-riesgo')
        ]);
        setKpis(resKpi.data);
        setTopLibros(resLibros.data);
        setRiskUsers(resUsers.data);
      } catch (e) { console.error(e); }
    };
    loadData();
  }, []);

  const descargarReporte = async (tipo) => {
    try {
      const response = await client.get(`/admin/reportes/exportar/${tipo}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo}_reporte.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Error al descargar reporte");
    }
  };

  if (!kpis) return <div className="p-10 text-center">Cargando métricas...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-secondary">📊 Tablero de Control</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Total Usuarios" value={kpis.total_usuarios} color="bg-accent" />
        <KpiCard title="Reservas Activas" value={kpis.reservas_en_curso} color="bg-green-600" />
        <KpiCard title="Faltas Hoy (No-Show)" value={kpis.faltas_hoy} color="bg-orange-500" />
        <KpiCard title="Usuarios Baneados" value={kpis.usuarios_baneados} color="bg-primary" />
      </div>

      {/* Botones de Exportación */}
      <div className="bg-white p-6 rounded-xl shadow-card border border-neutral-200">
        <h3 className="text-lg font-bold mb-4 text-neutral-700">📂 Exportar Datos</h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => descargarReporte('reservas')} className="btn-secondary flex gap-2 items-center text-sm">
            <Download size={16}/> Reporte de Reservas
          </button>
          <button onClick={() => descargarReporte('inventario')} className="bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-green-800 transition flex gap-2 items-center text-sm">
            <Download size={16}/> Inventario Completo
          </button>
          <button onClick={() => descargarReporte('usuarios')} className="bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-purple-800 transition flex gap-2 items-center text-sm">
            <Download size={16}/> Usuarios y Strikes
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Top Libros */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-neutral-200">
          <h3 className="text-lg font-bold mb-4 text-neutral-700">📚 Libros Más Solicitados</h3>
          <ul className="space-y-3">
            {topLibros.map((l, i) => (
              <li key={i} className="flex justify-between border-b border-neutral-100 pb-2 last:border-0">
                <span className="text-neutral-800 font-medium">{l.titulo}</span>
                <span className="font-bold text-accent">{l.solicitudes} reservas</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Usuarios en Riesgo */}
        <div className="bg-white p-6 rounded-xl shadow-card border border-neutral-200">
          <h3 className="text-lg font-bold mb-4 text-neutral-700">⚠️ Usuarios con Sanciones</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-neutral-500 uppercase border-b border-neutral-200">
                <th className="pb-2">Usuario</th>
                <th className="pb-2">DNI</th>
                <th className="pb-2 text-center">Strikes</th>
                <th className="pb-2 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {riskUsers.map((u, i) => (
                <tr key={i} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 font-medium">{u.nombre}</td>
                  <td className="text-neutral-500">{u.dni}</td>
                  <td className="font-bold text-center text-red-600">{u.strikes}</td>
                  <td className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.estado === 'BANEADO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>
                      {u.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-6 rounded-xl shadow-lg`}>
      <p className="text-xs opacity-90 font-bold uppercase tracking-wider">{title}</p>
      <p className="text-4xl font-extrabold mt-1">{value}</p>
    </div>
  );
}