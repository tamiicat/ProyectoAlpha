import React from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: '#081121' }}>
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className="text-white fw-bold">Prototipo FYAG</h2>
                    <p className="text-secondary">Selecciona un rol para navegar por el sistema</p>
                </div>

                <div className="row justify-content-center g-4">
                    {/* Botón Admin / Inventario */}
                    <div className="col-12 col-md-5">
                        <Link to="/inventario" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">👨‍💼 Vista Administrador</h4>
                                <p className="text-secondary small mb-0">Ver tarjetas semafóricas e inventario crítico</p>
                            </div>
                        </Link>
                    </div>

                    {/* Botón Bodeguero */}
                    <div className="col-12 col-md-5">
                        <Link to="/bodeguero" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">📦 Vista Bodeguero</h4>
                                <p className="text-secondary small mb-0">Panel de gestión de almacén y logística</p>
                            </div>
                        </Link>
                    </div>

                    {/* Botón Técnico */}
                    <div className="col-12 col-md-5">
                        <Link to="/tecnico" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">🧰 Vista Técnico</h4>
                                <p className="text-secondary small mb-0">Interfaz móvil para operaciones en terreno</p>
                            </div>
                        </Link>
                    </div>

                    {/* Botón Escáner */}
                    <div className="col-12 col-md-5">
                        <Link to="/escaner" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">📷 Módulo Escáner</h4>
                                <p className="text-secondary small mb-0">Simulación de cámara para lectura de códigos</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}