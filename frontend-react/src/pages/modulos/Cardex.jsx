import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Cardex() {
    const navigate = useNavigate();

    // Datos de ejemplo alineados a la tabla Cardex (luego vendrán de Django: GET /cardex)
    const movimientosMock = [
        {
            id_cardex: 9021,
            fecha: '2026-11-17 14:30',
            id_articulo: 500,
            articulo_nombre: 'Aire Acondicionado',
            id_usuario: 2,
            usuario_nombre: 'Carlos Soto (Bodeguero)',
            tipo_movimiento: 'Ingreso',
            referencia: 'Factura Doc #104',
            cantidad: 15,
            stock_resultante: 45,
            costo_unitario: 350000,
            observacion: 'Ingreso a Bodega Central tras recepción conforme de factura.'
        },
        {
            id_cardex: 9022,
            fecha: '2026-11-18 09:15',
            id_articulo: 500,
            articulo_nombre: 'Aire Acondicionado',
            id_usuario: 3,
            usuario_nombre: 'Luis Rojas (Técnico)',
            tipo_movimiento: 'Salida',
            referencia: 'Despacho Sol. #88',
            cantidad: -2,
            stock_resultante: 43,
            costo_unitario: 350000,
            observacion: 'Retiro asignado a obra de instalación en Agroindustrial Ñuble.'
        },
        {
            id_cardex: 9023,
            fecha: '2026-11-18 16:40',
            id_articulo: 502,
            articulo_nombre: 'Válvula de Presión 3/4',
            id_usuario: 2,
            usuario_nombre: 'Carlos Soto (Bodeguero)',
            tipo_movimiento: 'Merma',
            referencia: 'Merma #12',
            cantidad: -1,
            stock_resultante: 8,
            costo_unitario: 24500,
            observacion: 'Baja por daño detectado durante inspección en bodega.'
        },
        {
            id_cardex: 9024,
            fecha: '2026-11-19 10:05',
            id_articulo: 500,
            articulo_nombre: 'Aire Acondicionado',
            id_usuario: 1,
            usuario_nombre: 'Admin FYAG',
            tipo_movimiento: 'Ajuste',
            referencia: 'Registro directo',
            cantidad: 1,
            stock_resultante: 44,
            costo_unitario: 350000,
            observacion: 'Ajuste de inventario tras conteo físico mensual.'
        }
    ];

    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(movimientosMock[0]);
    const [modoImpresion, setModoImpresion] = useState('ficha'); // 'ficha' | 'historial'

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const obtenerBadgeTipo = (tipo) => {
        const estilos = {
            Ingreso: 'bg-success bg-opacity-10 text-success border-success',
            Salida: 'bg-danger bg-opacity-10 text-danger border-danger',
            Merma: 'bg-danger bg-opacity-10 text-danger border-danger',
            Ajuste: 'bg-warning bg-opacity-10 text-warning border-warning'
        };
        return estilos[tipo] || 'bg-secondary bg-opacity-10 text-secondary border-secondary';
    };

    const movimientosFiltrados = movimientosMock.filter((mov) => {
        const coincideTipo = filtroTipo === '' || mov.tipo_movimiento === filtroTipo;
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            String(mov.id_cardex).includes(termino) ||
            mov.articulo_nombre.toLowerCase().includes(termino) ||
            mov.usuario_nombre.toLowerCase().includes(termino) ||
            mov.referencia.toLowerCase().includes(termino);
        return coincideTipo && coincideBusqueda;
    });

    const handleImprimir = (modo) => {
        setModoImpresion(modo);
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="container-xl mt-5 mb-5">
            {/* Tarjeta Principal: Tabla de Movimientos (se oculta al imprimir solo la ficha) */}
            <div
                className={`shadow-lg mb-5 ${modoImpresion === 'ficha' ? 'd-print-none' : ''}`}
                style={{ borderRadius: '25px', overflow: 'hidden' }}
            >
                <div
                    className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5"
                    style={{ backgroundColor: '#2b3d52', color: 'white' }}
                >
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Cardex FYAG</h3>
                            <span className="small opacity-75">Registro e historial auditable de movimientos del inventario</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2 d-print-none">
                        <button
                            type="button"
                            onClick={() => handleImprimir('historial')}
                            className="btn btn-light rounded-pill px-4 fw-semibold"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-printer me-2"></i> Imprimir Historial
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="btn btn-outline-light rounded-pill px-4 fw-semibold"
                        >
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {/* Filtros (ocultos al imprimir) */}
                    <div className="row g-3 mb-4 d-print-none">
                        <div className="col-12 col-md-8">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="form-control bg-light border-light shadow-sm"
                                placeholder="Buscar por ID de movimiento, artículo, usuario o referencia..."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="form-select bg-light border-light shadow-sm text-muted"
                            >
                                <option value="">Todos los tipos</option>
                                <option value="Ingreso">Ingreso</option>
                                <option value="Salida">Salida</option>
                                <option value="Merma">Merma</option>
                                <option value="Ajuste">Ajuste</option>
                            </select>
                        </div>
                    </div>

                    <p className="small text-muted mb-2 d-print-none">
                        <i className="bi bi-hand-index-thumb me-1"></i>
                        Seleccione un movimiento de la tabla para ver su comprobante imprimible abajo.
                    </p>

                    <div className="table-responsive shadow-sm rounded border">
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
                                {movimientosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4 text-muted">
                                            No se encontraron movimientos con los filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    movimientosFiltrados.map((mov) => {
                                        const estaSeleccionado =
                                            movimientoSeleccionado &&
                                            movimientoSeleccionado.id_cardex === mov.id_cardex;

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
                                                    <span className={`badge border ${obtenerBadgeTipo(mov.tipo_movimiento)}`}>
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
                </div>
            </div>

            {/* Interfaz Print / Comprobante del Movimiento Seleccionado */}
            {movimientoSeleccionado && (
                <div
                    className={`shadow-lg bg-white border ${modoImpresion === 'historial' ? 'd-print-none' : ''}`}
                    style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}
                >
                    {/* Cabecera del Comprobante */}
                    <div
                        className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5"
                        style={{ backgroundColor: '#2b3d52', color: 'white' }}
                    >
                        <div className="d-flex align-items-center mb-3 mb-md-0">
                            <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '55px', objectFit: 'contain' }} />
                            <div className="ms-4">
                                <h4 className="mb-0 fw-semibold">
                                    Comprobante de Cardex #{movimientoSeleccionado.id_cardex}
                                </h4>
                                <span className="small opacity-75">
                                    Documento de respaldo de movimiento de inventario — FYAG
                                </span>
                            </div>
                        </div>
                        <div className="d-flex gap-2 d-print-none">
                            <button
                                type="button"
                                onClick={() => handleImprimir('ficha')}
                                className="btn btn-light rounded-pill px-4 fw-semibold"
                                style={{ color: '#2b3d52' }}
                            >
                                <i className="bi bi-file-earmark-pdf me-2"></i> Exportar PDF / Imprimir
                            </button>
                        </div>
                    </div>

                    {/* Cuerpo del Comprobante (estilo ficha de Despacho/Recepción) */}
                    <div className="p-4 p-md-5">
                        <div className="row g-4">
                            <div className="col-12 col-md-6 border-end pe-md-4">
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
                                    <span className={`badge border ${obtenerBadgeTipo(movimientoSeleccionado.tipo_movimiento)}`}>
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

                            <div className="col-12 col-md-6 ps-md-4">
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