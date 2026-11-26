import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GestionClientes() {
    const navigate = useNavigate();

    // Datos iniciales alineados a la tabla Cliente (luego vendrán de Django: GET /clientes)
    const [clientes, setClientes] = useState([
        {
            id_cliente: 1,
            nombre: 'Agroindustrial Ñuble Ltda.',
            rut: '76.890.123-4',
            correo_electronico: 'contacto@agronuble.cl',
            telefono: '942112233',
            direccion: 'Camino a Coihueco Km 8, Chillán',
            activo: true
        },
        {
            id_cliente: 2,
            nombre: 'Frigorífico San Carlos S.A.',
            rut: '96.451.780-2',
            correo_electronico: 'operaciones@frigosancarlos.cl',
            telefono: '983445566',
            direccion: 'Ruta 5 Sur Km 378, San Carlos',
            activo: true
        },
        {
            id_cliente: 3,
            nombre: 'Alberto Andrés Sepúlveda Ortiz',
            rut: '15.678.901-K',
            correo_electronico: 'alberto.sepulveda@gmail.com',
            telefono: '977889900',
            direccion: 'Pje. Alegría #42, Talca, Maule',
            activo: true
        }
    ]);

    const [busqueda, setBusqueda] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);

    const estadoInicial = {
        id_cliente: null,
        nombre: '',
        rut: '',
        correo_electronico: '',
        telefono: '',
        direccion: '',
        activo: true
    };

    const [formData, setFormData] = useState(estadoInicial);

    const clientesFiltrados = clientes.filter((cli) => {
        const termino = busqueda.toLowerCase();
        return (
            cli.nombre.toLowerCase().includes(termino) ||
            cli.rut.toLowerCase().includes(termino) ||
            cli.correo_electronico.toLowerCase().includes(termino) ||
            cli.direccion.toLowerCase().includes(termino)
        );
    });

    const handleAbrirNuevo = () => {
        setModoEdicion(false);
        setFormData(estadoInicial);
        setMostrarModal(true);
    };

    const handleAbrirEditar = (cliente) => {
        setModoEdicion(true);
        setFormData({ ...cliente });
        setMostrarModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGuardar = (e) => {
        e.preventDefault();

        const payload = {
            nombre: formData.nombre.trim(),
            rut: formData.rut.trim(),
            correo_electronico: formData.correo_electronico.trim(),
            telefono: formData.telefono.trim(),
            direccion: formData.direccion.trim(),
            activo: formData.activo
        };

        if (modoEdicion) {
            // PUT/PATCH /clientes/:id en Django
            setClientes((prev) =>
                prev.map((cli) =>
                    cli.id_cliente === formData.id_cliente
                        ? { id_cliente: formData.id_cliente, ...payload }
                        : cli
                )
            );
            console.log('Cliente actualizado (simulación local):', {
                id_cliente: formData.id_cliente,
                ...payload
            });
        } else {
            // POST /clientes en Django
            const nuevoId =
                clientes.length > 0
                    ? Math.max(...clientes.map((c) => c.id_cliente)) + 1
                    : 1;
            setClientes((prev) => [{ id_cliente: nuevoId, ...payload }, ...prev]);
            console.log('Nuevo cliente listo para enviar al backend:', payload);
        }

        setMostrarModal(false);
    };

    const handleDesactivar = (cliente) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas desactivar al cliente "${cliente.nombre}" (RUT: ${cliente.rut})?`
        );
        if (!confirmar) return;

        // Borrado lógico (activo: false) listo para la API
        setClientes((prev) =>
            prev.map((cli) =>
                cli.id_cliente === cliente.id_cliente
                    ? { ...cli, activo: false }
                    : cli
            )
        );
        console.log('Cliente desactivado (simulación local):', {
            id_cliente: cliente.id_cliente,
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
                            <h3 className="mb-0 fw-semibold">Gestión de Clientes</h3>
                            <span className="small opacity-75">Directorio de clientes para obras y despachos</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={handleAbrirNuevo}
                            className="btn btn-light rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-plus-circle"></i> Nuevo Cliente
                        </button>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {/* Buscador */}
                    <div className="row mb-4">
                        <div className="col-12 col-md-6">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="form-control bg-light border-light shadow-sm"
                                placeholder="Buscar por nombre/razón social, RUT, correo o dirección..."
                            />
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Nombre / Razón Social</th>
                                    <th className="py-3">RUT</th>
                                    <th className="py-3">Correo Electrónico</th>
                                    <th className="py-3">Teléfono</th>
                                    <th className="py-3">Dirección</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientesFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No se encontraron clientes registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    clientesFiltrados.map((cli) => (
                                        <tr key={cli.id_cliente} className={!cli.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 fw-semibold text-muted">{cli.id_cliente}</td>
                                            <td className="fw-semibold">{cli.nombre}</td>
                                            <td className="small text-muted">{cli.rut}</td>
                                            <td className="small">{cli.correo_electronico}</td>
                                            <td className="small">{cli.telefono}</td>
                                            <td className="small text-muted">{cli.direccion}</td>
                                            <td className="text-center">
                                                {cli.activo ? (
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
                                                        onClick={() => handleAbrirEditar(cli)}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar cliente"
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDesactivar(cli)}
                                                        disabled={!cli.activo}
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Desactivar cliente"
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

            {/* Modal para Crear / Editar Cliente */}
            {mostrarModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    {modoEdicion ? `Editar Cliente #${formData.id_cliente}` : 'Registrar Nuevo Cliente'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setMostrarModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleGuardar}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-12 col-md-7">
                                            <label className="form-label fw-semibold text-muted small">Nombre o Razón Social</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                maxLength={150}
                                                required
                                                value={formData.nombre}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="Ej: Agroindustrial Ñuble Ltda."
                                            />
                                        </div>
                                        <div className="col-12 col-md-5">
                                            <label className="form-label fw-semibold text-muted small">RUT</label>
                                            <input
                                                type="text"
                                                name="rut"
                                                maxLength={12}
                                                required
                                                value={formData.rut}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="Ej: 76.890.123-4"
                                            />
                                        </div>
                                        <div className="col-12 col-md-7">
                                            <label className="form-label fw-semibold text-muted small">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                name="correo_electronico"
                                                maxLength={100}
                                                required
                                                value={formData.correo_electronico}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="contacto@cliente.cl"
                                            />
                                        </div>
                                        <div className="col-12 col-md-5">
                                            <label className="form-label fw-semibold text-muted small">Teléfono</label>
                                            <input
                                                type="tel"
                                                name="telefono"
                                                maxLength={9}
                                                required
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="Ej: 942112233"
                                            />
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold text-muted small">Dirección</label>
                                            <input
                                                type="text"
                                                name="direccion"
                                                maxLength={200}
                                                required
                                                value={formData.direccion}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="Ej: Av. Libertad #850, Chillán"
                                            />
                                        </div>
                                        {modoEdicion && (
                                            <div className="col-12">
                                                <div className="form-check form-switch mt-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="switchActivoCliente"
                                                        name="activo"
                                                        checked={formData.activo}
                                                        onChange={handleChange}
                                                    />
                                                    <label className="form-check-label small fw-semibold text-muted" htmlFor="switchActivoCliente">
                                                        Cliente activo en el sistema
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setMostrarModal(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn text-white rounded-pill px-4 fw-semibold"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        {modoEdicion ? 'Guardar Cambios' : 'Registrar Cliente'}
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