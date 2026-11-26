import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Diagnostico() {
    const navigate = useNavigate();

    const [obras, setObras] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [reportes, setReportes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [enviando, setEnviando] = useState(false);

    const obtenerFechaHoraActual = () => {
        const ahora = new Date();
        const offset = ahora.getTimezoneOffset() * 60000;
        return new Date(ahora - offset).toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        id_obra: '',
        id_usuario: '',
        fecha: obtenerFechaHoraActual(),
        observaciones: ''
    });

    const cargarDatos = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resObras, resUsuarios, resReportes] = await Promise.allSettled([
                apiFetch('/obras/'),
                apiFetch('/usuarios/'),
                apiFetch('/reportes/')
            ]);

            if (resObras.status === 'fulfilled') {
                const rawObras = resObras.value;
                const listaObras = Array.isArray(rawObras) ? rawObras : (rawObras.obras || []);
                setObras(
                    listaObras.map((o, idx) => ({
                        id_obra: o.id_obra ?? o.id ?? idx + 1,
                        nombre: o.nombre ?? `Obra #${o.id_obra ?? o.id ?? idx + 1}`,
                        tipo: o.tipo ?? 'diagnóstico',
                        estado: o.estado ?? ''
                    }))
                );
            } else {
                setObras([]);
                setErrorCarga((prev) => prev || resObras.reason?.message || 'No se pudieron cargar las obras desde el servidor.');
            }

            if (resUsuarios.status === 'fulfilled') {
                const rawUsr = resUsuarios.value;
                const listaUsr = Array.isArray(rawUsr) ? rawUsr : (rawUsr.usuarios || []);
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
            } else {
                setUsuarios([]);
                setErrorCarga((prev) => prev || resUsuarios.reason?.message || 'No se pudieron cargar los usuarios desde el servidor.');
            }

            if (resReportes.status === 'fulfilled') {
                const rawRep = resReportes.value;
                const listaRep = Array.isArray(rawRep) ? rawRep : (rawRep.reportes || []);
                setReportes(
                    listaRep.map((rep, idx) => ({
                        id_reporte: rep.id_reporte ?? rep.id ?? idx + 1,
                        id_obra: rep.id_obra ?? rep.obra_id ?? '',
                        obra_nombre: rep.obra_nombre ?? rep.obra ?? 'Obra',
                        obra_tipo: rep.obra_tipo ?? rep.tipo ?? 'diagnóstico',
                        id_usuario: rep.id_usuario ?? rep.usuario_id ?? '',
                        usuario_nombre: rep.usuario_nombre ?? rep.usuario ?? 'Responsable',
                        fecha: rep.fecha ?? rep.created_at ?? '',
                        observaciones: rep.observaciones ?? ''
                    }))
                );
            } else {
                setReportes([]);
                setErrorCarga((prev) => prev || resReportes.reason?.message || 'No se pudieron cargar los reportes desde el servidor.');
            }
        } catch (err) {
            setObras([]);
            setUsuarios([]);
            setReportes([]);
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            id_obra: Number(formData.id_obra),
            id_usuario: Number(formData.id_usuario),
            fecha: formData.fecha.replace('T', ' '),
            observaciones: formData.observaciones.trim()
        };

        setEnviando(true);
        try {
            await apiFetch('/reportes/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert('Reporte técnico registrado correctamente en el servidor.');
            setFormData({
                id_obra: '',
                id_usuario: '',
                fecha: obtenerFechaHoraActual(),
                observaciones: ''
            });
            await cargarDatos();
        } catch (err) {
            alert(`No se pudo registrar el diagnóstico: ${err?.message || 'Error en el servidor.'}`);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Diagnóstico / Reporte Técnico</h3>
                            <span className="small opacity-75">Registro de observaciones y evaluaciones técnicas por obra</span>
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

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Obra / Proyecto Asociado</label>
                                <select
                                    name="id_obra"
                                    required
                                    disabled={enviando || cargando}
                                    value={formData.id_obra}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione una obra...</option>
                                    {obras.map((obra) => (
                                        <option key={obra.id_obra} value={obra.id_obra}>
                                            #OB-{obra.id_obra} — {obra.nombre} ({obra.tipo})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Técnico / Usuario Responsable</label>
                                <select
                                    name="id_usuario"
                                    required
                                    disabled={enviando || cargando}
                                    value={formData.id_usuario}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione un responsable...</option>
                                    {usuarios.map((usr) => (
                                        <option key={usr.id_usuario} value={usr.id_usuario}>
                                            {usr.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Fecha y Hora del Reporte</label>
                                <input
                                    type="datetime-local"
                                    name="fecha"
                                    required
                                    disabled={enviando}
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                />
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">
                                    Detalle de Fallas / Observaciones ({formData.observaciones.length}/500)
                                </label>
                                <textarea
                                    name="observaciones"
                                    maxLength={500}
                                    required
                                    disabled={enviando}
                                    rows="4"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    className="form-control shadow-sm border-light bg-light"
                                    placeholder="Describa el diagnóstico técnico, hallazgos o acciones requeridas..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mb-5">
                            <button
                                type="submit"
                                disabled={enviando}
                                className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                {enviando ? 'Registrando...' : 'Registrar Diagnóstico'}
                            </button>
                        </div>
                    </form>

                    {/* Historial de Reportes registrados */}
                    <hr className="my-4 opacity-25" />
                    <h6 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>
                        Reportes Técnicos Recientes
                    </h6>
                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Obra</th>
                                    <th className="py-3">Responsable</th>
                                    <th className="py-3">Fecha / Hora</th>
                                    <th className="py-3 px-4">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            Cargando reportes técnicos...
                                        </td>
                                    </tr>
                                ) : reportes.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay reportes disponibles por un error de conexión o autenticación.'
                                                : 'No hay reportes técnicos registrados en el servidor.'}
                                        </td>
                                    </tr>
                                ) : (
                                    reportes.map((rep) => (
                                        <tr key={rep.id_reporte}>
                                            <td className="px-4 fw-semibold text-muted">#{rep.id_reporte}</td>
                                            <td>
                                                <div className="fw-semibold">#OB-{rep.id_obra} — {rep.obra_nombre}</div>
                                                <span className="badge bg-light text-dark border small text-capitalize">{rep.obra_tipo}</span>
                                            </td>
                                            <td className="small">{rep.usuario_nombre}</td>
                                            <td className="small text-muted">{rep.fecha}</td>
                                            <td className="px-4 small">{rep.observaciones}</td>
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