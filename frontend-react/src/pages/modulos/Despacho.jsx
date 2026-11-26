import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Despacho() {
    const navigate = useNavigate();

    const [clientes, setClientes] = useState([]);
    const [obras, setObras] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [despachos, setDespachos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [seleccionadoId, setSeleccionadoId] = useState('');
    const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
    const [guardando, setGuardando] = useState(false);

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

    const normalizarDespacho = (d, idx) => ({
        id_despacho: d.id_despacho ?? d.id ?? idx + 1,
        id_cliente: d.id_cliente ?? d.cliente_id ?? '',
        cliente_nombre: d.cliente_nombre ?? d.cliente ?? 'Cliente',
        id_usuario: d.id_usuario ?? null,
        usuario_nombre: d.usuario_nombre ?? d.usuario ?? 'Usuario FYAG',
        id_obra: d.id_obra ?? d.obra_id ?? null,
        obra_nombre: d.obra_nombre ?? d.obra ?? null,
        fecha_despacho: d.fecha_despacho ?? d.fecha ?? '',
        fecha_entrega: d.fecha_entrega ?? null,
        estado: (d.estado || 'pendiente').toLowerCase(),
        boleta: d.boleta ?? '',
        direccion_entrega: d.direccion_entrega ?? d.direccion ?? '',
        detalles: Array.isArray(d.detalles)
            ? d.detalles.map((det, dIdx) => ({
                  id_detalle: det.id_detalle ?? det.id ?? dIdx + 1,
                  id_articulo: det.id_articulo ?? det.articulo_id ?? det.id ?? dIdx + 1,
                  articulo_nombre: det.articulo_nombre ?? det.nombre ?? 'Artículo',
                  unidad_de_medida: det.unidad_de_medida ?? 'Unidad',
                  cantidad: Number(det.cantidad ?? 0)
              }))
            : []
    });

    const cargarCatalogosYDespachos = async (mantenerSeleccion = null) => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resDespachos, resClientes, resObras, resArticulos] = await Promise.allSettled([
                apiFetch('/despachos/'),
                apiFetch('/clientes/'),
                apiFetch('/obras/'),
                apiFetch('/inventario/items/')
            ]);

            if (resDespachos.status === 'fulfilled') {
                const rawDesp = resDespachos.value;
                const listaDesp = Array.isArray(rawDesp) ? rawDesp : (rawDesp.despachos || []);
                const normalizados = listaDesp.map(normalizarDespacho);
                setDespachos(normalizados);
                if (normalizados.length > 0) {
                    const objetivo = mantenerSeleccion ?? normalizados[0].id_despacho;
                    const existe = normalizados.some((item) => Number(item.id_despacho) === Number(objetivo));
                    setSeleccionadoId(existe ? Number(objetivo) : Number(normalizados[0].id_despacho));
                } else {
                    setSeleccionadoId('');
                }
            } else {
                setDespachos([]);
                setSeleccionadoId('');
                setErrorCarga(resDespachos.reason?.message || 'No se pudieron cargar los despachos desde el servidor.');
            }

            if (resClientes.status === 'fulfilled') {
                const rawCli = resClientes.value;
                const listaCli = Array.isArray(rawCli) ? rawCli : (rawCli.clientes || []);
                setClientes(
                    listaCli.map((c, idx) => ({
                        id_cliente: c.id_cliente ?? c.id ?? idx + 1,
                        nombre: c.nombre ?? c.razon_social ?? 'Cliente',
                        direccion: c.direccion ?? ''
                    }))
                );
            }

            if (resObras.status === 'fulfilled') {
                const rawObr = resObras.value;
                const listaObr = Array.isArray(rawObr) ? rawObr : (rawObr.obras || []);
                setObras(
                    listaObr.map((o, idx) => ({
                        id_obra: o.id_obra ?? o.id ?? idx + 1,
                        nombre: o.nombre ?? `Obra #${o.id_obra ?? o.id ?? idx + 1}`
                    }))
                );
            }

            if (resArticulos.status === 'fulfilled') {
                const rawArt = resArticulos.value;
                const listaArt = Array.isArray(rawArt) ? rawArt : (rawArt.items || []);
                setArticulos(
                    listaArt.map((a, idx) => ({
                        id_articulo: a.id_articulo ?? a.id ?? idx + 1,
                        nombre: a.nombre ?? 'Artículo',
                        stock_actual: Number(a.stock_actual ?? a.stock ?? 0),
                        unidad_de_medida: a.unidad_de_medida ?? 'Unidad'
                    }))
                );
            }
        } catch (err) {
            setDespachos([]);
            setSeleccionadoId('');
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCatalogosYDespachos();
    }, []);

    const despacho = despachos.find((d) => Number(d.id_despacho) === Number(seleccionadoId)) || null;

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

    const handleCambiarEstado = async (nuevoEstado) => {
        if (!despacho) return;
        if (nuevoEstado === 'anulado') {
            const confirmar = window.confirm(`¿Seguro que deseas anular el Despacho #${String(despacho.id_despacho).padStart(3, '0')}?`);
            if (!confirmar) return;
        }

        try {
            await apiFetch(`/despachos/${despacho.id_despacho}/`, {
                method: 'PATCH',
                body: JSON.stringify({ estado: nuevoEstado })
            });
            await cargarCatalogosYDespachos(despacho.id_despacho);
        } catch (err) {
            alert(`No se pudo actualizar el estado del despacho: ${err?.message || 'Error en el servidor.'}`);
        }
    };

    const handleCambioClienteNuevo = (e) => {
        const idCli = e.target.value;
        const cli = clientes.find((c) => String(c.id_cliente) === String(idCli));
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
        const art = articulos.find((a) => String(a.id_articulo) === String(idArticuloActual));
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

    const handleCrearDespacho = async (e) => {
        e.preventDefault();
        if (detallesNuevos.length === 0) {
            alert('Debe agregar al menos un artículo al despacho.');
            return;
        }

        const payload = {
            id_cliente: Number(nuevoForm.id_cliente),
            id_obra: nuevoForm.id_obra ? Number(nuevoForm.id_obra) : null,
            fecha_despacho: nuevoForm.fecha_despacho,
            fecha_entrega: nuevoForm.fecha_entrega || null,
            estado: 'pendiente',
            boleta: nuevoForm.boleta.trim(),
            direccion_entrega: nuevoForm.direccion_entrega.trim(),
            detalles: detallesNuevos.map((d) => ({
                id_articulo: d.id_articulo,
                cantidad: d.cantidad
            }))
        };

        setGuardando(true);
        try {
            const resp = await apiFetch('/despachos/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const nuevoId = resp?.id_despacho ?? resp?.id ?? null;
            await cargarCatalogosYDespachos(nuevoId);
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
        } catch (err) {
            alert(`No se pudo registrar el despacho: ${err?.message || 'Error en el servidor.'}`);
        } finally {
            setGuardando(false);
        }
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
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={() => cargarCatalogosYDespachos()} className="btn btn-sm btn-outline-danger ms-3">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Selector de Despacho */}
                    <div className="row mb-4 align-items-center">
                        <div className="col-12 col-md-8">
                            <label className="form-label fw-semibold text-muted small">Seleccionar Orden de Despacho</label>
                            <select
                                className="form-select shadow-sm border-light bg-light"
                                value={seleccionadoId}
                                disabled={cargando || despachos.length === 0}
                                onChange={(e) => setSeleccionadoId(Number(e.target.value))}
                            >
                                {despachos.length === 0 ? (
                                    <option value="">
                                        {cargando ? 'Cargando despachos...' : 'No hay despachos registrados'}
                                    </option>
                                ) : (
                                    despachos.map((item) => (
                                        <option key={item.id_despacho} value={item.id_despacho}>
                                            Despacho #{String(item.id_despacho).padStart(3, '0')} — {item.cliente_nombre} ({item.estado})
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        {despacho && (
                            <div className="col-12 col-md-4 mt-3 mt-md-4 text-md-end">
                                {obtenerBadgeEstado(despacho.estado)}
                            </div>
                        )}
                    </div>

                    <hr className="mb-4 opacity-25" />

                    {cargando ? (
                        <div className="text-center py-4 text-muted">Cargando información de despachos...</div>
                    ) : !despacho ? (
                        <div className="text-center py-4 text-muted">
                            {errorCarga
                                ? 'No hay despachos disponibles por un error de conexión o autenticación.'
                                : 'No hay despachos registrados en el servidor.'}
                        </div>
                    ) : (
                        <>
                            <div className="row g-4 align-items-start mb-4">
                                {/* Datos de la tabla Despacho */}
                                <div className="col-12 col-md-7 border-end pe-md-4">
                                    <p className="mb-2"><strong>ID Despacho:</strong> #{String(despacho.id_despacho).padStart(3, '0')}</p>
                                    <p className="mb-2"><strong>Cliente:</strong> {despacho.cliente_nombre}</p>
                                    <p className="mb-2">
                                        <strong>Obra asociada:</strong>{' '}
                                        {despacho.id_obra ? `#OB-${despacho.id_obra}${despacho.obra_nombre ? ` - ${despacho.obra_nombre}` : ''}` : <span className="text-muted">Sin obra asociada (venta directa)</span>}
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
                                        {despacho.detalles.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="text-center py-3 text-muted">
                                                    No hay artículos asociados a este despacho.
                                                </td>
                                            </tr>
                                        ) : (
                                            despacho.detalles.map((det) => (
                                                <tr key={det.id_detalle}>
                                                    <td className="px-4 text-muted fw-semibold">#{det.id_articulo}</td>
                                                    <td className="fw-semibold">{det.articulo_nombre}</td>
                                                    <td className="text-center px-4 fw-bold">
                                                        {det.cantidad} <span className="fw-normal text-muted small">{det.unidad_de_medida}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
                                                {clientes.map((cli) => (
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
                                                {obras.map((obra) => (
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
                                                    {articulos.map((art) => (
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
                                        disabled={guardando}
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setMostrarModalNuevo(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        {guardando ? 'Guardando...' : 'Guardar Despacho'}
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