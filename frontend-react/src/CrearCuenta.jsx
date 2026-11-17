import React from 'react';
import { Link } from 'react-router-dom';

export default function CrearCuenta() {
    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Crear Cuenta</h3>
                    </div>
                    <div>
                        <Link to="/admin" className="btn btn-outline-light rounded-pill px-4 fw-semibold">Volver al menú</Link>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0">
                    <form>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Nombres</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Apellidos</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">RUT</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: 18.902.213-1" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Correo electrónico</label>
                                <input type="email" className="form-control form-control-lg shadow-sm border-light bg-light" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Usuario</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Contraseña</label>
                                <input type="password" className="form-control form-control-lg shadow-sm border-light bg-light" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Rol asignado</label>
                                <select className="form-select form-select-lg shadow-sm border-light bg-light text-muted">
                                    <option>Seleccione un rol...</option>
                                    <option>Administrador</option>
                                    <option>Bodeguero</option>
                                    <option>Técnico</option>
                                    <option>Finanzas</option>
                                    <option>Supervisor de Obras</option>
                                </select>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-5">
                            <button type="button" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                Registrar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}