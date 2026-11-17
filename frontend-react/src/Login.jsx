import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
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
                        
                        <form>
                            <div className="mb-4">
                                <label className="form-label text-muted fw-semibold small">Usuario</label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-lg bg-light border-0" 
                                    placeholder="Ingrese su usuario" 
                                    style={{ fontSize: '0.95rem' }}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label text-muted fw-semibold small">Contraseña</label>
                                <input 
                                    type="password" 
                                    className="form-control form-control-lg bg-light border-0" 
                                    placeholder="••••••••" 
                                    style={{ fontSize: '0.95rem' }}
                                />
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-5">
                                <div className="form-check">
                                    <input type="checkbox" className="form-check-input shadow-sm" id="recuerdame" />
                                    <label className="form-check-label text-muted small" htmlFor="recuerdame">Recuérdame</label>
                                </div>
                                <Link to="#" className="text-decoration-none small fw-semibold" style={{ color: '#2b3d52' }}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            
                            <button type="button" className="btn w-100 py-3 text-white fw-bold shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
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
                {/* Botones de ruteo directo a los 5 paneles */}
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