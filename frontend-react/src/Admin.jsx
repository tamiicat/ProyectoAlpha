import React from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
    return (
        <div className="container mt-5 mb-5">
            {/* Contenedor principal estilo Tarjeta */}
            <div className="shadow-lg rounded" style={{ overflow: 'hidden' }}>
                
                {/* Cabecera Azul Oscuro */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        {/* Logo corregido: sin fondo gris y sin padding */}
                        <img 
                            src="/img/logo-fyag.png" 
                            alt="Logo FYAG" 
                            style={{ height: '70px', objectFit: 'contain' }} 
                        />
                        <h3 className="ms-4 mb-0 fw-bold">Panel Administrador</h3>
                    </div>
                    <div>
                        <Link to="/" className="btn btn-light text-secondary fw-bold rounded-pill px-4">
                            <i className="bi bi-box-arrow-right me-2"></i> Cerrar Sesión
                        </Link>
                    </div>
                </div>
                {/* Contenedor de Botones */}
                <div className="bg-white p-5 border border-top-0 rounded-bottom">
                    {/* Flexbox con flex-wrap permite que los botones se acomoden solos como en el diseño */}
                    <div className="d-flex flex-wrap justify-content-center gap-3">
                        <Link to="/crear-cuenta" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Crear Cuenta</Link>
                        <Link to="/gestion-usuarios" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestionar Usuarios</Link>
                        <Link to="/inventario" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Ver Inventario</Link>
                        <Link to="/gestionar-inventario" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestionar Inventario</Link>
                        <Link to="/cardex" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Cardex</Link>
                        <Link to="/registrar-merma" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Registrar Merma</Link>
                        
                        <Link to="/ver-mermas" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Ver Mermas</Link>
                        <Link to="/solicitar-articulo" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Solicitar Artículo</Link>
                        <Link to="/diagnostico" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Diagnóstico</Link>
                        <Link to="/reporte-financiero" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Reportes</Link>
                        
                        <Link to="/despacho" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Módulo de Despacho</Link>
                        <Link to="/modulo-compras" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Módulo de Compras</Link>
                        <Link to="/gestion-obras" className="btn btn-menu py-3 shadow-sm" style={{ width: '220px' }}>Gestión de Obras</Link>
                    </div>
                </div>

            </div>
        </div>
    );
}