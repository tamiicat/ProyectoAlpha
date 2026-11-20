import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Tecnico() {
    const navigate = useNavigate();

    const sesionGuardada =
        JSON.parse(localStorage.getItem('usuarioFYAG') || sessionStorage.getItem('usuarioFYAG') || 'null');

    const handleCerrarSesion = () => {
        localStorage.removeItem('usuarioFYAG');
        sessionStorage.removeItem('usuarioFYAG');
        navigate('/');
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '70px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Panel Técnico</h3>
                            {sesionGuardada && (
                                <span className="small opacity-75">
                                    Sesión activa: {sesionGuardada.nombres} {sesionGuardada.apellidos}
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={handleCerrarSesion}
                            className="btn rounded-pill px-4 text-white shadow-sm"
                            style={{ backgroundColor: '#9aa5b1' }}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0 d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '450px' }}>
                    <div className="d-flex flex-wrap justify-content-center gap-4" style={{ maxWidth: '850px' }}>
                        <Link to="/diagnostico" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Diagnóstico Técnico</Link>
                        <Link to="/solicitar-articulo" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Solicitar Artículo</Link>
                        <Link to="/escaner" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Escanear Código</Link>
                        <Link to="/gestion-obras" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Gestión de Obras</Link>
                        <Link to="/registrar-merma" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px', fontSize: '1rem' }}>Registrar Merma</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}