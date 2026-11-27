import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function ModuloCompras() {
    const navigate = useNavigate();

    const [proveedores, setProveedores] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [compras, setCompras] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [aviso, setAviso] = useState(null);
    const [guardando, setGuardando] = useState(false);

    // Estado de cabecera (Factura)
    const [formData, setFormData] = useState({
        id_proveedor: '',
        id_ubicacion: '',
        numero: '',
        fecha_compra: new Date().toISOString().slice(0, 10),
        comprobante: ''
    });

    // Estado de ítems (Detalle_Factura 1:N)
    const [idArticuloActual, setIdArticuloActual] = useState('');
    const [cantidadActual, setCantidadActual] = useState('');
    const [precioUnitarioActual, setPrecioUnitarioActual] = useState('');
    const [detalles, setDetalles] = useState([]);
    const [compraDetalleModal, setCompraDetalleModal] = useState(null);

    const normalizarCompra = (fac, idx) => ({
        id_factura: fac.id_factura ?? fac.id ?? idx + 1,
        id_proveedor: fac.id_proveedor ?? fac.proveedor_id ?? '',
        proveedor_nombre: fac.proveedor_nombre ?? fac.proveedor ?? 'Proveedor',
        id_usuario: fac.id_usuario ?? null,
        id_ubicacion: fac.id_ubicacion ?? fac.ubicacion_id ?? '',
        ubicacion_nombre: fac.ubicacion_nombre ?? fac.ubicacion ?? 'Ubicación',
        numero: fac.numero ?? fac.numero_documento ?? `FAC-${fac.id_factura ?? fac.id ?? idx + 1}`,
        fecha_compra: fac.fecha_compra ?? fac.fecha ?? '',
        comprobante: fac.comprobante ?? '',
        monto_neto: Number(fac.monto_neto ?? fac.neto ?? 0),
        iva: Number(fac.iva ?? 0),
        monto_bruto: Number(fac.monto_bruto ?? fac.total ?? 0),
        detalles: Array.isArray(fac.detalles)
            ? fac.detalles.map((det, dIdx) => ({
                  id_detalle: det.id_detalle ?? det.id ?? dIdx + 1,
                  id_articulo: det.id_articulo ?? det.articulo_id ?? det.id ?? dIdx + 1,
                  articulo_nombre: det.articulo_nombre ?? det.nombre ?? 'Artículo',
                  cantidad: Number(det.cantidad ?? 0),
                  precio_unitario: Number(det.precio_unitario ?? det.precio ?? 0)
              }))
            : []
    });

    const cargarComprasYCatalogos = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resCompras, resProv, resUb, resArt] = await Promise.allSettled([
                apiFetch('/facturas/'),
                apiFetch('/proveedores/'),
                apiFetch('/ubicaciones/'),
                apiFetch('/inventario/items/')
            ]);

            if (resCompras.status === 'fulfilled') {
                const rawFac = resCompras.value;
                const listaFac = Array.isArray(rawFac) ? rawFac : (rawFac.facturas || rawFac.results || []);
                setCompras(listaFac.map(normalizarCompra));
            } else {
                setCompras([]);
                setErrorCarga(resCompras.reason?.message || 'No se pudieron cargar las compras desde el servidor.');
            }

            if (resProv.status === 'fulfilled') {
                const rawProv = resProv.value;
                const listaProv = Array.isArray(rawProv) ? rawProv : (rawProv.proveedores || rawProv.results || []);
                setProveedores(
                    listaProv.map((p, idx) => ({
                        id_proveedor: p.id_proveedor ?? p.id ?? idx + 1,
                        razon_social: p.razon_social ?? p.nombre ?? 'Proveedor',
                        rut: p.rut ?? ''
                    }))
                );
            }

            if (resUb.status === 'fulfilled') {
                const rawUb = resUb.value;
                const listaUb = Array.isArray(rawUb) ? rawUb : (rawUb.ubicaciones || rawUb.results || []);
                setUbicaciones(
                    listaUb.map((u, idx) => ({
                        id_ubicacion: u.id_ubicacion ?? u.id ?? idx + 1,
                        bodega: u.bodega ?? u.nombre ?? 'Bodega',
                        detalle: u.detalle ?? u.descripcion ?? ''
                    }))
                );
            }

            if (resArt.status === 'fulfilled') {
                const rawArt = resArt.value;
                const listaArt = Array.isArray(rawArt) ? rawArt : (rawArt.items || rawArt.articulos || rawArt.results || []);
                setArticulos(
                    listaArt.map((a, idx) => ({
                        id_articulo: a.id_articulo ?? a.id ?? idx + 1,
                        nombre: a.nombre ?? 'Artículo',
                        precio: Number(a.precio ?? a.precio_unitario ?? 0)
                    }))
                );
            }
        } catch (err) {
            setCompras([]);
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarComprasYCatalogos();
    }, []);

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const handleSeleccionarArticulo = (e) => {
        const idArt = e.target.value;
        setIdArticuloActual(idArt);
        const art = articulos.find((a) => String(a.id_articulo) === String(idArt));
        setPrecioUnitarioActual(art ? String(art.precio) : '');
        if (aviso) setAviso(null);
    };

    const handleAgregarArticulo = () => {
        setAviso(null);
        const cantNum = parseInt(cantidadActual, 10);
        const precioNum = parseFloat(precioUnitarioActual);

        if (!idArticuloActual || !cantNum || cantNum <= 0 || isNaN(precioNum) || precioNum < 0) {
            setAviso({
                tipo: 'warning',
                mensaje: 'Seleccione un artículo, una cantidad mayor a 0 y un precio unitario válido.'
            });
            return;
        }

        const art = articulos.find((a) => String(a.id_articulo) === String(idArticuloActual));
        if (!art) return;

        setDetalles((prev) => [
            ...prev,
            {
                id_detalle: Date.now(),
                id_articulo: art.id_articulo,
                articulo_nombre: art.nombre,
                cantidad: cantNum,
                precio_unitario: precioNum
            }
        ]);

        setIdArticuloActual('');
        setCantidadActual('');
        setPrecioUnitarioActual('');
    };

    const handleQuitarArticulo = (id_detalle) => {
        setDetalles((prev) => prev.filter((item) => item.id_detalle !== id_detalle));
        if (aviso) setAviso(null);
    };

    // Cálculos automáticos según modelo (NUMERIC 12, 2)
    const montoNeto = detalles.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);
    const iva = Math.round(montoNeto * 0.19);
    const montoBruto = montoNeto + iva;

    const handleRegistrarCompra = async (e) => {
        e.preventDefault();
        setAviso(null);

        if (detalles.length === 0) {
            setAviso({
                tipo: 'warning',
                mensaje: 'Debe agregar al menos un artículo a la compra.'
            });
            return;
        }

        const payload = {
            id_proveedor: Number(formData.id_proveedor),
            id_ubicacion: Number(formData.id_ubicacion),
            numero: formData.numero.trim(),
            fecha_compra: formData.fecha_compra,
            comprobante: formData.comprobante.trim(),
            monto_neto: montoNeto,
            iva: iva,
            monto_bruto: montoBruto,
            detalles: detalles.map((d) => ({
                id_articulo: d.id_articulo,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario
            }))
        };

        setGuardando(true);
        try {
            await apiFetch('/facturas/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            setFormData({
                id_proveedor: '',
                id_ubicacion: '',
                numero: '',
                fecha_compra: new Date().toISOString().slice(0, 10),
                comprobante: ''
            });
            setDetalles([]);
            await cargarComprasYCatalogos();
            setAviso({
                tipo: 'success',
                mensaje: 'Compra registrada correctamente en el servidor.'
            });
        } catch (err) {
            setAviso({
                tipo: 'danger',
                mensaje: `No se pudo registrar la compra: ${err?.message || 'Error en el servidor.'}`
            });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                {/* Header corporativo */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Módulo de Compras</h3>
                            <span className="small opacity-75">Registro de compras y facturas de abastecimiento a proveedores</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={cargarComprasYCatalogos} className="btn btn-sm btn-outline-danger ms-3">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {aviso && (
                        <div
                            className={`alert alert-${aviso.tipo} alert-dismissible fade show rounded-3 shadow-sm mb-4 d-flex justify-content-between align-items-center`}
                            role="alert"
                        >
                            <div>
                                <i
                                    className={`bi me-2 ${
                                        aviso.tipo === 'success'
                                            ? 'bi-check-circle-fill'
                                            : aviso.tipo === 'warning'
                                            ? 'bi-exclamation-triangle-fill'
                                            : 'bi-x-circle-fill'
                                    }`}
                                ></i>
                                <span>{aviso.mensaje}</span>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Cerrar"
                                onClick={() => setAviso(null)}
                            ></button>
                        </div>
                    )}

                    {/* Formulario Nueva Compra (Factura + Detalle_Factura) */}
                    <div className="card bg-light border-0 shadow-sm p-4 mb-5" style={{ borderRadius: '15px' }}>
                        <h5 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>Registrar Nueva Compra</h5>
                        <form onSubmit={handleRegistrarCompra}>
                            <div className="row g-3 mb-4">
                                <div className="col-12 col-md-4">
                                    <label className="form-label fw-semibold text-muted small">N° Factura / Compra</label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        required
                                        disabled={guardando}
                                        className="form-control bg-white border-light shadow-sm"
                                        placeholder="Ej: FAC-305"
                                        value={formData.numero}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, numero: e.target.value }));
                                            if (aviso) setAviso(null);
                                        }}
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label fw-semibold text-muted small">Fecha de Compra</label>
                                    <input
                                        type="date"
                                        required
                                        disabled={guardando}
                                        className="form-control bg-white border-light shadow-sm"
                                        value={formData.fecha_compra}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, fecha_compra: e.target.value }));
                                            if (aviso) setAviso(null);
                                        }}
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label fw-semibold text-muted small">Comprobante (Archivo / URL)</label>
                                    <input
                                        type="text"
                                        maxLength={255}
                                        disabled={guardando}
                                        className="form-control bg-white border-light shadow-sm"
                                        placeholder="Ej: factura_305.pdf"
                                        value={formData.comprobante}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, comprobante: e.target.value }));
                                            if (aviso) setAviso(null);
                                        }}
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-semibold text-muted small">Proveedor</label>
                                    <select
                                        required
                                        disabled={guardando || cargando}
                                        className="form-select bg-white border-light shadow-sm text-muted"
                                        value={formData.id_proveedor}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, id_proveedor: e.target.value }));
                                            if (aviso) setAviso(null);
                                        }}
                                    >
                                        <option value="">Seleccione un proveedor...</option>
                                        {proveedores.map((prov) => (
                                            <option key={prov.id_proveedor} value={prov.id_proveedor}>
                                                {prov.razon_social}{prov.rut ? ` (${prov.rut})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-semibold text-muted small">Ubicación Destino</label>
                                    <select
                                        required
                                        disabled={guardando || cargando}
                                        className="form-select bg-white border-light shadow-sm text-muted"
                                        value={formData.id_ubicacion}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, id_ubicacion: e.target.value }));
                                            if (aviso) setAviso(null);
                                        }}
                                    >
                                        <option value="">Seleccione una bodega/ubicación...</option>
                                        {ubicaciones.map((ub) => (
                                            <option key={ub.id_ubicacion} value={ub.id_ubicacion}>
                                                {ub.bodega}{ub.detalle ? ` - ${ub.detalle}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Agregar Artículos (Detalle_Factura) */}
                            <div className="p-3 bg-white rounded-3 border mb-4">
                                <h6 className="fw-bold small text-uppercase text-muted mb-3">Artículos de la Compra</h6>
                                <div className="row g-2 align-items-end">
                                    <div className="col-12 col-md-5">
                                        <label className="form-label small text-muted mb-1">Artículo</label>
                                        <select
                                            disabled={guardando || cargando}
                                            className="form-select bg-light border-0 text-muted"
                                            value={idArticuloActual}
                                            onChange={handleSeleccionarArticulo}
                                        >
                                            <option value="">Seleccione un artículo...</option>
                                            {articulos.map((art) => (
                                                <option key={art.id_articulo} value={art.id_articulo}>
                                                    {art.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-6 col-md-2">
                                        <label className="form-label small text-muted mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            min="1"
                                            disabled={guardando}
                                            className="form-control bg-light border-0"
                                            placeholder="Ej: 5"
                                            value={cantidadActual}
                                            onChange={(e) => {
                                                setCantidadActual(e.target.value);
                                                if (aviso) setAviso(null);
                                            }}
                                        />
                                    </div>
                                    <div className="col-6 col-md-3">
                                        <label className="form-label small text-muted mb-1">Precio Unit. (CLP)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            disabled={guardando}
                                            className="form-control bg-light border-0"
                                            placeholder="Ej: 45000"
                                            value={precioUnitarioActual}
                                            onChange={(e) => {
                                                setPrecioUnitarioActual(e.target.value);
                                                if (aviso) setAviso(null);
                                            }}
                                        />
                                    </div>
                                    <div className="col-12 col-md-2 d-grid">
                                        <button
                                            type="button"
                                            disabled={guardando}
                                            onClick={handleAgregarArticulo}
                                            className="btn btn-outline-primary fw-semibold"
                                        >
                                            <i className="bi bi-plus-circle me-1"></i> Agregar
                                        </button>
                                    </div>
                                </div>

                                {detalles.length > 0 && (
                                    <div className="table-responsive mt-3">
                                        <table className="table table-sm align-middle mb-0">
                                            <thead className="text-muted small">
                                                <tr>
                                                    <th>Artículo</th>
                                                    <th className="text-center">Cant.</th>
                                                    <th className="text-end">Precio Unit.</th>
                                                    <th className="text-end">Subtotal</th>
                                                    <th className="text-center">Quitar</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detalles.map((item) => (
                                                    <tr key={item.id_detalle}>
                                                        <td className="fw-semibold small">{item.articulo_nombre}</td>
                                                        <td className="text-center small">{item.cantidad}</td>
                                                        <td className="text-end small">{formatearCLP(item.precio_unitario)}</td>
                                                        <td className="text-end small fw-bold">{formatearCLP(item.cantidad * item.precio_unitario)}</td>
                                                        <td className="text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuitarArticulo(item.id_detalle)}
                                                                className="btn btn-sm btn-outline-danger py-0 px-2"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                <div className="small text-muted">
                                    <span className="me-3">Neto: <strong>{formatearCLP(montoNeto)}</strong></span>
                                    <span className="me-3">IVA (19%): <strong>{formatearCLP(iva)}</strong></span>
                                    <span className="fs-6 text-dark">Total Bruto: <strong>{formatearCLP(montoBruto)}</strong></span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="btn px-4 py-2 fw-bold text-white shadow-sm"
                                    style={{ backgroundColor: '#2b3d52', borderRadius: '10px' }}
                                >
                                    {guardando ? 'Registrando...' : 'Registrar Compra'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabla de Compras Registradas */}
                    <h5 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>Compras Registradas</h5>
                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">N° Factura</th>
                                    <th className="py-3">Proveedor</th>
                                    <th className="py-3">Ubicación</th>
                                    <th className="py-3">Fecha Compra</th>
                                    <th className="py-3 text-end">Neto</th>
                                    <th className="py-3 text-end">IVA</th>
                                    <th className="py-3 text-end">Total Bruto</th>
                                    <th className="py-3 px-4 text-center">Ítems</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Cargando compras desde el servidor...
                                        </td>
                                    </tr>
                                ) : compras.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No hay compras registradas en el servidor.'}
                                        </td>
                                    </tr>
                                ) : (
                                    compras.map((compra) => (
                                        <tr key={compra.id_factura}>
                                            <td className="px-4">
                                                <div className="fw-semibold text-dark">{compra.numero}</div>
                                                <div className="small text-muted">ID #{compra.id_factura}</div>
                                            </td>
                                            <td className="fw-semibold">{compra.proveedor_nombre}</td>
                                            <td className="small text-muted">{compra.ubicacion_nombre}</td>
                                            <td className="text-muted small">{compra.fecha_compra}</td>
                                            <td className="text-end small">{formatearCLP(compra.monto_neto)}</td>
                                            <td className="text-end small text-muted">{formatearCLP(compra.iva)}</td>
                                            <td className="text-end fw-bold">{formatearCLP(compra.monto_bruto)}</td>
                                            <td className="px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setCompraDetalleModal(compra)}
                                                    className="btn btn-sm btn-outline-primary"
                                                >
                                                    Ver ({compra.detalles.length})
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para ver Detalle de Compra */}
            {compraDetalleModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    Detalle de Compra {compraDetalleModal.numero} (ID #{compraDetalleModal.id_factura})
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setCompraDetalleModal(null)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="small mb-3">
                                    <strong>Proveedor:</strong> {compraDetalleModal.proveedor_nombre} &nbsp;|&nbsp;
                                    <strong>Comprobante:</strong> {compraDetalleModal.comprobante || 'Sin comprobante'}
                                </p>
                                <div className="table-responsive rounded border">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                            <tr>
                                                <th className="py-2 px-3">ID Art.</th>
                                                <th className="py-2">Artículo</th>
                                                <th className="py-2 text-center">Cant.</th>
                                                <th className="py-2 text-end">Precio Unit.</th>
                                                <th className="py-2 text-end px-3">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {compraDetalleModal.detalles.map((det) => (
                                                <tr key={det.id_detalle}>
                                                    <td className="px-3 text-muted">#{det.id_articulo}</td>
                                                    <td className="fw-semibold">{det.articulo_nombre}</td>
                                                    <td className="text-center fw-bold">{det.cantidad}</td>
                                                    <td className="text-end">{formatearCLP(det.precio_unitario)}</td>
                                                    <td className="text-end px-3 fw-semibold">
                                                        {formatearCLP(det.cantidad * det.precio_unitario)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer px-4 py-3 bg-light">
                                <button
                                    type="button"
                                    className="btn text-white rounded-pill px-4 fw-semibold"
                                    style={{ backgroundColor: '#2b3d52' }}
                                    onClick={() => setCompraDetalleModal(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}