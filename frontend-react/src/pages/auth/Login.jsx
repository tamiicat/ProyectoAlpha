import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();

    // Usuarios de prueba alineados a Usuario + Rol (luego validará la API de Django: POST /auth/login)
    const usuariosMock = [
        { id_usuario: 1, usuario: 'admin', contrasena: '123', nombres: 'Pedro Benjamín', apellidos: 'Aedo Lagos', id_rol: 1, rol: 'Administrador', ruta: '/admin', activo: true },
        { id_usuario: 2, usuario: 'bodeguero', contrasena: '123', nombres: 'Carlos', apellidos: 'Soto Muñoz', id_rol: 2, rol: 'Bodeguero', ruta: '/bodeguero', activo: true },
        { id_usuario: 3, usuario: 'tecnico', contrasena: '123', nombres: 'Luis', apellidos: 'Rojas Vera', id_rol: 3, rol: 'Técnico', ruta: '/tecnico', activo: true },
        { id_usuario: 4, usuario: 'finanzas', contrasena: '123', nombres: 'María', apellidos: 'Fuentes Díaz', id_rol: 4, rol: 'Finanzas', ruta: '/finanzas', activo: true },
        { id_usuario: 5, usuario: 'supervisor', contrasena: '123', nombres: 'Andrea', apellidos: 'Morales Pino', id_rol: 5, rol: 'Supervisor', ruta: '/supervisor', activo: true }
    ];

    const [formData, setFormData] = useState({
        usuario: '',
        contrasena: '',
        recuerdame: false
    });
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const usuarioLimpio = formData.usuario.trim();
        if (!usuarioLimpio || !formData.contrasena) {
            setError('Debe ingresar su usuario y contraseña.');
            return;
        }

        // Payload listo para enviar a Django (POST /auth/login)
        const payload = {
            usuario: usuarioLimpio,
            contrasena: formData.contrasena
        };
        console.log('Credenciales listas para enviar al backend:', payload);

        // Simulación local de autenticación
        const encontrado = usuariosMock.find(
            (u) => u.usuario.toLowerCase() === usuarioLimpio.toLowerCase() && u.contrasena === formData.contrasena
        );

        if (!encontrado) {
            setError('Usuario o contraseña incorrectos. (Prueba con: admin, bodeguero, tecnico, finanzas o supervisor / clave: 123)');
            return;
        }

        if (!encontrado.activo) {
            setError('Esta cuenta se encuentra desactivada. Contacte a un Administrador.');
            return;
        }

        // Guardar datos básicos de sesión (sin la contraseña)
        const sesion = {
            id_usuario: encontrado.id_usuario,
            usuario: encontrado.usuario,
            nombres: encontrado.nombres,
            apellidos: encontrado.apellidos,
            id_rol: encontrado.id_rol,
            rol: encontrado.rol
        };

        const storage = formData.recuerdame ? localStorage : sessionStorage;
        storage.setItem('usuarioFYAG', JSON.stringify(sesion));

        navigate(encontrado.ruta);
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
                                <label className="form-label text-muted fw-semibold small">Usuario</label>
                                <input
                                    type="text"
                                    name="usuario"
                                    maxLength={100}
                                    required
                                    value={formData.usuario}
                                    onChange={handleChange}
                                    className="form-control form-control-lg bg-light border-0"
                                    placeholder="Ingrese su usuario"
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
                                        value={formData.contrasena}
                                        onChange={handleChange}
                                        className="form-control form-control-lg bg-light border-0"
                                        placeholder="••••••••"
                                        style={{ fontSize: '0.95rem' }}
                                    />
                                    <button
                                        type="button"
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
                                className="btn w-100 py-3 text-white fw-bold shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                Iniciar Sesión
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
                    <Link to="/supervisor" className="btn btn-outline-danger btn-sm px-4 py-2 fw-semibold rounded-pill">Supervisor</Link>
                </div>
            </div>
        </div>
    );
}