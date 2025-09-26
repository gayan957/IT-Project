import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();
    
    if (loading) return <div className="p-6">Loading…</div>;
    if (!user) return <Navigate to="/login" replace />;
    
    // If no roles specified, allow any authenticated user
    if (allowedRoles.length === 0) return children;
    
    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }
    
    return children;
}
