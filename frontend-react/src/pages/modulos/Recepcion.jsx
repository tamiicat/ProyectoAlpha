import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Recepcion() {
    const navigate = useNavigate();

    // Facturas de ejemplo con su detalle (luego vendrán de Django: GET /facturas)
    const facturasMock = [
        {
            id_factura: 901,
            numero: 'FAC-901',
            proveedor_nombre: 'Empresa Ñuble SpA',
            ubicacion_nombre: 'Bodega Central - Pasillo A',
            fecha_compra: '2026-11-05',
            monto_neto: 1975555,
            iva: 375355,
            monto_bruto: 2350910,
            detalles: [
                { id_detalle: 1, id_articulo: 500, articulo_nombre: 'Repuesto Aire Acondicionado', cantidad: 12, precio_unitario: 164629 }
            ]
        },
        {
            id_factura: 902,
            numero: 'FAC-902',
            proveedor_nombre: 'Distribuidora Frío Sur Ltda.',
            ubicacion_nombre: 'Bodega Frío - Sector Equipos Pesados',
            fecha_compra: '2026-11-16',
            monto_neto: 665000,
            iva: 126350,
            monto_bruto: 791350,
            detalles: [
                { id_detalle: 2, id_articulo: 501, articulo_nombre: 'Filtro de Compresor Industrial', cantidad: 10, precio_unitario: 42000 },
                { id_detalle: 3, id_articulo: 502, articulo_nombre: 'Válvula de Presión 3/4', cantidad: 10, precio_unitario: 24500 }
            ]
        }
    ];

    // Historial de recepciones registradas (luego vendrá de Django: GET /recepciones)
    const [recepciones, setRecepciones] = useState([
        {
            id_recepcion: 1,
            id_factura: 901,
            factura_numero: 'FAC-901',
            proveedor_nombre: 'Empresa Ñuble SpA',
            id_usuario: 2,
            usuario_nombre: 'Carlos Soto (Bodeguero)',
            fecha_entrega: '2026-11-08',
            fecha_recepcion: '2026-11-08',
            firma: 'Carlos Soto M. - Conforme',
            observaciones: 'Mercadería recibida completa y sin daños en embalaje.'
        }
    ]);

    const hoy = new Date().toISOString().slice(0, 10);

    const [formData, setFormData] = useState({
        id_factura: String(facturasMock[0].id_factura),
        fecha_entrega: hoy,
        fecha_recepcion: hoy,
        firma: '',
        observaciones: ''
    });

    const facturaSeleccionada = facturasMock.find(
        (f) => f.id_factura === Number(formData.id_factura)
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!facturaSeleccionada) {
            alert('Debe seleccionar una factura.');
            return;
        }

        // Payload exacto para enviar a Django (POST /recepciones)
        // id_usuario lo asigna el backend desde la sesión autenticada
        const payload = {
            id_factura: Number(formData.id_factura),
            fecha_entrega: formData.fecha_entrega,
            fecha_recepcion: formData.fecha_recepcion,
            firma: formData.firma.trim(),
            observaciones: formData.observaciones.trim()
        };

        const nuevoId =
            recepciones.length > 0
                ? Math.max(...recepciones.map((r) => r.id_recepcion)) + 1
                : 1;

        setRecepciones((prev) => [
            {
                id_recepcion: nuevoId,
                ...payload,
                factura_numero: facturaSeleccionada.numero,
                proveedor_nombre: facturaSeleccionada.proveedor_nombre,
                id_usuario: 2,
                usuario_nombre: 'Usuario Actual'
            },
            ...prev
        ]);

        console.log('Recepción lista para enviar al backend:', payload);
        alert(`Recepción de ${facturaSeleccionada.numero} guardada correctamente (simulación local).`);

        setFormData((prev) => ({
            ...prev,
            firma: '',
            observaciones: ''
        }));
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
                    {/* Selector de Factura (FK id_factura) */}
                    <div className="row mb-4">
                        <div className="col-12 col-md-8">
                            <label className="form-label fw-semibold text-muted small">Seleccionar Factura a Recepcionar</label>
                            <select
                                name="id_factura"
                                value={formData.id_factura}
                                onChange={handleChange}
                                className="form-select shadow-sm border-light bg-light"
                            >
                                {facturasMock.map((fac) => (
                                    <option key={fac.id_factura} value={fac.id_factura}>
                                        {fac.numero} — {fac.proveedor_nombre} ({fac.fecha_compra})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="mb-4 opacity-25" />

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4">
                            {/* Columna izquierda: Resumen de Factura y Detalle_Factura */}
                            <div className="col-12 col-md-6 border-end pe-md-4">
                                {facturaSeleccionada && (
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
                                            {facturaSeleccionada.detalles.map((det) => (
                                                <li key={det.id_detalle} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <span>
                                                        <strong className="text-muted me-1">#{det.id_articulo}</strong>
                                                        {det.articulo_nombre}
                                                    </span>
                                                    <span className="badge bg-light text-dark border">
                                                        Cant: {det.cantidad}
                                                    </span>
                                                </li>
                                            ))}
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
                                        className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                        style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                                    >
                                        Guardar Recepción
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
                                {recepciones.map((rec) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}