import { Navigate } from 'react-router-dom';

// Simplificamos la ruta principal para que redirija al dashboard
export default function AdminHome() {
    return <Navigate to="/admin/dashboard" replace />;
}