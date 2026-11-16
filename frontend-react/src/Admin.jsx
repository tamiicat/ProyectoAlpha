import React from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: '#081121' }}>
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className="text-white fw-bold">Dashboard Administrador</h2>
                    <p className="text-secondary">Sistema de Gestión FYAG</p>
                </div>

                <div className="row justify-content-center g-4">
                    <div className="col-12 col-md-5">
                        <Link to="/inventario" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">📦 Inventario</h4>
                                <p className="text-secondary small mb-0">Ver tarjetas semafóricas y stock crítico</p>
                            </div>
                        </Link>
                    </div>

                    <div className="col-12 col-md-5">
                        <Link to="/escaner" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">📷 Escáner de Código</h4>
                                <p className="text-secondary small mb-0">Módulo de lectura para Bodegueros</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}