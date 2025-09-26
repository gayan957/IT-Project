import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { 
            setLoading(false); 
            return; 
        }
        
        api.get('/api/users/me')
            .then((res) => setUser(res.data))
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            })
            .finally(() => setLoading(false));
    }, []);

    const logout = () => {
        console.log('Logout function called');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        console.log('Tokens removed from localStorage');
        setUser(null);
        console.log('User state set to null');
        window.location.href = '/';
        console.log('Redirecting to home page');
    };

    const value = useMemo(() => ({ user, setUser, loading, logout }), [user, loading]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}