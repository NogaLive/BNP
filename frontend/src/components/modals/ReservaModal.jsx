import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css';
import { QRCodeSVG } from 'qrcode.react';
import { X, BookOpen, Monitor, AlertCircle, Calendar as CalendarIcon, CheckCircle } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

const HORARIOS_SALA = [
  { label: "10:00 - 11:50", start: "10:00", end: "11:50" },
  { label: "12:00 - 13:50", start: "12:00", end: "13:50" },
  { label: "14:00 - 15:50", start: "14:00", end: "15:50" },
  { label: "16:00 - 17:50", start: "16:00", end: "17:50" },
  { label: "18:00 - 19:50", start: "18:00", end: "19:50" },
  { label: "20:00 - 21:50", start: "20:00", end: "21:50" },
];

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const countDays = (start, end) => {
  const s = normalizeDate(start);
  const e = normalizeDate(end);
  return Math.round(Math.abs(e - s) / 86400000) + 1;
};

export default function ReservaModal({ isOpen, onClose, type, item, onSuccess }) {
  const { user } = useAuth();
  const { openAuthModal } = useModal();
  
  const [step, setStep] = useState('FORM'); 
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateSelection, setDateSelection] = useState(null);
  const [activeStartDate, setActiveStartDate] = useState(new Date());
  
  const [slotsOcupados, setSlotsOcupados] = useState([]);
  const [diasSinStock, setDiasSinStock] = useState([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);

  // --- NUEVO: Estado para detectar login pendiente ---
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // --- NUEVO: Efecto para auto-enviar al detectar usuario ---
  useEffect(() => {
    if (user && pendingSubmit) {
      handleSubmit();
      setPendingSubmit(false); // Limpiar bandera
    }
  }, [user, pendingSubmit]);

  useEffect(() => {
    if (type === 'LIBRO' && item && isOpen) {
      const year = activeStartDate.getFullYear();
      const month = String(activeStartDate.getMonth() + 1).padStart(2, '0');
      const mesStr = `${year}-${month}`;
      
      setLoading(true);
      client.get(`/reservas/disponibilidad?tipo=LIBRO&libro_id=${item.id}&mes=${mesStr}`)
        .then(res => setDiasSinStock(res.data.fechas_sin_stock || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeStartDate, item, type, isOpen]);

  useEffect(() => {
    if (type === 'SALA' && dateSelection && !Array.isArray(dateSelection)) {
      const fechaIso = formatDateLocal(dateSelection);
      setSlotsOcupados([]);
      setSlotSeleccionado(null);

      client.get(`/reservas/disponibilidad?tipo=SALA&recurso_id=${item.id}&fecha=${fechaIso}`)
        .then(res => setSlotsOcupados(res.data.ocupados))
        .catch(console.error);
    }
  }, [dateSelection, item, type]);

  if (!isOpen || !item) return null;

  const tileDisabled = ({ date, view }) => {
    if (view !== 'month') return false;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (date < today) return true;
    if (date.getDay() === 0) return true;

    if (type === 'LIBRO' && diasSinStock.length > 0) {
      const dateStr = formatDateLocal(date);
      return diasSinStock.includes(dateStr);
    }
    return false;
  };

  const handleActiveStartDateChange = ({ activeStartDate }) => {
    setActiveStartDate(activeStartDate);
  };

  const handleDateChange = (value) => {
    setError(null);
    setDateSelection(value);
    
    if (type === 'LIBRO' && Array.isArray(value) && value[0] && value[1]) {
      const [start, end] = value;
      const days = countDays(start, end);
      
      if (days > 5) setError(`⚠️ Máximo 5 días. Seleccionaste ${days}.`);
      
      const startStr = formatDateLocal(start);
      const endStr = formatDateLocal(end);
      
      const rangoTieneCruce = diasSinStock.some(diaOcupado => 
        diaOcupado >= startStr && diaOcupado <= endStr
      );

      if (rangoTieneCruce) {
        setError("⚠️ El rango seleccionado incluye días sin stock disponible.");
      }
    }
  };

  const handleSubmit = async () => {
    // --- CAMBIO AQUÍ: Lógica de Login Pendiente ---
    if (!user) { 
      setPendingSubmit(true); // Marcar intención
      openAuthModal('LOGIN'); // Abrir Login encima
      return; // No cerrar este modal
    }

    if (error) return;

    setLoading(true);
    setError(null);

    try {
      let payload = { tipo: type };

      if (type === 'SALA') {
        if (!dateSelection || !slotSeleccionado) throw new Error("Selecciona día y horario.");
        const fechaStr = formatDateLocal(dateSelection);
        
        payload.recurso_id = item.id;
        payload.fecha_reserva = new Date(fechaStr).toISOString();
        payload.hora_inicio = new Date(`${fechaStr}T${slotSeleccionado.start}:00`).toISOString();
        payload.hora_fin = new Date(`${fechaStr}T${slotSeleccionado.end}:00`).toISOString();
      
      } else { 
        if (!Array.isArray(dateSelection) || !dateSelection[0] || !dateSelection[1]) {
          throw new Error("Selecciona rango de fechas.");
        }
        const [start, end] = dateSelection;
        const days = countDays(start, end);
        
        if (days > 5) throw new Error("El préstamo excede 5 días.");

        const startStr = formatDateLocal(start);
        const endStr = formatDateLocal(end);
        const rangoTieneCruce = diasSinStock.some(d => d >= startStr && d <= endStr);
        if (rangoTieneCruce) throw new Error("El rango incluye días sin stock.");

        payload.libro_id = item.id;
        payload.fecha_reserva = new Date().toISOString();
        payload.hora_inicio = new Date(`${startStr}T00:00:00`).toISOString();
        payload.hora_fin = new Date(`${endStr}T23:59:59`).toISOString();
      }

      const res = await client.post('/reservas/', payload);
      setQrData(res.data);
      setStep('QR');
      if (onSuccess) onSuccess();

    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Error al procesar.");
      setPendingSubmit(false); // Si falla, limpiar pendiente
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('FORM');
    setQrData(null);
    setDateSelection(null);
    setSlotSeleccionado(null);
    setSlotsOcupados([]);
    setError(null);
    setLoading(false);
    setActiveStartDate(new Date()); 
    setPendingSubmit(false); // Limpiar pendiente al cerrar manual
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        
        <div className="bg-secondary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/10 p-2 rounded-lg">
                {type === 'LIBRO' ? <BookOpen size={20} /> : <Monitor size={20} />}
            </div>
            <div>
                <h3 className="font-bold text-lg leading-tight">
                {step === 'QR' ? '¡Reserva Confirmada!' : type === 'LIBRO' ? 'Solicitar Préstamo' : 'Reservar Espacio'}
                </h3>
                <p className="text-xs text-blue-200 opacity-90">{item.nombre_sede}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white transition p-1 rounded hover:bg-white/10">
            <X size={28} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {step === 'FORM' ? (
            <div className="flex flex-col lg:flex-row gap-8">
              
              <div className="flex-1">
                <div className="mb-4">
                    <h4 className="font-bold text-xl text-neutral-800">{item.titulo || item.nombre}</h4>
                    <p className="text-sm text-neutral-500 mt-1">
                        {type === 'LIBRO' ? item.autor : `Capacidad: ${item.capacidad} personas`}
                    </p>
                </div>

                <div className="mb-2">
                    <p className="text-xs font-bold text-neutral-500 uppercase mb-2 flex items-center gap-2">
                        <CalendarIcon size={14}/> 
                        {type === 'LIBRO' ? 'Selecciona Rango (Máx 5 días)' : 'Selecciona Fecha'}
                    </p>
                    
                    <Calendar 
                        onChange={handleDateChange} 
                        value={dateSelection}
                        selectRange={type === 'LIBRO'}
                        minDate={new Date()}
                        onActiveStartDateChange={handleActiveStartDateChange}
                        className="shadow-sm border-none w-full"
                        tileDisabled={tileDisabled}
                    />
                    
                    {type === 'LIBRO' && (
                        <div className="flex items-center gap-3 mt-3 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div> Disponible
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded opacity-50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-neutral-200/50"></div>
                                </div> Agotado
                            </div>
                        </div>
                    )}
                </div>
              </div>

              <div className="flex-1 flex flex-col border-l border-neutral-100 pl-0 lg:pl-8 pt-4 lg:pt-0">
                {type === 'SALA' && (
                    <>
                        <h5 className="font-bold text-neutral-800 mb-3">Horarios Disponibles</h5>
                        {!dateSelection ? (
                            <p className="text-sm text-neutral-400 italic">Selecciona una fecha primero.</p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                {HORARIOS_SALA.map((slot) => {
                                    const isTaken = slotsOcupados.includes(slot.start);
                                    const isSelected = slotSeleccionado?.start === slot.start;
                                    return (
                                    <button
                                        key={slot.start}
                                        onClick={() => setSlotSeleccionado(slot)}
                                        disabled={isTaken}
                                        className={`
                                        py-2 px-3 rounded-lg text-sm font-medium border transition-all text-center
                                        ${isTaken 
                                            ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed border-transparent line-through decoration-neutral-400' 
                                            : isSelected 
                                            ? 'bg-secondary text-white border-secondary shadow-md transform scale-105' 
                                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-secondary hover:text-secondary'
                                        }
                                        `}
                                    >
                                        {slot.label}
                                    </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {type === 'LIBRO' && (
                    <>
                        <h5 className="font-bold text-neutral-800 mb-3">Detalle del Préstamo</h5>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-blue-800">Entrega:</span>
                                <span className="font-bold">
                                    {Array.isArray(dateSelection) && dateSelection[0] 
                                        ? dateSelection[0].toLocaleDateString() 
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-blue-800">Devolución:</span>
                                <span className="font-bold">
                                    {Array.isArray(dateSelection) && dateSelection[1] 
                                        ? dateSelection[1].toLocaleDateString() 
                                        : '-'}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                <div className="mt-auto pt-6">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg border border-red-100 flex gap-2 items-start mb-3">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                        </div>
                    )}

                    <button 
                        onClick={handleSubmit}
                        disabled={loading || error || (type==='SALA' && !slotSeleccionado) || (type==='LIBRO' && (!dateSelection?.[0] || !dateSelection?.[1]))}
                        className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Procesando...' : (user ? 'Confirmar Reserva' : 'Iniciar Sesión y Confirmar')}
                    </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 flex flex-col items-center justify-center h-full animate-fade-in">
              <div className="bg-white p-4 rounded-xl border-2 border-neutral-100 inline-block shadow-sm mb-6">
                <QRCodeSVG value={qrData.qr_token} size={220} />
              </div>
              <p className="text-sm text-neutral-500 uppercase font-bold tracking-wide mb-1">Código de Reserva</p>
              <p className="text-4xl font-mono font-extrabold text-secondary mb-6 tracking-wider">{qrData.code}</p>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 text-sm mb-6 text-left max-w-xs mx-auto">
                <p className="font-bold flex items-center gap-2 mb-1">
                    <CheckCircle size={18} /> Reserva Exitosa
                </p>
                <p>Hemos enviado los detalles a tu correo.</p>
              </div>
              <button onClick={handleClose} className="w-full max-w-xs bg-neutral-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">
                Finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}