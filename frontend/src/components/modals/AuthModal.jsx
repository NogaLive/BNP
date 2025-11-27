import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, CreditCard, Check, AlertCircle, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';

// --- COMPONENTES UI HELPERS (DEFINIDOS FUERA) ---

// 1. Input Normal (Texto, Email, Número)
const InputGroup = ({ icon: Icon, ...props }) => (
  <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Icon className="text-gray-400 group-focus-within:text-primary transition-colors" size={22} />
      </div>
      <input 
          {...props}
          style={{ paddingLeft: '3.5rem' }} 
          className="w-full py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm text-gray-800 placeholder-gray-400 font-medium"
      />
  </div>
);

// 2. Input de Contraseña con "Ojito" (NUEVO)
const PasswordInput = ({ icon: Icon = Lock, ...props }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative group">
        {/* Ícono Izquierdo (Candado/Llave) */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="text-gray-400 group-focus-within:text-primary transition-colors" size={22} />
        </div>
        
        <input 
            {...props}
            type={show ? "text" : "password"}
            style={{ paddingLeft: '3.5rem', paddingRight: '3rem' }} 
            className="w-full py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm text-gray-800 placeholder-gray-400 font-medium"
        />

        {/* Botón Ojito (Derecha) */}
        <button 
            type="button"
            onClick={() => setShow(!show)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        >
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
    </div>
  );
};

export default function AuthModal() {
  const { modalState, closeModal, switchView } = useModal();
  const { login, register, forgotPassword, verifyCode, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [form, setForm] = useState({
    dni: '', password: '', email: '', code: '', newPassword: ''
  });

  const [pwdValidations, setPwdValidations] = useState({
    length: false, number: false, special: false, uppercase: false
  });
  const [showPwdRequirements, setShowPwdRequirements] = useState(false);

  if (!modalState.isOpen) return null;

  const validatePassword = (pwd) => {
    setPwdValidations({
      length: pwd.length >= 8,
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'dni' || name === 'code') {
      setForm({ ...form, [name]: value.replace(/\D/g, '') });
    } else if (name === 'password' || name === 'newPassword') {
      setForm({ ...form, [name]: value });
      if (modalState.view === 'REGISTER' || modalState.view === 'RESET') {
        setShowPwdRequirements(true);
        validatePassword(value);
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const isPasswordValid = () => Object.values(pwdValidations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (modalState.view === 'LOGIN') {
        const loggedUser = await login(form.dni, form.password);
        closeModal();
        if (loggedUser.role === 'ADMIN') navigate('/admin/dashboard');
      } 
      else if (modalState.view === 'REGISTER') {
        if (!isPasswordValid()) throw new Error("Contraseña insegura.");
        const loggedUser = await register({ 
            dni: form.dni, email: form.email, password: form.password 
        });
        closeModal();
        alert("¡Registro exitoso!");
        if (loggedUser.role === 'ADMIN') navigate('/admin/dashboard');
      } 
      else if (modalState.view === 'FORGOT') {
        await forgotPassword(form.dni, form.email);
        setSuccessMsg("Código enviado. Revisa tu correo.");
        setTimeout(() => { setSuccessMsg(null); switchView('VERIFY'); }, 1500);
      }
      else if (modalState.view === 'VERIFY') {
        if (form.code.length !== 6) throw new Error("El código debe ser de 6 dígitos.");
        await verifyCode(form.dni, form.email, form.code);
        switchView('RESET');
      }
      else if (modalState.view === 'RESET') {
        if (!isPasswordValid()) throw new Error("La nueva contraseña es insegura.");
        await resetPassword(form.dni, form.email, form.code, form.newPassword);
        alert("¡Contraseña actualizada! Inicia sesión.");
        switchView('LOGIN');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Error en la operación.");
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordRequirements = () => (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs transition-all">
      <p className="font-bold text-gray-500 mb-2 uppercase tracking-wide">Seguridad:</p>
      <ul className="space-y-1">
        <RequirementItem valid={pwdValidations.length} text="Mínimo 8 caracteres" />
        <RequirementItem valid={pwdValidations.number} text="Al menos un número" />
        <RequirementItem valid={pwdValidations.special} text="Símbolo (!@#$)" />
        <RequirementItem valid={pwdValidations.uppercase} text="Mayúscula" />
      </ul>
    </div>
  );

  const RequirementItem = ({ valid, text }) => (
    <li className={`flex items-center gap-2 ${valid ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
      {valid ? <Check size={14} strokeWidth={3} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300"></div>}
      <span>{text}</span>
    </li>
  );

  // --- VISTAS ---
  const renderLogin = () => (
    <div className="space-y-5">
        <InputGroup icon={CreditCard} name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} maxLength={8} required />
        
        {/* USANDO EL NUEVO COMPONENTE PASSWORD INPUT */}
        <PasswordInput name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
        
        <div className="flex justify-end"><button type="button" onClick={() => switchView('FORGOT')} className="text-xs text-blue-600 hover:underline font-medium">¿Olvidaste tu contraseña?</button></div>
        <button disabled={isLoading} className="btn-primary w-full py-3 rounded-xl font-bold shadow-lg">{isLoading ? 'Ingresando...' : 'INGRESAR'}</button>
        <div className="text-center pt-2 text-sm text-gray-500">¿Nuevo? <button type="button" onClick={() => switchView('REGISTER')} className="text-secondary font-bold hover:underline">Regístrate</button></div>
    </div>
  );

  const renderRegister = () => (
    <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">Ingresa tu DNI correcto. Validaremos tu identidad con RENIEC.</div>
        <InputGroup icon={CreditCard} name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} maxLength={8} required />
        <InputGroup icon={Mail} name="email" placeholder="Correo" value={form.email} onChange={handleChange} type="email" required />
        
        {/* USANDO PASSWORD INPUT */}
        <PasswordInput name="password" placeholder="Crea contraseña" value={form.password} onChange={handleChange} onFocus={() => setShowPwdRequirements(true)} required />
        
        {showPwdRequirements && <PasswordRequirements />}
        <button disabled={isLoading || !isPasswordValid()} className="btn-secondary w-full py-3 rounded-xl font-bold shadow-lg mt-2">{isLoading ? 'Validando...' : 'CREAR CUENTA'}</button>
        <div className="text-center pt-2 text-sm text-gray-500">¿Tienes cuenta? <button type="button" onClick={() => switchView('LOGIN')} className="text-primary font-bold hover:underline">Ingresa</button></div>
    </div>
  );

  const renderForgot = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 text-center">Te enviaremos un código de recuperación.</p>
      <InputGroup icon={CreditCard} name="dni" placeholder="Tu DNI" value={form.dni} onChange={handleChange} maxLength={8} />
      <InputGroup icon={Mail} name="email" placeholder="Tu correo" value={form.email} onChange={handleChange} type="email" />
      <button disabled={isLoading} className="btn-primary w-full py-3 rounded-xl font-bold shadow-md">{isLoading ? 'Enviando...' : 'ENVIAR CÓDIGO'}</button>
      <button type="button" onClick={() => switchView('LOGIN')} className="w-full text-sm text-gray-500 hover:text-gray-900">Cancelar</button>
    </div>
  );

  const renderVerify = () => (
    <div className="space-y-5 text-center">
      <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm">Hemos enviado un código a <strong>{form.email}</strong>.</div>
      <InputGroup icon={ShieldCheck} name="code" placeholder="000000" value={form.code} onChange={handleChange} maxLength={6} style={{ paddingLeft: '3.5rem', letterSpacing: '0.5em', textAlign: 'center', fontFamily: 'monospace', fontSize: '1.25rem' }} />
      <button disabled={isLoading || form.code.length !== 6} className="btn-primary w-full py-3 rounded-xl font-bold shadow-md">{isLoading ? 'Verificando...' : 'VALIDAR CÓDIGO'}</button>
      <button type="button" onClick={() => switchView('FORGOT')} className="w-full text-sm text-gray-500 hover:underline">Reenviar código</button>
    </div>
  );

  const renderReset = () => (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 mb-2">Crea tu nueva contraseña.</p>
      
      {/* USANDO PASSWORD INPUT (Con icono de Llave) */}
      <PasswordInput icon={KeyRound} name="newPassword" placeholder="Nueva contraseña" value={form.newPassword} onChange={handleChange} onFocus={() => setShowPwdRequirements(true)} required />
      
      {showPwdRequirements && <PasswordRequirements />}
      <button disabled={isLoading || !isPasswordValid()} className="btn-primary w-full py-3 rounded-xl font-bold shadow-md">{isLoading ? 'Actualizando...' : 'CAMBIAR CONTRASEÑA'}</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] overflow-hidden relative border border-white/20">
        <div className="px-8 pt-8 pb-4 bg-white">
          <button onClick={closeModal} className="absolute top-5 right-5 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition"><X size={20} /></button>
          <h2 className="text-2xl font-extrabold text-secondary tracking-tight">
            {modalState.view === 'LOGIN' && '¡Hola de nuevo!'}
            {modalState.view === 'REGISTER' && 'Crear Cuenta'}
            {modalState.view === 'FORGOT' && 'Recuperar'}
            {modalState.view === 'VERIFY' && 'Validar Código'}
            {modalState.view === 'RESET' && 'Nueva Clave'}
          </h2>
          <div className="flex gap-1 mt-2 h-1.5">
             <div className={`rounded-full transition-all duration-500 ${['LOGIN','FORGOT','VERIFY','RESET'].includes(modalState.view) ? 'bg-primary w-8' : 'bg-gray-200 w-2'}`}></div>
             <div className={`rounded-full transition-all duration-500 ${['REGISTER','VERIFY','RESET'].includes(modalState.view) ? 'bg-secondary w-8' : 'bg-gray-200 w-2'}`}></div>
             <div className={`rounded-full transition-all duration-500 ${['RESET'].includes(modalState.view) ? 'bg-primary w-8' : 'bg-gray-200 w-2'}`}></div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-2">
          {error && <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg border border-red-100 flex items-center gap-2 animate-shake"><AlertCircle size={16}/> {error}</div>}
          {successMsg && <div className="mb-5 p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-100 flex items-center gap-2 animate-fade-in"><Check size={16}/> {successMsg}</div>}
          
          <form onSubmit={handleSubmit} className="animate-fade-in-up">
            {modalState.view === 'LOGIN' && renderLogin()}
            {modalState.view === 'REGISTER' && renderRegister()}
            {modalState.view === 'FORGOT' && renderForgot()}
            {modalState.view === 'VERIFY' && renderVerify()}
            {modalState.view === 'RESET' && renderReset()}
          </form>
        </div>
      </div>
    </div>
  );
}