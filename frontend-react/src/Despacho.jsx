import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Despacho() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Despacho de Compra</h3>
                    </div>
                    <div>
                        {/* Botón dinámico que regresa a la ruta anterior exacta */}
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0">
                    <div className="row">
                        <div className="col-12 col-md-6 border-end pe-md-5">
                            <span className="text-muted small mb-3 d-block">Fecha: 03/10/2026</span>
                            
                            <p className="mb-1"><span className="fw-bold text-muted">Cliente:</span> Alberto Andrés Sepúlveda Ortiz</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Artículo:</span> Aire Acondicionado</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Cantidad:</span> 1</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Precio:</span> $680.990</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Fecha de entrega:</span> Pje. Alegría #42, Talca, Maule</p>
                            
                            <hr className="my-3 text-muted" />
                            
                            <p className="mb-1"><span className="fw-bold text-muted">Cantidad original:</span> 12</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Fecha de Compra:</span> 03/10/2026</p>
                            <p className="mb-1"><span className="fw-bold text-muted">Fecha de Entrega:</span> 06/10/2026</p>
                        </div>

                        <div className="col-12 col-md-6 ps-md-5 mt-4 mt-md-0 d-flex flex-column align-items-center justify-content-center">
                            <div className="bg-light p-5 rounded text-center border shadow-sm w-100" style={{ borderStyle: 'dashed !important' }}>
                                <i className="bi bi-paperclip display-4 text-secondary mb-3"></i>
                                <h5 className="fw-bold text-muted">Boleta</h5>
                                <p className="text-secondary mb-0">Aire Acondicionado</p>
                                <span className="small text-muted opacity-75">Información boleta</span>
                            </div>
                            
                            <div className="w-100 d-flex justify-content-end mt-4">
                                <button type="button" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                    Confirmar Despacho
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}