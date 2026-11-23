import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Inventario() {
    const navigate = useNavigate();

    // Datos de ejemplo (luego vendrán de la API de Django: GET /articulos)
    const [articulos, setArticulos] = useState([
        {
            id_articulo: 500,
            id_categoria: 1,
            categoria_nombre: 'Climatización',
            id_ubicacion: 1,
            ubicacion_nombre: 'Bodega Central - Pasillo A',
            codigo_de_barras: '12034298034821',
            nombre: 'Aire Acondicionado',
            stock_actual: 45,
            stock_critico: 10,
            unidad_de_medida: 'Unidad',
            precio: 350000,
            fecha_ingreso: '2026-11-17 10:30',
            estado: 'en bodega',
            activo: true
        },
        {
            id_articulo: 502,
            id_categoria: 2,
            categoria_nombre: 'Tuberías e Insumos',
            id_ubicacion: 1,
            ubicacion_nombre: 'Bodega Central - Pasillo C',
            codigo_de_barras: '7809876543210',
            nombre: 'Cañería de Cobre 1/2',
            stock_actual: 12,
            stock_critico: 10,
            unidad_de_medida: 'Metros',
            precio: 8900,
            fecha_ingreso: '2026-11-18 11:20',
            estado: 'en bodega',
            activo: true
        },
        {
            id_articulo: 501,
            id_categoria: 3,
            categoria_nombre: 'Repuestos y Componentes',
            id_ubicacion: 2,
            ubicacion_nombre: 'Bodega Central - Pasillo B',
            codigo_de_barras: '7801234567890',
            nombre: 'Válvula de Presión 3/4',
            stock_actual: 0,
            stock_critico: 5,
            unidad_de_medida: 'Unidad',
            precio: 24500,
            fecha_ingreso: '2026-11-18 15:10',
            estado: 'sin stock',
            activo: true
        }
    ]);

    // Estado para el modal de edición
    const [articuloEditando, setArticuloEditando] = useState(null);

    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
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

    const handleAbrirEditar = (articulo) => {
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
        const stockNum = parseInt(articuloEditando.stock_actual, 10) || 0;
        const criticoNum = parseInt(articuloEditando.stock_critico, 10) || 0;
        const precioNum = parseFloat(articuloEditando.precio) || 0;

        const actualizado = {
            ...articuloEditando,
            stock_actual: stockNum,
            stock_critico: criticoNum,
            precio: precioNum,
            estado: stockNum > 0 ? 'en bodega' : 'sin stock'
        };

        setArticulos((prev) =>
            prev.map((item) =>
                item.id_articulo === actualizado.id_articulo ? actualizado : item
            )
        );
        console.log('Artículo editado (simulación local):', actualizado);
        setArticuloEditando(null);
    };

    const handleEliminar = (articulo) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas eliminar "${articulo.nombre}" (ID: ${articulo.id_articulo})?`
        );
        if (!confirmar) return;

        setArticulos((prev) =>
            prev.filter((item) => item.id_articulo !== articulo.id_articulo)
        );
        console.log('Artículo desactivado/eliminado (simulación local):', {
            id_articulo: articulo.id_articulo,
            activo: false
        });
    };

    return (
        <div className="container-xl mt-4 mt-md-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-md-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-3 ms-md-4">
                            <h3 className="mb-0 fw-semibold">Inventario Registrado</h3>
                            <span className="small opacity-75">Registro de artículos y control de stock crítico</span>
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
                    {/* Leyenda semafórica */}
                    <div className="d-flex flex-wrap gap-2 mb-4 small">
                        <span className="badge bg-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle-fill me-1"></i> Óptimo
                        </span>
                        <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
                            <i className="bi bi-exclamation-circle-fill me-1"></i> Stock Bajo (Preventivo)
                        </span>
                        <span className="badge bg-danger px-3 py-2 rounded-pill">
                            <i className="bi bi-exclamation-triangle-fill me-1"></i> Crítico / Sin Stock
                        </span>
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
                                {articulos.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted">
                                            No hay artículos registrados en el inventario.
                                        </td>
                                    </tr>
                                ) : (
                                    articulos.map((art) => {
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
                        {articulos.length === 0 ? (
                            <div className="text-center py-4 text-muted border rounded-4 bg-light">
                                No hay artículos registrados en el inventario.
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {articulos.map((art) => {
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