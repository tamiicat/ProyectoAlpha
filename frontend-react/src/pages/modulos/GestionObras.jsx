import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GestionObras() {
    const navigate = useNavigate();

    // Datos de ejemplo (luego vendrán de la API de Django: GET /clientes y GET /usuarios)
    const clientesMock = [
        { id_cliente: 1, nombre: 'Agroindustrial Ñuble Ltda.' },
        { id_cliente: 2, nombre: 'Frigorífico San Carlos S.A.' },
        { id_cliente: 3, nombre: 'Comercial Chillán Centro' }
    ];

    const usuariosMock = [
        { id_usuario: 3, nombre: 'Carlos Méndez (Técnico)' },
        { id_usuario: 4, nombre: 'Luis Rojas (Técnico)' },
        { id_usuario: 5, nombre: 'Andrea Morales (Supervisor)' }
    ];

    // Datos de ejemplo alineados a Obra y Detalle_Obra (GET /obras)
    const [obras, setObras] = useState([
        {
            id_obra: 201,
            id_usuario: 3,
            usuario_nombre: 'Carlos Méndez (Técnico)',
            id_cliente: 3,
            cliente_nombre: 'Comercial Chillán Centro',
            nombre: 'Instalación Climatización Centro',
            tipo: 'instalación',
            estado: 'en proceso',
            fecha_inicio: '2026-11-10',
            fecha_termino: '2026-11-25',
            activo: true,
            detalles: [
                { id_detalle: 1, observaciones: 'Se completó el montaje de ductos en el primer piso.' }
            ]
        },
        {
            id_obra: 202,
            id_usuario: 4,
            usuario_nombre: 'Luis Rojas (Técnico)',
            id_cliente: 2,
            cliente_nombre: 'Frigorífico San Carlos S.A.',
            nombre: 'Cámara de Maduración Agroindustrial',
            tipo: 'reparación',
            estado: 'finalizada',
            fecha_inicio: '2026-10-05',
            fecha_termino: '2026-10-20',
            activo: true,
            detalles: [
                { id_detalle: 2, observaciones: 'Cambio de compresor y prueba de hermeticidad aprobada.' }
            ]
        }
    ]);

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
        return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    };

    const handleAbrirNuevaObra = () => {
        setModoEdicion(false);
        setFormData(estadoInicialFormulario);
        setMostrarModalObra(true);
    };

    const handleAbrirEditarObra = (obra) => {
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
    };

    const handleGuardarObra = (e) => {
        e.preventDefault();

        const clienteSel = clientesMock.find((c) => c.id_cliente === Number(formData.id_cliente));
        const usuarioSel = usuariosMock.find((u) => u.id_usuario === Number(formData.id_usuario));

        if (modoEdicion) {
            const payloadEditar = {
                id_obra: formData.id_obra,
                id_usuario: Number(formData.id_usuario),
                id_cliente: Number(formData.id_cliente),
                nombre: formData.nombre.trim(),
                tipo: formData.tipo,
                estado: formData.estado,
                fecha_inicio: formData.fecha_inicio,
                fecha_termino: formData.fecha_termino || null,
                activo: formData.activo
            };

            setObras((prev) =>
                prev.map((obra) =>
                    obra.id_obra === formData.id_obra
                        ? {
                              ...obra,
                              ...payloadEditar,
                              cliente_nombre: clienteSel ? clienteSel.nombre : obra.cliente_nombre,
                              usuario_nombre: usuarioSel ? usuarioSel.nombre : obra.usuario_nombre
                          }
                        : obra
                )
            );
            console.log('Obra actualizada (simulación local):', payloadEditar);
        } else {
            const nuevoId = obras.length > 0 ? Math.max(...obras.map((o) => o.id_obra)) + 1 : 201;
            const detallesIniciales = formData.observacion_inicial.trim()
                ? [{ id_detalle: Date.now(), observaciones: formData.observacion_inicial.trim() }]
                : [];

            const nuevaObra = {
                id_obra: nuevoId,
                id_usuario: Number(formData.id_usuario),
                usuario_nombre: usuarioSel ? usuarioSel.nombre : 'Sin asignar',
                id_cliente: Number(formData.id_cliente),
                cliente_nombre: clienteSel ? clienteSel.nombre : 'Sin cliente',
                nombre: formData.nombre.trim(),
                tipo: formData.tipo,
                estado: formData.estado,
                fecha_inicio: formData.fecha_inicio,
                fecha_termino: formData.fecha_termino || null,
                activo: true,
                detalles: detallesIniciales
            };

            setObras((prev) => [nuevaObra, ...prev]);
            console.log('Nueva obra lista para enviar al backend:', {
                id_usuario: nuevaObra.id_usuario,
                id_cliente: nuevaObra.id_cliente,
                nombre: nuevaObra.nombre,
                tipo: nuevaObra.tipo,
                estado: nuevaObra.estado,
                fecha_inicio: nuevaObra.fecha_inicio,
                fecha_termino: nuevaObra.fecha_termino,
                activo: true,
                observaciones_inicial: formData.observacion_inicial.trim() || null
            });
        }

        setMostrarModalObra(false);
    };

    const handleEliminarObra = (obra) => {
        const confirmar = window.confirm(`¿Seguro que deseas desactivar/eliminar la obra "${obra.nombre}" (#OB-${obra.id_obra})?`);
        if (!confirmar) return;

        // Borrado lógico (activo: false) listo para la API
        setObras((prev) => prev.filter((item) => item.id_obra !== obra.id_obra));
        console.log('Obra desactivada (simulación local):', { id_obra: obra.id_obra, activo: false });
    };

    const handleAgregarObservacion = (e) => {
        e.preventDefault();
        if (!nuevaObservacion.trim() || !obraDetalles) return;

        const nuevoDetalle = {
            id_detalle: Date.now(),
            id_obra: obraDetalles.id_obra,
            observaciones: nuevaObservacion.trim()
        };

        setObras((prev) =>
            prev.map((obra) =>
                obra.id_obra === obraDetalles.id_obra
                    ? { ...obra, detalles: [...obra.detalles, nuevoDetalle] }
                    : obra
            )
        );

        setObraDetalles((prev) => ({
            ...prev,
            detalles: [...prev.detalles, nuevoDetalle]
        }));

        console.log('Detalle_Obra listo para enviar al backend:', {
            id_obra: obraDetalles.id_obra,
            observaciones: nuevoDetalle.observaciones
        });

        setNuevaObservacion('');
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
                                {obras.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No hay obras registradas.
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
                                                        onClick={() => setObraDetalles(obra)}
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
                                                {clientesMock.map((cli) => (
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
                                                {usuariosMock.map((usr) => (
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
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setMostrarModalObra(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        {modoEdicion ? 'Guardar Cambios' : 'Crear Obra'}
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
                                        rows="3"
                                        value={nuevaObservacion}
                                        onChange={(e) => setNuevaObservacion(e.target.value)}
                                        className="form-control bg-light mb-3"
                                        placeholder="Registrar avance, novedad u observación técnica..."
                                    ></textarea>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary rounded-pill px-4"
                                            onClick={() => setObraDetalles(null)}
                                        >
                                            Cerrar
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn text-white rounded-pill px-4 fw-semibold"
                                            style={{ backgroundColor: '#2b3d52' }}
                                        >
                                            Agregar Observación
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