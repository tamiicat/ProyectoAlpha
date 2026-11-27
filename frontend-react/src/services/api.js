const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');
const AUTH_URL = (import.meta.env.VITE_AUTH_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

let redirigiendoLogin = false;

function forzarReinicioSesion(
    mensaje = 'Tu sesión ha expirado o el sistema se actualizó. Por favor, inicia sesión nuevamente.'
) {
    localStorage.removeItem('usuarioFYAG');
    sessionStorage.removeItem('usuarioFYAG');
    sessionStorage.removeItem('rolVistaFYAG');

    if (!redirigiendoLogin && window.location.pathname !== '/') {
        redirigiendoLogin = true;
        alert(mensaje);
        window.location.replace('/');
    }
}

export async function apiFetch(endpoint, options = {}) {
    const sesion = JSON.parse(
        localStorage.getItem('usuarioFYAG') || sessionStorage.getItem('usuarioFYAG') || 'null'
    );

    const token = sesion?.token || sesion?.access_token;

    // Si no hay token guardado, fuerza el regreso al Login
    if (!token) {
        forzarReinicioSesion('No tienes una sesión activa. Por favor, inicia sesión.');
        throw new Error('Sesión no iniciada');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Si el token expiró o el servidor lo rechazó (401), cierra sesión y redirige
    if (response.status === 401) {
        forzarReinicioSesion();
        throw new Error('Sesión expirada. Redirigiendo al login...');
    }

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