import React from 'react';
import { Link } from 'react-router-dom';

export default function Bodeguero() {
    return (
        <div className="container mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '70px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Panel Bodeguero</h3>
                    </div>
                    <div>
                        <Link to="/" className="btn rounded-pill px-4 text-white shadow-sm" style={{ backgroundColor: '#9aa5b1' }}>
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '450px' }}>
                    <div className="d-flex flex-wrap justify-content-center gap-4" style={{ maxWidth: '850px' }}>
                        <Link to="/inventario" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Ver Inventario</Link>
                        <Link to="/gestionar-inventario" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Gestionar Inventario</Link>
                        <Link to="/cardex" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Cardex</Link>
                        <Link to="/recepcion" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Recepción de Compra</Link>
                        <Link to="/despacho" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Módulo de Despacho</Link>
                        <Link to="/escaner" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Escanear Código</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}