import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../../services/api';

const CLAVE_CORREO_RECORDADO = 'correoRecordadoFYAG';

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        usuario: '',
        contrasena: '',
        recuerdame: false
    });
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [aviso, setAviso] = useState(null); // { tipo: 'danger' | 'info', mensaje: string }
    const [cargando, setCargando] = useState(false);

    // Cargar solo el correo/usuario recordado al montar (nunca sesión ni token)
    useEffect(() => {
        try {
            const correoGuardado = localStorage.getItem(CLAVE_CORREO_RECORDADO);
            if (correoGuardado) {
                setFormData((prev) => ({
                    ...prev,
                    usuario: correoGuardado,
                    recuerdame: true
                }));
            }
        } catch {
            // Ignorar si localStorage no está disponible
        }
    }, []);

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

    const guardarSesionYEntrar = (sesion, usuarioLimpio, rutaDestino) => {
        // Nunca persistir tokens o sesión completa en localStorage; solo el correo si marcó "Recuérdame"
        localStorage.removeItem('usuarioFYAG');
        sessionStorage.removeItem('usuarioFYAG');

        try {
            if (formData.recuerdame && usuarioLimpio) {
                localStorage.setItem(CLAVE_CORREO_RECORDADO, usuarioLimpio);
            } else {
                localStorage.removeItem(CLAVE_CORREO_RECORDADO);
            }
        } catch {
            // Ignorar errores de storage
        }

        sessionStorage.setItem('usuarioFYAG', JSON.stringify(sesion));

        navigate(rutaDestino || obtenerRutaPorRol(sesion.rol));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'recuerdame' && !checked) {
            try {
                localStorage.removeItem(CLAVE_CORREO_RECORDADO);
            } catch {
                // Ignorar errores de storage
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (aviso) setAviso(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const usuarioLimpio = formData.usuario.trim();
        if (!usuarioLimpio || !formData.contrasena) {
            setAviso({ tipo: 'danger', mensaje: 'Debe ingresar su correo y contraseña.' });
            return;
        }

        setCargando(true);
        setAviso(null);

        try {
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

            guardarSesionYEntrar(sesionBackend, usuarioLimpio, obtenerRutaPorRol(rolCrudo));
        } catch (err) {
            setAviso({
                tipo: 'danger',
                mensaje: err.message || 'No se pudo iniciar sesión con el servicio de autenticación.'
            });
        } finally {
            setCargando(false);
        }
    };

    const handleOlvidoContrasena = (e) => {
        e.preventDefault();
        setAviso({
            tipo: 'info',
            mensaje: 'Para restablecer tu contraseña, solicita asistencia al Administrador del sistema FYAG.'
        });
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

                        {aviso && (
                            <div className={`alert alert-${aviso.tipo} py-2 small`} role="alert">
                                {aviso.mensaje}
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
        </div>
    );
}