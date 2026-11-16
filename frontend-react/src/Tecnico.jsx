import React from 'react';
import { Link } from 'react-router-dom';

export default function Tecnico() {
    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: '#212529' }}>
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className="text-white fw-bold">Panel de Técnico</h2>
                    <p className="text-secondary">Operaciones en Terreno</p>
                </div>

                <div className="row justify-content-center g-4">
                    <div className="col-12 col-md-5">
                        <Link to="/inventario" className="text-decoration-none">
                            <div className="card h-100 bg-dark border-secondary shadow text-center p-4" style={{ borderRadius: '15px' }}>
                                <h4 className="text-white mb-3">🧰 Mis Herramientas</h4>
                                <p className="text-secondary small mb-0">Ver equipo asignado actualmente</p>
                            </div>
                        </Link>
                    </div>

                    <div className="col-12 col-md-5">
                        <div className="card h-100 bg-dark border-danger shadow text-center p-4 opacity-75" style={{ borderRadius: '15px' }}>
                            <h4 className="text-danger mb-3">⚠️ Reportar Falla</h4>
                            <p className="text-secondary small mb-0">Generar alerta de merma o daño (En desarrollo)</p>
                        </div>
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