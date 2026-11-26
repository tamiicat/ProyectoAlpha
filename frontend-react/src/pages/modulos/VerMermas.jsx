import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function VerMermas() {
    const navigate = useNavigate();

    const [mermas, setMermas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroMotivo, setFiltroMotivo] = useState('');

    const cargarMermas = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const data = await apiFetch('/mermas/');
            const lista = Array.isArray(data) ? data : (data.mermas || data.results || []);
            const normalizadas = lista.map((m, idx) => ({
                id_merma: m.id_merma ?? m.id ?? idx + 1,
                id_articulo: m.id_articulo ?? m.articulo_id ?? m.sku ?? '-',
                articulo_nombre: m.articulo_nombre ?? m.articulo ?? m.nombre ?? 'Artículo',
                id_usuario: m.id_usuario ?? m.usuario_id ?? null,
                usuario_nombre: m.usuario_nombre ?? m.usuario ?? 'Usuario FYAG',
                fecha: m.fecha ?? m.created_at ?? '',
                motivo: m.motivo ?? 'Sin motivo',
                cantidad: Number(m.cantidad ?? 0),
                justificacion: m.justificacion ?? m.observacion ?? ''
            }));
            setMermas(normalizadas);
        } catch (err) {
            setMermas([]);
            setErrorCarga(err?.message || 'No se pudieron cargar las mermas desde el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarMermas();
    }, []);

    const motivosUnicos = [...new Set(mermas.map((m) => m.motivo).filter(Boolean))];

    const obtenerBadgeMotivo = (motivo) => {
        if (motivo === 'Daño por transporte' || motivo === 'Rotura en manipulación') {
            return 'bg-danger bg-opacity-10 text-danger border-danger';
        }
        if (motivo === 'Defecto de fábrica') {
            return 'bg-warning bg-opacity-10 text-warning border-warning';
        }
        return 'bg-secondary bg-opacity-10 text-secondary border-secondary';
    };

    const mermasFiltradas = mermas.filter((merma) => {
        const coincideMotivo = filtroMotivo === '' || merma.motivo === filtroMotivo;
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            merma.articulo_nombre.toLowerCase().includes(termino) ||
            merma.usuario_nombre.toLowerCase().includes(termino) ||
            merma.motivo.toLowerCase().includes(termino) ||
            merma.justificacion.toLowerCase().includes(termino) ||
            String(merma.id_merma).includes(termino);
        return coincideMotivo && coincideBusqueda;
    });

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Historial de Mermas</h3>
                            <span className="small opacity-75">Registro de artículos dañados o dados de baja</span>
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
                            <button type="button" onClick={cargarMermas} className="btn btn-sm btn-outline-danger ms-3">
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
                                placeholder="Buscar por ID, artículo, responsable o justificación..."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                value={filtroMotivo}
                                onChange={(e) => setFiltroMotivo(e.target.value)}
                                className="form-select bg-light border-light shadow-sm text-muted"
                            >
                                <option value="">Todos los motivos</option>
                                {motivosUnicos.map((mot) => (
                                    <option key={mot} value={mot}>
                                        {mot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Fecha / Hora</th>
                                    <th className="py-3">Artículo</th>
                                    <th className="py-3">Responsable</th>
                                    <th className="py-3 text-center">Cantidad</th>
                                    <th className="py-3">Motivo</th>
                                    <th className="py-3 px-4">Justificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            Cargando historial de mermas desde el servidor...
                                        </td>
                                    </tr>
                                ) : mermasFiltradas.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No se encontraron registros de mermas con los filtros aplicados.'}
                                        </td>
                                    </tr>
                                ) : (
                                    mermasFiltradas.map((merma) => (
                                        <tr key={merma.id_merma}>
                                            <td className="px-4 fw-semibold text-muted">#M-{merma.id_merma}</td>
                                            <td className="small text-muted">{merma.fecha}</td>
                                            <td>
                                                <div className="fw-semibold">{merma.articulo_nombre}</div>
                                                <div className="small text-muted">ID Art. #{merma.id_articulo}</div>
                                            </td>
                                            <td className="small">{merma.usuario_nombre}</td>
                                            <td className="text-center fw-bold text-danger">-{merma.cantidad}</td>
                                            <td>
                                                <span className={`badge border ${obtenerBadgeMotivo(merma.motivo)}`}>
                                                    {merma.motivo}
                                                </span>
                                            </td>
                                            <td className="px-4 text-muted small">{merma.justificacion}</td>
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