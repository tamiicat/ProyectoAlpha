import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Finanzas() {
    const navigate = useNavigate();

    return (
        <div className="container mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '70px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Panel Finanzas</h3>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} className="btn rounded-pill px-4 text-white shadow-sm" style={{ backgroundColor: '#9aa5b1' }}>
                            <i className="bi bi-box-arrow-right me-2"></i> Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '450px' }}>
                    <div className="d-flex flex-wrap justify-content-center gap-4" style={{ maxWidth: '850px' }}>
                        <Link to="/reporte-financiero" className="btn btn-menu py-3 shadow-sm" style={{ width: '250px', fontSize: '1rem' }}>Módulo de Compras</Link>
                        <Link to="/gestion-facturas" className="btn btn-menu py-3 shadow-sm" style={{ width: '250px', fontSize: '1rem' }}>Gestión de Facturas</Link>
                        <Link to="/gestion-proveedores" className="btn btn-menu py-3 shadow-sm" style={{ width: '250px', fontSize: '1rem' }}>Gestión de Proveedores</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}