import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function GestionCatalogos() {
    const navigate = useNavigate();

    const [tabActiva, setTabActiva] = useState('categorias');
    const [categorias, setCategorias] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [aviso, setAviso] = useState(null); // { tipo: 'success' | 'danger' | 'warning', mensaje: string }
    const [guardando, setGuardando] = useState(false);

    // Modal Categoría
    const [modalCat, setModalCat] = useState(false);
    const [editandoCat, setEditandoCat] = useState(false);
    const [formCat, setFormCat] = useState({
        id_categoria: null,
        nombre: '',
        activo: true
    });

    // Modal Ubicación
    const [modalUb, setModalUb] = useState(false);
    const [editandoUb, setEditandoUb] = useState(false);
    const [formUb, setFormUb] = useState({
        id_ubicacion: null,
        bodega: '',
        detalle: '',
        activo: true
    });

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const [resCat, resUb] = await Promise.allSettled([
                apiFetch('/categorias/'),
                apiFetch('/ubicaciones/')
            ]);

            if (resCat.status === 'fulfilled') {
                const rawCat = resCat.value;
                const listaCat = Array.isArray(rawCat) ? rawCat : (rawCat.categorias || rawCat.results || []);
                setCategorias(
                    listaCat.map((c, idx) => ({
                        id_categoria: c.id_categoria ?? c.id ?? idx + 1,
                        nombre: c.nombre ?? c.categoria ?? `Categoría #${idx + 1}`,
                        activo: c.activo !== undefined ? Boolean(c.activo) : true
                    }))
                );
            } else {
                setCategorias([]);
                setErrorCarga((prev) => prev || resCat.reason?.message || 'No se pudieron cargar las categorías.');
            }

            if (resUb.status === 'fulfilled') {
                const rawUb = resUb.value;
                const listaUb = Array.isArray(rawUb) ? rawUb : (rawUb.ubicaciones || rawUb.results || []);
                setUbicaciones(
                    listaUb.map((u, idx) => ({
                        id_ubicacion: u.id_ubicacion ?? u.id ?? idx + 1,
                        bodega: u.bodega ?? u.nombre ?? 'Bodega',
                        detalle: u.detalle ?? u.descripcion ?? '',
                        activo: u.activo !== undefined ? Boolean(u.activo) : true
                    }))
                );
            } else {
                setUbicaciones([]);
                setErrorCarga((prev) => prev || resUb.reason?.message || 'No se pudieron cargar las ubicaciones.');
            }
        } catch (err) {
            setErrorCarga(err?.message || 'Error al comunicarse con el servidor.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // === CRUD CATEGORÍAS ===
    const abrirNuevaCat = () => {
        setAviso(null);
        setEditandoCat(false);
        setFormCat({ id_categoria: null, nombre: '', activo: true });
        setModalCat(true);
    };

    const abrirEditarCat = (cat) => {
        setAviso(null);
        setEditandoCat(true);
        setFormCat({
            id_categoria: cat.id_categoria,
            nombre: cat.nombre,
            activo: cat.activo
        });
        setModalCat(true);
    };

    const guardarCategoria = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const payload = {
                nombre: formCat.nombre.trim(),
                activo: formCat.activo
            };

            if (editandoCat) {
                await apiFetch(`/categorias/${formCat.id_categoria}/`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/categorias/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            await cargarDatos();
            setModalCat(false);
            setAviso({
                tipo: 'success',
                mensaje: editandoCat
                    ? 'Categoría actualizada correctamente.'
                    : 'Categoría creada correctamente.'
            });
        } catch (err) {
            setModalCat(false);
            setAviso({
                tipo: 'danger',
                mensaje: `No se pudo guardar la categoría: ${err?.message || 'Error en el servidor.'}`
            });
        } finally {
            setGuardando(false);
        }
    };

    const toggleActivoCat = async (cat) => {
        const accion = cat.activo ? 'desactivar' : 'reactivar';
        if (!window.confirm(`¿Seguro que deseas ${accion} la categoría "${cat.nombre}"?`)) return;

        setAviso(null);
        try {
            await apiFetch(`/categorias/${cat.id_categoria}/`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: !cat.activo })
            });
            await cargarDatos();
            setAviso({
                tipo: 'success',
                mensaje: `Categoría "${cat.nombre}" ${cat.activo ? 'desactivada' : 'reactivada'} correctamente.`
            });
        } catch (err) {
            setAviso({
                tipo: 'danger',
                mensaje: `No se pudo ${accion} la categoría: ${err?.message || 'Error en el servidor.'}`
            });
        }
    };

    // === CRUD UBICACIONES ===
    const abrirNuevaUb = () => {
        setAviso(null);
        setEditandoUb(false);
        setFormUb({ id_ubicacion: null, bodega: '', detalle: '', activo: true });
        setModalUb(true);
    };

    const abrirEditarUb = (ub) => {
        setAviso(null);
        setEditandoUb(true);
        setFormUb({
            id_ubicacion: ub.id_ubicacion,
            bodega: ub.bodega,
            detalle: ub.detalle,
            activo: ub.activo
        });
        setModalUb(true);
    };

    const guardarUbicacion = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const payload = {
                bodega: formUb.bodega.trim(),
                detalle: formUb.detalle.trim(),
                activo: formUb.activo
            };

            if (editandoUb) {
                await apiFetch(`/ubicaciones/${formUb.id_ubicacion}/`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/ubicaciones/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            await cargarDatos();
            setModalUb(false);
            setAviso({
                tipo: 'success',
                mensaje: editandoUb
                    ? 'Ubicación actualizada correctamente.'
                    : 'Ubicación creada correctamente.'
            });
        } catch (err) {
            setModalUb(false);
            setAviso({
                tipo: 'danger',
                mensaje: `No se pudo guardar la ubicación: ${err?.message || 'Error en el servidor.'}`
            });
        } finally {
            setGuardando(false);
        }
    };

    const toggleActivoUb = async (ub) => {
        const accion = ub.activo ? 'desactivar' : 'reactivar';
        if (!window.confirm(`¿Seguro que deseas ${accion} la ubicación "${ub.bodega}"?`)) return;

        setAviso(null);
        try {
            await apiFetch(`/ubicaciones/${ub.id_ubicacion}/`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: !ub.activo })
            });
            await cargarDatos();
            setAviso({
                tipo: 'success',
                mensaje: `Ubicación "${ub.bodega}" ${ub.activo ? 'desactivada' : 'reactivada'} correctamente.`
            });
        } catch (err) {
            setAviso({
                tipo: 'danger',
                mensaje: `No se pudo ${accion} la ubicación: ${err?.message || 'Error en el servidor.'}`
            });
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Categorías y Bodegas</h3>
                            <span className="small opacity-75">Administración de catálogos de inventario y ubicaciones</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={tabActiva === 'categorias' ? abrirNuevaCat : abrirNuevaUb}
                            className="btn btn-light rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-plus-circle"></i>
                            {tabActiva === 'categorias' ? 'Nueva Categoría' : 'Nueva Bodega'}
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

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={cargarDatos} className="btn btn-sm btn-outline-danger ms-3">
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

                    {/* Pestañas */}
                    <ul className="nav nav-pills mb-4 gap-2">
                        <li className="nav-item">
                            <button
                                type="button"
                                onClick={() => {
                                    setTabActiva('categorias');
                                    if (aviso) setAviso(null);
                                }}
                                className={`nav-link rounded-pill px-4 fw-semibold ${tabActiva === 'categorias' ? 'active' : 'text-secondary bg-light'}`}
                                style={tabActiva === 'categorias' ? { backgroundColor: '#2b3d52' } : {}}
                            >
                                <i className="bi bi-tags me-2"></i>Categorías ({categorias.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                onClick={() => {
                                    setTabActiva('ubicaciones');
                                    if (aviso) setAviso(null);
                                }}
                                className={`nav-link rounded-pill px-4 fw-semibold ${tabActiva === 'ubicaciones' ? 'active' : 'text-secondary bg-light'}`}
                                style={tabActiva === 'ubicaciones' ? { backgroundColor: '#2b3d52' } : {}}
                            >
                                <i className="bi bi-geo-alt me-2"></i>Bodegas / Ubicaciones ({ubicaciones.length})
                            </button>
                        </li>
                    </ul>

                    {/* Tabla Categorías */}
                    {tabActiva === 'categorias' && (
                        <div className="table-responsive shadow-sm rounded border">
                            <table className="table table-hover align-middle mb-0">
                                <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                    <tr>
                                        <th className="py-3 px-4">ID</th>
                                        <th className="py-3">Nombre Categoría</th>
                                        <th className="py-3 text-center">Estado</th>
                                        <th className="py-3 text-center px-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargando ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4 text-muted">Cargando categorías...</td>
                                        </tr>
                                    ) : categorias.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4 text-muted">No hay categorías registradas.</td>
                                        </tr>
                                    ) : (
                                        categorias.map((cat) => (
                                            <tr key={cat.id_categoria}>
                                                <td className="px-4 fw-semibold text-muted">#{cat.id_categoria}</td>
                                                <td className="fw-semibold">{cat.nombre}</td>
                                                <td className="text-center">
                                                    {cat.activo ? (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success">Activa</span>
                                                    ) : (
                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">Inactiva</span>
                                                    )}
                                                </td>
                                                <td className="text-center px-4">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirEditarCat(cat)}
                                                            className="btn btn-sm btn-outline-primary"
                                                            title="Editar categoría"
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleActivoCat(cat)}
                                                            className={`btn btn-sm ${cat.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                                            title={cat.activo ? 'Desactivar categoría' : 'Reactivar categoría'}
                                                        >
                                                            <i className={`bi ${cat.activo ? 'bi-trash' : 'bi-arrow-counterclockwise'}`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Tabla Ubicaciones */}
                    {tabActiva === 'ubicaciones' && (
                        <div className="table-responsive shadow-sm rounded border">
                            <table className="table table-hover align-middle mb-0">
                                <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                    <tr>
                                        <th className="py-3 px-4">ID</th>
                                        <th className="py-3">Bodega</th>
                                        <th className="py-3">Detalle / Sector</th>
                                        <th className="py-3 text-center">Estado</th>
                                        <th className="py-3 text-center px-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargando ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted">Cargando ubicaciones...</td>
                                        </tr>
                                    ) : ubicaciones.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted">No hay bodegas registradas.</td>
                                        </tr>
                                    ) : (
                                        ubicaciones.map((ub) => (
                                            <tr key={ub.id_ubicacion}>
                                                <td className="px-4 fw-semibold text-muted">#{ub.id_ubicacion}</td>
                                                <td className="fw-semibold">{ub.bodega}</td>
                                                <td className="text-muted">{ub.detalle || 'Sin detalle'}</td>
                                                <td className="text-center">
                                                    {ub.activo ? (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success">Activa</span>
                                                    ) : (
                                                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">Inactiva</span>
                                                    )}
                                                </td>
                                                <td className="text-center px-4">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => abrirEditarUb(ub)}
                                                            className="btn btn-sm btn-outline-primary"
                                                            title="Editar ubicación"
                                                        >
                                                            <i className="bi bi-pencil-square"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleActivoUb(ub)}
                                                            className={`btn btn-sm ${ub.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                                                            title={ub.activo ? 'Desactivar ubicación' : 'Reactivar ubicación'}
                                                        >
                                                            <i className={`bi ${ub.activo ? 'bi-trash' : 'bi-arrow-counterclockwise'}`}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Categoría */}
            {modalCat && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    {editandoCat ? `Editar Categoría #${formCat.id_categoria}` : 'Nueva Categoría'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setModalCat(false)}></button>
                            </div>
                            <form onSubmit={guardarCategoria}>
                                <div className="modal-body p-4">
                                    <label className="form-label fw-semibold text-muted small">Nombre de la Categoría</label>
                                    <input
                                        type="text"
                                        maxLength={200}
                                        required
                                        value={formCat.nombre}
                                        onChange={(e) => setFormCat((prev) => ({ ...prev, nombre: e.target.value }))}
                                        className="form-control bg-light"
                                        placeholder="Ej: Climatización, Herramientas, Repuestos"
                                    />
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button type="button" disabled={guardando} className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setModalCat(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={guardando} className="btn text-white rounded-pill px-4 fw-semibold" style={{ backgroundColor: '#2b3d52' }}>
                                        {guardando ? 'Guardando...' : (editandoCat ? 'Guardar Cambios' : 'Crear Categoría')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ubicación */}
            {modalUb && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    {editandoUb ? `Editar Bodega #${formUb.id_ubicacion}` : 'Nueva Bodega / Ubicación'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setModalUb(false)}></button>
                            </div>
                            <form onSubmit={guardarUbicacion}>
                                <div className="modal-body p-4 d-flex flex-column gap-3">
                                    <div>
                                        <label className="form-label fw-semibold text-muted small">Nombre de Bodega</label>
                                        <input
                                            type="text"
                                            maxLength={100}
                                            required
                                            value={formUb.bodega}
                                            onChange={(e) => setFormUb((prev) => ({ ...prev, bodega: e.target.value }))}
                                            className="form-control bg-light"
                                            placeholder="Ej: Bodega Central"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label fw-semibold text-muted small">Detalle / Sector (Opcional)</label>
                                        <input
                                            type="text"
                                            maxLength={100}
                                            value={formUb.detalle}
                                            onChange={(e) => setFormUb((prev) => ({ ...prev, detalle: e.target.value }))}
                                            className="form-control bg-light"
                                            placeholder="Ej: Pasillo A - Estante 2"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button type="button" disabled={guardando} className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setModalUb(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={guardando} className="btn text-white rounded-pill px-4 fw-semibold" style={{ backgroundColor: '#2b3d52' }}>
                                        {guardando ? 'Guardando...' : (editandoUb ? 'Guardar Cambios' : 'Crear Ubicación')}
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