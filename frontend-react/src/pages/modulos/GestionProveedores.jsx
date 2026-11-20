import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function GestionProveedores() {
    const navigate = useNavigate();

    // Datos iniciales alineados a la tabla Proveedor (luego vendrán de Django: GET /proveedores)
    const [proveedores, setProveedores] = useState([
        {
            id_proveedor: 1,
            razon_social: 'Empresa Ñuble SpA',
            rut: '76.123.456-K',
            correo_electronico: 'contacto@empresanuble.cl',
            telefono: '912345678',
            direccion: 'Av. O’Higgins #450, Chillán',
            activo: true
        },
        {
            id_proveedor: 2,
            razon_social: 'Distribuidora Frío Sur Ltda.',
            rut: '77.654.321-8',
            correo_electronico: 'ventas@friosur.cl',
            telefono: '987654321',
            direccion: 'Ruta 5 Sur Km 402, Chillán Viejo',
            activo: true
        }
    ]);

    const [busqueda, setBusqueda] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);

    const estadoInicial = {
        id_proveedor: null,
        razon_social: '',
        rut: '',
        correo_electronico: '',
        telefono: '',
        direccion: '',
        activo: true
    };

    const [formData, setFormData] = useState(estadoInicial);

    const proveedoresFiltrados = proveedores.filter((prov) => {
        const termino = busqueda.toLowerCase();
        return (
            prov.razon_social.toLowerCase().includes(termino) ||
            prov.rut.toLowerCase().includes(termino) ||
            prov.correo_electronico.toLowerCase().includes(termino) ||
            prov.direccion.toLowerCase().includes(termino)
        );
    });

    const handleAbrirNuevo = () => {
        setModoEdicion(false);
        setFormData(estadoInicial);
        setMostrarModal(true);
    };

    const handleAbrirEditar = (proveedor) => {
        setModoEdicion(true);
        setFormData({ ...proveedor });
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
            razon_social: formData.razon_social.trim(),
            rut: formData.rut.trim(),
            correo_electronico: formData.correo_electronico.trim(),
            telefono: formData.telefono.trim(),
            direccion: formData.direccion.trim(),
            activo: formData.activo
        };

        if (modoEdicion) {
            // PUT/PATCH /proveedores/:id en Django
            setProveedores((prev) =>
                prev.map((prov) =>
                    prov.id_proveedor === formData.id_proveedor
                        ? { id_proveedor: formData.id_proveedor, ...payload }
                        : prov
                )
            );
            console.log('Proveedor actualizado (simulación local):', {
                id_proveedor: formData.id_proveedor,
                ...payload
            });
        } else {
            // POST /proveedores en Django
            const nuevoId =
                proveedores.length > 0
                    ? Math.max(...proveedores.map((p) => p.id_proveedor)) + 1
                    : 1;
            setProveedores((prev) => [{ id_proveedor: nuevoId, ...payload }, ...prev]);
            console.log('Nuevo proveedor listo para enviar al backend:', payload);
        }

        setMostrarModal(false);
    };

    const handleDesactivar = (proveedor) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas desactivar al proveedor "${proveedor.razon_social}" (RUT: ${proveedor.rut})?`
        );
        if (!confirmar) return;

        // Borrado lógico (activo: false) listo para la API
        setProveedores((prev) =>
            prev.map((prov) =>
                prov.id_proveedor === proveedor.id_proveedor
                    ? { ...prov, activo: false }
                    : prov
            )
        );
        console.log('Proveedor desactivado (simulación local):', {
            id_proveedor: proveedor.id_proveedor,
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
                            <h3 className="mb-0 fw-semibold">Gestión de Proveedores</h3>
                            <span className="small opacity-75">Directorio y administración de proveedores registrados</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            onClick={handleAbrirNuevo}
                            className="btn btn-light rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                            style={{ color: '#2b3d52' }}
                        >
                            <i className="bi bi-plus-circle"></i> Nuevo Proveedor
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
                                placeholder="Buscar por razón social, RUT, correo o dirección..."
                            />
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Razón Social</th>
                                    <th className="py-3">RUT</th>
                                    <th className="py-3">Correo Electrónico</th>
                                    <th className="py-3">Teléfono</th>
                                    <th className="py-3">Dirección</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proveedoresFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No se encontraron proveedores registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    proveedoresFiltrados.map((prov) => (
                                        <tr key={prov.id_proveedor} className={!prov.activo ? 'opacity-50' : ''}>
                                            <td className="px-4 fw-semibold text-muted">{prov.id_proveedor}</td>
                                            <td className="fw-semibold">{prov.razon_social}</td>
                                            <td className="small text-muted">{prov.rut}</td>
                                            <td className="small">{prov.correo_electronico}</td>
                                            <td className="small">{prov.telefono}</td>
                                            <td className="small text-muted">{prov.direccion}</td>
                                            <td className="text-center">
                                                {prov.activo ? (
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
                                                        onClick={() => handleAbrirEditar(prov)}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar proveedor"
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDesactivar(prov)}
                                                        disabled={!prov.activo}
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Desactivar proveedor"
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

            {/* Modal para Crear / Editar Proveedor */}
            {mostrarModal && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    {modoEdicion ? `Editar Proveedor #${formData.id_proveedor}` : 'Registrar Nuevo Proveedor'}
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
                                            <label className="form-label fw-semibold text-muted small">Razón Social</label>
                                            <input
                                                type="text"
                                                name="razon_social"
                                                maxLength={150}
                                                required
                                                value={formData.razon_social}
                                                onChange={handleChange}
                                                className="form-control bg-light"
                                                placeholder="Ej: Empresa Ñuble SpA"
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
                                                placeholder="Ej: 76.123.456-K"
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
                                                placeholder="contacto@proveedor.cl"
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
                                                placeholder="Ej: 912345678"
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
                                                placeholder="Ej: Av. O'Higgins #450, Chillán"
                                            />
                                        </div>
                                        {modoEdicion && (
                                            <div className="col-12">
                                                <div className="form-check form-switch mt-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="switchActivoProveedor"
                                                        name="activo"
                                                        checked={formData.activo}
                                                        onChange={handleChange}
                                                    />
                                                    <label className="form-check-label small fw-semibold text-muted" htmlFor="switchActivoProveedor">
                                                        Proveedor activo en el sistema
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
                                        {modoEdicion ? 'Guardar Cambios' : 'Registrar Proveedor'}
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