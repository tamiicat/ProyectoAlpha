import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import TourAyuda from '../../components/TourAyuda';

// Configuración visual, módulos y acciones rápidas por rol
const CONFIG_ROLES = {
  admin: {
    titulo: 'Panel Administrador',
    etiqueta: 'Administrador',
    colorPrimario: '#1b2e42',
    colorAcento: '#0ea5e9',
    verValorizacion: true,
    accionesRapidas: [
      { label: 'Crear Cuenta', ruta: '/crear-cuenta', icono: 'bi-person-plus', desc: 'Registrar usuarios' },
      { label: 'Autorizaciones', ruta: '/autorizaciones', icono: 'bi-shield-check', desc: 'Aprobar cambios' },
      { label: 'Añadir Artículo', ruta: '/gestionar-inventario', icono: 'bi-plus-square', desc: 'Nuevo insumo' },
      { label: 'Categorías y Bodegas', ruta: '/gestion-catalogos', icono: 'bi-tags', desc: 'Administrar catálogos' },
    ],
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
          { label: 'Categorías y Bodegas', ruta: '/gestion-catalogos', icono: 'bi-tags' },
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
    colorPrimario: '#0f3d3e',
    colorAcento: '#10b981',
    verValorizacion: false,
    accionesRapidas: [
      { label: 'Añadir Artículo', ruta: '/gestionar-inventario', icono: 'bi-plus-square', desc: 'Ingresar a bodega' },
      { label: 'Escanear Código', ruta: '/escaner', icono: 'bi-upc-scan', desc: 'Lectura rápida' },
      { label: 'Recepción de Compra', ruta: '/recepcion', icono: 'bi-box-arrow-in-down', desc: 'Recibir facturas' },
      { label: 'Módulo de Despacho', ruta: '/despacho', icono: 'bi-truck', desc: 'Gestionar entregas' },
    ],
    secciones: [
      {
        grupo: 'Gestión de Bodega',
        items: [
          { label: 'Ver Inventario', ruta: '/inventario', icono: 'bi-box-seam' },
          { label: 'Añadir Artículo', ruta: '/gestionar-inventario', icono: 'bi-plus-square' },
          { label: 'Categorías y Bodegas', ruta: '/gestion-catalogos', icono: 'bi-tags' },
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
    colorPrimario: '#1e293b',
    colorAcento: '#f97316',
    verValorizacion: false,
    accionesRapidas: [
      { label: 'Diagnóstico Técnico', ruta: '/diagnostico', icono: 'bi-wrench-adjustable', desc: 'Registrar reporte' },
      { label: 'Solicitar Artículo', ruta: '/solicitar-articulo', icono: 'bi-cart-plus', desc: 'Pedir materiales' },
      { label: 'Escanear Código', ruta: '/escaner', icono: 'bi-upc-scan', desc: 'Consultar insumo' },
      { label: 'Gestión de Obras', ruta: '/gestion-obras', icono: 'bi-building-gear', desc: 'Ver obras activas' },
    ],
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
    colorPrimario: '#1e1b4b',
    colorAcento: '#6366f1',
    verValorizacion: true,
    accionesRapidas: [
      { label: 'Módulo de Compras', ruta: '/modulo-compras', icono: 'bi-bag-check', desc: 'Registrar compras' },
      { label: 'Gestión de Facturas', ruta: '/gestion-facturas', icono: 'bi-receipt', desc: 'Revisar documentos' },
      { label: 'Reporte Financiero', ruta: '/reporte-financiero', icono: 'bi-graph-up-arrow', desc: 'Ver balance' },
      { label: 'Proveedores', ruta: '/gestion-proveedores', icono: 'bi-buildings', desc: 'Administrar entidades' },
    ],
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
    colorPrimario: '#27272a',
    colorAcento: '#f59e0b',
    verValorizacion: true,
    accionesRapidas: [
      { label: 'Autorizaciones', ruta: '/autorizaciones', icono: 'bi-shield-check', desc: 'Pendientes de aprobar' },
      { label: 'Ver Mermas', ruta: '/ver-mermas', icono: 'bi-clipboard-x', desc: 'Revisar pérdidas' },
      { label: 'Gestión de Obras', ruta: '/gestion-obras', icono: 'bi-building-gear', desc: 'Control de avances' },
      { label: 'Cardex', ruta: '/cardex', icono: 'bi-journal-text', desc: 'Historial de stock' },
    ],
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

export default function Dashboard({ rol = 'admin' }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Filtros de inventario por bodega y búsqueda
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState('TODAS');
  const [vistaTabla, setVistaTabla] = useState('todo'); // 'todo' | 'alertas'
  const [busqueda, setBusqueda] = useState('');

  const tema = CONFIG_ROLES[rol] || CONFIG_ROLES.admin;

  const sesion = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem('usuarioFYAG') || sessionStorage.getItem('usuarioFYAG') || 'null'
      );
    } catch {
      return null;
    }
  }, []);

  const handleCerrarSesion = () => {
    localStorage.removeItem('usuarioFYAG');
    sessionStorage.removeItem('usuarioFYAG');
    sessionStorage.removeItem('rolVistaFYAG');
    navigate('/');
  };

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inventario/items/');
      const lista = Array.isArray(data) ? data : data?.items || data?.results || [];
      setItems(lista);
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem('rolVistaFYAG', rol);
    cargarDatos();
  }, [rol]);

  const normalizados = useMemo(() => {
    return items.map((it, idx) => {
      const stock = Number(it.stock_actual ?? it.stock ?? 0);
      const critico = Number(it.stock_critico ?? 5);
      const precio = Number(it.precio ?? 0);
      const ubicacion = it.ubicacion_nombre ?? it.ubicacion ?? 'Bodega Central';
      const unidad = it.unidad_de_medida ?? 'Unid.';

      let estado = 'optimo';
      if (stock <= critico) estado = 'critico';
      else if (stock <= Math.ceil(critico * 1.5)) estado = 'bajo';

      return {
        id: it.id_articulo ?? it.id ?? idx + 1,
        nombre: it.nombre ?? 'Sin nombre',
        codigo: it.codigo_de_barras ?? it.sku ?? 'S/N',
        ubicacion,
        unidad,
        stock,
        critico,
        precio,
        estado,
      };
    });
  }, [items]);

  // Lista única de bodegas para el filtro
  const listaBodegas = useMemo(() => {
    const unicas = Array.from(new Set(normalizados.map((i) => i.ubicacion)));
    return unicas.sort((a, b) => a.localeCompare(b));
  }, [normalizados]);

  // Inventario filtrado por la bodega seleccionada
  const itemsFiltradosBodega = useMemo(() => {
    if (bodegaSeleccionada === 'TODAS') return normalizados;
    return normalizados.filter((i) => i.ubicacion === bodegaSeleccionada);
  }, [normalizados, bodegaSeleccionada]);

  const kpis = useMemo(() => {
    const total = itemsFiltradosBodega.length;
    const optimos = itemsFiltradosBodega.filter((i) => i.estado === 'optimo').length;
    const bajos = itemsFiltradosBodega.filter((i) => i.estado === 'bajo').length;
    const criticos = itemsFiltradosBodega.filter((i) => i.estado === 'critico').length;
    const unidadesTotales = itemsFiltradosBodega.reduce((acc, i) => acc + i.stock, 0);
    const valorTotal = itemsFiltradosBodega.reduce((acc, i) => acc + i.stock * i.precio, 0);
    return {
      total,
      optimos,
      bajos,
      criticos,
      alertas: bajos + criticos,
      unidadesTotales,
      valorTotal,
    };
  }, [itemsFiltradosBodega]);

  const alertasStock = useMemo(() => {
    return itemsFiltradosBodega
      .filter((i) => i.estado === 'critico' || i.estado === 'bajo')
      .sort((a, b) => a.stock - b.stock);
  }, [itemsFiltradosBodega]);

  const itemsTabla = useMemo(() => {
    const base = vistaTabla === 'alertas' ? alertasStock : itemsFiltradosBodega;
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return base;
    return base.filter(
      (i) =>
        i.nombre.toLowerCase().includes(termino) ||
        String(i.codigo).toLowerCase().includes(termino) ||
        i.ubicacion.toLowerCase().includes(termino)
    );
  }, [vistaTabla, alertasStock, itemsFiltradosBodega, busqueda]);

  const porUbicacion = useMemo(() => {
    const mapa = {};
    normalizados.forEach((i) => {
      mapa[i.ubicacion] = (mapa[i.ubicacion] || 0) + 1;
    });
    const total = normalizados.length || 1;
    return Object.entries(mapa)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [normalizados]);

  const fechaHoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const nombreUsuario = sesion
    ? `${sesion.nombres || ''} ${sesion.apellidos || ''}`.trim() || sesion.username || 'Usuario'
    : 'Sesión activa';

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f4f7fa' }}>
      {/* Fondo oscuro en móvil para cerrar el menú al tocar fuera */}
      {menuAbierto && (
        <div
          className="fyag-sidebar-backdrop d-lg-none"
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        data-tour="sidebar"
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
        {/* Logo y Rol */}
        <div
          className="p-4 text-center border-bottom"
          style={{ borderColor: 'rgba(255,255,255,0.12)' }}
        >
          <img
            src="/img/logo-fyag.png"
            alt="Logo FYAG"
            style={{ height: '58px', objectFit: 'contain' }}
            className="mb-2"
          />
          <div>
            <span
              className="badge rounded-pill px-3 py-1"
              style={{ backgroundColor: tema.colorAcento, color: '#fff', fontSize: '0.78rem' }}
            >
              {tema.etiqueta}
            </span>
          </div>
        </div>

        {/* Navegación por módulos del rol */}
        <nav className="p-3 flex-grow-1">
          {tema.secciones.map((sec) => (
            <div key={sec.grupo} className="mb-3">
              <div
                className="text-uppercase px-2 mb-2 fw-semibold"
                style={{ fontSize: '0.7rem', letterSpacing: '0.08em', opacity: 0.6 }}
              >
                {sec.grupo}
              </div>
              <div className="d-flex flex-column gap-1">
                {sec.items.map((item) => (
                  <Link
                    key={item.ruta}
                    to={item.ruta}
                    onClick={() => setMenuAbierto(false)}
                    className="d-flex align-items-center gap-2 text-white text-decoration-none px-3 py-2 rounded-3"
                    style={{
                      fontSize: '0.9rem',
                      transition: 'background 0.15s',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = tema.colorAcento)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')
                    }
                  >
                    <i className={`bi ${item.icono}`}></i>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Botón Cerrar Sesión */}
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {/* Barra Superior */}
        <header
          className="bg-white border-bottom px-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-3"
          style={{ borderTop: `4px solid ${tema.colorAcento}` }}
        >
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn btn-outline-secondary d-lg-none"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <div>
              <h4 className="mb-0 fw-bold" style={{ color: tema.colorPrimario }}>
                {tema.titulo}
              </h4>
              <small className="text-muted text-capitalize">
                {fechaHoy} · {nombreUsuario}
              </small>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2" data-tour="header-acciones">
            {/* Filtro global por Bodega */}
            <div className="d-flex align-items-center gap-2" data-tour="filtro-bodega">
              <i className="bi bi-funnel text-muted"></i>
              <select
                className="form-select form-select-sm rounded-pill bg-light border-secondary-subtle fw-semibold"
                style={{ minWidth: '190px' }}
                value={bodegaSeleccionada}
                onChange={(e) => setBodegaSeleccionada(e.target.value)}
                aria-label="Filtrar por bodega"
              >
                <option value="TODAS">Todas las bodegas ({normalizados.length})</option>
                {listaBodegas.map((bod) => (
                  <option key={bod} value={bod}>
                    {bod}
                  </option>
                ))}
              </select>
            </div>

            <span
              className={`badge rounded-pill px-3 py-2 ${
                loading
                  ? 'bg-warning-subtle text-warning-emphasis'
                  : error
                  ? 'bg-danger-subtle text-danger'
                  : 'bg-success-subtle text-success'
              }`}
            >
              ● {loading ? 'Sincronizando...' : error ? 'Sin conexión' : 'API En línea'}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={cargarDatos}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Actualizar
            </button>
          </div>
        </header>

        <main className="p-4 flex-grow-1">
          {error && (
            <div className="alert alert-danger d-flex justify-content-between align-items-center rounded-3 shadow-sm">
              <span>
                <strong>Error de conexión:</strong> {error}
              </span>
              <button className="btn btn-sm btn-outline-danger" onClick={cargarDatos}>
                Reintentar
              </button>
            </div>
          )}

          {/* Acciones Rápidas personalizadas por Rol */}
          <div className="mb-4" data-tour="acciones-rapidas">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-uppercase text-muted fw-bold small mb-0" style={{ letterSpacing: '0.06em' }}>
                Acciones Rápidas · {tema.etiqueta}
              </h6>
            </div>
            <div className="row g-3">
              {tema.accionesRapidas.map((acc) => (
                <div key={acc.ruta} className="col-12 col-sm-6 col-xl-3">
                  <Link
                    to={acc.ruta}
                    className="card border-0 shadow-sm rounded-4 text-decoration-none h-100"
                    style={{ transition: 'transform 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <div className="card-body d-flex align-items-center gap-3 py-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 text-white"
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: tema.colorAcento,
                        }}
                      >
                        <i className={`bi ${acc.icono} fs-5`}></i>
                      </div>
                      <div className="overflow-hidden">
                        <div className="fw-bold text-truncate" style={{ color: tema.colorPrimario }}>
                          {acc.label}
                        </div>
                        <small className="text-muted text-truncate d-block">{acc.desc}</small>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Tarjetas KPI */}
          <div className="row g-3 mb-4" data-tour="kpis">
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card border-0 shadow-sm h-100 rounded-4"
                style={{ borderLeft: `4px solid ${tema.colorAcento}` }}
              >
                <div className="card-body">
                  <p className="text-muted small fw-semibold text-uppercase mb-1">
                    Total Artículos
                  </p>
                  <h2 className="fw-bold mb-1" style={{ color: tema.colorPrimario }}>
                    {loading ? '...' : kpis.total}
                  </h2>
                  <small className="text-secondary">
                    {bodegaSeleccionada === 'TODAS' ? 'Todas las bodegas' : bodegaSeleccionada}
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card border-0 shadow-sm h-100 rounded-4"
                style={{ borderLeft: '4px solid #198754' }}
              >
                <div className="card-body">
                  <p className="text-muted small fw-semibold text-uppercase mb-1">Stock Óptimo</p>
                  <h2 className="fw-bold text-success mb-1">{loading ? '...' : kpis.optimos}</h2>
                  <small className="text-secondary">Disponibilidad normal</small>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card border-0 shadow-sm h-100 rounded-4"
                style={{ borderLeft: '4px solid #dc3545' }}
              >
                <div className="card-body">
                  <p className="text-muted small fw-semibold text-uppercase mb-1">
                    Alertas de Stock
                  </p>
                  <h2
                    className={`fw-bold mb-1 ${
                      kpis.criticos > 0
                        ? 'text-danger'
                        : kpis.bajos > 0
                        ? 'text-warning'
                        : 'text-success'
                    }`}
                  >
                    {loading ? '...' : kpis.alertas}
                  </h2>
                  <small className="text-secondary">
                    {kpis.criticos} críticos · {kpis.bajos} preventivos
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div
                className="card border-0 shadow-sm h-100 rounded-4"
                style={{ borderLeft: `4px solid ${tema.colorPrimario}` }}
              >
                <div className="card-body">
                  {tema.verValorizacion ? (
                    <>
                      <p className="text-muted small fw-semibold text-uppercase mb-1">
                        Valorización Stock
                      </p>
                      <h2 className="fw-bold mb-1" style={{ color: tema.colorAcento }}>
                        {loading ? '...' : `$${kpis.valorTotal.toLocaleString('es-CL')}`}
                      </h2>
                      <small className="text-secondary">Estimado en CLP</small>
                    </>
                  ) : (
                    <>
                      <p className="text-muted small fw-semibold text-uppercase mb-1">
                        Unidades en Stock
                      </p>
                      <h2 className="fw-bold mb-1" style={{ color: tema.colorAcento }}>
                        {loading ? '...' : kpis.unidadesTotales.toLocaleString('es-CL')}
                      </h2>
                      <small className="text-secondary">Existencias físicas</small>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inventario / Alertas filtrable + Distribución por Ubicación */}
          <div className="row g-4">
            <div className="col-12 col-xl-8" data-tour="alertas-stock">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap justify-content-between align-items-center gap-2 rounded-top-4">
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ color: tema.colorPrimario }}>
                      {vistaTabla === 'alertas'
                        ? 'Alertas de Reposición Prioritaria'
                        : 'Inventario General'}
                      {bodegaSeleccionada !== 'TODAS' && (
                        <span className="badge bg-light text-dark border ms-2 fw-normal fs-6">
                          {bodegaSeleccionada}
                        </span>
                      )}
                    </h5>
                    <small className="text-muted">
                      {vistaTabla === 'alertas'
                        ? 'Artículos en nivel preventivo o crítico'
                        : 'Listado completo filtrado por bodega'}
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        onClick={() => setVistaTabla('todo')}
                        className={`btn ${
                          vistaTabla === 'todo' ? 'text-white' : 'btn-outline-secondary'
                        }`}
                        style={vistaTabla === 'todo' ? { backgroundColor: tema.colorPrimario } : {}}
                      >
                        Todo ({itemsFiltradosBodega.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setVistaTabla('alertas')}
                        className={`btn ${
                          vistaTabla === 'alertas' ? 'btn-danger text-white' : 'btn-outline-secondary'
                        }`}
                      >
                        Alertas ({alertasStock.length})
                      </button>
                    </div>
                    <Link
                      to="/inventario"
                      className="btn btn-sm rounded-pill px-3 text-white fw-semibold"
                      style={{ backgroundColor: tema.colorAcento }}
                    >
                      Abrir módulo
                    </Link>
                  </div>
                </div>

                {/* Buscador rápido */}
                <div className="px-3 pt-3 pb-2 bg-light border-bottom">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white border-end-0 text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Buscar por nombre, código de barras o bodega..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setBusqueda('')}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="card-body p-0">
                  {loading ? (
                    <div className="p-5 text-center text-muted">
                      <div className="spinner-border spinner-border-sm me-2" />
                      Cargando inventario...
                    </div>
                  ) : itemsTabla.length === 0 ? (
                    <div className="p-5 text-center">
                      <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill mb-2">
                        <i className="bi bi-check-circle-fill me-1"></i>Sin coincidencias
                      </span>
                      <p className="text-muted mb-0">
                        {vistaTabla === 'alertas'
                          ? 'No hay quiebres de stock ni artículos críticos en esta vista.'
                          : 'No se encontraron artículos para el filtro seleccionado.'}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th className="ps-3">Artículo</th>
                            <th>Bodega / Ubicación</th>
                            <th className="text-center">Stock</th>
                            <th className="text-center">Crítico</th>
                            <th className="text-end pe-3">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsTabla.map((item) => (
                            <tr key={item.id}>
                              <td className="ps-3">
                                <div className="fw-semibold">{item.nombre}</div>
                                <small className="text-muted">{item.codigo}</small>
                              </td>
                              <td>{item.ubicacion}</td>
                              <td className="text-center fw-bold">
                                {item.stock}{' '}
                                <span className="fw-normal text-muted small">{item.unidad}</span>
                              </td>
                              <td className="text-center text-muted">{item.critico}</td>
                              <td className="text-end pe-3">
                                {item.estado === 'critico' ? (
                                  <span className="badge rounded-pill bg-danger">Crítico</span>
                                ) : item.estado === 'bajo' ? (
                                  <span className="badge rounded-pill bg-warning text-dark">
                                    Stock Bajo
                                  </span>
                                ) : (
                                  <span className="badge rounded-pill bg-success-subtle text-success">
                                    Óptimo
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stock por Ubicación (interactivo para filtrar) */}
            <div className="col-12 col-xl-4" data-tour="stock-ubicacion">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center rounded-top-4">
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ color: tema.colorPrimario }}>
                      Stock por Bodega
                    </h5>
                    <small className="text-muted">Haz clic en una bodega para filtrar</small>
                  </div>
                  {bodegaSeleccionada !== 'TODAS' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0"
                      onClick={() => setBodegaSeleccionada('TODAS')}
                    >
                      Ver todas
                    </button>
                  )}
                </div>
                <div className="card-body">
                  {loading ? (
                    <p className="text-muted text-center my-4">Calculando distribución...</p>
                  ) : porUbicacion.length === 0 ? (
                    <p className="text-muted text-center my-4">Sin datos para mostrar.</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {porUbicacion.map((ub) => {
                        const activa = bodegaSeleccionada === ub.nombre;
                        return (
                          <button
                            key={ub.nombre}
                            type="button"
                            onClick={() =>
                              setBodegaSeleccionada(activa ? 'TODAS' : ub.nombre)
                            }
                            className={`text-start border rounded-3 p-2 bg-transparent ${
                              activa ? 'border-primary bg-primary bg-opacity-10' : 'border-light-subtle'
                            }`}
                            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="fw-semibold text-dark">
                                {activa && <i className="bi bi-check-circle-fill text-primary me-1"></i>}
                                {ub.nombre}
                              </span>
                              <span className="text-muted">
                                {ub.cantidad} ({ub.porcentaje}%)
                              </span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className="progress-bar"
                                style={{
                                  width: `${ub.porcentaje}%`,
                                  backgroundColor: tema.colorAcento,
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Guía y tutorial interactivo */}
      <TourAyuda rol={rol} />
    </div>
  );
}