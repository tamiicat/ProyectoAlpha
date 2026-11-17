import React from 'react';
import { Link } from 'react-router-dom';

export default function Tecnico() {
    return (
        <div className="container mt-5 mb-5">
            <div className="shadow-lg rounded" style={{ overflow: 'hidden' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '70px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-bold">Panel Técnico</h3>
                    </div>
                    <div>
                        <Link to="/" className="btn btn-light text-secondary fw-bold rounded-pill px-4">
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-5 border border-top-0 rounded-bottom">
                    <div className="d-flex flex-wrap justify-content-center gap-4">
                        <Link to="#" className="btn btn-menu py-3 shadow-sm" style={{ width: '250px' }}>Solicitar Artículo a Bodega</Link>
                        <Link to="#" className="btn btn-menu py-3 shadow-sm" style={{ width: '250px' }}>Registrar Diagnóstico</Link>
                        <Link to="#" className="btn btn-menu py-3 shadow-sm" style={{ width: '250px' }}>Enviar Reporte de Trabajo</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}