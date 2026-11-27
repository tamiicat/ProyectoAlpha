import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function GestionFacturas() {
    const navigate = useNavigate();

    const [proveedores, setProveedores] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [facturas, setFacturas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [aviso, setAviso] = useState(null);
    const [avisoModal, setAvisoModal] = useState(null);
    const [guardando, setGuardando] = useState(false);

    const [busqueda, setBusqueda] = useState('');
    const [facturaDetalle, setFacturaDetalle] = useState(null);
    const [mostrarModalNueva, setMostrarModalNueva] = useState(false);

    const [nuevaFactura, setNuevaFactura] = useState({
        id_proveedor: '',
        id_ubicacion: '',
        numero: '',
        fecha_compra: new Date().toISOString().slice(0, 10),
        comprobante: ''
    });
    const [idArticuloActual, setIdArticuloActual] = useState('');
    const [cantidadActual, setCantidadActual] = useState('');
    const [precioUnitarioActual, setPrecioUnitarioActual] = useState('');
    const [detallesNuevos, setDetallesNuevos] = useState([]);

    const normalizarFactura = (fac, idx) => ({
        id_factura: fac.id_factura ?? fac.id ?? idx + 1,
        id_proveedor: fac.id_proveedor ?? fac.proveedor_id ?? '',
        proveedor_nombre: fac.proveedor_nombre ?? fac.proveedor ?? 'Proveedor',
        id_usuario: fac.id_usuario ?? null,
        usuario_nombre: fac.usuario_nombre ?? fac.usuario ?? 'Usuario FYAG',
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

    const cargarFacturasYCatalogos = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resFacturas, resProv, resUb, resArt] = await Promise.allSettled([
                apiFetch('/facturas/'),
                apiFetch('/proveedores/'),
                apiFetch('/ubicaciones/'),
                apiFetch('/inventario/items/')
            ]);

            if (resFacturas.status === 'fulfilled') {
                const rawFac = resFacturas.value;
                const listaFac = Array.isArray(rawFac) ? rawFac : (rawFac.facturas || rawFac.results || []);
                setFacturas(listaFac.map(normalizarFactura));
            } else {
                setFacturas([]);
                setErrorCarga(resFacturas.reason?.message || 'No se pudieron cargar las facturas desde el servidor.');
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
            setFacturas([]);
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarFacturasYCatalogos();
    }, []);

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const facturasFiltradas = facturas.filter((fac) => {
        const termino = busqueda.toLowerCase();
        return (
            fac.numero.toLowerCase().includes(termino) ||
            fac.proveedor_nombre.toLowerCase().includes(termino) ||
            fac.ubicacion_nombre.toLowerCase().includes(termino) ||
            String(fac.id_factura).includes(termino)
        );
    });

    const handleSeleccionarArticulo = (e) => {
        const idArt = e.target.value;
        setIdArticuloActual(idArt);
        const art = articulos.find((a) => String(a.id_articulo) === String(idArt));
        setPrecioUnitarioActual(art ? String(art.precio) : '');
        if (avisoModal) setAvisoModal(null);
    };

    const handleAgregarDetalle = () => {
        setAvisoModal(null);
        const cantNum = parseInt(cantidadActual, 10);
        const precioNum = parseFloat(precioUnitarioActual);

        if (!idArticuloActual || !cantNum || cantNum <= 0 || isNaN(precioNum) || precioNum < 0) {
            setAvisoModal({
                tipo: 'warning',
                mensaje: 'Seleccione un artículo, una cantidad mayor a 0 y un precio unitario válido.'
            });
            return;
        }

        const art = articulos.find((a) => String(a.id_articulo) === String(idArticuloActual));
        if (!art) return;

        setDetallesNuevos((prev) => [
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

    const handleQuitarDetalle = (id_detalle) => {
        setDetallesNuevos((prev) => prev.filter((item) => item.id_detalle !== id_detalle));
        if (avisoModal) setAvisoModal(null);
    };

    const montoNetoCalculado = detallesNuevos.reduce(
        (acc, item) => acc + item.cantidad * item.precio_unitario,
        0
    );
    const ivaCalculado = Math.round(montoNetoCalculado * 0.19);
    const montoBrutoCalculado = montoNetoCalculado + ivaCalculado;

    const handleGuardarFactura = async (e) => {
        e.preventDefault();
        setAvisoModal(null);

        if (detallesNuevos.length === 0) {
            setAvisoModal({
                tipo: 'warning',
                mensaje: 'Debe agregar al menos un artículo al detalle de la factura.'
            });
            return;
        }

        const payload = {
            id_proveedor: Number(nuevaFactura.id_proveedor),
            id_ubicacion: Number(nuevaFactura.id_ubicacion),
            numero: nuevaFactura.numero.trim(),
            fecha_compra: nuevaFactura.fecha_compra,
            comprobante: nuevaFactura.comprobante.trim(),
            monto_neto: montoNetoCalculado,
            iva: ivaCalculado,
            monto_bruto: montoBrutoCalculado,
            detalles: detallesNuevos.map((d) => ({
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
            await cargarFacturasYCatalogos();
            setMostrarModalNueva(false);
            setAvisoModal(null);
            setAviso({ tipo: 'success', mensaje: 'Factura registrada correctamente en el servidor.' });
            setNuevaFactura({
                id_proveedor: '',
                id_ubicacion: '',
                numero: '',
                fecha_compra: new Date().toISOString().slice(0, 10),
                comprobante: ''
            });
            setDetallesNuevos([]);
        } catch (err) {
            setAvisoModal({
                tipo: 'danger',
                mensaje: `No se pudo registrar la factura: ${err?.message || 'Error en el servidor.'}`
            });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Gestión de Facturas</h3>
                            <span className="small opacity-75">Registro y control de facturas de compra y su detalle</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setAvisoModal(null);
                                setMostrarModalNueva(true);
                            }}
                            className="btn btn-light rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-plus-circle"></i> Nueva Factura
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={cargarFacturasYCatalogos} className="btn btn-sm btn-outline-danger ms-3">
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

                    <div className="row mb-4">
                        <div className="col-12 col-md-6">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => {
                                    setBusqueda(e.target.value);
                                    if (aviso) setAviso(null);
                                }}
                                className="form-control bg-light border-light shadow-sm"
                                placeholder="Buscar por N° de factura, proveedor o bodega..."
                            />
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">N° Factura</th>
                                    <th className="py-3">Proveedor</th>
                                    <th className="py-3">Ubicación Destino</th>
                                    <th className="py-3">Fecha Compra</th>
                                    <th className="py-3 text-end">Monto Neto</th>
                                    <th className="py-3 text-end">IVA (19%)</th>
                                    <th className="py-3 text-end">Monto Bruto</th>
                                    <th className="py-3 text-center px-4">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Cargando facturas desde el servidor...
                                        </td>
                                    </tr>
                                ) : facturasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No se encontraron facturas registradas.'}
                                        </td>
                                    </tr>
                                ) : (
                                    facturasFiltradas.map((fac) => (
                                        <tr key={fac.id_factura}>
                                            <td className="px-4">
                                                <div className="fw-semibold text-dark">{fac.numero}</div>
                                                <div className="small text-muted">ID #{fac.id_factura}</div>
                                            </td>
                                            <td className="fw-semibold">{fac.proveedor_nombre}</td>
                                            <td className="small text-muted">{fac.ubicacion_nombre}</td>
                                            <td className="small text-muted">{fac.fecha_compra}</td>
                                            <td className="text-end">{formatearCLP(fac.monto_neto)}</td>
                                            <td className="text-end text-muted">{formatearCLP(fac.iva)}</td>
                                            <td className="text-end fw-bold">{formatearCLP(fac.monto_bruto)}</td>
                                            <td className="text-center px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setFacturaDetalle(fac)}
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="Ver detalle de factura"
                                                >
                                                    <i className="bi bi-eye me-1"></i> Ver ({fac.detalles.length})
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

            {facturaDetalle && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    Detalle de Factura {facturaDetalle.numero} (ID #{facturaDetalle.id_factura})
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setFacturaDetalle(null)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-2 mb-4 small">
                                    <div className="col-12 col-md-6"><strong>Proveedor:</strong> {facturaDetalle.proveedor_nombre}</div>
                                    <div className="col-12 col-md-6"><strong>Fecha Compra:</strong> {facturaDetalle.fecha_compra}</div>
                                    <div className="col-12 col-md-6"><strong>Ubicación:</strong> {facturaDetalle.ubicacion_nombre}</div>
                                    <div className="col-12 col-md-6"><strong>Registrado por:</strong> {facturaDetalle.usuario_nombre}</div>
                                    <div className="col-12">
                                        <strong>Comprobante:</strong>{' '}
                                        <span className="text-primary">{facturaDetalle.comprobante || 'Sin archivo adjunto'}</span>
                                    </div>
                                </div>

                                <div className="table-responsive rounded border mb-3">
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
                                            {facturaDetalle.detalles.map((det) => (
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

                                <div className="d-flex justify-content-end">
                                    <div className="text-end small">
                                        <div><strong>Monto Neto:</strong> {formatearCLP(facturaDetalle.monto_neto)}</div>
                                        <div><strong>IVA (19%):</strong> {formatearCLP(facturaDetalle.iva)}</div>
                                        <div className="fs-6 mt-1"><strong>Monto Bruto:</strong> {formatearCLP(facturaDetalle.monto_bruto)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer px-4 py-3 bg-light">
                                <button
                                    type="button"
                                    className="btn text-white rounded-pill px-4 fw-semibold"
                                    style={{ backgroundColor: '#2b3d52' }}
                                    onClick={() => setFacturaDetalle(null)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mostrarModalNueva && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">Registrar Nueva Factura</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModalNueva(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleGuardarFactura}>
                                <div className="modal-body p-4">
                                    {avisoModal && (
                                        <div
                                            className={`alert alert-${avisoModal.tipo} alert-dismissible fade show rounded-3 mb-3 d-flex justify-content-between align-items-center`}
                                            role="alert"
                                        >
                                            <span className="small">{avisoModal.mensaje}</span>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Cerrar"
                                                onClick={() => setAvisoModal(null)}
                                            ></button>
                                        </div>
                                    )}

                                    <div className="row g-3 mb-4">
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">N° Factura</label>
                                            <input
                                                type="text"
                                                maxLength={30}
                                                required
                                                value={nuevaFactura.numero}
                                                onChange={(e) => setNuevaFactura((prev) => ({ ...prev, numero: e.target.value }))}
                                                className="form-control bg-light"
                                                placeholder="Ej: FAC-905"
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Fecha de Compra</label>
                                            <input
                                                type="date"
                                                required
                                                value={nuevaFactura.fecha_compra}
                                                onChange={(e) => setNuevaFactura((prev) => ({ ...prev, fecha_compra: e.target.value }))}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Comprobante (Ref. / URL)</label>
                                            <input
                                                type="text"
                                                maxLength={255}
                                                value={nuevaFactura.comprobante}
                                                onChange={(e) => setNuevaFactura((prev) => ({ ...prev, comprobante: e.target.value }))}
                                                className="form-control bg-light"
                                                placeholder="Ej: factura_905.pdf"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Proveedor</label>
                                            <select
                                                required
                                                value={nuevaFactura.id_proveedor}
                                                onChange={(e) => setNuevaFactura((prev) => ({ ...prev, id_proveedor: e.target.value }))}
                                                className="form-select bg-light text-muted"
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
                                                value={nuevaFactura.id_ubicacion}
                                                onChange={(e) => setNuevaFactura((prev) => ({ ...prev, id_ubicacion: e.target.value }))}
                                                className="form-select bg-light text-muted"
                                            >
                                                <option value="">Seleccione una ubicación...</option>
                                                {ubicaciones.map((ub) => (
                                                    <option key={ub.id_ubicacion} value={ub.id_ubicacion}>
                                                        {ub.bodega}{ub.detalle ? ` - ${ub.detalle}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-3 bg-light border mb-3">
                                        <h6 className="fw-bold small text-uppercase text-muted mb-3">Artículos de la Factura</h6>
                                        <div className="row g-2 align-items-end">
                                            <div className="col-12 col-md-5">
                                                <select
                                                    value={idArticuloActual}
                                                    onChange={handleSeleccionarArticulo}
                                                    className="form-select bg-white text-muted"
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
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={cantidadActual}
                                                    onChange={(e) => {
                                                        setCantidadActual(e.target.value);
                                                        if (avisoModal) setAvisoModal(null);
                                                    }}
                                                    className="form-control bg-white"
                                                    placeholder="Cant."
                                                />
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={precioUnitarioActual}
                                                    onChange={(e) => {
                                                        setPrecioUnitarioActual(e.target.value);
                                                        if (avisoModal) setAvisoModal(null);
                                                    }}
                                                    className="form-control bg-white"
                                                    placeholder="Precio Unit."
                                                />
                                            </div>
                                            <div className="col-12 col-md-2 d-grid">
                                                <button
                                                    type="button"
                                                    onClick={handleAgregarDetalle}
                                                    className="btn btn-outline-primary bg-white fw-semibold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {detallesNuevos.length > 0 && (
                                            <ul className="list-group mt-3">
                                                {detallesNuevos.map((item) => (
                                                    <li key={item.id_detalle} className="list-group-item d-flex justify-content-between align-items-center small">
                                                        <span>
                                                            <strong>{item.articulo_nombre}</strong> — {item.cantidad} x {formatearCLP(item.precio_unitario)} ={' '}
                                                            <strong>{formatearCLP(item.cantidad * item.precio_unitario)}</strong>
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuitarDetalle(item.id_detalle)}
                                                            className="btn btn-sm btn-outline-danger"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-end">
                                        <div className="text-end small">
                                            <div>Monto Neto: <strong>{formatearCLP(montoNetoCalculado)}</strong></div>
                                            <div>IVA (19%): <strong>{formatearCLP(ivaCalculado)}</strong></div>
                                            <div className="fs-6 mt-1">Monto Bruto: <strong>{formatearCLP(montoBrutoCalculado)}</strong></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        disabled={guardando}
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setMostrarModalNueva(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        {guardando ? 'Guardando...' : 'Guardar Factura'}
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