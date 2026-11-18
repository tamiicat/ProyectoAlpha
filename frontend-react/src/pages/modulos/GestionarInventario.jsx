import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function GestionarInventario() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Gestionar Inventario</h3>
                            <span className="small opacity-75">Registro y edición de artículos</span>
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
                                <label className="form-label fw-semibold text-muted small">Nombre Artículo</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: Aire Acondicionado" />
                            </div>
                            
                            {/* Campo de Código de Barras con botón de escáner al lado */}
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Código de Barras</label>
                                <div className="input-group input-group-lg shadow-sm">
                                    <input type="text" className="form-control border-light bg-light" placeholder="12034298034821" />
                                    <Link to="/escaner" className="btn btn-outline-secondary px-3 d-flex align-items-center" title="Abrir Escáner">
                                        <i className="bi bi-upc-scan fs-5"></i>
                                    </Link>
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Stock Inicial</label>
                                <input type="number" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: 45" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Stock Crítico</label>
                                <input type="number" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: 10" />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end mt-5">
                            <button type="button" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                Guardar Artículo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}