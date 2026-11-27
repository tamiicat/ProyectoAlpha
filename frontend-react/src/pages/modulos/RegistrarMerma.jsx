import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://proyectoalpha.onrender.com/api/v1';

export default function RegistrarMerma() {
    const navigate = useNavigate();

    const [articulos, setArticulos] = useState([]);
    const [cargandoArticulos, setCargandoArticulos] = useState(true);
    const [guardando, setGuardando] = useState(false);

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

    const obtenerHeadersAuth = () => {
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('access_token') ||
            localStorage.getItem('jwt') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('access_token') ||
            '';
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }
        return headers;
    };

    useEffect(() => {
        let activo = true;
        const cargarArticulos = async () => {
            setCargandoArticulos(true);
            try {
                const resp = await fetch(`${API_BASE_URL}/inventario/items/`, {
                    method: 'GET',
                    headers: obtenerHeadersAuth()
                });
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}`);
                }
                const data = await resp.json();
                const lista = Array.isArray(data) ? data : (data.items || []);
                if (activo) {
                    const normalizados = lista.map((item) => ({
                        id_articulo: item.id_articulo ?? item.id,
                        nombre: item.nombre,
                        stock_actual: Number(item.stock_actual ?? item.stock ?? 0),
                        unidad_de_medida: item.unidad_de_medida || item.unidad || 'Unidad'
                    }));
                    setArticulos(normalizados);
                }
            } catch (err) {
                console.error('Error cargando artículos desde backend:', err);
                if (activo) {
                    setArticulos([]);
                }
            } finally {
                if (activo) {
                    setCargandoArticulos(false);
                }
            }
        };

        cargarArticulos();
        return () => {
            activo = false;
        };
    }, []);

    const articuloSeleccionado = articulos.find(
        (art) => Number(art.id_articulo) === Number(formData.id_articulo)
    );

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
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

        const payload = {
            id_articulo: Number(formData.id_articulo),
            articulo: articuloSeleccionado.nombre,
            fecha: formData.fecha.replace('T', ' '),
            motivo: motivoFinal,
            cantidad: cantNum,
            justificacion: formData.justificacion.trim()
        };

        setGuardando(true);
        try {
            const resp = await fetch(`${API_BASE_URL}/mermas/`, {
                method: 'POST',
                headers: obtenerHeadersAuth(),
                body: JSON.stringify(payload)
            });

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                alert(data.error || `No se pudo guardar la merma (HTTP ${resp.status}).`);
                return;
            }

            setArticulos((prev) =>
                prev.map((art) =>
                    Number(art.id_articulo) === Number(articuloSeleccionado.id_articulo)
                        ? { ...art, stock_actual: Math.max(0, art.stock_actual - cantNum) }
                        : art
                )
            );

            alert(
                `Merma registrada correctamente para "${articuloSeleccionado.nombre}" (-${cantNum} ${articuloSeleccionado.unidad_de_medida}).`
            );

            setFormData({
                id_articulo: '',
                cantidad: '',
                motivo: 'Daño por transporte',
                motivo_otro: '',
                fecha: obtenerFechaHoraActual(),
                justificacion: ''
            });
        } catch (err) {
            console.error('Error al registrar merma:', err);
            alert('Error de conexión al registrar la merma.');
        } finally {
            setGuardando(false);
        }
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
                                    disabled={cargandoArticulos}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">
                                        {cargandoArticulos ? 'Cargando artículos...' : 'Seleccione un artículo...'}
                                    </option>
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
                                disabled={guardando}
                                className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                {guardando ? 'Guardando...' : 'Guardar Merma'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}