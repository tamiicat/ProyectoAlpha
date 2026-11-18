import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CrearCuenta() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Crear Cuenta</h3>
                            <span className="small opacity-75">Registro de nuevos usuarios y asignación de rol</span>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0">
                    <form>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Nombres y Apellidos</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: Juan Pérez González" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">RUT</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: 18.456.789-K" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Correo Electrónico</label>
                                <input type="email" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="usuario@fyag.cl" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Rol / Perfil</label>
                                <select className="form-select form-select-lg shadow-sm border-light bg-light text-muted">
                                    <option value="">Seleccione un rol...</option>
                                    <option value="admin">Administrador</option>
                                    <option value="bodeguero">Bodeguero</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="finanzas">Finanzas</option>
                                    <option value="supervisor">Supervisor</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Contraseña</label>
                                <input type="password" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="••••••••" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Confirmar Contraseña</label>
                                <input type="password" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="••••••••" />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
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