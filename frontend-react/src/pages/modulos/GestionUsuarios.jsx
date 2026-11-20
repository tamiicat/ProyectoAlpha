import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GestionUsuarios() {
    const navigate = useNavigate();

    // Roles alineados a la tabla Rol (luego vendrán de Django: GET /roles)
    const rolesMock = [
        { id_rol: 1, nombre: 'Administrador' },
        { id_rol: 2, nombre: 'Bodeguero' },
        { id_rol: 3, nombre: 'Técnico' },
        { id_rol: 4, nombre: 'Finanzas' },
        { id_rol: 5, nombre: 'Supervisor' }
    ];

    // Datos iniciales alineados a la tabla Usuario (luego vendrán de Django: GET /usuarios)
    const [usuarios, setUsuarios] = useState([
        {
            id_usuario: 1,
            id_rol: 1,
            nombres: 'Pedro Benjamín',
            apellidos: 'Aedo Lagos',
            rut: '18.902.213-1',
            correo_electronico: 'p.aedolagos@gmail.com',
            telefono: '912345678',
            usuario: 'paedo',
            activo: true
        },
        {
            id_usuario: 2,
            id_rol: 2,
            nombres: 'Carlos',
            apellidos: 'Soto Muñoz',
            rut: '19.456.123-4',
            correo_electronico: 'csoto@fyag.cl',
            telefono: '987654321',
            usuario: 'csoto',
            activo: true
        },
        {
            id_usuario: 3,
            id_rol: 3,
            nombres: 'Luis',
            apellidos: 'Rojas Vera',
            rut: '17.321.654-K',
            correo_electronico: 'lrojas@fyag.cl',
            telefono: '945612378',
            usuario: 'lrojas',
            activo: true
        }
    ]);

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState('');
    const [usuarioEditando, setUsuarioEditando] = useState(null);

    const obtenerNombreRol = (id_rol) => {
        const rol = rolesMock.find((r) => r.id_rol === Number(id_rol));
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

    const handleGuardarEdicion = (e) => {
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

        // PUT/PATCH /usuarios/:id en Django
        setUsuarios((prev) =>
            prev.map((u) => (u.id_usuario === payload.id_usuario ? payload : u))
        );
        console.log('Usuario actualizado (simulación local):', payload);
        setUsuarioEditando(null);
    };

    const handleDesactivar = (usr) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas desactivar al usuario "${usr.nombres} ${usr.apellidos}" (@${usr.usuario})?`
        );
        if (!confirmar) return;

        // Borrado lógico (activo: false) listo para la API
        setUsuarios((prev) =>
            prev.map((u) =>
                u.id_usuario === usr.id_usuario ? { ...u, activo: false } : u
            )
        );
        console.log('Usuario desactivado (simulación local):', {
            id_usuario: usr.id_usuario,
            activo: false
        });
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
                                {rolesMock.map((rol) => (
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
                                {usuariosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No se encontraron usuarios con los filtros aplicados.
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
                                                {rolesMock.map((rol) => (
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