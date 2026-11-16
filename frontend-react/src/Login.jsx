import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
    return (
        <div className="d-flex align-items-center min-vh-100 py-4" style={{ backgroundColor: '#3b4b5e' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6 col-lg-4 text-center">
                        <div className="card shadow-lg p-4 panel-card">
                            
                            <div className="mb-4">
                                {/* Ruta corregida apuntando a la subcarpeta img dentro de public */}
                                <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ maxHeight: '100px', width: 'auto', objectFit: 'contain' }} />
                            </div>
                            
                            <h4 className="fw-bold mb-4" style={{ color: '#2b3d52' }}>Iniciar Sesión</h4>
                            
                            <form>
                                <div className="mb-3 text-start">
                                    <label className="form-label text-muted small fw-bold">Correo Electrónico</label>
                                    <input type="email" className="form-control" placeholder="usuario@fyag.cl" />
                                </div>
                                <div className="mb-4 text-start">
                                    <label className="form-label text-muted small fw-bold">Contraseña</label>
                                    <input type="password" className="form-control" placeholder="********" />
                                </div>
                                
                                {/* Acción de autenticación y redirección al Dashboard */}
                                <Link to="/admin" className="btn btn-menu w-100 py-2 shadow-sm mb-3">
                                    Ingresar
                                </Link>
                            </form>

                            <hr className="my-4 text-secondary opacity-25" />

                            {/* Enlaces de navegación rápida para el entorno de desarrollo */}
                            <div className="mt-2">
                                <p className="small text-muted mb-3">Accesos Directos (Entorno Dev)</p>
                                <div className="d-flex justify-content-center gap-2 flex-wrap">
                                    <Link to="/admin" className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">Admin</Link>
                                    <Link to="/bodeguero" className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">Bodeguero</Link>
                                    <Link to="/tecnico" className="btn btn-outline-secondary btn-sm rounded-pill fw-bold">Técnico</Link>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}