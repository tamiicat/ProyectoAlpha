import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Recepcion() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Recepción de Compra</h3>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0">
                    <div className="row">
                        <div className="col-12 col-md-6 border-end pe-md-5">
                            <span className="text-muted small mb-3 d-block">Fecha: 05/10/2026</span>
                            <p className="mb-1"><span className="fw-bold text-muted">Proveedor:</span> Empresa Nuble</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Monto Total (Bruto):</span> $2.350.910</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Valor Neto:</span> $1.975.555</p>
                            <p className="mb-1"><span className="fw-bold text-muted">IVA (19%):</span> $375.355</p>
                            <hr className="my-3 text-muted" />
                            <p className="mb-1"><span className="fw-bold text-muted">Artículo:</span> Repuesto Aire Acondicionado</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Cantidad:</span> 12</p>
                        </div>
                        <div className="col-12 col-md-6 ps-md-5 mt-4 mt-md-0 d-flex flex-column">
                            <label className="fw-bold text-muted mb-2">Firma Recepción</label>
                            <textarea className="form-control flex-grow-1 bg-light shadow-sm border-light" placeholder="Ingrese firma aquí..." style={{ minHeight: '200px', resize: 'none' }}></textarea>
                            <div className="d-flex justify-content-end mt-4">
                                <button type="button" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                    Guardar Recepción
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}