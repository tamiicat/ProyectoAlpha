import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Admin() {
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
            {/* Contenedor principal estilo Tarjeta */}
            <div className="shadow-lg rounded" style={{ overflow: 'hidden' }}>
                {/* Cabecera Azul Oscuro */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img
                            src="/img/logo-fyag.png"
                            alt="Logo FYAG"
                            style={{ height: '70px', objectFit: 'contain' }}
                        />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-bold">Panel Administrador</h3>
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
                            className="btn btn-light text-secondary fw-bold rounded-pill px-4"
                        >
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>

                {/* Contenedor de Botones */}
                <div className="bg-white p-5 border border-top-0 rounded-bottom">
                    <div className="d-flex flex-wrap justify-content-center gap-3">
                        {/* Usuarios y Permisos */}
                        <Link to="/crear-cuenta" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Crear Cuenta</Link>
                        <Link to="/gestion-usuarios" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestionar Usuarios</Link>
                        <Link to="/autorizaciones" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Autorizaciones</Link>

                        {/* Inventario y Bodega */}
                        <Link to="/inventario" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Ver Inventario</Link>
                        <Link to="/gestionar-inventario" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Añadir Artículo</Link>
                        <Link to="/cardex" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Cardex</Link>
                        <Link to="/escaner" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Escáner</Link>
                        <Link to="/registrar-merma" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Registrar Merma</Link>
                        <Link to="/ver-mermas" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Ver Mermas</Link>

                        {/* Operaciones y Terreno */}
                        <Link to="/solicitar-articulo" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Solicitar Artículo</Link>
                        <Link to="/despacho" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Módulo de Despacho</Link>
                        <Link to="/recepcion" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Recepción de Compra</Link>
                        <Link to="/gestion-obras" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestión de Obras</Link>
                        <Link to="/diagnostico" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Diagnóstico</Link>

                        {/* Compras, Finanzas y Entidades */}
                        <Link to="/modulo-compras" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Módulo de Compras</Link>
                        <Link to="/gestion-facturas" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestión de Facturas</Link>
                        <Link to="/reporte-financiero" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Reporte Financiero</Link>
                        <Link to="/gestion-proveedores" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestión de Proveedores</Link>
                        <Link to="/gestion-clientes" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestión de Clientes</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}