import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Cardex() {
    const navigate = useNavigate();
    const comprobanteRef = useRef(null);

    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
    const [modoImpresion, setModoImpresion] = useState('ficha'); // 'ficha' | 'historial'

    useEffect(() => {
        setCargando(true);
        setErrorCarga('');
        apiFetch('/cardex/')
            .then((data) => {
                const lista = Array.isArray(data) ? data : (data.movimientos || []);
                if (lista.length > 0) {
                    const normalizados = lista.map((mov, idx) => ({
                        id_cardex: mov.id_cardex ?? mov.id ?? idx + 1,
                        fecha: mov.fecha ?? mov.created_at ?? 'Sin fecha',
                        id_articulo: mov.id_articulo ?? mov.sku ?? '-',
                        articulo_nombre: mov.articulo_nombre ?? mov.nombre ?? mov.sku ?? 'Artículo',
                        id_usuario: mov.id_usuario ?? null,
                        usuario_nombre: mov.usuario_nombre ?? mov.usuario ?? 'Usuario FYAG',
                        tipo_movimiento: mov.tipo_movimiento ?? mov.tipo ?? 'Ingreso',
                        referencia: mov.referencia ?? 'Registro sistema',
                        cantidad: Number(mov.cantidad ?? 0),
                        stock_resultante: Number(mov.stock_resultante ?? mov.stock ?? 0),
                        costo_unitario: Number(mov.costo_unitario ?? mov.precio_neto ?? 0),
                        observacion: mov.observacion ?? ''
                    }));
                    setMovimientos(normalizados);
                    setMovimientoSeleccionado(normalizados[0]);
                } else {
                    setMovimientos([]);
                    setMovimientoSeleccionado(null);
                }
            })
            .catch((err) => {
                console.error('Error al cargar Cardex desde el servidor:', err.message);
                setMovimientos([]);
                setMovimientoSeleccionado(null);
                setErrorCarga(err?.message || 'No se pudieron cargar los movimientos del Cardex desde el servidor.');
            })
            .finally(() => {
                setCargando(false);
            });
    }, []);

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    // Estilos WCAG alto contraste por tipo de movimiento
    const obtenerEstiloTipo = (tipo) => {
        const tipoNormalizado = (tipo || '').toLowerCase();
        if (tipoNormalizado.includes('ingreso')) {
            return {
                claseBadge: 'bg-success text-white',
                colorBorde: '#198754',
                icono: 'bi-arrow-down-circle-fill'
            };
        }
        if (tipoNormalizado.includes('salida') || tipoNormalizado.includes('egreso')) {
            return {
                claseBadge: 'bg-danger text-white',
                colorBorde: '#dc3545',
                icono: 'bi-arrow-up-circle-fill'
            };
        }
        if (tipoNormalizado.includes('merma')) {
            return {
                claseBadge: 'bg-danger text-white',
                colorBorde: '#dc3545',
                icono: 'bi-exclamation-octagon-fill'
            };
        }
        if (tipoNormalizado.includes('ajuste')) {
            return {
                claseBadge: 'bg-warning text-dark',
                colorBorde: '#d97706',
                icono: 'bi-sliders'
            };
        }
        return {
            claseBadge: 'bg-secondary text-white',
            colorBorde: '#6c757d',
            icono: 'bi-record-circle'
        };
    };

    const movimientosFiltrados = movimientos.filter((mov) => {
        const coincideTipo =
            filtroTipo === '' ||
            mov.tipo_movimiento.toLowerCase() === filtroTipo.toLowerCase();
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            String(mov.id_cardex).includes(termino) ||
            mov.articulo_nombre.toLowerCase().includes(termino) ||
            mov.usuario_nombre.toLowerCase().includes(termino) ||
            mov.referencia.toLowerCase().includes(termino);
        return coincideTipo && coincideBusqueda;
    });

    const handleSeleccionarYVerComprobante = (mov) => {
        setMovimientoSeleccionado(mov);
        setTimeout(() => {
            comprobanteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    };

    const handleImprimir = (modo) => {
        setModoImpresion(modo);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="container-xl mt-4 mt-md-5 mb-5">
            {/* Tarjeta Principal: Historial de Movimientos */}
            <div
                className={`shadow-lg mb-5 ${modoImpresion === 'ficha' ? 'd-print-none' : ''}`}
                style={{ borderRadius: '25px', overflow: 'hidden' }}
            >
                <div
                    className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-md-5 gap-3"
                    style={{ backgroundColor: '#2b3d52', color: 'white' }}
                >
                    <div className="d-flex align-items-center">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-3 ms-md-4">
                            <h3 className="mb-0 fw-semibold">Cardex FYAG</h3>
                            <span className="small opacity-75">Registro e historial auditable de movimientos del inventario</span>
                        </div>
                    </div>
                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto d-print-none">
                        <button
                            type="button"
                            onClick={() => handleImprimir('historial')}
                            className="btn btn-light rounded-pill px-4 fw-semibold"
                            style={{ color: '#2b3d52', minHeight: '48px' }}
                        >
                            <i className="bi bi-printer me-2"></i> Imprimir Historial
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn btn-outline-light rounded-pill px-4 fw-semibold"
                            style={{ minHeight: '48px' }}
                        >
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-3 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger mb-4 d-print-none" role="alert">
                            {errorCarga}
                        </div>
                    )}

                    {/* Filtros con altura táctil >= 48px (ocultos al imprimir) */}
                    <div className="row g-3 mb-4 d-print-none">
                        <div className="col-12 col-md-8">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="form-control bg-light border-light shadow-sm"
                                style={{ minHeight: '48px' }}
                                placeholder="Buscar por ID de movimiento, artículo, usuario o referencia..."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="form-select bg-light border-light shadow-sm text-dark"
                                style={{ minHeight: '48px' }}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="Ingreso">Ingreso</option>
                                <option value="Salida">Salida</option>
                                <option value="Merma">Merma</option>
                                <option value="Ajuste">Ajuste</option>
                            </select>
                        </div>
                    </div>

                    <p className="small text-muted mb-3 d-print-none">
                        <i className="bi bi-hand-index-thumb me-1"></i>
                        Seleccione un movimiento para ver su comprobante imprimible abajo.
                    </p>

                    {/* VISTA ESCRITORIO Y PDF: Tabla tradicional */}
                    <div className="d-none d-md-block d-print-block table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID Mov.</th>
                                    <th className="py-3">Fecha/Hora</th>
                                    <th className="py-3">Artículo</th>
                                    <th className="py-3">Usuario</th>
                                    <th className="py-3 text-center">Tipo</th>
                                    <th className="py-3">Referencia</th>
                                    <th className="py-3 text-center">Cant.</th>
                                    <th className="py-3 text-center">Stock Result.</th>
                                    <th className="py-3 text-end px-4">Costo Unit.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4 text-muted">
                                            Cargando movimientos del Cardex...
                                        </td>
                                    </tr>
                                ) : movimientosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No se encontraron movimientos con los filtros aplicados.'}
                                        </td>
                                    </tr>
                                ) : (
                                    movimientosFiltrados.map((mov) => {
                                        const estaSeleccionado =
                                            movimientoSeleccionado &&
                                            movimientoSeleccionado.id_cardex === mov.id_cardex;
                                        const estilo = obtenerEstiloTipo(mov.tipo_movimiento);

                                        return (
                                            <tr
                                                key={mov.id_cardex}
                                                onClick={() => setMovimientoSeleccionado(mov)}
                                                className={estaSeleccionado ? 'table-active' : ''}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className="px-4 fw-semibold text-muted">#{mov.id_cardex}</td>
                                                <td className="small text-muted">{mov.fecha}</td>
                                                <td className="fw-semibold">{mov.articulo_nombre}</td>
                                                <td className="small">{mov.usuario_nombre}</td>
                                                <td className="text-center">
                                                    <span className={`badge ${estilo.claseBadge} px-3 py-2 rounded-pill`}>
                                                        <i className={`bi ${estilo.icono} me-1`}></i>
                                                        {mov.tipo_movimiento}
                                                    </span>
                                                </td>
                                                <td className="small text-muted">{mov.referencia}</td>
                                                <td
                                                    className={`text-center fw-bold ${
                                                        mov.cantidad > 0 ? 'text-success' : 'text-danger'
                                                    }`}
                                                >
                                                    {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                                                </td>
                                                <td className="text-center fw-semibold">{mov.stock_resultante}</td>
                                                <td className="text-end px-4 fw-semibold">
                                                    {formatearCLP(mov.costo_unitario)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* VISTA MÓVIL: Tarjetas (Cards) legibles con botones >= 48px */}
                    <div className="d-block d-md-none d-print-none">
                        {cargando ? (
                            <div className="text-center py-4 text-muted border rounded-4 bg-light">
                                Cargando movimientos del Cardex...
                            </div>
                        ) : movimientosFiltrados.length === 0 ? (
                            <div className="text-center py-4 text-muted border rounded-4 bg-light">
                                {errorCarga
                                    ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                    : 'No se encontraron movimientos con los filtros aplicados.'}
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {movimientosFiltrados.map((mov) => {
                                    const estaSeleccionado =
                                        movimientoSeleccionado &&
                                        movimientoSeleccionado.id_cardex === mov.id_cardex;
                                    const estilo = obtenerEstiloTipo(mov.tipo_movimiento);

                                    return (
                                        <div
                                            key={mov.id_cardex}
                                            className="card shadow-sm"
                                            style={{
                                                borderRadius: '16px',
                                                border: estaSeleccionado ? '2px solid #2b3d52' : '1px solid #e2e8f0',
                                                borderLeft: `6px solid ${estilo.colorBorde}`,
                                                backgroundColor: estaSeleccionado ? '#f1f5f9' : '#f8fafc'
                                            }}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                                    <div>
                                                        <span className="text-muted small fw-semibold d-block">
                                                            #{mov.id_cardex} · {mov.fecha}
                                                        </span>
                                                        <h6 className="fw-bold mb-0 mt-1" style={{ color: '#2b3d52' }}>
                                                            {mov.articulo_nombre}
                                                        </h6>
                                                    </div>
                                                    <span className={`badge ${estilo.claseBadge} px-2 py-2 rounded-pill flex-shrink-0`}>
                                                        <i className={`bi ${estilo.icono} me-1`}></i>
                                                        {mov.tipo_movimiento}
                                                    </span>
                                                </div>

                                                <div className="small text-muted mb-3">
                                                    <div><i className="bi bi-person me-2"></i>{mov.usuario_nombre}</div>
                                                    <div><i className="bi bi-file-text me-2"></i>{mov.referencia}</div>
                                                </div>

                                                <div className="row g-2 bg-white rounded-3 p-2 border mb-3 text-center">
                                                    <div className="col-4 border-end">
                                                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Cantidad</span>
                                                        <span className={`fw-bold ${mov.cantidad > 0 ? 'text-success' : 'text-danger'}`}>
                                                            {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                                                        </span>
                                                    </div>
                                                    <div className="col-4 border-end">
                                                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Stock Final</span>
                                                        <span className="fw-bold text-dark">{mov.stock_resultante}</span>
                                                    </div>
                                                    <div className="col-4">
                                                        <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>Costo Unit.</span>
                                                        <span className="fw-bold text-dark">{formatearCLP(mov.costo_unitario)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleSeleccionarYVerComprobante(mov)}
                                                    className={`btn w-100 fw-semibold ${
                                                        estaSeleccionado ? 'text-white' : 'btn-outline-secondary'
                                                    }`}
                                                    style={{
                                                        minHeight: '48px',
                                                        borderRadius: '12px',
                                                        backgroundColor: estaSeleccionado ? '#2b3d52' : 'white'
                                                    }}
                                                >
                                                    <i className="bi bi-file-earmark-text me-2"></i>
                                                    {estaSeleccionado ? 'Comprobante Seleccionado' : 'Ver Comprobante'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Interfaz Print / Comprobante del Movimiento Seleccionado */}
            {movimientoSeleccionado && (
                <div
                    ref={comprobanteRef}
                    className={`shadow-lg bg-white border ${modoImpresion === 'historial' ? 'd-print-none' : ''}`}
                    style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}
                >
                    {/* Cabecera del Comprobante */}
                    <div
                        className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-md-5 gap-3"
                        style={{ backgroundColor: '#2b3d52', color: 'white' }}
                    >
                        <div className="d-flex align-items-center">
                            <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '55px', objectFit: 'contain' }} />
                            <div className="ms-3 ms-md-4">
                                <h4 className="mb-0 fw-semibold">
                                    Comprobante de Cardex #{movimientoSeleccionado.id_cardex}
                                </h4>
                                <span className="small opacity-75">
                                    Documento de respaldo de movimiento de inventario — FYAG
                                </span>
                            </div>
                        </div>
                        <div className="w-100 w-md-auto d-print-none">
                            <button
                                type="button"
                                onClick={() => handleImprimir('ficha')}
                                className="btn btn-light rounded-pill px-4 fw-semibold w-100 w-md-auto"
                                style={{ color: '#2b3d52', minHeight: '48px' }}
                            >
                                <i className="bi bi-file-earmark-pdf me-2"></i> Exportar PDF / Imprimir
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo del Comprobante */}
                    <div className="p-4 p-md-5">
                        <div className="row g-4">
                            <div className="col-12 col-md-6 pe-md-4">
                                <h6 className="fw-bold text-uppercase small text-muted mb-3">
                                    Información del Movimiento
                                </h6>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">N° Movimiento:</span> #{movimientoSeleccionado.id_cardex}
                                </p>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Fecha y Hora:</span> {movimientoSeleccionado.fecha}
                                </p>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Tipo:</span>{' '}
                                    <span className={`badge ${obtenerEstiloTipo(movimientoSeleccionado.tipo_movimiento).claseBadge} px-3 py-1 rounded-pill`}>
                                        {movimientoSeleccionado.tipo_movimiento}
                                    </span>
                                </p>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Documento / Referencia:</span> {movimientoSeleccionado.referencia}
                                </p>
                                <p className="mb-0">
                                    <span className="fw-bold text-muted">Responsable:</span> {movimientoSeleccionado.usuario_nombre}
                                </p>
                            </div>

                            <div className="col-12 col-md-6 ps-md-4 border-top pt-4 pt-md-0 border-top-md-0">
                                <h6 className="fw-bold text-uppercase small text-muted mb-3">
                                    Detalle de Inventario y Valorización
                                </h6>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Artículo:</span> {movimientoSeleccionado.articulo_nombre} (ID #{movimientoSeleccionado.id_articulo})
                                </p>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Cantidad Movida:</span>{' '}
                                    <strong className={movimientoSeleccionado.cantidad > 0 ? 'text-success' : 'text-danger'}>
                                        {movimientoSeleccionado.cantidad > 0
                                            ? `+${movimientoSeleccionado.cantidad}`
                                            : movimientoSeleccionado.cantidad}{' '}
                                        unidades
                                    </strong>
                                </p>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Stock Resultante:</span>{' '}
                                    <strong>{movimientoSeleccionado.stock_resultante} unidades</strong>
                                </p>
                                <p className="mb-2">
                                    <span className="fw-bold text-muted">Costo Unitario:</span>{' '}
                                    {formatearCLP(movimientoSeleccionado.costo_unitario)}
                                </p>
                                <p className="mb-0">
                                    <span className="fw-bold text-muted">Valorización del Movimiento:</span>{' '}
                                    <strong className="text-dark">
                                        {formatearCLP(
                                            Math.abs(movimientoSeleccionado.cantidad) * movimientoSeleccionado.costo_unitario
                                        )}
                                    </strong>
                                </p>
                            </div>
                        </div>

                        <hr className="my-4 opacity-25" />

                        <div className="bg-light p-3 rounded-3 border">
                            <span className="fw-bold text-muted small d-block mb-1">Observación / Detalle de Auditoría:</span>
                            <p className="mb-0 small text-dark">
                                {movimientoSeleccionado.observacion || 'Sin observaciones registradas.'}
                            </p>
                        </div>

                        {/* Pie de firma visible al exportar a PDF */}
                        <div className="d-none d-print-flex justify-content-between mt-5 pt-4 small text-muted">
                            <div className="text-center" style={{ width: '40%', borderTop: '1px solid #999', paddingTop: '8px' }}>
                                Firma Responsable ({movimientoSeleccionado.usuario_nombre})
                            </div>
                            <div className="text-center" style={{ width: '40%', borderTop: '1px solid #999', paddingTop: '8px' }}>
                                V°B° Supervisión / Bodega FYAG
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}