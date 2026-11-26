import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function GestionarInventario() {
    const navigate = useNavigate();

    const [categorias, setCategorias] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
    const [errorCatalogos, setErrorCatalogos] = useState('');

    const [formData, setFormData] = useState({
        nombre: '',
        codigo_de_barras: '',
        id_categoria: '',
        id_ubicacion: '',
        stock_actual: '',
        stock_critico: '',
        unidad_de_medida: '',
        precio: '',
        activo: true
    });

    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarCatalogos = async () => {
            setCargandoCatalogos(true);
            setErrorCatalogos('');
            try {
                const [resCat, resUb] = await Promise.allSettled([
                    apiFetch('/categorias/'),
                    apiFetch('/ubicaciones/')
                ]);

                if (resCat.status === 'fulfilled') {
                    const rawCat = resCat.value;
                    const listaCat = Array.isArray(rawCat) ? rawCat : (rawCat.categorias || rawCat.results || []);
                    setCategorias(
                        listaCat.map((cat, idx) => ({
                            id_categoria: cat.id_categoria ?? cat.id ?? idx + 1,
                            nombre: cat.nombre ?? cat.categoria ?? `Categoría #${idx + 1}`
                        }))
                    );
                } else {
                    setCategorias([]);
                    setErrorCatalogos((prev) => prev || resCat.reason?.message || 'No se pudieron cargar las categorías desde el servidor.');
                }

                if (resUb.status === 'fulfilled') {
                    const rawUb = resUb.value;
                    const listaUb = Array.isArray(rawUb) ? rawUb : (rawUb.ubicaciones || rawUb.results || []);
                    setUbicaciones(
                        listaUb.map((ub, idx) => ({
                            id_ubicacion: ub.id_ubicacion ?? ub.id ?? idx + 1,
                            bodega: ub.bodega ?? ub.nombre ?? 'Bodega',
                            detalle: ub.detalle ?? ub.descripcion ?? ''
                        }))
                    );
                } else {
                    setUbicaciones([]);
                    setErrorCatalogos((prev) => prev || resUb.reason?.message || 'No se pudieron cargar las ubicaciones desde el servidor.');
                }
            } catch (err) {
                setCategorias([]);
                setUbicaciones([]);
                setErrorCatalogos(err?.message || 'Error al cargar catálogos desde el servidor.');
            } finally {
                setCargandoCatalogos(false);
            }
        };

        cargarCatalogos();
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
        setGuardando(true);
        setError('');

        const stockNum = parseInt(formData.stock_actual, 10) || 0;
        const codigoLimpio = formData.codigo_de_barras.trim();
        const ubicacionObj = ubicaciones.find(
            (ub) => String(ub.id_ubicacion) === String(formData.id_ubicacion)
        );
        const ubicacionTexto = ubicacionObj
            ? `${ubicacionObj.bodega}${ubicacionObj.detalle ? ` - ${ubicacionObj.detalle}` : ''}`
            : '';

        const payload = {
            sku: codigoLimpio,
            nombre: formData.nombre.trim(),
            stock: stockNum,
            ubicacion: ubicacionTexto,
            id_categoria: Number(formData.id_categoria),
            id_ubicacion: Number(formData.id_ubicacion),
            codigo_de_barras: codigoLimpio,
            stock_actual: stockNum,
            stock_critico: parseInt(formData.stock_critico, 10) || 0,
            unidad_de_medida: formData.unidad_de_medida.trim(),
            precio: parseFloat(formData.precio) || 0,
            estado: stockNum > 0 ? 'en bodega' : 'sin stock',
            activo: formData.activo
        };

        try {
            await apiFetch('/inventario/items/crear/', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert('Artículo guardado correctamente en el servidor.');
            navigate('/inventario');
        } catch (err) {
            setError(err.message || 'No se pudo guardar el artículo en el servidor.');
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
                            <h3 className="mb-0 fw-semibold">Añadir Artículo</h3>
                            <span className="small opacity-75">Registro de nuevos artículos en inventario</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {errorCatalogos && (
                        <div className="alert alert-warning rounded-3 mb-4" role="alert">
                            {errorCatalogos}
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger rounded-3 mb-4">
                            <strong>Error al guardar:</strong> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4 mb-4">
                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Nombre Artículo</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    maxLength={200}
                                    required
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: Aire Acondicionado"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Código de Barras</label>
                                <div className="input-group input-group-lg shadow-sm">
                                    <input
                                        type="text"
                                        name="codigo_de_barras"
                                        maxLength={20}
                                        required
                                        value={formData.codigo_de_barras}
                                        onChange={handleChange}
                                        className="form-control border-light bg-light"
                                        placeholder="12034298034821"
                                    />
                                    <Link to="/escaner" className="btn btn-outline-secondary px-3 d-flex align-items-center" title="Abrir Escáner">
                                        <i className="bi bi-upc-scan fs-5"></i>
                                    </Link>
                                </div>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Categoría</label>
                                <select
                                    name="id_categoria"
                                    required
                                    disabled={cargandoCatalogos || guardando}
                                    value={formData.id_categoria}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">
                                        {cargandoCatalogos ? 'Cargando categorías...' : 'Seleccione una categoría...'}
                                    </option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id_categoria} value={cat.id_categoria}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Ubicación (Bodega / Detalle)</label>
                                <select
                                    name="id_ubicacion"
                                    required
                                    disabled={cargandoCatalogos || guardando}
                                    value={formData.id_ubicacion}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">
                                        {cargandoCatalogos ? 'Cargando ubicaciones...' : 'Seleccione una ubicación...'}
                                    </option>
                                    {ubicaciones.map((ub) => (
                                        <option key={ub.id_ubicacion} value={ub.id_ubicacion}>
                                            {ub.bodega}{ub.detalle ? ` - ${ub.detalle}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Stock Actual / Inicial</label>
                                <input
                                    type="number"
                                    name="stock_actual"
                                    min="0"
                                    required
                                    value={formData.stock_actual}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: 45"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Stock Crítico</label>
                                <input
                                    type="number"
                                    name="stock_critico"
                                    min="0"
                                    required
                                    value={formData.stock_critico}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: 10"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Unidad de Medida</label>
                                <input
                                    type="text"
                                    name="unidad_de_medida"
                                    maxLength={25}
                                    required
                                    value={formData.unidad_de_medida}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: Unidad, Metros, Kg, Litros"
                                />
                            </div>

                            <div className="col-12 col-md-6">
                                <label className="form-label fw-semibold text-muted small">Precio ($)</label>
                                <input
                                    type="number"
                                    name="precio"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={formData.precio}
                                    onChange={handleChange}
                                    className="form-control form-control-lg shadow-sm border-light bg-light"
                                    placeholder="Ej: 350000"
                                />
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-5">
                            <button
                                type="submit"
                                disabled={guardando}
                                className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                {guardando ? 'Guardando...' : 'Guardar Artículo'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}