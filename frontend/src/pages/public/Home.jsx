import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Monitor, Search, CalendarCheck, QrCode, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* --- HERO SECTION --- */}
      <section className="bg-gradient-to-br from-secondary to-[#002F4A] text-white pt-20 pb-32 px-6 relative overflow-hidden">
        {/* Patrón de fondo decorativo (opcional) */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 transform origin-top pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-sm">
            Sistema de Gestión Integrada
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Tu puerta de acceso a la <br/>
            <span className="text-red-500">cultura y el conocimiento</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl leading-relaxed">
            Reserva libros y espacios de estudio en las sedes de la Biblioteca Nacional del Perú de forma rápida, digital y sin colas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link to="/libros" className="px-8 py-4 bg-primary hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <Book size={20} /> Buscar Libros
            </Link>
            <Link to="/recursos" className="px-8 py-4 bg-white text-secondary hover:bg-gray-50 rounded-xl font-bold shadow-lg transition transform hover:-translate-y-1 flex items-center justify-center gap-2">
              <Monitor size={20} /> Reservar Sala
            </Link>
          </div>
        </div>
      </section>

      {/* --- TARJETAS DE SERVICIO (Flotantes) --- */}
      <section className="px-6 -mt-20 relative z-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          
          {/* Card Libros */}
          <Link to="/libros" className="group bg-white p-8 rounded-2xl shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-300 flex items-start gap-6">
            <div className="bg-red-50 p-4 rounded-2xl group-hover:bg-primary transition-colors duration-300">
              <Book size={32} className="text-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors">Préstamo Bibliográfico</h3>
              <p className="text-neutral-600 mb-4 leading-relaxed">
                Accede a miles de títulos. Consulta disponibilidad en tiempo real por sede y separa tu ejemplar.
              </p>
              <span className="text-sm font-bold text-primary flex items-center gap-2">
                Ir al catálogo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

          {/* Card Salas */}
          <Link to="/recursos" className="group bg-white p-8 rounded-2xl shadow-xl border border-neutral-100 hover:shadow-2xl transition-all duration-300 flex items-start gap-6">
            <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-secondary transition-colors duration-300">
              <Monitor size={32} className="text-secondary group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-secondary transition-colors">Salas y Equipos</h3>
              <p className="text-neutral-600 mb-4 leading-relaxed">
                Espacios de estudio y equipos multimedia listos para ti. Reserva por horas y asegura tu lugar.
              </p>
              <span className="text-sm font-bold text-secondary flex items-center gap-2">
                Ver disponibilidad <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>

        </div>
      </section>

      {/* --- CÓMO FUNCIONA --- */}
      <section className="py-24 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-secondary mb-4">Experiencia Digital Simple</h2>
            <p className="text-neutral-500 max-w-xl mx-auto">Olvídate de los trámites presenciales. Gestiona todo tu proceso en 3 pasos sencillos.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Línea conectora (Desktop) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-neutral-200 z-0"></div>

            {/* Paso 1 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border-4 border-neutral-50">
                <Search size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">1. Encuentra</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Busca el libro o la sala que necesitas filtrando por la sede más cercana a ti.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border-4 border-neutral-50">
                <CalendarCheck size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">2. Reserva</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Selecciona tus fechas u horarios. Confirma con tu cuenta digital en segundos.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border-4 border-neutral-50">
                <QrCode size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">3. Accede</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Recibe un código QR en tu correo. Preséntalo al ingresar y disfruta del servicio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-neutral-200 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="font-bold text-secondary text-lg mb-1">Biblioteca Nacional del Perú</h4>
            <p className="text-sm text-neutral-500">Sistema de Gestión Integrada de Servicios Bibliotecarios</p>
          </div>
          <div className="flex gap-6 text-sm font-medium text-neutral-600">
            <a href="#" className="hover:text-primary transition">Términos y Condiciones</a>
            <a href="#" className="hover:text-primary transition">Privacidad</a>
            <a href="#" className="hover:text-primary transition">Ayuda</a>
          </div>
          <div className="text-xs text-neutral-400">
            © {new Date().getFullYear()} BNP. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}