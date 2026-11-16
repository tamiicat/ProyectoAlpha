import React from 'react';
import { Link } from 'react-router-dom';

export default function Bodeguero() {
    return (
        <div className="d-flex align-items-center min-vh-100 py-4" style={{ backgroundColor: '#3b4b5e' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6 col-lg-4 text-center">
                        <div className="card shadow-lg p-4 panel-card">
                            <div className="mb-3">
                                <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ maxHeight: '90px', width: 'auto', objectFit: 'contain' }} />
                            </div>
                            <h5 className="fw-bold mb-4" style={{ color: '#2b3d52' }}>Panel Bodeguero</h5>
                            <div className="d-grid gap-3 px-2">
                                <Link to="/inventario" className="btn btn-menu py-2 shadow-sm">Gestión de Inventario</Link>
                                <Link to="#" className="btn btn-menu py-2 shadow-sm">Cardex</Link>
                                <Link to="#" className="btn btn-menu py-2 shadow-sm">Módulo de Compras</Link>
                                <Link to="/escaner" className="btn btn-menu py-2 shadow-sm">Módulo de Despachos (Escáner)</Link>
                            </div>
                            <div className="mt-4">
                                <Link to="/" className="btn btn-outline-danger w-100 rounded-pill fw-bold">Cerrar Sesión</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}