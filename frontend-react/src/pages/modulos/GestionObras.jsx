import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function GestionObras() {
    const navigate = useNavigate();

    const [clientes, setClientes] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [obras, setObras] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [aviso, setAviso] = useState(null);
    const [avisoModalObra, setAvisoModalObra] = useState(null);
    const [avisoModalObs, setAvisoModalObs] = useState(null);
    const [guardandoObra, setGuardandoObra] = useState(false);
    const [guardandoObs, setGuardandoObs] = useState(false);

    // Estados para modales
    const [mostrarModalObra, setMostrarModalObra] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [obraDetalles, setObraDetalles] = useState(null);
    const [nuevaObservacion, setNuevaObservacion] = useState('');

    const estadoInicialFormulario = {
        id_obra: null,
        id_usuario: '',
        id_cliente: '',
        nombre: '',
        tipo: 'instalación',
        estado: 'pendiente',
        fecha_inicio: '',
        fecha_termino: '',
        observacion_inicial: '',
        activo: true
    };

    const [formData, setFormData] = useState(estadoInicialFormulario);

    const normalizarObra = (o, idx) => ({
        id_obra: o.id_obra ?? o.id ?? idx + 1,
        id_usuario: o.id_usuario ?? o.usuario_id ?? '',
        usuario_nombre: o.usuario_nombre ?? o.usuario ?? 'Sin asignar',
        id_cliente: o.id_cliente ?? o.cliente_id ?? '',
        cliente_nombre: o.cliente_nombre ?? o.cliente ?? 'Sin cliente',
        nombre: o.nombre ?? `Obra #${o.id_obra ?? o.id ?? idx + 1}`,
        tipo: o.tipo ?? 'instalación',
        estado: (o.estado || 'pendiente').toLowerCase(),
        fecha_inicio: o.fecha_inicio ?? '',
        fecha_termino: o.fecha_termino ?? null,
        activo: o.activo !== undefined ? Boolean(o.activo) : true,
        detalles: Array.isArray(o.detalles)
            ? o.detalles.map((det, dIdx) => ({
                  id_detalle: det.id_detalle ?? det.id ?? dIdx + 1,
                  id_obra: det.id_obra ?? o.id_obra ?? o.id ?? idx + 1,
                  observaciones: det.observaciones ?? det.observacion ?? ''
              }))
            : []
    });

    const cargarObrasYCatalogos = async (idObraDetallesAbierta = null) => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resObras, resClientes, resUsuarios] = await Promise.allSettled([
                apiFetch('/obras/'),
                apiFetch('/clientes/'),
                apiFetch('/usuarios/')
            ]);

            if (resObras.status === 'fulfilled') {
                const rawObras = resObras.value;
                const listaObras = Array.isArray(rawObras) ? rawObras : (rawObras.obras || rawObras.results || []);
                const normalizadas = listaObras.map(normalizarObra);
                setObras(normalizadas);

                if (idObraDetallesAbierta !== null) {
                    const actualizada = normalizadas.find((item) => Number(item.id_obra) === Number(idObraDetallesAbierta));
                    setObraDetalles(actualizada || null);
                }
            } else {
                setObras([]);
                setErrorCarga(resObras.reason?.message || 'No se pudieron cargar las obras desde el servidor.');
            }

            if (resClientes.status === 'fulfilled') {
                const rawCli = resClientes.value;
                const listaCli = Array.isArray(rawCli) ? rawCli : (rawCli.clientes || rawCli.results || []);
                setClientes(
                    listaCli.map((c, idx) => ({
                        id_cliente: c.id_cliente ?? c.id ?? idx + 1,
                        nombre: c.nombre ?? c.razon_social ?? 'Cliente'
                    }))
                );
            }

            if (resUsuarios.status === 'fulfilled') {
                const rawUsr = resUsuarios.value;
                const listaUsr = Array.isArray(rawUsr) ? rawUsr : (rawUsr.usuarios || rawUsr.results || []);
                setUsuarios(
                    listaUsr.map((u, idx) => {
                        const nombreCompleto = `${u.nombres ?? u.nombre ?? ''} ${u.apellidos ?? ''}`.trim();
                        const rolTexto = u.rol ?? u.role ?? '';
                        return {
                            id_usuario: u.id_usuario ?? u.id ?? idx + 1,
                            nombre: nombreCompleto
                                ? `${nombreCompleto}${rolTexto ? ` (${rolTexto})` : ''}`
                                : (u.usuario ?? u.username ?? `Usuario #${u.id_usuario ?? u.id ?? idx + 1}`)
                        };
                    })
                );
            }
        } catch (err) {
            setObras([]);
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarObrasYCatalogos();
    }, []);

    const obtenerBadgeEstado = (estado) => {
        const estilos = {
            pendiente: { clase: 'bg-warning bg-opacity-10 text-warning border-warning', texto: 'Pendiente' },
            'en proceso': { clase: 'bg-primary bg-opacity-10 text-primary border-primary', texto: 'En proceso' },
            finalizada: { clase: 'bg-success bg-opacity-10 text-success border-success', texto: 'Finalizada' }
        };
        const config = estilos[estado] || { clase: 'bg-secondary bg-opacity-10 text-secondary border-secondary', texto: estado };
        return <span className={`badge border ${config.clase}`}>{config.texto}</span>;
    };

    const formatearTipo = (tipo) => {
        return tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'General';
    };

    const handleAbrirNuevaObra = () => {
        setAviso(null);
        setAvisoModalObra(null);
        setModoEdicion(false);
        setFormData(estadoInicialFormulario);
        setMostrarModalObra(true);
    };

    const handleAbrirEditarObra = (obra) => {
        setAviso(null);
        setAvisoModalObra(null);
        setModoEdicion(true);
        setFormData({
            id_obra: obra.id_obra,
            id_usuario: String(obra.id_usuario),
            id_cliente: String(obra.id_cliente),
            nombre: obra.nombre,
            tipo: obra.tipo,
            estado: obra.estado,
            fecha_inicio: obra.fecha_inicio,
            fecha_termino: obra.fecha_termino || '',
            observacion_inicial: '',
            activo: obra.activo
        });
        setMostrarModalObra(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (avisoModalObra) setAvisoModalObra(null);
    };

    const handleGuardarObra = async (e) => {
        e.preventDefault();
        setAvisoModalObra(null);

        setGuardandoObra(true);
        try {
            if (modoEdicion) {
                const payloadEditar = {
                    id_usuario: Number(formData.id_usuario),
                    id_cliente: Number(formData.id_cliente),
                    nombre: formData.nombre.trim(),
                    tipo: formData.tipo,
                    estado: formData.estado,
                    fecha_inicio: formData.fecha_inicio,
                    fecha_termino: formData.fecha_termino || null,
                    activo: formData.activo
                };

                await apiFetch(`/obras/${formData.id_obra}/`, {
                    method: 'PUT',
                    body: JSON.stringify(payloadEditar)
                });
            } else {
                const payloadCrear = {
                    id_usuario: Number(formData.id_usuario),
                    id_cliente: Number(formData.id_cliente),
                    nombre: formData.nombre.trim(),
                    tipo: formData.tipo,
                    estado: formData.estado,
                    fecha_inicio: formData.fecha_inicio,
                    fecha_termino: formData.fecha_termino || null,
                    activo: true,
                    observaciones_inicial: formData.observacion_inicial.trim() || null
                };

                await apiFetch('/obras/', {
                    method: 'POST',
                    body: JSON.stringify(payloadCrear)
                });
            }

            await cargarObrasYCatalogos();
            setMostrarModalObra(false);
            setAviso({
                tipo: 'success',
                mensaje: modoEdicion ? 'Obra actualizada correctamente.' : 'Obra creada correctamente.'
            });
        } catch (err) {
            setAvisoModalObra({
                tipo: 'danger',
                mensaje: `No se pudo guardar la obra: ${err?.message || 'Error en el servidor.'}`
            });
        } finally {
            setGuardandoObra(false);
        }
    };

    const handleEliminarObra = async (obra) => {
        const confirmar = window.confirm(`¿Seguro que deseas desactivar/eliminar la obra "${obra.nombre}" (#OB-${obra.id_obra})?`);
        if (!confirmar) return;

        setAviso(null);
        try {
            await apiFetch(`/obras/${obra.id_obra}/`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: false })
            });
            await cargarObrasYCatalogos();
            setAviso({ tipo: 'success', mensaje: `Obra "${obra.nombre}" desactivada correctamente.` });
        } catch (err) {
            setAviso({
                tipo: 'danger',
                mensaje: `No se pudo desactivar la obra: ${err?.message || 'Error en el servidor.'}`
            });
        }
    };

    const handleAgregarObservacion = async (e) => {
        e.preventDefault();
        if (!nuevaObservacion.trim() || !obraDetalles) return;
        setAvisoModalObs(null);

        setGuardandoObs(true);
        try {
            await apiFetch(`/obras/${obraDetalles.id_obra}/observaciones/`, {
                method: 'POST',
                body: JSON.stringify({
                    id_obra: obraDetalles.id_obra,
                    observaciones: nuevaObservacion.trim()
                })
            });
            setNuevaObservacion('');
            await cargarObrasYCatalogos(obraDetalles.id_obra);
            setAvisoModalObs({ tipo: 'success', mensaje: 'Observación agregada correctamente.' });
        } catch (err) {
            setAvisoModalObs({
                tipo: 'danger',
                mensaje: `No se pudo agregar la observación: ${err?.message || 'Error en el servidor.'}`
            });
        } finally {
            setGuardandoObs(false);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Gestión de Obras</h3>
                            <span className="small opacity-75">Administración de proyectos e instalaciones activas</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={handleAbrirNuevaObra}
                            className="btn btn-light rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-plus-circle"></i> Nueva Obra
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
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={() => cargarObrasYCatalogos()} className="btn btn-sm btn-outline-danger ms-3">
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

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID Obra</th>
                                    <th className="py-3">Nombre</th>
                                    <th className="py-3">Cliente</th>
                                    <th className="py-3">Encargado</th>
                                    <th className="py-3 text-center">Tipo</th>
                                    <th className="py-3">Inicio / Término</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Cargando obras desde el servidor...
                                        </td>
                                    </tr>
                                ) : obras.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No hay obras registradas en el servidor.'}
                                        </td>
                                    </tr>
                                ) : (
                                    obras.map((obra) => (
                                        <tr key={obra.id_obra}>
                                            <td className="px-4 fw-semibold text-muted">#OB-{obra.id_obra}</td>
                                            <td className="fw-semibold">{obra.nombre}</td>
                                            <td className="small">{obra.cliente_nombre}</td>
                                            <td className="small">{obra.usuario_nombre}</td>
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark border">
                                                    {formatearTipo(obra.tipo)}
                                                </span>
                                            </td>
                                            <td className="small text-muted">
                                                <div>{obra.fecha_inicio}</div>
                                                <div>{obra.fecha_termino ? obra.fecha_termino : 'Sin término'}</div>
                                            </td>
                                            <td className="text-center">{obtenerBadgeEstado(obra.estado)}</td>
                                            <td className="text-center px-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAvisoModalObs(null);
                                                            setNuevaObservacion('');
                                                            setObraDetalles(obra);
                                                        }}
                                                        className="btn btn-sm btn-outline-secondary"
                                                        title="Observaciones (Detalle de Obra)"
                                                    >
                                                        <i className="bi bi-journal-text"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAbrirEditarObra(obra)}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar obra"
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminarObra(obra)}
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Eliminar obra"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para Crear / Editar Obra */}
            {mostrarModalObra && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    {modoEdicion ? `Editar Obra #OB-${formData.id_obra}` : 'Añadir Nueva Obra'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModalObra(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleGuardarObra}>
                                <div className="modal-body p-4">
                                    {avisoModalObra && (
                                        <div
                                            className={`alert alert-${avisoModalObra.tipo} alert-dismissible fade show rounded-3 mb-3 d-flex justify-content-between align-items-center`}
                                            role="alert"
                                        >
                                            <span className="small">{avisoModalObra.mensaje}</span>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Cerrar"
                                                onClick={() => setAvisoModalObra(null)}
                                            ></button>
                                        </div>
                                    )}

                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold text-muted small">Nombre de la Obra</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                maxLength={150}
                                                required
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="Ej: Instalación Climatización Centro"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Cliente</label>
                                            <select
                                                name="id_cliente"
                                                required
                                                value={formData.id_cliente}
                                                onChange={handleChange}
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
                                            <label className="form-label fw-semibold text-muted small">Usuario Encargado</label>
                                            <select
                                                name="id_usuario"
                                                required
                                                value={formData.id_usuario}
                                                onChange={handleChange}
                                                className="form-select bg-light text-muted"
                                            >
                                                <option value="">Seleccione un encargado...</option>
                                                {usuarios.map((usr) => (
                                                    <option key={usr.id_usuario} value={usr.id_usuario}>
                                                        {usr.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Tipo de Obra</label>
                                            <select
                                                name="tipo"
                                                required
                                                value={formData.tipo}
                                                onChange={handleChange}
                                                className="form-select bg-light text-muted"
                                            >
                                                <option value="diagnóstico">Diagnóstico</option>
                                                <option value="instalación">Instalación</option>
                                                <option value="reparación">Reparación</option>
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Estado</label>
                                            <select
                                                name="estado"
                                                required
                                                value={formData.estado}
                                                onChange={handleChange}
                                                className="form-select bg-light text-muted"
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="en proceso">En proceso</option>
                                                <option value="finalizada">Finalizada</option>
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Fecha Inicio</label>
                                            <input
                                                type="date"
                                                name="fecha_inicio"
                                                required
                                                value={formData.fecha_inicio}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Fecha Término</label>
                                            <input
                                                type="date"
                                                name="fecha_termino"
                                                value={formData.fecha_termino}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        {!modoEdicion && (
                                            <div className="col-12">
                                                <label className="form-label fw-semibold text-muted small">
                                                    Observación Inicial (Opcional - {formData.observacion_inicial.length}/500)
                                                </label>
                                                <textarea
                                                    name="observacion_inicial"
                                                    maxLength={500}
                                                    rows="3"
                                                    value={formData.observacion_inicial}
                                                    onChange={handleChange}
                                                    className="form-control bg-light"
                                                    placeholder="Detalles iniciales de la obra..."
                                                ></textarea>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        disabled={guardandoObra}
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setMostrarModalObra(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardandoObra}
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        {guardandoObra ? 'Guardando...' : (modoEdicion ? 'Guardar Cambios' : 'Crear Obra')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Detalle_Obra (Observaciones 1 a N) */}
            {obraDetalles && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    Observaciones - #OB-{obraDetalles.id_obra} ({obraDetalles.nombre})
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setObraDetalles(null)}
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                {avisoModalObs && (
                                    <div
                                        className={`alert alert-${avisoModalObs.tipo} alert-dismissible fade show rounded-3 mb-3 d-flex justify-content-between align-items-center`}
                                        role="alert"
                                    >
                                        <span className="small">{avisoModalObs.mensaje}</span>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            aria-label="Cerrar"
                                            onClick={() => setAvisoModalObs(null)}
                                        ></button>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <h6 className="fw-bold text-muted small text-uppercase mb-3">Historial de Detalles</h6>
                                    {obraDetalles.detalles.length === 0 ? (
                                        <p className="text-muted small mb-0">No hay observaciones registradas para esta obra.</p>
                                    ) : (
                                        <ul className="list-group list-group-flush border rounded">
                                            {obraDetalles.detalles.map((det) => (
                                                <li key={det.id_detalle} className="list-group-item py-3">
                                                    <span className="text-muted small me-2">#{det.id_detalle}</span>
                                                    {det.observaciones}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <form onSubmit={handleAgregarObservacion}>
                                    <label className="form-label fw-semibold text-muted small">
                                        Nueva Observación ({nuevaObservacion.length}/500)
                                    </label>
                                    <textarea
                                        maxLength={500}
                                        required
                                        disabled={guardandoObs}
                                        rows="3"
                                        value={nuevaObservacion}
                                        onChange={(e) => {
                                            setNuevaObservacion(e.target.value);
                                            if (avisoModalObs) setAvisoModalObs(null);
                                        }}
                                        className="form-control bg-light mb-3"
                                        placeholder="Registrar avance, novedad u observación técnica..."
                                    ></textarea>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            type="button"
                                            disabled={guardandoObs}
                                            className="btn btn-outline-secondary rounded-pill px-4"
                                            onClick={() => setObraDetalles(null)}
                                        >
                                            Cerrar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={guardandoObs}
                                            className="btn text-white rounded-pill px-4 fw-semibold"
                                            style={{ backgroundColor: '#2b3d52' }}
                                        >
                                            {guardandoObs ? 'Guardando...' : 'Agregar Observación'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}