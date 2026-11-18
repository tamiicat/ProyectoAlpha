import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Escaner() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '800px', margin: '0 auto' }}>
                
                {/* Header corporativo */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Escáner de Código de Barras</h3>
                            <span className="small opacity-75">Lectura de artículos en terreno</span>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-5 border-top-0">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-8">
                            
                            {/* Simulación de Cámara del celular */}
                            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                <div className="bg-dark position-relative d-flex justify-content-center align-items-center" style={{ height: '220px' }}>
                                    <div className="border border-success border-2 rounded position-relative" style={{ width: '180px', height: '120px' }}>
                                        <div className="scan-line bg-success" style={{ height: '2px', width: '100%', position: 'absolute', boxShadow: '0 0 10px #198754' }}></div>
                                    </div>
                                    <span className="position-absolute bottom-0 mb-2 text-white opacity-50 small">Cámara Activa</span>
                                </div>
                            </div>

                            {/* Formulario de Resultados de Lectura */}
                            <div className="card shadow-sm border-0 bg-light p-4" style={{ borderRadius: '15px' }}>
                                <h5 className="fw-bold text-secondary mb-3">Lectura Detectada</h5>
                                <form>
                                    <div className="mb-3">
                                        <label className="form-label small text-muted fw-bold">Código de Barras</label>
                                        <input type="text" className="form-control bg-white shadow-sm border-light" value="789456123012" readOnly />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small text-muted fw-bold">Producto Asignado</label>
                                        <input type="text" className="form-control bg-white shadow-sm border-light" value="Filtro de Compresor Industrial" readOnly />
                                    </div>
                                    <div className="d-flex gap-3">
                                        <button type="button" className="btn w-50 fw-bold text-white shadow-sm py-2" style={{ backgroundColor: '#2b3d52', borderRadius: '10px' }}>
                                            Confirmar Ingreso
                                        </button>
                                        <button type="button" className="btn btn-outline-danger w-50 fw-bold shadow-sm py-2" style={{ borderRadius: '10px' }}>
                                            Rechazar
                                        </button>
                                    </div>
                                </form>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}