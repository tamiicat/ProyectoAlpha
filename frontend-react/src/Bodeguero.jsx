import React from 'react';
import { Link } from 'react-router-dom';

export default function Bodeguero() {
    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: '#1a1d20' }}>
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className="text-white fw-bold">Panel de Bodeguero</h2>
                    <p className="text-secondary">Gestión de Almacén y Entregas</p>
                </div>

                <div className="row justify-content-center g-4">
                    <div className="col-12 col-md-5">
                        <Link to="/escaner" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">📷 Escáner de Salida</h4>
                                <p className="text-secondary small mb-0">Registrar entrega y devolución de herramientas</p>
                            </div>
                        </Link>
                    </div>

                    <div className="col-12 col-md-5">
                        <Link to="/inventario" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">📦 Stock General</h4>
                                <p className="text-secondary small mb-0">Revisar existencias de bodega</p>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <Link to="/" className="btn btn-outline-secondary px-4 rounded-pill">
                        &larr; Cambiar de Rol (Volver al Inicio)
                    </Link>
                </div>
            </div>
        </div>
    );
}