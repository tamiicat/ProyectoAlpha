import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Autorizaciones() {
    const navigate = useNavigate();

    const [autorizaciones, setAutorizaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState('');

    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');
    const [solicitudActiva, setSolicitudActiva] = useState(null);
    const [accionModal, setAccionModal] = useState(''); // 'aprobada' | 'rechazada'
    const [observacionesRespuesta, setObservacionesRespuesta] = useState('');

    const cargarAutorizaciones = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const data = await apiFetch('/autorizaciones/');
            const lista = Array.isArray(data) ? data : (data.autorizaciones || data.results || []);
            const normalizadas = lista.map((item, idx) => ({
                id_autorizacion: item.id_autorizacion ?? item.id ?? idx + 1,
                id_usuario_solicitante: item.id_usuario_solicitante ?? item.id_solicitante ?? null,
                solicitante_nombre: item.solicitante_nombre ?? item.solicitante ?? 'Usuario FYAG',
                id_usuario_autorizador: item.id_usuario_autorizador ?? item.id_autorizador ?? null,
                autorizador_nombre: item.autorizador_nombre ?? item.autorizador ?? null,
                modulo: item.modulo ?? item.tabla_afectada ?? 'General',
                id_registro: item.id_registro ?? item.id_movimiento ?? '-',
                accion: (item.accion ?? 'modificacion').toLowerCase(),
                motivo: item.motivo ?? item.justificacion ?? '',
                fecha_solicitud: item.fecha_solicitud ?? item.created_at ?? '',
                fecha_respuesta: item.fecha_respuesta ?? item.fecha_resolucion ?? null,
                estado: (item.estado ?? 'pendiente').toLowerCase(),
                observaciones: item.observaciones ?? ''
            }));
            setAutorizaciones(normalizadas);
        } catch (err) {
            setAutorizaciones([]);
            setErrorCarga(err?.message || 'No se pudieron cargar las autorizaciones desde el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarAutorizaciones();
    }, []);

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
        if (accion === 'eliminacion' || accion === 'eliminar') {
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
        setErrorModal('');
    };

    const handleConfirmarRespuesta = async (e) => {
        e.preventDefault();
        if (!solicitudActiva) return;

        setGuardando(true);
        setErrorModal('');

        const payload = {
            estado: accionModal,
            observaciones: observacionesRespuesta.trim()
        };

        try {
            await apiFetch(`/autorizaciones/${solicitudActiva.id_autorizacion}/`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            setSolicitudActiva(null);
            setAccionModal('');
            setObservacionesRespuesta('');
            await cargarAutorizaciones();
        } catch (err) {
            setErrorModal(err?.message || 'No se pudo registrar la respuesta en el servidor.');
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
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={cargarAutorizaciones} className="btn btn-sm btn-outline-danger ms-3">
                                Reintentar
                            </button>
                        </div>
                    )}

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
                                {cargando ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Cargando autorizaciones desde el servidor...
                                        </td>
                                    </tr>
                                ) : autorizacionesFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No se encontraron solicitudes de autorización.'}
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
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
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
                                    disabled={guardando}
                                ></button>
                            </div>
                            <form onSubmit={handleConfirmarRespuesta}>
                                <div className="modal-body p-4">
                                    {errorModal && (
                                        <div className="alert alert-danger py-2 small mb-3" role="alert">
                                            {errorModal}
                                        </div>
                                    )}
                                    <p className="small mb-2">
                                        <strong>Solicitante:</strong> {solicitudActiva.solicitante_nombre}
                                    </p>
                                    <p className="small mb-3">
                                        <strong>Solicitud:</strong>{' '}
                                        {solicitudActiva.accion === 'eliminacion' || solicitudActiva.accion === 'eliminar'
                                            ? 'Eliminación'
                                            : 'Modificación'}{' '}
                                        en <strong>{solicitudActiva.modulo} #{solicitudActiva.id_registro}</strong>
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
                                        disabled={guardando}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={guardando}
                                        className={`btn rounded-pill px-4 fw-semibold text-white ${
                                            accionModal === 'aprobada' ? 'btn-success' : 'btn-danger'
                                        }`}
                                    >
                                        {guardando
                                            ? 'Guardando...'
                                            : `Confirmar ${accionModal === 'aprobada' ? 'Aprobación' : 'Rechazo'}`}
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