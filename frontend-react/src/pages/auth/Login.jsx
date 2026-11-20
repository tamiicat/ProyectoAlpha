import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Login() {
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [recordarme, setRecordarme] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    // Respaldo local para pruebas mientras el backend de Django no esté activo
    const usuariosMock = {
        admin: {
            id_usuario: 1,
            usuario: 'admin',
            nombres: 'Pedro Benjamín',
            apellidos: 'Aedo Lagos',
            rol: 'Administrador',
            ruta: '/admin'
        },
        bodeguero: {
            id_usuario: 2,
            usuario: 'bodeguero',
            nombres: 'Carlos',
            apellidos: 'Soto',
            rol: 'Bodeguero',
            ruta: '/bodeguero'
        },
        tecnico: {
            id_usuario: 3,
            usuario: 'tecnico',
            nombres: 'Luis',
            apellidos: 'Rojas',
            rol: 'Técnico',
            ruta: '/tecnico'
        },
        finanzas: {
            id_usuario: 4,
            usuario: 'finanzas',
            nombres: 'Laura',
            apellidos: 'Díaz',
            rol: 'Finanzas',
            ruta: '/finanzas'
        },
        supervisor: {
            id_usuario: 5,
            usuario: 'supervisor',
            nombres: 'Omar',
            apellidos: 'Solar',
            rol: 'Supervisor',
            ruta: '/supervisor'
        }
    };

    const obtenerRutaPorRol = (rol = '') => {
        const normalizado = rol
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        if (normalizado.includes('admin')) return '/admin';
        if (normalizado.includes('bodeg')) return '/bodeguero';
        if (normalizado.includes('tecnic')) return '/tecnico';
        if (normalizado.includes('finanz')) return '/finanzas';
        if (normalizado.includes('supervis')) return '/supervisor';
        return '/admin';
    };

    const guardarSesionYEntrar = (datosUsuario, rutaDestino) => {
        localStorage.removeItem('usuarioFYAG');
        sessionStorage.removeItem('usuarioFYAG');

        const destinoStorage = recordarme ? localStorage : sessionStorage;
        destinoStorage.setItem('usuarioFYAG', JSON.stringify(datosUsuario));

        navigate(rutaDestino || obtenerRutaPorRol(datosUsuario.rol));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!usuario.trim() || !password.trim()) {
            setError('Por favor, ingrese su usuario y contraseña.');
            return;
        }

        setCargando(true);

        try {
            // 1. Intenta autenticar con el backend real de Django
            const data = await apiFetch('/login/', {
                method: 'POST',
                body: JSON.stringify({
                    usuario: usuario.trim(),
                    password: password
                })
            });

            // Normaliza los datos que devuelva Django (ajusta las claves si tu compañero usa otros nombres)
            const sesionBackend = {
                id_usuario: data.id_usuario ?? data.user?.id ?? null,
                usuario: data.usuario ?? data.user?.username ?? usuario.trim(),
                nombres: data.nombres ?? data.user?.first_name ?? usuario.trim(),
                apellidos: data.apellidos ?? data.user?.last_name ?? '',
                rol: data.rol ?? data.user?.rol ?? 'Administrador',
                token: data.token ?? data.access ?? null
            };

            guardarSesionYEntrar(sesionBackend, obtenerRutaPorRol(sesionBackend.rol));
        } catch (err) {
            // 2. Si Django no responde (apagado o sin red), usa las credenciales locales de prueba
            const sinConexionBackend =
                err instanceof TypeError ||
                err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('404');

            if (sinConexionBackend) {
                console.warn('Backend no disponible, validando con usuarios locales:', err.message);
                const clave = usuario.trim().toLowerCase();
                const cuentaMock = usuariosMock[clave];

                if (cuentaMock && password === '123') {
                    guardarSesionYEntrar(cuentaMock, cuentaMock.ruta);
                } else {
                    setError('Usuario o contraseña incorrectos.');
                }
            } else {
                // Si Django sí respondió (ej. 401 Credenciales inválidas), muestra el error real
                setError(err.message || 'Credenciales inválidas.');
            }
        } finally {
            setCargando(false);
        }
    };

    const handleAccesoRapido = (claveRol) => {
        const cuenta = usuariosMock[claveRol];
        if (cuenta) {
            guardarSesionYEntrar(cuenta, cuenta.ruta);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
            <div className="card shadow-lg border-0 w-100" style={{ maxWidth: '460px', borderRadius: '25px', overflow: 'hidden' }}>
                <div className="p-4 text-center text-white" style={{ backgroundColor: '#2b3d52' }}>
                    <img
                        src="/img/logo-fyag.png"
                        alt="Logo FYAG"
                        style={{ height: '75px', objectFit: 'contain' }}
                        className="mb-2"
                    />
                    <h4 className="mb-0 fw-semibold">Acceso FYAG</h4>
                    <span className="small opacity-75">Sistema de Gestión de Inventario</span>
                </div>

                <div className="card-body p-4 p-md-5 bg-white">
                    {error && (
                        <div className="alert alert-danger py-2 small rounded-3" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold small text-muted">Usuario</label>
                            <input
                                type="text"
                                className="form-control bg-light border-light shadow-sm py-2"
                                placeholder="Ej: admin, bodeguero, tecnico..."
                                value={usuario}
                                onChange={(e) => setUsuario(e.target.value)}
                                disabled={cargando}
                                autoComplete="username"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold small text-muted">Contraseña</label>
                            <input
                                type="password"
                                className="form-control bg-light border-light shadow-sm py-2"
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={cargando}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="recordarmeCheck"
                                    checked={recordarme}
                                    onChange={(e) => setRecordarme(e.target.checked)}
                                    disabled={cargando}
                                />
                                <label className="form-check-label small text-muted" htmlFor="recordarmeCheck">
                                    Recuérdame
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="btn w-100 text-white rounded-pill py-2 fw-semibold shadow-sm"
                            style={{ backgroundColor: '#2b3d52' }}
                        >
                            {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <hr className="my-4 opacity-25" />

                    <div className="text-center">
                        <span className="d-block small text-muted mb-2 fw-semibold">Accesos Rápidos (Pruebas)</span>
                        <div className="d-flex flex-wrap justify-content-center gap-2">
                            <button type="button" onClick={() => handleAccesoRapido('admin')} className="btn btn-outline-secondary btn-sm rounded-pill px-3">Admin</button>
                            <button type="button" onClick={() => handleAccesoRapido('bodeguero')} className="btn btn-outline-secondary btn-sm rounded-pill px-3">Bodeguero</button>
                            <button type="button" onClick={() => handleAccesoRapido('tecnico')} className="btn btn-outline-secondary btn-sm rounded-pill px-3">Técnico</button>
                            <button type="button" onClick={() => handleAccesoRapido('finanzas')} className="btn btn-outline-secondary btn-sm rounded-pill px-3">Finanzas</button>
                            <button type="button" onClick={() => handleAccesoRapido('supervisor')} className="btn btn-outline-secondary btn-sm rounded-pill px-3">Supervisor</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}