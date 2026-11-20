const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function apiFetch(endpoint, options = {}) {
    const sesion = JSON.parse(
        localStorage.getItem('usuarioFYAG') || sessionStorage.getItem('usuarioFYAG') || 'null'
    );

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Si Django devuelve un token JWT al iniciar sesión, se adjunta automáticamente
    if (sesion?.token) {
        headers['Authorization'] = `Bearer ${sesion.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Error ${response.status}`);
    }

    // Si el endpoint responde 204 No Content (típico en DELETE), no intenta leer JSON
    if (response.status === 204) return null;

    return response.json();
}