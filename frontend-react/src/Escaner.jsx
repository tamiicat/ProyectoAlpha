import React from 'react';
import { Link } from 'react-router-dom';

export default function Escaner() {
    return (
        <div className="min-vh-100 py-4" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="container">
                {/* Botón para volver al menú */}
                <div className="mb-3">
                    <Link to="/" className="btn btn-outline-secondary btn-sm fw-bold">
                        &larr; Volver al Dashboard
                    </Link>
                </div>

                <div className="row justify-content-center">
                    <div className="col-12 col-md-6 col-lg-4">
                        
                        {/* Simulación de Cámara del celular */}
                        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                            <div className="bg-dark position-relative d-flex justify-content-center align-items-center" style={{ height: '250px' }}>
                                <div className="border border-success border-2 rounded position-relative" style={{ width: '200px', height: '150px' }}>
                                    {/* Esta es la línea verde animada */}
                                    <div className="scan-line bg-success" style={{ height: '2px', width: '100%', position: 'absolute', boxShadow: '0 0 10px #198754' }}></div>
                                </div>
                                <span className="position-absolute bottom-0 mb-2 text-white opacity-50 small">Cámara Activa</span>
                            </div>
                        </div>

                        {/* Formulario de Resultados de Lectura */}
                        <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
                            <div className="card-body p-4">
                                <h5 className="fw-bold text-success mb-3">Lectura Detectada</h5>
                                <form>
                                    <div className="mb-3">
                                        <label className="form-label small text-muted fw-bold">Código de Barras</label>
                                        <input type="text" className="form-control bg-light" value="789456123012" readOnly />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small text-muted fw-bold">Producto Asignado</label>
                                        <input type="text" className="form-control bg-light" value="Filtro de Compresor Industrial" readOnly />
                                    </div>
                                    
                                    {/* Botones de 48px según la rúbrica */}
                                    <button type="button" className="btn btn-success w-100 fw-bold mb-2" style={{ minHeight: '48px', borderRadius: '8px' }}>
                                        Confirmar Ingreso
                                    </button>
                                    <button type="button" className="btn btn-outline-danger w-100 fw-bold" style={{ minHeight: '48px', borderRadius: '8px' }}>
                                        Rechazar
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}