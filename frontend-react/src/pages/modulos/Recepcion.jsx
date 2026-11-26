import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Recepcion() {
    const navigate = useNavigate();

    const hoy = new Date().toISOString().slice(0, 10);

    const [facturas, setFacturas] = useState([]);
    const [recepciones, setRecepciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [guardando, setGuardando] = useState(false);

    const [formData, setFormData] = useState({
        id_factura: '',
        fecha_entrega: hoy,
        fecha_recepcion: hoy,
        firma: '',
        observaciones: ''
    });

    const normalizarFactura = (fac, idx) => ({
        id_factura: fac.id_factura ?? fac.id ?? idx + 1,
        numero: fac.numero ?? fac.numero_documento ?? `FAC-${fac.id_factura ?? fac.id ?? idx + 1}`,
        proveedor_nombre: fac.proveedor_nombre ?? fac.proveedor ?? 'Proveedor',
        ubicacion_nombre: fac.ubicacion_nombre ?? fac.ubicacion ?? 'Ubicación',
        fecha_compra: fac.fecha_compra ?? fac.fecha ?? '',
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

    const normalizarRecepcion = (rec, idx) => ({
        id_recepcion: rec.id_recepcion ?? rec.id ?? idx + 1,
        id_factura: rec.id_factura ?? rec.factura_id ?? '',
        factura_numero: rec.factura_numero ?? rec.numero ?? 'Factura',
        proveedor_nombre: rec.proveedor_nombre ?? rec.proveedor ?? 'Proveedor',
        id_usuario: rec.id_usuario ?? null,
        usuario_nombre: rec.usuario_nombre ?? rec.usuario ?? 'Usuario FYAG',
        fecha_entrega: rec.fecha_entrega ?? '',
        fecha_recepcion: rec.fecha_recepcion ?? '',
        firma: rec.firma ?? '',
        observaciones: rec.observaciones ?? ''
    });

    const cargarDatos = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resFacturas, resRecepciones] = await Promise.allSettled([
                apiFetch('/facturas/'),
                apiFetch('/recepciones/')
            ]);

            if (resFacturas.status === 'fulfilled') {
                const rawFac = resFacturas.value;
                const listaFac = Array.isArray(rawFac) ? rawFac : (rawFac.facturas || rawFac.results || []);
                const normalizadasFac = listaFac.map(normalizarFactura);
                setFacturas(normalizadasFac);

                if (normalizadasFac.length > 0) {
                    setFormData((prev) => {
                        const existeActual = normalizadasFac.some(
                            (f) => String(f.id_factura) === String(prev.id_factura)
                        );
                        return {
                            ...prev,
                            id_factura: existeActual ? prev.id_factura : String(normalizadasFac[0].id_factura)
                        };
                    });
                } else {
                    setFormData((prev) => ({ ...prev, id_factura: '' }));
                }
            } else {
                setFacturas([]);
                setFormData((prev) => ({ ...prev, id_factura: '' }));
                setErrorCarga((prev) => prev || resFacturas.reason?.message || 'No se pudieron cargar las facturas desde el servidor.');
            }

            if (resRecepciones.status === 'fulfilled') {
                const rawRec = resRecepciones.value;
                const listaRec = Array.isArray(rawRec) ? rawRec : (rawRec.recepciones || rawRec.results || []);
                setRecepciones(listaRec.map(normalizarRecepcion));
            } else {
                setRecepciones([]);
                setErrorCarga((prev) => prev || resRecepciones.reason?.message || 'No se pudieron cargar las recepciones desde el servidor.');
            }
        } catch (err) {
            setFacturas([]);
            setRecepciones([]);
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const facturaSeleccionada = facturas.find(
        (f) => String(f.id_factura) === String(formData.id_factura)
    );

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!facturaSeleccionada) {
            alert('Debe seleccionar una factura.');
            return;
        }

        const payload = {
            id_factura: Number(formData.id_factura),
            fecha_entrega: formData.fecha_entrega,
            fecha_recepcion: formData.fecha_recepcion,
            firma: formData.firma.trim(),
            observaciones: formData.observaciones.trim()
        };

        setGuardando(true);
        try {
            await apiFetch('/recepciones/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            setFormData((prev) => ({
                ...prev,
                firma: '',
                observaciones: ''
            }));
            await cargarDatos();
            alert(`Recepción de ${facturaSeleccionada.numero} guardada correctamente en el servidor.`);
        } catch (err) {
            alert(`No se pudo guardar la recepción: ${err?.message || 'Error en el servidor.'}`);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1050px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Recepción de Compra</h3>
                            <span className="small opacity-75">Validación de entrega de facturas y conformidad en bodega</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={cargarDatos} className="btn btn-sm btn-outline-danger ms-3">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Selector de Factura (FK id_factura) */}
                    <div className="row mb-4">
                        <div className="col-12 col-md-8">
                            <label className="form-label fw-semibold text-muted small">Seleccionar Factura a Recepcionar</label>
                            <select
                                name="id_factura"
                                value={formData.id_factura}
                                disabled={cargando || guardando || facturas.length === 0}
                                onChange={handleChange}
                                className="form-select shadow-sm border-light bg-light"
                            >
                                {facturas.length === 0 ? (
                                    <option value="">
                                        {cargando ? 'Cargando facturas...' : 'No hay facturas disponibles'}
                                    </option>
                                ) : (
                                    facturas.map((fac) => (
                                        <option key={fac.id_factura} value={fac.id_factura}>
                                            {fac.numero} — {fac.proveedor_nombre} ({fac.fecha_compra})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <hr className="mb-4 opacity-25" />

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Columna izquierda: Resumen de Factura y Detalle_Factura */}
                            <div className="col-12 col-md-6 border-end pe-md-4">
                                {cargando ? (
                                    <p className="text-muted small mb-0">Cargando detalle de factura...</p>
                                ) : !facturaSeleccionada ? (
                                    <p className="text-muted small mb-0">
                                        No hay una factura seleccionada o disponible desde el servidor.
                                    </p>
                                ) : (
                                    <>
                                        <span className="text-muted small mb-3 d-block">
                                            Fecha de Compra: {facturaSeleccionada.fecha_compra}
                                        </span>
                                        <p className="mb-1">
                                            <span className="fw-bold text-muted">N° Factura:</span> {facturaSeleccionada.numero} (ID #{facturaSeleccionada.id_factura})
                                        </p>
                                        <p className="mb-1">
                                            <span className="fw-bold text-muted">Proveedor:</span> {facturaSeleccionada.proveedor_nombre}
                                        </p>
                                        <p className="mb-1">
                                            <span className="fw-bold text-muted">Ubicación Destino:</span> {facturaSeleccionada.ubicacion_nombre}
                                        </p>
                                        <hr className="my-3 opacity-25" />
                                        <p className="mb-1">
                                            <span className="fw-bold text-muted">Valor Neto:</span> {formatearCLP(facturaSeleccionada.monto_neto)}
                                        </p>
                                        <p className="mb-1">
                                            <span className="fw-bold text-muted">IVA (19%):</span> {formatearCLP(facturaSeleccionada.iva)}
                                        </p>
                                        <p className="mb-3">
                                            <span className="fw-bold text-muted">Monto Total (Bruto):</span>{' '}
                                            <strong className="text-dark">{formatearCLP(facturaSeleccionada.monto_bruto)}</strong>
                                        </p>

                                        <h6 className="fw-bold small text-uppercase text-muted mb-2">
                                            Artículos en esta Factura ({facturaSeleccionada.detalles.length})
                                        </h6>
                                        <ul className="list-group list-group-flush border rounded small">
                                            {facturaSeleccionada.detalles.length === 0 ? (
                                                <li className="list-group-item text-muted">Sin artículos detallados en esta factura.</li>
                                            ) : (
                                                facturaSeleccionada.detalles.map((det) => (
                                                    <li key={det.id_detalle} className="list-group-item d-flex justify-content-between align-items-center">
                                                        <span>
                                                            <strong className="text-muted me-1">#{det.id_articulo}</strong>
                                                            {det.articulo_nombre}
                                                        </span>
                                                        <span className="badge bg-light text-dark border">
                                                            Cant: {det.cantidad}
                                                        </span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </>
                                )}
                            </div>

                            {/* Columna derecha: Campos de la tabla Recepcion */}
                            <div className="col-12 col-md-6 ps-md-4 d-flex flex-column">
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label fw-bold text-muted small">Fecha de Entrega</label>
                                        <input
                                            type="date"
                                            name="fecha_entrega"
                                            required
                                            disabled={guardando}
                                            value={formData.fecha_entrega}
                                            onChange={handleChange}
                                            className="form-control bg-light shadow-sm border-light"
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label fw-bold text-muted small">Fecha de Recepción</label>
                                        <input
                                            type="date"
                                            name="fecha_recepcion"
                                            required
                                            disabled={guardando}
                                            value={formData.fecha_recepcion}
                                            onChange={handleChange}
                                            className="form-control bg-light shadow-sm border-light"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-muted small">
                                        Firma Recepción ({formData.firma.length}/255)
                                    </label>
                                    <input
                                        type="text"
                                        name="firma"
                                        maxLength={255}
                                        required
                                        disabled={guardando}
                                        value={formData.firma}
                                        onChange={handleChange}
                                        className="form-control bg-light shadow-sm border-light"
                                        placeholder="Nombre completo o código de firma de quien recibe..."
                                    />
                                </div>

                                <div className="mb-3 flex-grow-1 d-flex flex-column">
                                    <label className="form-label fw-bold text-muted small">
                                        Observaciones ({formData.observaciones.length}/500)
                                    </label>
                                    <textarea
                                        name="observaciones"
                                        maxLength={500}
                                        rows="4"
                                        disabled={guardando}
                                        value={formData.observaciones}
                                        onChange={handleChange}
                                        className="form-control flex-grow-1 bg-light shadow-sm border-light"
                                        placeholder="Estado del embalaje, diferencias de cantidad, comentarios..."
                                        style={{ resize: 'none' }}
                                    ></textarea>
                                </div>

                                <div className="d-flex justify-content-end mt-2">
                                    <button
                                        type="submit"
                                        disabled={guardando || !facturaSeleccionada}
                                        className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                        style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                                    >
                                        {guardando ? 'Guardando...' : 'Guardar Recepción'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Historial de Recepciones */}
                    <hr className="my-5 opacity-25" />
                    <h6 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>
                        Recepciones Registradas
                    </h6>
                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Factura / Proveedor</th>
                                    <th className="py-3">Entrega / Recepción</th>
                                    <th className="py-3">Firma</th>
                                    <th className="py-3 px-4">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            Cargando recepciones registradas...
                                        </td>
                                    </tr>
                                ) : recepciones.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No hay recepciones registradas en el servidor.'}
                                        </td>
                                    </tr>
                                ) : (
                                    recepciones.map((rec) => (
                                        <tr key={rec.id_recepcion}>
                                            <td className="px-4 fw-semibold text-muted">#{rec.id_recepcion}</td>
                                            <td>
                                                <div className="fw-semibold">{rec.factura_numero}</div>
                                                <div className="small text-muted">{rec.proveedor_nombre}</div>
                                            </td>
                                            <td className="small text-muted">
                                                <div>Ent: {rec.fecha_entrega}</div>
                                                <div>Rec: {rec.fecha_recepcion}</div>
                                            </td>
                                            <td className="small fw-semibold">{rec.firma}</td>
                                            <td className="px-4 small text-muted">{rec.observaciones || 'Sin observaciones'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}