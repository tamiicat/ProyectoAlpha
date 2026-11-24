const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
const AUTH_URL = (import.meta.env.VITE_AUTH_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

export async function apiFetch(endpoint, options = {}) {
    const sesion = JSON.parse(
        localStorage.getItem('usuarioFYAG') || sessionStorage.getItem('usuarioFYAG') || 'null'
    );

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Adjunta el token JWT (soporta tanto 'token' como 'access_token')
    const token = sesion?.token || sesion?.access_token;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Error ${response.status}`);
    }

    if (response.status === 204) return null;

    return response.json();
}

// Función dedicada al microservicio Auth IAM (/auth/login, /auth/refresh, /auth/revoke-device)
export async function authFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(`${AUTH_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `Error ${response.status}`);
    }

    return response.json();
}