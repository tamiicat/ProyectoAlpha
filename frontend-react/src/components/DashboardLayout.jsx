import React, { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const CONFIG_ROLES = {
  admin: {
    titulo: 'Panel Administrador',
    etiqueta: 'Administrador',
    rutaInicio: '/admin',
    colorPrimario: '#1b2e42',
    colorAcento: '#0ea5e9',
    secciones: [
      {
        grupo: 'Usuarios y Permisos',
        items: [
          { label: 'Crear Cuenta', ruta: '/crear-cuenta', icono: 'bi-person-plus' },
          { label: 'Gestionar Usuarios', ruta: '/gestion-usuarios', icono: 'bi-people' },
          { label: 'Autorizaciones', ruta: '/autorizaciones', icono: 'bi-shield-check' },
        ],
      },
      {
        grupo: 'Inventario y Bodega',
        items: [
          { label: 'Ver Inventario', ruta: '/inventario', icono: 'bi-box-seam' },
          { label: 'Añadir Artículo', ruta: '/gestionar-inventario', icono: 'bi-plus-square' },
          { label: 'Cardex', ruta: '/cardex', icono: 'bi-journal-text' },
          { label: 'Escáner', ruta: '/escaner', icono: 'bi-upc-scan' },
          { label: 'Registrar Merma', ruta: '/registrar-merma', icono: 'bi-exclamation-diamond' },
          { label: 'Ver Mermas', ruta: '/ver-mermas', icono: 'bi-clipboard-x' },
        ],
      },
      {
        grupo: 'Operaciones y Terreno',
        items: [
          { label: 'Solicitar Artículo', ruta: '/solicitar-articulo', icono: 'bi-cart-plus' },
          { label: 'Módulo de Despacho', ruta: '/despacho', icono: 'bi-truck' },
          { label: 'Recepción de Compra', ruta: '/recepcion', icono: 'bi-box-arrow-in-down' },
          { label: 'Gestión de Obras', ruta: '/gestion-obras', icono: 'bi-building-gear' },
          { label: 'Diagnóstico', ruta: '/diagnostico', icono: 'bi-wrench-adjustable' },
        ],
      },
      {
        grupo: 'Finanzas y Entidades',
        items: [
          { label: 'Módulo de Compras', ruta: '/modulo-compras', icono: 'bi-bag-check' },
          { label: 'Gestión de Facturas', ruta: '/gestion-facturas', icono: 'bi-receipt' },
          { label: 'Reporte Financiero', ruta: '/reporte-financiero', icono: 'bi-graph-up-arrow' },
          { label: 'Proveedores', ruta: '/gestion-proveedores', icono: 'bi-buildings' },
          { label: 'Clientes', ruta: '/gestion-clientes', icono: 'bi-person-badge' },
        ],
      },
    ],
  },
  bodeguero: {
    titulo: 'Panel Bodeguero',
    etiqueta: 'Bodeguero',
    rutaInicio: '/bodeguero',
    colorPrimario: '#0f3d3e',
    colorAcento: '#10b981',
    secciones: [
      {
        grupo: 'Gestión de Bodega',
        items: [
          { label: 'Ver Inventario', ruta: '/inventario', icono: 'bi-box-seam' },
          { label: 'Añadir Artículo', ruta: '/gestionar-inventario', icono: 'bi-plus-square' },
          { label: 'Cardex', ruta: '/cardex', icono: 'bi-journal-text' },
          { label: 'Recepción de Compra', ruta: '/recepcion', icono: 'bi-box-arrow-in-down' },
          { label: 'Módulo de Despacho', ruta: '/despacho', icono: 'bi-truck' },
          { label: 'Escanear Código', ruta: '/escaner', icono: 'bi-upc-scan' },
          { label: 'Registrar Merma', ruta: '/registrar-merma', icono: 'bi-exclamation-diamond' },
          { label: 'Ver Mermas', ruta: '/ver-mermas', icono: 'bi-clipboard-x' },
        ],
      },
    ],
  },
  tecnico: {
    titulo: 'Panel Técnico',
    etiqueta: 'Técnico',
    rutaInicio: '/tecnico',
    colorPrimario: '#1e293b',
    colorAcento: '#f97316',
    secciones: [
      {
        grupo: 'Operaciones en Terreno',
        items: [
          { label: 'Diagnóstico Técnico', ruta: '/diagnostico', icono: 'bi-wrench-adjustable' },
          { label: 'Solicitar Artículo', ruta: '/solicitar-articulo', icono: 'bi-cart-plus' },
          { label: 'Escanear Código', ruta: '/escaner', icono: 'bi-upc-scan' },
          { label: 'Gestión de Obras', ruta: '/gestion-obras', icono: 'bi-building-gear' },
          { label: 'Registrar Merma', ruta: '/registrar-merma', icono: 'bi-exclamation-diamond' },
        ],
      },
    ],
  },
  finanzas: {
    titulo: 'Panel Finanzas',
    etiqueta: 'Finanzas',
    rutaInicio: '/finanzas',
    colorPrimario: '#1e1b4b',
    colorAcento: '#6366f1',
    secciones: [
      {
        grupo: 'Gestión Financiera',
        items: [
          { label: 'Reporte Financiero', ruta: '/reporte-financiero', icono: 'bi-graph-up-arrow' },
          { label: 'Módulo de Compras', ruta: '/modulo-compras', icono: 'bi-bag-check' },
          { label: 'Gestión de Facturas', ruta: '/gestion-facturas', icono: 'bi-receipt' },
          { label: 'Gestión de Proveedores', ruta: '/gestion-proveedores', icono: 'bi-buildings' },
          { label: 'Gestión de Clientes', ruta: '/gestion-clientes', icono: 'bi-person-badge' },
        ],
      },
    ],
  },
  supervisor: {
    titulo: 'Panel Supervisor',
    etiqueta: 'Supervisor',
    rutaInicio: '/supervisor',
    colorPrimario: '#27272a',
    colorAcento: '#f59e0b',
    secciones: [
      {
        grupo: 'Supervisión y Control',
        items: [
          { label: 'Autorizaciones', ruta: '/autorizaciones', icono: 'bi-shield-check' },
          { label: 'Ver Inventario', ruta: '/inventario', icono: 'bi-box-seam' },
          { label: 'Cardex', ruta: '/cardex', icono: 'bi-journal-text' },
          { label: 'Ver Mermas', ruta: '/ver-mermas', icono: 'bi-clipboard-x' },
          { label: 'Diagnóstico Técnico', ruta: '/diagnostico', icono: 'bi-wrench-adjustable' },
          { label: 'Gestión de Obras', ruta: '/gestion-obras', icono: 'bi-building-gear' },
          { label: 'Reporte Financiero', ruta: '/reporte-financiero', icono: 'bi-graph-up-arrow' },
        ],
      },
    ],
  },
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const sesion = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem('usuarioFYAG') || sessionStorage.getItem('usuarioFYAG') || 'null'
      );
    } catch {
      return null;
    }
  }, []);

  const rolRaw = (
    sessionStorage.getItem('rolVistaFYAG') ||
    sesion?.rol ||
    sesion?.role ||
    'admin'
  ).toLowerCase();
  const rolKey = CONFIG_ROLES[rolRaw] ? rolRaw : 'admin';
  const tema = CONFIG_ROLES[rolKey];

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuarioFYAG');
    sessionStorage.removeItem('usuarioFYAG');
    sessionStorage.removeItem('rolVistaFYAG');
    navigate('/');
  };

  return (
    <div
      className="d-flex"
      style={{
        minHeight: '100vh',
        backgroundColor: '#f4f7fa',
        '--fyag-navy': tema.colorPrimario,
        '--fyag-navy-hover': tema.colorPrimario,
        '--fyag-accent': tema.colorAcento,
      }}
    >
      {/* Fondo oscuro en móvil para cerrar el menú al tocar fuera */}
      {menuAbierto && (
        <div
          className="fyag-sidebar-backdrop d-lg-none"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fyag-sidebar d-flex flex-column text-white flex-shrink-0 ${
          menuAbierto ? 'd-flex' : 'd-none d-lg-flex'
        }`}
        style={{
          width: '270px',
          backgroundColor: tema.colorPrimario,
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          maxHeight: '100vh',
          overflowY: 'auto',
          boxShadow: '4px 0 15px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="p-4 text-center border-bottom"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          <Link to={tema.rutaInicio} className="text-decoration-none">
            <img
              src="/img/logo-fyag.png"
              alt="Logo FYAG"
              style={{ height: '58px', objectFit: 'contain' }}
              className="mb-2"
            />
          </Link>
          <div>
            <span
              className="badge rounded-pill px-3 py-1"
              style={{ backgroundColor: tema.colorAcento, color: '#fff', fontSize: '0.78rem' }}
            >
              {tema.etiqueta}
            </span>
          </div>
        </div>

        <nav className="p-3 flex-grow-1">
          {/* Botón directo para volver al Dashboard principal */}
          <div className="mb-3">
            <Link
              to={tema.rutaInicio}
              onClick={() => setMenuAbierto(false)}
              className="d-flex align-items-center gap-2 text-white text-decoration-none px-3 py-2 rounded-3 fw-semibold"
              style={{
                fontSize: '0.9rem',
                backgroundColor: 'rgba(255,255,255,0.12)',
              }}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Resumen / Dashboard</span>
            </Link>
          </div>

          {tema.secciones.map((sec) => (
            <div key={sec.grupo} className="mb-3">
              <div
                className="text-uppercase px-2 mb-2 fw-semibold"
                style={{ fontSize: '0.7rem', letterSpacing: '0.08em', opacity: 0.6 }}
              >
                {sec.grupo}
              </div>
              <div className="d-flex flex-column gap-1">
                {sec.items.map((item) => {
                  const activo = location.pathname === item.ruta;
                  return (
                    <Link
                      key={item.ruta}
                      to={item.ruta}
                      onClick={() => setMenuAbierto(false)}
                      className="d-flex align-items-center gap-2 text-white text-decoration-none px-3 py-2 rounded-3"
                      style={{
                        fontSize: '0.9rem',
                        transition: 'background 0.15s',
                        backgroundColor: activo ? tema.colorAcento : 'rgba(255,255,255,0.05)',
                        fontWeight: activo ? 600 : 400,
                      }}
                    >
                      <i className={`bi ${item.icono}`}></i>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="btn btn-outline-light w-100 rounded-pill fw-semibold"
          >
            <i className="bi bi-box-arrow-right me-2"></i>Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO DEL MÓDULO */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Barra móvil para abrir menú en pantallas pequeñas */}
        <div
          className="bg-white border-bottom px-3 py-2 d-flex d-lg-none align-items-center justify-content-between"
          style={{ borderTop: `4px solid ${tema.colorAcento}` }}
        >
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <i className="bi bi-list fs-5"></i> Menú
          </button>
          <span className="fw-bold small" style={{ color: tema.colorPrimario }}>
            {tema.titulo}
          </span>
        </div>

        <main className="p-3 p-md-4 flex-grow-1 fyag-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}