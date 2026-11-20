import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CrearCuenta() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        rut: '',
        correo_electronico: '',
        telefono: '',
        usuario: '',
        id_rol: '',
        password: '',
        confirmar_password: '',
        activo: true
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

        if (formData.password !== formData.confirmar_password) {
            alert('Las contraseñas no coinciden.');
            return;
        }

        // Payload listo para enviar a la API de Django
        const payload = {
            id_rol: Number(formData.id_rol),
            nombres: formData.nombres.trim(),
            apellidos: formData.apellidos.trim(),
            rut: formData.rut.trim(),
            correo_electronico: formData.correo_electronico.trim(),
            telefono: formData.telefono.trim(),
            usuario: formData.usuario.trim(),
            password: formData.password,
            activo: formData.activo
        };

        console.log('Datos listos para enviar al backend:', payload);
        alert('Usuario registrado correctamente (simulación local).');
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Crear Cuenta</h3>
                            <span className="small opacity-75">Registro de nuevos usuarios y asignación de rol</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Nombres</label>
                                <input
                                    type="text"
                                    name="nombres"
                                    maxLength={100}
                                    required
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: Juan Pablo"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Apellidos</label>
                                <input
                                    type="text"
                                    name="apellidos"
                                    maxLength={100}
                                    required
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: Pérez González"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">RUT</label>
                                <input
                                    type="text"
                                    name="rut"
                                    maxLength={12}
                                    required
                                    value={formData.rut}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: 18.456.789-K"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    maxLength={9}
                                    required
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: 912345678"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="correo_electronico"
                                    maxLength={100}
                                    required
                                    value={formData.correo_electronico}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="usuario@fyag.cl"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Nombre de Usuario</label>
                                <input
                                    type="text"
                                    name="usuario"
                                    maxLength={100}
                                    required
                                    value={formData.usuario}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: jperez"
                                />
                            </div>
                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">Rol / Perfil</label>
                                <select
                                    name="id_rol"
                                    required
                                    value={formData.id_rol}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione un rol...</option>
                                    <option value="1">Administrador</option>
                                    <option value="2">Bodeguero</option>
                                    <option value="3">Técnico</option>
                                    <option value="4">Finanzas</option>
                                    <option value="5">Supervisor</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Contraseña</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    name="confirmar_password"
                                    required
                                    value={formData.confirmar_password}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button type="submit" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                Registrar Usuario
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}