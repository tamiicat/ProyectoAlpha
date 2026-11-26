import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Diagnostico() {
    const navigate = useNavigate();

    // Datos de ejemplo (luego vendrán de la API de Django: GET /obras y GET /usuarios)
    const obrasMock = [
        { id_obra: 201, nombre: 'Instalación Climatización Centro', tipo: 'instalación', estado: 'en proceso' },
        { id_obra: 202, nombre: 'Revisión Cámara Frigorífica Ñuble', tipo: 'diagnóstico', estado: 'en proceso' },
        { id_obra: 203, nombre: 'Mantención Equipo Chillán Viejo', tipo: 'reparación', estado: 'pendiente' }
    ];

    const usuariosMock = [
        { id_usuario: 3, nombre: 'Carlos Méndez (Técnico)' },
        { id_usuario: 4, nombre: 'Luis Rojas (Técnico)' },
        { id_usuario: 5, nombre: 'Andrea Morales (Supervisor)' }
    ];

    // Historial inicial alineado a la tabla Reporte (GET /reportes)
    const [reportes, setReportes] = useState([
        {
            id_reporte: 1,
            id_obra: 202,
            obra_nombre: 'Revisión Cámara Frigorífica Ñuble',
            obra_tipo: 'diagnóstico',
            id_usuario: 3,
            usuario_nombre: 'Carlos Méndez (Técnico)',
            fecha: '2026-11-18 11:30',
            observaciones: 'Se detecta fuga leve en válvula de expansión y pérdida de presión en circuito secundario. Requiere reemplazo de sello.'
        }
    ]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const obraSel = obrasMock.find((o) => o.id_obra === Number(formData.id_obra));
        const usuarioSel = usuariosMock.find((u) => u.id_usuario === Number(formData.id_usuario));

        // Payload listo para enviar a la API de Django (POST /reportes)
        const payload = {
            id_obra: Number(formData.id_obra),
            id_usuario: Number(formData.id_usuario),
            fecha: formData.fecha.replace('T', ' '),
            observaciones: formData.observaciones.trim()
        };

        const nuevoId = reportes.length > 0 ? Math.max(...reportes.map((r) => r.id_reporte)) + 1 : 1;

        setReportes((prev) => [
            {
                id_reporte: nuevoId,
                ...payload,
                obra_nombre: obraSel ? obraSel.nombre : 'Obra',
                obra_tipo: obraSel ? obraSel.tipo : 'diagnóstico',
                usuario_nombre: usuarioSel ? usuarioSel.nombre : 'Técnico'
            },
            ...prev
        ]);

        console.log('Reporte de diagnóstico listo para enviar al backend:', payload);
        alert('Reporte técnico registrado correctamente (simulación local).');

        setFormData({
            id_obra: '',
            id_usuario: '',
            fecha: obtenerFechaHoraActual(),
            observaciones: ''
        });
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
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Obra / Proyecto Asociado</label>
                                <select
                                    name="id_obra"
                                    required
                                    value={formData.id_obra}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione una obra...</option>
                                    {obrasMock.map((obra) => (
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
                                    value={formData.id_usuario}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione un responsable...</option>
                                    {usuariosMock.map((usr) => (
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
                                className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                Registrar Diagnóstico
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
                                {reportes.map((rep) => (
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}