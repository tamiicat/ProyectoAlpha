import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Autorizaciones() {
    const navigate = useNavigate();

    // Datos de ejemplo alineados a la tabla Autorizacion (luego vendrán de Django: GET /autorizaciones)
    const [autorizaciones, setAutorizaciones] = useState([
        {
            id_autorizacion: 1,
            id_usuario_solicitante: 2,
            solicitante_nombre: 'Carlos Soto (Bodeguero)',
            id_usuario_autorizador: null,
            autorizador_nombre: null,
            modulo: 'Articulo',
            id_registro: 501,
            accion: 'eliminacion',
            motivo: 'Artículo duplicado al ingresar factura #902.',
            fecha_solicitud: '2026-11-19 10:15',
            fecha_respuesta: null,
            estado: 'pendiente',
            observaciones: ''
        },
        {
            id_autorizacion: 2,
            id_usuario_solicitante: 3,
            solicitante_nombre: 'Luis Rojas (Técnico)',
            id_usuario_autorizador: null,
            autorizador_nombre: null,
            modulo: 'Obra',
            id_registro: 201,
            accion: 'modificacion',
            motivo: 'Extensión de fecha de término por retraso en llegada de repuestos.',
            fecha_solicitud: '2026-11-19 14:40',
            fecha_respuesta: null,
            estado: 'pendiente',
            observaciones: ''
        },
        {
            id_autorizacion: 3,
            id_usuario_solicitante: 4,
            solicitante_nombre: 'Finanzas FYAG',
            id_usuario_autorizador: 1,
            autorizador_nombre: 'Pedro Aedo (Admin)',
            modulo: 'Factura',
            id_registro: 901,
            accion: 'modificacion',
            motivo: 'Corrección de monto neto por nota de crédito del proveedor.',
            fecha_solicitud: '2026-11-17 09:30',
            fecha_respuesta: '2026-11-17 11:05',
            estado: 'aprobada',
            observaciones: 'Verificado con documento tributario adjunto.'
        }
    ]);

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [solicitudActiva, setSolicitudActiva] = useState(null);
    const [accionModal, setAccionModal] = useState(''); // 'aprobada' | 'rechazada'
    const [observacionesRespuesta, setObservacionesRespuesta] = useState('');

    const obtenerFechaHoraActual = () => {
        const ahora = new Date();
        const offset = ahora.getTimezoneOffset() * 60000;
        return new Date(ahora - offset).toISOString().slice(0, 16).replace('T', ' ');
    };

    const obtenerBadgeEstado = (estado) => {
        const estilos = {
            pendiente: { clase: 'bg-warning bg-opacity-10 text-warning border-warning', texto: 'Pendiente' },
            aprobada: { clase: 'bg-success bg-opacity-10 text-success border-success', texto: 'Aprobada' },
            rechazada: { clase: 'bg-danger bg-opacity-10 text-danger border-danger', texto: 'Rechazada' }
        };
        const config = estilos[estado] || { clase: 'bg-secondary bg-opacity-10 text-secondary border-secondary', texto: estado };
        return <span className={`badge border ${config.clase}`}>{config.texto}</span>;
    };

    const obtenerBadgeAccion = (accion) => {
        if (accion === 'eliminacion') {
            return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">Eliminación</span>;
        }
        return <span className="badge bg-info bg-opacity-10 text-info border border-info">Modificación</span>;
    };

    const autorizacionesFiltradas = autorizaciones.filter((item) => {
        const coincideEstado = filtroEstado === '' || item.estado === filtroEstado;
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            item.solicitante_nombre.toLowerCase().includes(termino) ||
            item.modulo.toLowerCase().includes(termino) ||
            item.motivo.toLowerCase().includes(termino) ||
            String(item.id_autorizacion).includes(termino) ||
            String(item.id_registro).includes(termino);
        return coincideEstado && coincideBusqueda;
    });

    const handleAbrirRespuesta = (solicitud, decision) => {
        setSolicitudActiva(solicitud);
        setAccionModal(decision);
        setObservacionesRespuesta('');
    };

    const handleConfirmarRespuesta = (e) => {
        e.preventDefault();
        if (!solicitudActiva) return;

        const fechaRespuesta = obtenerFechaHoraActual();

        // Payload listo para enviar a Django (PATCH /autorizaciones/:id)
        // id_usuario_autorizador lo asigna el backend desde la sesión autenticada
        const payload = {
            id_autorizacion: solicitudActiva.id_autorizacion,
            estado: accionModal,
            fecha_respuesta: fechaRespuesta,
            observaciones: observacionesRespuesta.trim()
        };

        setAutorizaciones((prev) =>
            prev.map((item) =>
                item.id_autorizacion === solicitudActiva.id_autorizacion
                    ? {
                          ...item,
                          estado: accionModal,
                          fecha_respuesta: fechaRespuesta,
                          autorizador_nombre: 'Usuario Actual',
                          observaciones: payload.observaciones
                      }
                    : item
            )
        );

        console.log('Respuesta de autorización lista para el backend:', payload);
        setSolicitudActiva(null);
        setAccionModal('');
        setObservacionesRespuesta('');
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Autorizaciones</h3>
                            <span className="small opacity-75">Aprobación y rechazo de modificaciones o eliminaciones</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {/* Filtros */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-8">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="form-control bg-light border-light shadow-sm"
                                placeholder="Buscar por ID, solicitante, módulo o motivo..."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="form-select bg-light border-light shadow-sm text-muted"
                            >
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendientes</option>
                                <option value="aprobada">Aprobadas</option>
                                <option value="rechazada">Rechazadas</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Solicitante</th>
                                    <th className="py-3">Módulo / Reg.</th>
                                    <th className="py-3 text-center">Acción</th>
                                    <th className="py-3">Motivo</th>
                                    <th className="py-3">Fecha Solicitud</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center px-4">Gestión</th>
                                </tr>
                            </thead>
                            <tbody>
                                {autorizacionesFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No se encontraron solicitudes de autorización.
                                        </td>
                                    </tr>
                                ) : (
                                    autorizacionesFiltradas.map((item) => (
                                        <tr key={item.id_autorizacion}>
                                            <td className="px-4 fw-semibold text-muted">#AUT-{item.id_autorizacion}</td>
                                            <td className="small fw-semibold">{item.solicitante_nombre}</td>
                                            <td className="small">
                                                <div className="fw-semibold">{item.modulo}</div>
                                                <div className="text-muted">ID #{item.id_registro}</div>
                                            </td>
                                            <td className="text-center">{obtenerBadgeAccion(item.accion)}</td>
                                            <td className="small text-muted" style={{ maxWidth: '240px' }}>
                                                <div>{item.motivo}</div>
                                                {item.observaciones && (
                                                    <div className="text-dark mt-1">
                                                        <strong>Resp.:</strong> {item.observaciones}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="small text-muted">
                                                <div>{item.fecha_solicitud}</div>
                                                {item.fecha_respuesta && (
                                                    <div className="text-success">Resp: {item.fecha_respuesta}</div>
                                                )}
                                            </td>
                                            <td className="text-center">{obtenerBadgeEstado(item.estado)}</td>
                                            <td className="text-center px-4">
                                                {item.estado === 'pendiente' ? (
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAbrirRespuesta(item, 'aprobada')}
                                                            className="btn btn-sm btn-outline-success"
                                                            title="Aprobar solicitud"
                                                        >
                                                            <i className="bi bi-check-lg"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAbrirRespuesta(item, 'rechazada')}
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Rechazar solicitud"
                                                        >
                                                            <i className="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="small text-muted">
                                                        {item.autorizador_nombre || 'Resuelta'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal para confirmar Aprobación o Rechazo */}
            {solicitudActiva && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div
                                className="modal-header px-4 py-3 text-white"
                                style={{ backgroundColor: accionModal === 'aprobada' ? '#198754' : '#dc3545' }}
                            >
                                <h5 className="modal-title fw-semibold">
                                    {accionModal === 'aprobada' ? 'Aprobar' : 'Rechazar'} Solicitud #AUT-{solicitudActiva.id_autorizacion}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setSolicitudActiva(null)}
                                ></button>
                            </div>
                            <form onSubmit={handleConfirmarRespuesta}>
                                <div className="modal-body p-4">
                                    <p className="small mb-2">
                                        <strong>Solicitante:</strong> {solicitudActiva.solicitante_nombre}
                                    </p>
                                    <p className="small mb-3">
                                        <strong>Solicitud:</strong> {solicitudActiva.accion === 'eliminacion' ? 'Eliminación' : 'Modificación'} en{' '}
                                        <strong>{solicitudActiva.modulo} #{solicitudActiva.id_registro}</strong>
                                    </p>
                                    <div className="mb-2">
                                        <label className="form-label fw-semibold text-muted small">
                                            Observaciones ({observacionesRespuesta.length}/500)
                                        </label>
                                        <textarea
                                            maxLength={500}
                                            required={accionModal === 'rechazada'}
                                            rows="3"
                                            value={observacionesRespuesta}
                                            onChange={(e) => setObservacionesRespuesta(e.target.value)}
                                            className="form-control bg-light"
                                            placeholder={
                                                accionModal === 'rechazada'
                                                    ? 'Indique el motivo del rechazo (obligatorio)...'
                                                    : 'Comentario opcional sobre la aprobación...'
                                            }
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setSolicitudActiva(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={`btn rounded-pill px-4 fw-semibold text-white ${
                                            accionModal === 'aprobada' ? 'btn-success' : 'btn-danger'
                                        }`}
                                    >
                                        Confirmar {accionModal === 'aprobada' ? 'Aprobación' : 'Rechazo'}
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