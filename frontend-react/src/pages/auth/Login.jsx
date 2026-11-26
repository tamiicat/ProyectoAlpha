import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authFetch } from '../../services/api';

export default function Login() {
    const navigate = useNavigate();

    // Usuarios de prueba (respaldo si el microservicio Auth IAM no responde)
    const usuariosMock = [
        { id_usuario: 1, usuario: 'admin', email: 'admin@fyag.cl', contrasena: '123', nombres: 'Pedro Benjamín', apellidos: 'Aedo Lagos', id_rol: 1, rol: 'Administrador', ruta: '/admin', activo: true },
        { id_usuario: 2, usuario: 'bodeguero', email: 'bodeguero@fyag.cl', contrasena: '123', nombres: 'Carlos', apellidos: 'Soto Muñoz', id_rol: 2, rol: 'Bodeguero', ruta: '/bodeguero', activo: true },
        { id_usuario: 3, usuario: 'tecnico', email: 'tecnico@fyag.cl', contrasena: '123', nombres: 'Luis', apellidos: 'Rojas Vera', id_rol: 3, rol: 'Técnico', ruta: '/tecnico', activo: true },
        { id_usuario: 4, usuario: 'finanzas', email: 'finanzas@fyag.cl', contrasena: '123', nombres: 'María', apellidos: 'Fuentes Díaz', id_rol: 4, rol: 'Finanzas', ruta: '/finanzas', activo: true },
        { id_usuario: 5, usuario: 'supervisor', email: 'supervisor@fyag.cl', contrasena: '123', nombres: 'Andrea', apellidos: 'Morales Pino', id_rol: 5, rol: 'Supervisor de Obras', ruta: '/supervisor', activo: true }
    ];

    const [formData, setFormData] = useState({
        usuario: '',
        contrasena: '',
        recuerdame: false
    });
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    // Extrae el payload del JWT (user_id, role, etc.) sin librerías externas
    const decodificarJWT = (token) => {
        try {
            const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(payloadBase64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch {
            return {};
        }
    };

    const formatearNombreRol = (rol = '') => {
        const mapa = {
            ADMIN_TI: 'Administrador',
            BODEGUERO: 'Bodeguero',
            TECNICO: 'Técnico',
            FINANZAS: 'Finanzas',
            SUPERVISOR_OBRAS: 'Supervisor de Obras'
        };
        return mapa[rol.toUpperCase()] || rol || 'Administrador';
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

    const guardarSesionYEntrar = (sesion, rutaDestino) => {
        localStorage.removeItem('usuarioFYAG');
        sessionStorage.removeItem('usuarioFYAG');

        const storage = formData.recuerdame ? localStorage : sessionStorage;
        storage.setItem('usuarioFYAG', JSON.stringify(sesion));

        navigate(rutaDestino || obtenerRutaPorRol(sesion.rol));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const usuarioLimpio = formData.usuario.trim();
        if (!usuarioLimpio || !formData.contrasena) {
            setError('Debe ingresar su correo y contraseña.');
            return;
        }

        setCargando(true);
        setError('');

        try {
            // 1. Autentica contra el microservicio Auth IAM (POST /auth/login)
            const data = await authFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: usuarioLimpio,
                    password: formData.contrasena,
                    device_id: 'web_fyag'
                })
            });

            const accessToken = data.access_token ?? data.token ?? data.access ?? null;
            const payloadJWT = accessToken ? decodificarJWT(accessToken) : {};
            const rolCrudo = data.role ?? data.rol ?? payloadJWT.role ?? payloadJWT.rol ?? 'ADMIN_TI';

            const sesionBackend = {
                id_usuario: data.user_id ?? payloadJWT.user_id ?? payloadJWT.sub ?? null,
                usuario: usuarioLimpio,
                nombres: data.nombres ?? usuarioLimpio.split('@')[0],
                apellidos: data.apellidos ?? '',
                rol_backend: rolCrudo,
                rol: formatearNombreRol(rolCrudo),
                token: accessToken,
                refresh_token: data.refresh_token ?? null
            };

            guardarSesionYEntrar(sesionBackend, obtenerRutaPorRol(rolCrudo));
        } catch (err) {
            // 2. Si el microservicio Auth no responde (apagado o sin red), usa la simulación local
            const sinConexionBackend =
                err instanceof TypeError ||
                err.message.includes('Failed to fetch') ||
                err.message.includes('NetworkError') ||
                err.message.includes('404');

            if (sinConexionBackend) {
                console.warn('Auth IAM no disponible, validando con usuarios locales:', err.message);

                const encontrado = usuariosMock.find(
                    (u) =>
                        (u.usuario.toLowerCase() === usuarioLimpio.toLowerCase() ||
                            u.email.toLowerCase() === usuarioLimpio.toLowerCase()) &&
                        u.contrasena === formData.contrasena
                );

                if (!encontrado) {
                    setError('Usuario o contraseña incorrectos. (Modo local: admin, bodeguero, tecnico, finanzas o supervisor / clave: 123)');
                    return;
                }

                if (!encontrado.activo) {
                    setError('Esta cuenta se encuentra desactivada. Contacte a un Administrador.');
                    return;
                }

                const sesion = {
                    id_usuario: encontrado.id_usuario,
                    usuario: encontrado.usuario,
                    nombres: encontrado.nombres,
                    apellidos: encontrado.apellidos,
                    id_rol: encontrado.id_rol,
                    rol: encontrado.rol
                };

                guardarSesionYEntrar(sesion, encontrado.ruta);
            } else {
                // Si Auth IAM respondió (ej. 401 Credenciales inválidas o Dispositivo revocado), muestra el error real
                setError(err.message || 'Credenciales inválidas.');
            }
        } finally {
            setCargando(false);
        }
    };

    const handleOlvidoContrasena = (e) => {
        e.preventDefault();
        alert('Para restablecer tu contraseña, solicita asistencia al Administrador del sistema FYAG.');
    };

    return (
        <div className="container mt-5 mb-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '85vh' }}>
            {/* Tarjeta de Login Principal (Split Layout para PC) */}
            <div className="card shadow-lg border-0 w-100" style={{ maxWidth: '900px', borderRadius: '20px', overflow: 'hidden' }}>
                <div className="row g-0">
                    {/* Mitad Izquierda: Branding Institucional (col-md-5) */}
                    <div className="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center p-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                        <img
                            src="/img/logo-fyag.png"
                            alt="Logo FYAG"
                            className="img-fluid mb-4"
                            style={{ maxHeight: '130px', objectFit: 'contain' }}
                        />
                        <h4 className="fw-bold text-center mb-1">Acceso FYAG</h4>
                        <p className="text-center small text-light opacity-75">Sistema de Gestión Logística</p>
                    </div>

                    {/* Mitad Derecha: Formulario de Autenticación (col-md-7) */}
                    <div className="col-12 col-md-7 p-5 bg-white d-flex flex-column justify-content-center">
                        <h4 className="fw-bold mb-4" style={{ color: '#2b3d52' }}>Iniciar Sesión</h4>

                        {error && (
                            <div className="alert alert-danger py-2 small" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="form-label text-muted fw-semibold small">Correo o Usuario</label>
                                <input
                                    type="text"
                                    name="usuario"
                                    maxLength={100}
                                    required
                                    disabled={cargando}
                                    value={formData.usuario}
                                    onChange={handleChange}
                                    className="form-control form-control-lg bg-light border-0"
                                    placeholder="ej. finanzas@fyag.cl"
                                    style={{ fontSize: '0.95rem' }}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label text-muted fw-semibold small">Contraseña</label>
                                <div className="input-group">
                                    <input
                                        type={mostrarContrasena ? 'text' : 'password'}
                                        name="contrasena"
                                        required
                                        disabled={cargando}
                                        value={formData.contrasena}
                                        onChange={handleChange}
                                        className="form-control form-control-lg bg-light border-0"
                                        placeholder="••••••••"
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                    <button
                                        type="button"
                                        disabled={cargando}
                                        onClick={() => setMostrarContrasena((prev) => !prev)}
                                        className="btn bg-light border-0 text-muted px-3"
                                        title={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        <i className={`bi ${mostrarContrasena ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-5">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        name="recuerdame"
                                        disabled={cargando}
                                        checked={formData.recuerdame}
                                        onChange={handleChange}
                                        className="form-check-input shadow-sm"
                                        id="recuerdame"
                                    />
                                    <label className="form-check-label text-muted small" htmlFor="recuerdame">Recuérdame</label>
                                </div>
                                <a
                                    href="#recuperar"
                                    onClick={handleOlvidoContrasena}
                                    className="text-decoration-none small fw-semibold"
                                    style={{ color: '#2b3d52' }}
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={cargando}
                                className="btn w-100 py-3 text-white fw-bold shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Panel de Entorno de Pruebas (Accesos directos para la evaluación) */}
            <div className="mt-5 w-100 text-center" style={{ maxWidth: '900px' }}>
                <div className="mb-3">
                    <span className="badge bg-warning text-dark px-4 py-2 rounded-pill shadow-sm border border-warning" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-tools me-2"></i> Entorno de Evaluación: Accesos Rápidos
                    </span>
                </div>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                    <Link to="/admin" className="btn btn-outline-primary btn-sm px-4 py-2 fw-semibold rounded-pill">Admin</Link>
                    <Link to="/bodeguero" className="btn btn-outline-success btn-sm px-4 py-2 fw-semibold rounded-pill">Bodeguero</Link>
                    <Link to="/tecnico" className="btn btn-outline-secondary btn-sm px-4 py-2 fw-semibold rounded-pill">Técnico</Link>
                    <Link to="/finanzas" className="btn btn-outline-warning text-dark btn-sm px-4 py-2 fw-semibold rounded-pill">Finanzas</Link>
                    <Link to="/supervisor" className="btn btn-outline-danger btn-sm px-4 py-2 fw-semibold rounded-pill">Supervisor de Obras</Link>
                </div>
            </div>
        </div>
    );
}