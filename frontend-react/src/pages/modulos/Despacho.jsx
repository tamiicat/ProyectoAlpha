import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Despacho() {
    const navigate = useNavigate();

    // Datos de ejemplo para selectores (luego vendrán de la API de Django)
    const clientesMock = [
        { id_cliente: 1, nombre: 'Alberto Andrés Sepúlveda Ortiz', direccion: 'Pje. Alegría #42, Talca, Maule' },
        { id_cliente: 2, nombre: 'Agrícola Santa Rosa Ltda.', direccion: 'Camino a Coihueco Km 8, Chillán' },
        { id_cliente: 3, nombre: 'Comercial El Roble SpA', direccion: 'Av. Libertad #850, Chillán' }
    ];

    const obrasMock = [
        { id_obra: 201, nombre: 'Instalación Climatización Centro' },
        { id_obra: 202, nombre: 'Cámara de Maduración Agroindustrial' }
    ];

    const articulosMock = [
        { id_articulo: 500, nombre: 'Aire Acondicionado', stock_actual: 45, unidad_de_medida: 'Unidad' },
        { id_articulo: 501, nombre: 'Filtro de Compresor Industrial', stock_actual: 25, unidad_de_medida: 'Unidad' },
        { id_articulo: 502, nombre: 'Termostato Digital Trifásico', stock_actual: 18, unidad_de_medida: 'Unidad' }
    ];

    // Datos iniciales alineados a Despacho + Detalle_Despacho (GET /despachos)
    const [despachos, setDespachos] = useState([
        {
            id_despacho: 1,
            id_cliente: 1,
            cliente_nombre: 'Alberto Andrés Sepúlveda Ortiz',
            id_usuario: 2,
            usuario_nombre: 'Carlos Soto (Bodeguero)',
            id_obra: 201,
            obra_nombre: 'Instalación Climatización Centro',
            fecha_despacho: '2026-10-03',
            fecha_entrega: '2026-10-06',
            estado: 'pendiente',
            boleta: 'Boleta N° 45892',
            direccion_entrega: 'Pje. Alegría #42, Talca, Maule',
            detalles: [
                { id_detalle: 1, id_articulo: 500, articulo_nombre: 'Aire Acondicionado', unidad_de_medida: 'Unidad', cantidad: 1 }
            ]
        },
        {
            id_despacho: 2,
            id_cliente: 2,
            cliente_nombre: 'Agrícola Santa Rosa Ltda.',
            id_usuario: 2,
            usuario_nombre: 'Carlos Soto (Bodeguero)',
            id_obra: 202,
            obra_nombre: 'Cámara de Maduración Agroindustrial',
            fecha_despacho: '2026-11-12',
            fecha_entrega: '2026-11-15',
            estado: 'despachado',
            boleta: 'Boleta N° 46010',
            direccion_entrega: 'Camino a Coihueco Km 8, Chillán',
            detalles: [
                { id_detalle: 2, id_articulo: 501, articulo_nombre: 'Filtro de Compresor Industrial', unidad_de_medida: 'Unidad', cantidad: 4 },
                { id_detalle: 3, id_articulo: 502, articulo_nombre: 'Termostato Digital Trifásico', unidad_de_medida: 'Unidad', cantidad: 2 }
            ]
        },
        {
            id_despacho: 3,
            id_cliente: 3,
            cliente_nombre: 'Comercial El Roble SpA',
            id_usuario: 2,
            usuario_nombre: 'Carlos Soto (Bodeguero)',
            id_obra: null,
            obra_nombre: null,
            fecha_despacho: '2026-11-18',
            fecha_entrega: '2026-11-20',
            estado: 'entregado',
            boleta: 'Boleta N° 46105',
            direccion_entrega: 'Av. Libertad #850, Chillán',
            detalles: [
                { id_detalle: 4, id_articulo: 502, articulo_nombre: 'Termostato Digital Trifásico', unidad_de_medida: 'Unidad', cantidad: 3 }
            ]
        }
    ]);

    const [seleccionadoId, setSeleccionadoId] = useState(1);
    const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

    // Estado del formulario para crear un nuevo despacho
    const [nuevoForm, setNuevoForm] = useState({
        id_cliente: '',
        id_obra: '',
        fecha_despacho: new Date().toISOString().slice(0, 10),
        fecha_entrega: '',
        boleta: '',
        direccion_entrega: ''
    });
    const [idArticuloActual, setIdArticuloActual] = useState('');
    const [cantidadActual, setCantidadActual] = useState('');
    const [detallesNuevos, setDetallesNuevos] = useState([]);

    const despacho = despachos.find((d) => d.id_despacho === Number(seleccionadoId)) || despachos[0];

    const obtenerBadgeEstado = (estado) => {
        const estilos = {
            pendiente: { clase: 'bg-warning bg-opacity-10 text-warning border-warning', texto: 'Pendiente' },
            despachado: { clase: 'bg-primary bg-opacity-10 text-primary border-primary', texto: 'Despachado' },
            entregado: { clase: 'bg-success bg-opacity-10 text-success border-success', texto: 'Entregado' },
            anulado: { clase: 'bg-danger bg-opacity-10 text-danger border-danger', texto: 'Anulado' }
        };
        const config = estilos[estado] || { clase: 'bg-secondary bg-opacity-10 text-secondary border-secondary', texto: estado };
        return <span className={`badge border px-3 py-2 fs-6 ${config.clase}`}>{config.texto}</span>;
    };

    const handleCambiarEstado = (nuevoEstado) => {
        if (!despacho) return;
        if (nuevoEstado === 'anulado') {
            const confirmar = window.confirm(`¿Seguro que deseas anular el Despacho #${String(despacho.id_despacho).padStart(3, '0')}?`);
            if (!confirmar) return;
        }

        // PATCH /despachos/:id/ en Django
        setDespachos((prev) =>
            prev.map((d) =>
                d.id_despacho === despacho.id_despacho ? { ...d, estado: nuevoEstado } : d
            )
        );
        console.log('Cambio de estado de despacho (simulación local):', {
            id_despacho: despacho.id_despacho,
            estado: nuevoEstado
        });
    };

    const handleCambioClienteNuevo = (e) => {
        const idCli = e.target.value;
        const cli = clientesMock.find((c) => c.id_cliente === Number(idCli));
        setNuevoForm((prev) => ({
            ...prev,
            id_cliente: idCli,
            direccion_entrega: cli ? cli.direccion : ''
        }));
    };

    const handleAgregarDetalleNuevo = () => {
        const cantNum = parseInt(cantidadActual, 10);
        if (!idArticuloActual || !cantNum || cantNum <= 0) {
            alert('Seleccione un artículo y una cantidad válida.');
            return;
        }
        const art = articulosMock.find((a) => a.id_articulo === Number(idArticuloActual));
        if (!art) return;

        const existe = detallesNuevos.find((item) => item.id_articulo === art.id_articulo);
        if (existe) {
            setDetallesNuevos((prev) =>
                prev.map((item) =>
                    item.id_articulo === art.id_articulo
                        ? { ...item, cantidad: item.cantidad + cantNum }
                        : item
                )
            );
        } else {
            setDetallesNuevos((prev) => [
                ...prev,
                {
                    id_detalle: Date.now(),
                    id_articulo: art.id_articulo,
                    articulo_nombre: art.nombre,
                    unidad_de_medida: art.unidad_de_medida,
                    cantidad: cantNum
                }
            ]);
        }
        setIdArticuloActual('');
        setCantidadActual('');
    };

    const handleQuitarDetalleNuevo = (id_articulo) => {
        setDetallesNuevos((prev) => prev.filter((item) => item.id_articulo !== id_articulo));
    };

    const handleCrearDespacho = (e) => {
        e.preventDefault();
        if (detallesNuevos.length === 0) {
            alert('Debe agregar al menos un artículo al despacho.');
            return;
        }

        const nuevoId = despachos.length > 0 ? Math.max(...despachos.map((d) => d.id_despacho)) + 1 : 1;
        const cli = clientesMock.find((c) => c.id_cliente === Number(nuevoForm.id_cliente));
        const obra = obrasMock.find((o) => o.id_obra === Number(nuevoForm.id_obra));

        const nuevoDespacho = {
            id_despacho: nuevoId,
            id_cliente: Number(nuevoForm.id_cliente),
            cliente_nombre: cli ? cli.nombre : 'Cliente',
            id_usuario: 2, // En producción lo asigna Django según sesión
            usuario_nombre: 'Usuario Actual',
            id_obra: nuevoForm.id_obra ? Number(nuevoForm.id_obra) : null,
            obra_nombre: obra ? obra.nombre : null,
            fecha_despacho: nuevoForm.fecha_despacho,
            fecha_entrega: nuevoForm.fecha_entrega || null,
            estado: 'pendiente',
            boleta: nuevoForm.boleta.trim(),
            direccion_entrega: nuevoForm.direccion_entrega.trim(),
            detalles: detallesNuevos
        };

        // Payload exacto para POST /despachos en Django
        const payload = {
            id_cliente: nuevoDespacho.id_cliente,
            id_obra: nuevoDespacho.id_obra,
            fecha_despacho: nuevoDespacho.fecha_despacho,
            fecha_entrega: nuevoDespacho.fecha_entrega,
            estado: 'pendiente',
            boleta: nuevoDespacho.boleta,
            direccion_entrega: nuevoDespacho.direccion_entrega,
            detalles: detallesNuevos.map((d) => ({
                id_articulo: d.id_articulo,
                cantidad: d.cantidad
            }))
        };

        console.log('Nuevo despacho listo para enviar al backend:', payload);
        setDespachos((prev) => [nuevoDespacho, ...prev]);
        setSeleccionadoId(nuevoId);
        setMostrarModalNuevo(false);
        setNuevoForm({
            id_cliente: '',
            id_obra: '',
            fecha_despacho: new Date().toISOString().slice(0, 10),
            fecha_entrega: '',
            boleta: '',
            direccion_entrega: ''
        });
        setDetallesNuevos([]);
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1050px', margin: '0 auto' }}>
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Gestión de Despachos</h3>
                            <span className="small opacity-75">Control de entregas, boletas y artículos despachados</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={() => setMostrarModalNuevo(true)}
                            className="btn btn-light rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-plus-circle"></i> Nuevo Despacho
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    {/* Selector de Despacho */}
                    <div className="row mb-4 align-items-center">
                        <div className="col-12 col-md-8">
                            <label className="form-label fw-semibold text-muted small">Seleccionar Orden de Despacho</label>
                            <select
                                className="form-select shadow-sm border-light bg-light"
                                value={seleccionadoId}
                                onChange={(e) => setSeleccionadoId(Number(e.target.value))}
                            >
                                {despachos.map((item) => (
                                    <option key={item.id_despacho} value={item.id_despacho}>
                                        Despacho #{String(item.id_despacho).padStart(3, '0')} — {item.cliente_nombre} ({item.estado})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {despacho && (
                            <div className="col-12 col-md-4 mt-3 mt-md-4 text-md-end">
                                {obtenerBadgeEstado(despacho.estado)}
                            </div>
                        )}
                    </div>

                    <hr className="mb-4 opacity-25" />

                    {despacho && (
                        <>
                            <div className="row g-4 align-items-start mb-4">
                                {/* Datos de la tabla Despacho */}
                                <div className="col-12 col-md-7 border-end pe-md-4">
                                    <p className="mb-2"><strong>ID Despacho:</strong> #{String(despacho.id_despacho).padStart(3, '0')}</p>
                                    <p className="mb-2"><strong>Cliente:</strong> {despacho.cliente_nombre}</p>
                                    <p className="mb-2">
                                        <strong>Obra asociada:</strong>{' '}
                                        {despacho.id_obra ? `#OB-${despacho.id_obra} - ${despacho.obra_nombre}` : <span className="text-muted">Sin obra asociada (venta directa)</span>}
                                    </p>
                                    <p className="mb-2"><strong>Responsable:</strong> {despacho.usuario_nombre}</p>
                                    <p className="mb-3"><strong>Dirección de entrega:</strong> {despacho.direccion_entrega}</p>

                                    <hr className="my-3 opacity-25" />

                                    <div className="row">
                                        <div className="col-6">
                                            <p className="mb-0"><strong>Fecha de Despacho:</strong><br />{despacho.fecha_despacho}</p>
                                        </div>
                                        <div className="col-6">
                                            <p className="mb-0"><strong>Fecha de Entrega:</strong><br />{despacho.fecha_entrega || 'Por confirmar'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tarjeta de Boleta y Acciones de Estado */}
                                <div className="col-12 col-md-5 ps-md-4 d-flex flex-column justify-content-between">
                                    <div className="card bg-light border shadow-sm text-center p-4 mb-4" style={{ borderRadius: '15px' }}>
                                        <div className="mb-2">
                                            <i className="bi bi-paperclip fs-1 text-secondary"></i>
                                        </div>
                                        <h5 className="fw-bold text-secondary mb-1">Boleta / Comprobante</h5>
                                        <p className="text-dark fw-semibold mb-1">{despacho.boleta || 'Sin boleta adjunta'}</p>
                                        <span className="small text-muted">
                                            {despacho.detalles.length} artículo(s) en este despacho
                                        </span>
                                    </div>

                                    {/* Acciones según ENUM de estado */}
                                    <div className="d-flex flex-wrap justify-content-end gap-2">
                                        {despacho.estado === 'pendiente' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCambiarEstado('anulado')}
                                                    className="btn btn-outline-danger px-3 py-2 fw-semibold"
                                                    style={{ borderRadius: '12px' }}
                                                >
                                                    Anular
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCambiarEstado('despachado')}
                                                    className="btn px-4 py-2 fw-bold text-white shadow-sm"
                                                    style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                                                >
                                                    Marcar como Despachado
                                                </button>
                                            </>
                                        )}

                                        {despacho.estado === 'despachado' && (
                                            <button
                                                type="button"
                                                onClick={() => handleCambiarEstado('entregado')}
                                                className="btn btn-success px-4 py-2 fw-bold text-white shadow-sm"
                                                style={{ borderRadius: '12px' }}
                                            >
                                                Confirmar Entrega
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de Detalle_Despacho (1 a N) */}
                            <h6 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>
                                Artículos Incluidos en el Despacho
                            </h6>
                            <div className="table-responsive shadow-sm rounded border">
                                <table className="table table-hover align-middle mb-0">
                                    <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                        <tr>
                                            <th className="py-3 px-4">ID Art.</th>
                                            <th className="py-3">Artículo</th>
                                            <th className="py-3 text-center px-4">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {despacho.detalles.map((det) => (
                                            <tr key={det.id_detalle}>
                                                <td className="px-4 text-muted fw-semibold">#{det.id_articulo}</td>
                                                <td className="fw-semibold">{det.articulo_nombre}</td>
                                                <td className="text-center px-4 fw-bold">
                                                    {det.cantidad} <span className="fw-normal text-muted small">{det.unidad_de_medida}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal para crear Nuevo Despacho */}
            {mostrarModalNuevo && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">Registrar Nuevo Despacho</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModalNuevo(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCrearDespacho}>
                                <div className="modal-body p-4">
                                    <div className="row g-3 mb-4">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Cliente</label>
                                            <select
                                                required
                                                value={nuevoForm.id_cliente}
                                                onChange={handleCambioClienteNuevo}
                                                className="form-select bg-light text-muted"
                                            >
                                                <option value="">Seleccione un cliente...</option>
                                                {clientesMock.map((cli) => (
                                                    <option key={cli.id_cliente} value={cli.id_cliente}>
                                                        {cli.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Obra Asociada (Opcional)</label>
                                            <select
                                                value={nuevoForm.id_obra}
                                                onChange={(e) => setNuevoForm((prev) => ({ ...prev, id_obra: e.target.value }))}
                                                className="form-select bg-light text-muted"
                                            >
                                                <option value="">Sin obra (venta directa)</option>
                                                {obrasMock.map((obra) => (
                                                    <option key={obra.id_obra} value={obra.id_obra}>
                                                        #OB-{obra.id_obra} - {obra.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Fecha de Despacho</label>
                                            <input
                                                type="date"
                                                required
                                                value={nuevoForm.fecha_despacho}
                                                onChange={(e) => setNuevoForm((prev) => ({ ...prev, fecha_despacho: e.target.value }))}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Fecha Estimada de Entrega</label>
                                            <input
                                                type="date"
                                                value={nuevoForm.fecha_entrega}
                                                onChange={(e) => setNuevoForm((prev) => ({ ...prev, fecha_entrega: e.target.value }))}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Boleta / Referencia</label>
                                            <input
                                                type="text"
                                                maxLength={255}
                                                required
                                                value={nuevoForm.boleta}
                                                onChange={(e) => setNuevoForm((prev) => ({ ...prev, boleta: e.target.value }))}
                                                className="form-control bg-light"
                                                placeholder="Ej: Boleta N° 46200 o URL comprobante"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Dirección de Entrega</label>
                                            <input
                                                type="text"
                                                maxLength={200}
                                                required
                                                value={nuevoForm.direccion_entrega}
                                                onChange={(e) => setNuevoForm((prev) => ({ ...prev, direccion_entrega: e.target.value }))}
                                                className="form-control bg-light"
                                                placeholder="Ej: Av. Libertad #850, Chillán"
                                            />
                                        </div>
                                    </div>

                                    {/* Agregar artículos al Detalle_Despacho */}
                                    <div className="p-3 rounded-3 bg-light border">
                                        <h6 className="fw-bold small text-uppercase text-muted mb-3">Artículos a Despachar</h6>
                                        <div className="row g-2 align-items-end">
                                            <div className="col-12 col-md-6">
                                                <select
                                                    value={idArticuloActual}
                                                    onChange={(e) => setIdArticuloActual(e.target.value)}
                                                    className="form-select bg-white text-muted"
                                                >
                                                    <option value="">Seleccione un artículo...</option>
                                                    {articulosMock.map((art) => (
                                                        <option key={art.id_articulo} value={art.id_articulo}>
                                                            {art.nombre} (Stock: {art.stock_actual})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-6 col-md-3">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={cantidadActual}
                                                    onChange={(e) => setCantidadActual(e.target.value)}
                                                    className="form-control bg-white"
                                                    placeholder="Cant."
                                                />
                                            </div>
                                            <div className="col-6 col-md-3 d-grid">
                                                <button
                                                    type="button"
                                                    onClick={handleAgregarDetalleNuevo}
                                                    className="btn btn-outline-primary bg-white fw-semibold"
                                                >
                                                    + Agregar
                                                </button>
                                            </div>
                                        </div>

                                        {detallesNuevos.length > 0 && (
                                            <ul className="list-group mt-3">
                                                {detallesNuevos.map((item) => (
                                                    <li key={item.id_articulo} className="list-group-item d-flex justify-content-between align-items-center">
                                                        <span>
                                                            <strong>{item.articulo_nombre}</strong> — {item.cantidad} {item.unidad_de_medida}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuitarDetalleNuevo(item.id_articulo)}
                                                            className="btn btn-sm btn-outline-danger"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setMostrarModalNuevo(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        Guardar Despacho
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