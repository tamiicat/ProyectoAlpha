import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Inventario() {
    const navigate = useNavigate();

    const [articulos, setArticulos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [avisoAccion, setAvisoAccion] = useState('');

    // Estados de búsqueda y filtros
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroUbicacion, setFiltroUbicacion] = useState('todas');
    const [filtroEstado, setFiltroEstado] = useState('todos'); // todos | optimo | bajo | critico

    // Paginación
    const [filasPorPagina, setFilasPorPagina] = useState(10);
    const [paginaActual, setPaginaActual] = useState(1);

    // Estado para el modal de edición
    const [articuloEditando, setArticuloEditando] = useState(null);

    useEffect(() => {
        setCargando(true);
        setErrorCarga('');

        apiFetch('/inventario/items/')
            .then((data) => {
                const lista = Array.isArray(data) ? data : (data.items || []);
                const normalizados = lista.map((item, idx) => ({
                    id_articulo: item.id_articulo ?? item.id ?? idx + 1,
                    categoria_nombre: item.categoria_nombre ?? 'General',
                    ubicacion_nombre: item.ubicacion_nombre ?? item.ubicacion ?? 'Bodega Central',
                    codigo_de_barras: item.codigo_de_barras ?? item.sku ?? 'S/N',
                    nombre: item.nombre ?? 'Sin nombre',
                    stock_actual: Number(item.stock_actual ?? item.stock ?? 0),
                    stock_critico: Number(item.stock_critico ?? 5),
                    unidad_de_medida: item.unidad_de_medida ?? 'Unidad',
                    precio: Number(item.precio ?? 0),
                    estado: Number(item.stock_actual ?? item.stock ?? 0) > 0 ? 'en bodega' : 'sin stock',
                    activo: true
                }));
                setArticulos(normalizados);
            })
            .catch((err) => {
                setErrorCarga(err.message || 'No se pudo cargar el inventario desde el servidor.');
                setArticulos([]);
            })
            .finally(() => {
                setCargando(false);
            });
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, filtroCategoria, filtroUbicacion, filtroEstado, filasPorPagina]);

    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    // Clasificación del estado de stock para filtros y semáforo
    const obtenerTipoEstado = (stockActual, stockCritico) => {
        if (stockActual === 0 || stockActual <= stockCritico) return 'critico';
        if (stockActual <= Math.ceil(stockCritico * 1.5)) return 'bajo';
        return 'optimo';
    };

    // Indicador semafórico de stock (WCAG alto contraste)
    const obtenerSemaforoStock = (stockActual, stockCritico) => {
        if (stockActual === 0) {
            return {
                etiqueta: 'Sin Stock',
                colorBorde: '#dc3545',
                claseBadge: 'bg-danger text-white',
                claseTexto: 'text-danger',
                icono: 'bi-x-octagon-fill'
            };
        }
        if (stockActual <= stockCritico) {
            return {
                etiqueta: 'Stock Crítico',
                colorBorde: '#dc3545',
                claseBadge: 'bg-danger text-white',
                claseTexto: 'text-danger',
                icono: 'bi-exclamation-triangle-fill'
            };
        }
        if (stockActual <= Math.ceil(stockCritico * 1.5)) {
            return {
                etiqueta: 'Stock Bajo',
                colorBorde: '#d97706',
                claseBadge: 'bg-warning text-dark',
                claseTexto: 'text-warning-emphasis',
                icono: 'bi-exclamation-circle-fill'
            };
        }
        return {
            etiqueta: 'Stock Óptimo',
            colorBorde: '#198754',
            claseBadge: 'bg-success text-white',
            claseTexto: 'text-success',
            icono: 'bi-check-circle-fill'
        };
    };

    // Opciones dinámicas para los selectores
    const categoriasUnicas = useMemo(() => {
        return [...new Set(articulos.map((a) => a.categoria_nombre).filter(Boolean))].sort();
    }, [articulos]);

    const ubicacionesUnicas = useMemo(() => {
        return [...new Set(articulos.map((a) => a.ubicacion_nombre).filter(Boolean))].sort();
    }, [articulos]);

    // Conteo por estado para mostrar en los botones del semáforo
    const conteoEstados = useMemo(() => {
        return articulos.reduce(
            (acc, art) => {
                const tipo = obtenerTipoEstado(art.stock_actual, art.stock_critico);
                acc[tipo] += 1;
                return acc;
            },
            { optimo: 0, bajo: 0, critico: 0 }
        );
    }, [articulos]);

    // Lista filtrada en tiempo real
    const articulosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return articulos.filter((art) => {
            const coincideTexto =
                !texto ||
                art.nombre.toLowerCase().includes(texto) ||
                String(art.codigo_de_barras).toLowerCase().includes(texto) ||
                String(art.id_articulo).includes(texto);

            const coincideCategoria =
                filtroCategoria === 'todas' || art.categoria_nombre === filtroCategoria;

            const coincideUbicacion =
                filtroUbicacion === 'todas' || art.ubicacion_nombre === filtroUbicacion;

            const tipoEstado = obtenerTipoEstado(art.stock_actual, art.stock_critico);
            const coincideEstado = filtroEstado === 'todos' || tipoEstado === filtroEstado;

            return coincideTexto && coincideCategoria && coincideUbicacion && coincideEstado;
        });
    }, [articulos, busqueda, filtroCategoria, filtroUbicacion, filtroEstado]);

    const totalPaginas = Math.max(1, Math.ceil(articulosFiltrados.length / filasPorPagina));
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const indiceInicio = (paginaSegura - 1) * filasPorPagina;
    const indiceFin = Math.min(indiceInicio + filasPorPagina, articulosFiltrados.length);
    const articulosPaginados = articulosFiltrados.slice(indiceInicio, indiceFin);

    const hayFiltrosActivos =
        busqueda.trim() !== '' ||
        filtroCategoria !== 'todas' ||
        filtroUbicacion !== 'todas' ||
        filtroEstado !== 'todos';

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroCategoria('todas');
        setFiltroUbicacion('todas');
        setFiltroEstado('todos');
    };

    const handleAbrirEditar = (articulo) => {
        setAvisoAccion('');
        setArticuloEditando({ ...articulo });
    };

    const handleCambioEdicion = (e) => {
        const { name, value } = e.target;
        setArticuloEditando((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGuardarEdicion = (e) => {
        e.preventDefault();
        setAvisoAccion('La edición de artículos aún no está conectada a un endpoint en el backend; no se guardó en la base de datos.');
        setArticuloEditando(null);
    };

    const handleEliminar = (articulo) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas eliminar "${articulo.nombre}" (ID: ${articulo.id_articulo})?`
        );
        if (!confirmar) return;

        setAvisoAccion('La eliminación de artículos aún no está conectada a un endpoint en el backend; no se aplicó en la base de datos.');
    };

    return (
        <div className="container-xl mt-4 mt-md-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-md-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-3 ms-md-4">
                            <h3 className="mb-0 fw-semibold">Inventario Registrado</h3>
                            <span className="small opacity-75">Registro general de artículos y control de stock crítico</span>
                        </div>
                    </div>
                    <div className="w-100 w-md-auto text-center">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn btn-outline-light rounded-pill px-4 fw-semibold w-100 w-md-auto"
                            style={{ minHeight: '48px' }}
                        >
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-3 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger rounded-3 mb-4">
                            <strong>Error al cargar inventario:</strong> {errorCarga}
                        </div>
                    )}

                    {avisoAccion && (
                        <div className="alert alert-warning rounded-3 mb-4">
                            {avisoAccion}
                        </div>
                    )}

                    {/* Barra de búsqueda y filtros */}
                    <div className="row g-3 mb-3 align-items-end">
                        <div className="col-12 col-md-5">
                            <label className="form-label small fw-semibold text-muted mb-1">
                                Buscar artículo
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-light border-start-0"
                                    placeholder="Nombre, código de barras o ID..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    style={{ minHeight: '44px' }}
                                />
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-semibold text-muted mb-1">
                                Categoría
                            </label>
                            <select
                                className="form-select bg-light"
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                style={{ minHeight: '44px' }}
                            >
                                <option value="todas">Todas las categorías</option>
                                {categoriasUnicas.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-sm-6 col-md-3">
                            <label className="form-label small fw-semibold text-muted mb-1">
                                Ubicación
                            </label>
                            <select
                                className="form-select bg-light"
                                value={filtroUbicacion}
                                onChange={(e) => setFiltroUbicacion(e.target.value)}
                                style={{ minHeight: '44px' }}
                            >
                                <option value="todas">Todas las ubicaciones</option>
                                {ubicacionesUnicas.map((ub) => (
                                    <option key={ub} value={ub}>
                                        {ub}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-12 col-md-1 d-grid">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={limpiarFiltros}
                                disabled={!hayFiltrosActivos}
                                title="Limpiar filtros"
                                style={{ minHeight: '44px' }}
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Filtros rápidos por Semáforo + selector de cantidad */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div className="d-flex flex-wrap gap-2 small">
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('todos')}
                                className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                                    filtroEstado === 'todos'
                                        ? 'btn-dark'
                                        : 'btn-outline-secondary'
                                }`}
                            >
                                Todos ({articulos.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('optimo')}
                                className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                                    filtroEstado === 'optimo'
                                        ? 'btn-success'
                                        : 'btn-outline-success'
                                }`}
                            >
                                <i className="bi bi-check-circle-fill me-1"></i>
                                Óptimo ({conteoEstados.optimo})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('bajo')}
                                className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                                    filtroEstado === 'bajo'
                                        ? 'btn-warning text-dark'
                                        : 'btn-outline-warning text-dark'
                                }`}
                            >
                                <i className="bi bi-exclamation-circle-fill me-1"></i>
                                Stock Bajo ({conteoEstados.bajo})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroEstado('critico')}
                                className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                                    filtroEstado === 'critico'
                                        ? 'btn-danger'
                                        : 'btn-outline-danger'
                                }`}
                            >
                                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                Crítico / Sin Stock ({conteoEstados.critico})
                            </button>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <label htmlFor="selectFilasInventario" className="small text-muted fw-semibold mb-0">
                                Mostrar:
                            </label>
                            <select
                                id="selectFilasInventario"
                                value={filasPorPagina}
                                onChange={(e) => setFilasPorPagina(Number(e.target.value))}
                                className="form-select form-select-sm bg-light border-secondary-subtle fw-semibold"
                                style={{ width: 'auto', minHeight: '36px' }}
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="small text-muted">por página</span>
                        </div>
                    </div>

                    {/* VISTA ESCRITORIO: Tabla tradicional (oculta en móvil) */}
                    <div className="d-none d-md-block table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Nombre</th>
                                    <th className="py-3">Código de Barras</th>
                                    <th className="py-3">Categoría</th>
                                    <th className="py-3">Ubicación</th>
                                    <th className="py-3 text-center">Stock Actual</th>
                                    <th className="py-3 text-center">Stock Crítico</th>
                                    <th className="py-3 text-end">Precio</th>
                                    <th className="py-3 text-center">Semáforo</th>
                                    <th className="py-3 text-center px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted">
                                            Cargando inventario desde el servidor...
                                        </td>
                                    </tr>
                                ) : articulosPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted">
                                            {hayFiltrosActivos
                                                ? 'No se encontraron artículos con los filtros seleccionados.'
                                                : 'No hay artículos registrados en el inventario.'}
                                        </td>
                                    </tr>
                                ) : (
                                    articulosPaginados.map((art) => {
                                        const semaforo = obtenerSemaforoStock(art.stock_actual, art.stock_critico);
                                        return (
                                            <tr key={art.id_articulo}>
                                                <td className="px-4 fw-semibold text-muted">{art.id_articulo}</td>
                                                <td className="fw-semibold">{art.nombre}</td>
                                                <td className="text-muted small">{art.codigo_de_barras}</td>
                                                <td>{art.categoria_nombre}</td>
                                                <td className="small">{art.ubicacion_nombre}</td>
                                                <td className={`text-center fw-bold ${semaforo.claseTexto}`}>
                                                    {art.stock_actual} <span className="fw-normal text-muted small">{art.unidad_de_medida}</span>
                                                </td>
                                                <td className="text-center text-muted fw-semibold">{art.stock_critico}</td>
                                                <td className="text-end fw-semibold">{formatearPrecio(art.precio)}</td>
                                                <td className="text-center">
                                                    <span className={`badge ${semaforo.claseBadge} px-3 py-2 rounded-pill`}>
                                                        <i className={`bi ${semaforo.icono} me-1`}></i>
                                                        {semaforo.etiqueta}
                                                    </span>
                                                </td>
                                                <td className="text-center px-4">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAbrirEditar(art)}
                                                            className="btn btn-outline-primary"
                                                            style={{ minWidth: '42px', minHeight: '42px' }}
                                                            title="Editar artículo"
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEliminar(art)}
                                                            className="btn btn-outline-danger"
                                                            style={{ minWidth: '42px', minHeight: '42px' }}
                                                            title="Eliminar artículo"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* VISTA MÓVIL: Tarjetas (Cards) legibles con semáforo y botones >= 48px */}
                    <div className="d-block d-md-none">
                        {cargando ? (
                            <div className="text-center py-4 text-muted border rounded-4 bg-light">
                                Cargando inventario desde el servidor...
                            </div>
                        ) : articulosPaginados.length === 0 ? (
                            <div className="text-center py-4 text-muted border rounded-4 bg-light">
                                {hayFiltrosActivos
                                    ? 'No se encontraron artículos con los filtros seleccionados.'
                                    : 'No hay artículos registrados en el inventario.'}
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {articulosPaginados.map((art) => {
                                    const semaforo = obtenerSemaforoStock(art.stock_actual, art.stock_critico);
                                    return (
                                        <div
                                            key={art.id_articulo}
                                            className="card shadow-sm border-0"
                                            style={{
                                                borderRadius: '16px',
                                                borderLeft: `6px solid ${semaforo.colorBorde}`,
                                                backgroundColor: '#f8fafc'
                                            }}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                                    <div>
                                                        <span className="text-muted small fw-semibold d-block">
                                                            #{art.id_articulo} · {art.categoria_nombre}
                                                        </span>
                                                        <h6 className="fw-bold mb-0 mt-1" style={{ color: '#2b3d52' }}>
                                                            {art.nombre}
                                                        </h6>
                                                    </div>
                                                    <span className={`badge ${semaforo.claseBadge} px-2 py-2 rounded-pill flex-shrink-0`}>
                                                        <i className={`bi ${semaforo.icono} me-1`}></i>
                                                        {semaforo.etiqueta}
                                                    </span>
                                                </div>

                                                <div className="small text-muted mb-3">
                                                    <div><i className="bi bi-upc-scan me-2"></i>{art.codigo_de_barras}</div>
                                                    <div><i className="bi bi-geo-alt me-2"></i>{art.ubicacion_nombre}</div>
                                                </div>

                                                <div className="row g-2 bg-white rounded-3 p-2 border mb-3 text-center">
                                                    <div className="col-4 border-end">
                                                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Stock Actual</span>
                                                        <span className={`fw-bold ${semaforo.claseTexto}`}>
                                                            {art.stock_actual} {art.unidad_de_medida}
                                                        </span>
                                                    </div>
                                                    <div className="col-4 border-end">
                                                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Crítico</span>
                                                        <span className="fw-bold text-dark">{art.stock_critico}</span>
                                                    </div>
                                                    <div className="col-4">
                                                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Precio</span>
                                                        <span className="fw-bold text-dark">{formatearPrecio(art.precio)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAbrirEditar(art)}
                                                        className="btn btn-outline-primary fw-semibold flex-fill"
                                                        style={{ minHeight: '48px', borderRadius: '12px' }}
                                                    >
                                                        <i className="bi bi-pencil-square me-2"></i>Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminar(art)}
                                                        className="btn btn-outline-danger fw-semibold flex-fill"
                                                        style={{ minHeight: '48px', borderRadius: '12px' }}
                                                    >
                                                        <i className="bi bi-trash me-2"></i>Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Controles de paginación */}
                    {!cargando && articulosFiltrados.length > 0 && (
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
                            <span className="small text-muted">
                                Mostrando <strong>{indiceInicio + 1}–{indiceFin}</strong> de{' '}
                                <strong>{articulosFiltrados.length}</strong> artículos
                            </span>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    disabled={paginaSegura <= 1}
                                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                >
                                    <i className="bi bi-chevron-left me-1"></i> Anterior
                                </button>
                                <span className="small fw-semibold px-2" style={{ color: '#2b3d52' }}>
                                    Página {paginaSegura} de {totalPaginas}
                                </span>
                                <button
                                    type="button"
                                    disabled={paginaSegura >= totalPaginas}
                                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                >
                                    Siguiente <i className="bi bi-chevron-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para editar artículo */}
            {articuloEditando && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    Editar Artículo #{articuloEditando.id_articulo}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setArticuloEditando(null)}
                                ></button>
                            </div>
                            <form onSubmit={handleGuardarEdicion}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Nombre</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                maxLength={200}
                                                required
                                                value={articuloEditando.nombre}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Código de Barras</label>
                                            <input
                                                type="text"
                                                name="codigo_de_barras"
                                                maxLength={20}
                                                required
                                                value={articuloEditando.codigo_de_barras}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Stock Actual</label>
                                            <input
                                                type="number"
                                                name="stock_actual"
                                                min="0"
                                                required
                                                value={articuloEditando.stock_actual}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Stock Crítico</label>
                                            <input
                                                type="number"
                                                name="stock_critico"
                                                min="0"
                                                required
                                                value={articuloEditando.stock_critico}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Unidad de Medida</label>
                                            <input
                                                type="text"
                                                name="unidad_de_medida"
                                                maxLength={25}
                                                required
                                                value={articuloEditando.unidad_de_medida}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Precio ($)</label>
                                            <input
                                                type="number"
                                                name="precio"
                                                min="0"
                                                step="0.01"
                                                required
                                                value={articuloEditando.precio}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                                style={{ minHeight: '48px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        style={{ minHeight: '48px' }}
                                        onClick={() => setArticuloEditando(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52', minHeight: '48px' }}
                                    >
                                        Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}