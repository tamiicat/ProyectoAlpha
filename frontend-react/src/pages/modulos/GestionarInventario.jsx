import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function GestionarInventario() {
    const navigate = useNavigate();

    // Datos de ejemplo (luego vendrán de la API de Django: GET /categorias y GET /ubicaciones)
    const categoriasMock = [
        { id_categoria: 1, nombre: 'Climatización' },
        { id_categoria: 2, nombre: 'Refrigeración Industrial' },
        { id_categoria: 3, nombre: 'Repuestos y Componentes' },
        { id_categoria: 4, nombre: 'Herramientas' }
    ];

    const ubicacionesMock = [
        { id_ubicacion: 1, bodega: 'Bodega Central', detalle: 'Pasillo A - Estante 1' },
        { id_ubicacion: 2, bodega: 'Bodega Central', detalle: 'Pasillo B - Estante 3' },
        { id_ubicacion: 3, bodega: 'Bodega Frío', detalle: 'Sector Equipos Pesados' }
    ];

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const stockNum = parseInt(formData.stock_actual, 10) || 0;

        // Payload listo para enviar a la API de Django
        const payload = {
            id_categoria: Number(formData.id_categoria),
            id_ubicacion: Number(formData.id_ubicacion),
            codigo_de_barras: formData.codigo_de_barras.trim(),
            nombre: formData.nombre.trim(),
            stock_actual: stockNum,
            stock_critico: parseInt(formData.stock_critico, 10) || 0,
            unidad_de_medida: formData.unidad_de_medida.trim(),
            precio: parseFloat(formData.precio) || 0,
            estado: stockNum > 0 ? 'en bodega' : 'sin stock',
            activo: formData.activo
        };

        console.log('Artículo listo para enviar al backend:', payload);
        alert('Artículo guardado correctamente (simulación local).');
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

                <div className="bg-white p-5 border-top-0">
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

                            {/* Campo de Código de Barras con botón de escáner al lado */}
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
                                    value={formData.id_categoria}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione una categoría...</option>
                                    {categoriasMock.map((cat) => (
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
                                    value={formData.id_ubicacion}
                                    onChange={handleChange}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione una ubicación...</option>
                                    {ubicacionesMock.map((ub) => (
                                        <option key={ub.id_ubicacion} value={ub.id_ubicacion}>
                                            {ub.bodega} - {ub.detalle}
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
                            <button type="submit" className="btn px-5 py-3 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}>
                                Guardar Artículo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}