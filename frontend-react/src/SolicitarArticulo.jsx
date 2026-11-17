import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SolicitarArticulo() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Solicitar Artículo</h3>
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
                                <label className="form-label fw-semibold text-muted small">Artículo Requerido</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Nombre o código del repuesto" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Cantidad Solicitada</label>
                                <input type="number" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: 5" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Proyecto / Obra Destino</label>
                                <input type="text" className="form-control form-control-lg shadow-sm border-light bg-light" placeholder="Ej: Instalación Chillán Centro" />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Prioridad</label>
                                <select className="form-select form-select-lg shadow-sm border-light bg-light text-muted">
                                    <option>Normal</option>
                                    <option>Urgente</option>
                                    <option>Crítica</option>
                                </select>
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">Justificación de la Solicitud</label>
                                <textarea className="form-control shadow-sm border-light bg-light" rows="3" placeholder="Explique brevemente el motivo del requerimiento..."></textarea>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-5">
                            <button type="button" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                Enviar Solicitud
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}