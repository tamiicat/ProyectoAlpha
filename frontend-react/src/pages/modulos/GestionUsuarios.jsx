import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

const ROLES_CATALOGO = [
    { id_rol: 1, codigo: 'ADMIN_TI', nombre: 'Administrador' },
    { id_rol: 2, codigo: 'BODEGUERO', nombre: 'Bodeguero' },
    { id_rol: 3, codigo: 'TECNICO', nombre: 'Técnico' },
    { id_rol: 4, codigo: 'FINANZAS', nombre: 'Finanzas' },
    { id_rol: 5, codigo: 'SUPERVISOR_OBRAS', nombre: 'Supervisor' }
];

export default function GestionUsuarios() {
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [usuarioEditando, setUsuarioEditando] = useState(null);

    const mapearRolAId = (rolCrudo) => {
        if (typeof rolCrudo === 'number') return rolCrudo;
        const texto = String(rolCrudo || '').toUpperCase();
        if (texto.includes('ADMIN')) return 1;
        if (texto.includes('BODEG')) return 2;
        if (texto.includes('TECNIC')) return 3;
        if (texto.includes('FINANZ')) return 4;
        if (texto.includes('SUPERVIS')) return 5;
        return 1;
    };

    const cargarUsuarios = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const data = await apiFetch('/usuarios/');
            const lista = Array.isArray(data) ? data : (data.usuarios || []);
            const normalizados = lista.map((u, idx) => {
                const correo = u.correo_electronico ?? u.email ?? 'sin-correo@fyag.cl';
                return {
                    id_usuario: u.id_usuario ?? u.user_id ?? u.id ?? idx + 1,
                    id_rol: u.id_rol ? Number(u.id_rol) : mapearRolAId(u.role ?? u.rol),
                    nombres: u.nombres ?? u.nombre ?? correo.split('@')[0],
                    apellidos: u.apellidos ?? '',
                    rut: u.rut ?? 'Sin RUT',
                    correo_electronico: correo,
                    telefono: u.telefono ?? 'Sin teléfono',
                    usuario: u.usuario ?? u.username ?? correo.split('@')[0],
                    activo: u.activo !== undefined ? Boolean(u.activo) : true
                };
            });
            setUsuarios(normalizados);
        } catch (err) {
            setUsuarios([]);
            setErrorCarga(err?.message || 'No se pudieron cargar los usuarios desde el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const obtenerNombreRol = (id_rol) => {
        const rol = ROLES_CATALOGO.find((r) => r.id_rol === Number(id_rol));
        return rol ? rol.nombre : 'Sin rol';
    };

    const usuariosFiltrados = usuarios.filter((usr) => {
        const coincideRol = filtroRol === '' || usr.id_rol === Number(filtroRol);
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            usr.nombres.toLowerCase().includes(termino) ||
            usr.apellidos.toLowerCase().includes(termino) ||
            usr.rut.toLowerCase().includes(termino) ||
            usr.usuario.toLowerCase().includes(termino) ||
            usr.correo_electronico.toLowerCase().includes(termino);
        return coincideRol && coincideBusqueda;
    });

    const handleAbrirEditar = (usr) => {
        setUsuarioEditando({ ...usr, id_rol: String(usr.id_rol) });
    };

    const handleChangeEdicion = (e) => {
        const { name, value, type, checked } = e.target;
        setUsuarioEditando((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGuardarEdicion = async (e) => {
        e.preventDefault();

        const payload = {
            id_usuario: usuarioEditando.id_usuario,
            id_rol: Number(usuarioEditando.id_rol),
            nombres: usuarioEditando.nombres.trim(),
            apellidos: usuarioEditando.apellidos.trim(),
            rut: usuarioEditando.rut.trim(),
            correo_electronico: usuarioEditando.correo_electronico.trim(),
            telefono: usuarioEditando.telefono.trim(),
            usuario: usuarioEditando.usuario.trim(),
            activo: usuarioEditando.activo
        };

        try {
            await apiFetch(`/usuarios/${payload.id_usuario}/`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            await cargarUsuarios();
            setUsuarioEditando(null);
        } catch (err) {
            alert(`No se pudo actualizar el usuario: ${err?.message || 'Error en el servidor'}`);
        }
    };

    const handleDesactivar = async (usr) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas desactivar al usuario "${usr.nombres} ${usr.apellidos}" (@${usr.usuario})?`
        );
        if (!confirmar) return;

        try {
            await apiFetch(`/usuarios/${usr.id_usuario}/`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: false })
            });
            await cargarUsuarios();
        } catch (err) {
            alert(`No se pudo desactivar el usuario: ${err?.message || 'Error en el servidor'}`);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Gestión de Usuarios</h3>
                            <span className="small opacity-75">Directorio, roles y estado de cuentas registradas</span>
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
                            <button type="button" onClick={cargarUsuarios} className="btn btn-sm btn-outline-danger ms-3">
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
                                placeholder="Buscar por nombre, apellido, RUT, usuario o correo..."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                value={filtroRol}
                                onChange={(e) => setFiltroRol(e.target.value)}
                                className="form-select bg-light border-light shadow-sm text-muted"
                            >
                                <option value="">Todos los roles</option>
                                {ROLES_CATALOGO.map((rol) => (
                                    <option key={rol.id_rol} value={rol.id_rol}>
                                        {rol.nombre}
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
                                    <th className="py-3">Nombres y Apellidos</th>
                                    <th className="py-3">Usuario</th>
                                    <th className="py-3">RUT</th>
                                    <th className="py-3">Contacto</th>
                                    <th className="py-3 text-center">Rol</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Cargando usuarios desde el servidor...
                                        </td>
                                    </tr>
                                ) : usuariosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No se encontraron usuarios registrados.'}
                                        </td>
                                    </tr>
                                ) : (
                                    usuariosFiltrados.map((usr) => (
                                        <tr key={usr.id_usuario} className={!usr.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 fw-semibold text-muted">{usr.id_usuario}</td>
                                            <td className="fw-semibold">
                                                {usr.nombres} {usr.apellidos}
                                            </td>
                                            <td className="small text-muted">@{usr.usuario}</td>
                                            <td className="small text-muted">{usr.rut}</td>
                                            <td className="small">
                                                <div>{usr.correo_electronico}</div>
                                                <div className="text-muted">{usr.telefono}</div>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                                                    {obtenerNombreRol(usr.id_rol)}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {usr.activo ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center px-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAbrirEditar(usr)}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar usuario"
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDesactivar(usr)}
                                                        disabled={!usr.activo}
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Desactivar usuario"
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

            {/* Modal para Editar Usuario */}
            {usuarioEditando && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    Editar Usuario #{usuarioEditando.id_usuario}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setUsuarioEditando(null)}
                                ></button>
                            </div>
                            <form onSubmit={handleGuardarEdicion}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Nombres</label>
                                            <input
                                                type="text"
                                                name="nombres"
                                                maxLength={100}
                                                required
                                                value={usuarioEditando.nombres}
                                                onChange={handleChangeEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Apellidos</label>
                                            <input
                                                type="text"
                                                name="apellidos"
                                                maxLength={100}
                                                required
                                                value={usuarioEditando.apellidos}
                                                onChange={handleChangeEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">RUT</label>
                                            <input
                                                type="text"
                                                name="rut"
                                                maxLength={12}
                                                required
                                                value={usuarioEditando.rut}
                                                onChange={handleChangeEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Teléfono</label>
                                            <input
                                                type="tel"
                                                name="telefono"
                                                maxLength={9}
                                                required
                                                value={usuarioEditando.telefono}
                                                onChange={handleChangeEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                name="correo_electronico"
                                                maxLength={100}
                                                required
                                                value={usuarioEditando.correo_electronico}
                                                onChange={handleChangeEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Nombre de Usuario</label>
                                            <input
                                                type="text"
                                                name="usuario"
                                                maxLength={100}
                                                required
                                                value={usuarioEditando.usuario}
                                                onChange={handleChangeEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold text-muted small">Rol / Perfil</label>
                                            <select
                                                name="id_rol"
                                                required
                                                value={usuarioEditando.id_rol}
                                                onChange={handleChangeEdicion}
                                                className="form-select bg-light text-muted"
                                            >
                                                {ROLES_CATALOGO.map((rol) => (
                                                    <option key={rol.id_rol} value={rol.id_rol}>
                                                        {rol.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12">
                                            <div className="form-check form-switch mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="switchActivoUsuario"
                                                    name="activo"
                                                    checked={usuarioEditando.activo}
                                                    onChange={handleChangeEdicion}
                                                />
                                                <label className="form-check-label small fw-semibold text-muted" htmlFor="switchActivoUsuario">
                                                    Cuenta activa en el sistema
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setUsuarioEditando(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        Guardar Cambios
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