import api from './api';

export async function login(email, password) {
  try {
    const { data } = await api.post('/api/auth/users/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.user;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Login failed';
    throw new Error(msg);
  }
}

export async function adminLogin(email, password) {
  try {
    const { data } = await api.post('/api/auth/admin/login', { email, password });
    localStorage.setItem('token', data.token);
    return data.admin;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Admin login failed';
    throw new Error(msg);
  }
}

export async function register(payload) {
  try {
    const { data } = await api.post('/api/auth/users/register', payload);
    localStorage.setItem('token', data.token);
    return data.user;
  } catch (err) {
    const msg = err?.response?.data?.message || err?.message || 'Registration failed';
    throw new Error(msg);
  }
}

export function logout() {
  try {
    localStorage.removeItem('token');
    window.location.href = '/';
  } catch (err) {
    console.error('Logout error:', err);
  }
}
