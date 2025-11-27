import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import client from '../../api/client';
import { QrCode, XCircle, Camera, CheckCircle } from 'lucide-react';

export default function ValidarQR() {
  const [token, setToken] = useState('');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  // Iniciar Escaneo
  const startScan = async () => {
    setError(null);
    setInfo(null);
    setScanning(true);

    // Esperar a que el div se renderice
    setTimeout(async () => {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Preferir cámara trasera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            // ÉXITO:
            handleStopScan();
            setToken(decodedText);
            validarCodigo(decodedText);
          },
          (errorMessage) => {
            // Ignoramos errores de "no QR found" frame por frame
          }
        );
      } catch (err) {
        console.error("Error iniciando cámara:", err);
        setScanning(false);
        setError("No se pudo acceder a la cámara. Verifica permisos.");
      }
    }, 100);
  };

  const handleStopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error("Error deteniendo", e);
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // Limpieza al salir
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const validarCodigo = async (codigo) => {
    setError(null);
    setInfo(null);
    try {
      const res = await client.post(`/admin/validar-qr?qr_token=${codigo}`);
      setInfo(res.data);
      setToken(''); 
    } catch (err) {
      setError(err.response?.data?.detail || "Error de validación");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    validarCodigo(token);
  };

  return (
    <div className="p-6 max-w-md mx-auto mt-6">
      <div className="bg-white shadow-card border border-neutral-200 rounded-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-secondary text-white text-center">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <QrCode /> Control de Acceso
          </h2>
          <p className="text-blue-200 text-sm mt-1">Validación rápida de ingresos</p>
        </div>

        <div className="p-6">
          
          {/* VISTA DE CÁMARA (LIMPIA) */}
          {scanning ? (
            <div className="relative animate-fade-in bg-black rounded-xl overflow-hidden">
              {/* Contenedor del video */}
              <div id="reader" className="w-full h-[300px]"></div>
              
              {/* Overlay Guía Visual (Marco) */}
              <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none flex items-center justify-center">
                 <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50"></div>
              </div>

              {/* Botón Cancelar Flotante */}
              <button 
                onClick={handleStopScan}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-red-600 px-6 py-2 rounded-full font-bold shadow-lg text-sm flex items-center gap-2 hover:bg-white"
              >
                <XCircle size={16} /> Cancelar
              </button>
            </div>
          ) : (
            // BOTÓN INICIAR
            <button 
              onClick={startScan}
              className="w-full py-4 mb-6 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition transform active:scale-95 flex items-center justify-center gap-3 text-lg"
            >
              <Camera size={28} /> ESCANEAR ENTRADA
            </button>
          )}

          {/* SEPARADOR */}
          {!scanning && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs uppercase font-bold tracking-widest">Ingreso Manual</span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              {/* INPUT MANUAL */}
              <form onSubmit={handleSubmit} className="mt-4">
                <input 
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Código (Ej: LI-123456)"
                  className="w-full p-3 border-2 border-neutral-200 rounded-lg text-lg focus:border-secondary outline-none transition mb-3 font-mono text-center uppercase placeholder-gray-300"
                />
                <button 
                  disabled={!token}
                  className="w-full py-3 bg-white border-2 border-secondary text-secondary rounded-lg font-bold hover:bg-secondary hover:text-white transition disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-secondary"
                >
                  VALIDAR CÓDIGO
                </button>
              </form>
            </>
          )}
        </div>

        {/* RESULTADOS (FEEDBACK VISUAL) */}
        {(info || error) && (
          <div className={`p-6 border-t animate-fade-in ${info ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            {info && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-500 text-white p-3 rounded-full shadow-sm">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-green-800">{info.status}</h3>
                    <p className="text-green-700 text-sm font-medium leading-tight">{info.mensaje}</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">Usuario</p>
                      <p className="text-lg font-bold text-neutral-900">{info.usuario.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-1">DNI</p>
                      <p className="text-md font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">{info.usuario.dni}</p>
                    </div>
                  </div>
                </div>
                
                {/* Botón para escanear el siguiente rápido */}
                <button 
                  onClick={() => { setInfo(null); startScan(); }}
                  className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
                >
                  <Camera size={20} /> Siguiente Persona
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-4">
                <div className="bg-red-500 text-white p-3 rounded-full shadow-sm">
                  <XCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-red-800">ACCESO DENEGADO</h3>
                  <p className="text-red-700 font-medium text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}