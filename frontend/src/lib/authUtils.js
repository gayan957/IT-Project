import { api } from './api';

export async function login(email, password) {
    const { data } = await api.post('/api/auth/users/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.user;
}

export async function adminLogin(email, password) {
    const { data } = await api.post('/api/auth/admin/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.admin;
}

export async function register(payload) {
    const { data } = await api.post('/api/auth/users/register', payload);
    localStorage.setItem('token', data.token);
    return data.user;
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}
