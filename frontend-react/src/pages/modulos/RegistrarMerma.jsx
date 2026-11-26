import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegistrarMerma() {
    const navigate = useNavigate();

    // Datos de ejemplo alineados a Articulo (luego vendrán de Django: GET /articulos)
    const [articulos, setArticulos] = useState([
        { id_articulo: 500, nombre: 'Aire Acondicionado', stock_actual: 45, unidad_de_medida: 'Unidad' },
        { id_articulo: 501, nombre: 'Cámara de Maduración', stock_actual: 8, unidad_de_medida: 'Unidad' },
        { id_articulo: 502, nombre: 'Válvula de Presión 3/4', stock_actual: 12, unidad_de_medida: 'Unidad' }
    ]);

    const motivosPredefinidos = [
        'Daño por transporte',
        'Defecto de fábrica',
        'Rotura en manipulación',
        'Expiración / Deterioro',
        'Otro'
    ];

    const obtenerFechaHoraActual = () => {
        const ahora = new Date();
        const offset = ahora.getTimezoneOffset() * 60000;
        return new Date(ahora - offset).toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        id_articulo: '',
        cantidad: '',
        motivo: 'Daño por transporte',
        motivo_otro: '',
        fecha: obtenerFechaHoraActual(),
        justificacion: ''
    });

    const articuloSeleccionado = articulos.find(
        (art) => art.id_articulo === Number(formData.id_articulo)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!articuloSeleccionado) {
            alert('Debe seleccionar un artículo.');
            return;
        }

        const cantNum = parseInt(formData.cantidad, 10);
        if (!cantNum || cantNum <= 0) {
            alert('Ingrese una cantidad válida mayor a 0.');
            return;
        }

        if (cantNum > articuloSeleccionado.stock_actual) {
            alert(
                `La cantidad afectada (${cantNum}) supera el stock actual disponible (${articuloSeleccionado.stock_actual} ${articuloSeleccionado.unidad_de_medida}).`
            );
            return;
        }

        const motivoFinal =
            formData.motivo === 'Otro'
                ? formData.motivo_otro.trim()
                : formData.motivo;

        if (!motivoFinal) {
            alert('Debe especificar el motivo de la merma.');
            return;
        }

        // Payload exacto para enviar a Django (POST /mermas)
        // id_usuario lo asigna el backend desde la sesión autenticada
        const payload = {
            id_articulo: Number(formData.id_articulo),
            fecha: formData.fecha.replace('T', ' '),
            motivo: motivoFinal,
            cantidad: cantNum,
            justificacion: formData.justificacion.trim()
        };

        // Actualización visual del stock en local
        setArticulos((prev) =>
            prev.map((art) =>
                art.id_articulo === articuloSeleccionado.id_articulo
                    ? { ...art, stock_actual: art.stock_actual - cantNum }
                    : art
            )
        );

        console.log('Merma lista para enviar al backend:', payload);
        alert(
            `Merma registrada correctamente para "${articuloSeleccionado.nombre}" (-${cantNum} ${articuloSeleccionado.unidad_de_medida}).`
        );

        // Limpiar formulario
        setFormData({
            id_articulo: '',
            cantidad: '',
            motivo: 'Daño por transporte',
            motivo_otro: '',
            fecha: obtenerFechaHoraActual(),
            justificacion: ''
        });
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Registrar Merma</h3>
                            <span className="small opacity-75">Registro de pérdidas, daños o bajas de inventario</span>
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
                                <label className="form-label fw-semibold text-muted small">Seleccionar Artículo</label>
                                <select
                                    name="id_articulo"
                                    required
                                    value={formData.id_articulo}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione un artículo...</option>
                                    {articulos.map((art) => (
                                        <option key={art.id_articulo} value={art.id_articulo}>
                                            {art.nombre} (ID: {art.id_articulo} — Stock: {art.stock_actual})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">
                                    Cantidad Afectada{' '}
                                    {articuloSeleccionado && (
                                        <span className="text-primary">
                                            (Máx: {articuloSeleccionado.stock_actual} {articuloSeleccionado.unidad_de_medida})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    min="1"
                                    max={articuloSeleccionado ? articuloSeleccionado.stock_actual : undefined}
                                    required
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: 2"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Motivo de la Merma</label>
                                <select
                                    name="motivo"
                                    required
                                    value={formData.motivo}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    {motivosPredefinidos.map((mot) => (
                                        <option key={mot} value={mot}>
                                            {mot}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Fecha y Hora de Registro</label>
                                <input
                                    type="datetime-local"
                                    name="fecha"
                                    required
                                    value={formData.fecha}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                />
                            </div>

                            {formData.motivo === 'Otro' && (
                                <div className="col-12">
                                    <label className="form-label fw-semibold text-muted small">
                                        Especificar Motivo ({formData.motivo_otro.length}/100)
                                    </label>
                                    <input
                                        type="text"
                                        name="motivo_otro"
                                        maxLength={100}
                                        required
                                        value={formData.motivo_otro}
                                        onChange={handleChange}
                                        className="form-control form-control-lg shadow-sm border-light bg-light"
                                        placeholder="Describa brevemente el motivo..."
                                    />
                                </div>
                            )}

                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">
                                    Justificación ({formData.justificacion.length}/500)
                                </label>
                                <textarea
                                    name="justificacion"
                                    maxLength={500}
                                    required
                                    rows="3"
                                    value={formData.justificacion}
                                    onChange={handleChange}
                                    className="form-control shadow-sm border-light bg-light"
                                    placeholder="Detalle el estado del artículo dañado y la justificación de la baja..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-5">
                            <button
                                type="submit"
                                className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                Guardar Merma
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}