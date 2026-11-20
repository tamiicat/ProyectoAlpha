import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Inventario() {
    const navigate = useNavigate();

    // Datos de ejemplo (luego vendrán de la API de Django: GET /articulos)
    const [articulos, setArticulos] = useState([
        {
            id_articulo: 500,
            id_categoria: 1,
            categoria_nombre: 'Climatización',
            id_ubicacion: 1,
            ubicacion_nombre: 'Bodega Central - Pasillo A',
            codigo_de_barras: '12034298034821',
            nombre: 'Aire Acondicionado',
            stock_actual: 45,
            stock_critico: 10,
            unidad_de_medida: 'Unidad',
            precio: 350000,
            fecha_ingreso: '2026-11-17 10:30',
            estado: 'en bodega',
            activo: true
        },
        {
            id_articulo: 501,
            id_categoria: 3,
            categoria_nombre: 'Repuestos y Componentes',
            id_ubicacion: 2,
            ubicacion_nombre: 'Bodega Central - Pasillo B',
            codigo_de_barras: '7801234567890',
            nombre: 'Válvula de Presión 3/4',
            stock_actual: 0,
            stock_critico: 5,
            unidad_de_medida: 'Unidad',
            precio: 24500,
            fecha_ingreso: '2026-11-18 15:10',
            estado: 'sin stock',
            activo: true
        }
    ]);

    // Estado para el modal de edición
    const [articuloEditando, setArticuloEditando] = useState(null);

    const formatearPrecio = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const handleAbrirEditar = (articulo) => {
        setArticuloEditando({ ...articulo });
    };

    const handleCambioEdicion = (e) => {
        const { name, value } = e.target;
        setArticuloEditando((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGuardarEdicion = (e) => {
        e.preventDefault();
        const stockNum = parseInt(articuloEditando.stock_actual, 10) || 0;
        const criticoNum = parseInt(articuloEditando.stock_critico, 10) || 0;
        const precioNum = parseFloat(articuloEditando.precio) || 0;

        const actualizado = {
            ...articuloEditando,
            stock_actual: stockNum,
            stock_critico: criticoNum,
            precio: precioNum,
            estado: stockNum > 0 ? 'en bodega' : 'sin stock'
        };

        // Aquí luego irá el PUT/PATCH a la API de Django
        setArticulos((prev) =>
            prev.map((item) =>
                item.id_articulo === actualizado.id_articulo ? actualizado : item
            )
        );
        console.log('Artículo editado (simulación local):', actualizado);
        setArticuloEditando(null);
    };

    const handleEliminar = (articulo) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas eliminar "${articulo.nombre}" (ID: ${articulo.id_articulo})?`
        );
        if (!confirmar) return;

        // En el modelo relacional se recomienda borrado lógico (activo: false) vía API
        setArticulos((prev) =>
            prev.filter((item) => item.id_articulo !== articulo.id_articulo)
        );
        console.log('Artículo desactivado/eliminado (simulación local):', {
            id_articulo: articulo.id_articulo,
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
                            <h3 className="mb-0 fw-semibold">Inventario Registrado</h3>
                            <span className="small opacity-75">Registro de artículos en inventario</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Nombre</th>
                                    <th className="py-3">Código de Barras</th>
                                    <th className="py-3">Categoría</th>
                                    <th className="py-3">Ubicación</th>
                                    <th className="py-3 text-center">Stock Actual</th>
                                    <th className="py-3 text-center">Stock Crítico</th>
                                    <th className="py-3 text-end">Precio</th>
                                    <th className="py-3 text-center">Estado</th>
                                    <th className="py-3 text-center px-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {articulos.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-4 text-muted">
                                            No hay artículos registrados en el inventario.
                                        </td>
                                    </tr>
                                ) : (
                                    articulos.map((art) => (
                                        <tr key={art.id_articulo}>
                                            <td className="px-4 fw-semibold text-muted">{art.id_articulo}</td>
                                            <td className="fw-semibold">{art.nombre}</td>
                                            <td className="text-muted small">{art.codigo_de_barras}</td>
                                            <td>{art.categoria_nombre}</td>
                                            <td className="small">{art.ubicacion_nombre}</td>
                                            <td className={`text-center fw-bold ${art.stock_actual <= art.stock_critico ? 'text-danger' : 'text-success'}`}>
                                                {art.stock_actual} <span className="fw-normal text-muted small">{art.unidad_de_medida}</span>
                                            </td>
                                            <td className="text-center text-danger">{art.stock_critico}</td>
                                            <td className="text-end fw-semibold">{formatearPrecio(art.precio)}</td>
                                            <td className="text-center">
                                                {art.estado === 'en bodega' ? (
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                                        En bodega
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                                        Sin stock
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center px-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAbrirEditar(art)}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar artículo"
                                                    >
                                                        <i className="bi bi-pencil-square"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminar(art)}
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Eliminar artículo"
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

            {/* Modal para editar artículo */}
            {articuloEditando && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            <div className="modal-header px-4 py-3" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                                <h5 className="modal-title fw-semibold">
                                    Editar Artículo #{articuloEditando.id_articulo}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setArticuloEditando(null)}
                                ></button>
                            </div>
                            <form onSubmit={handleGuardarEdicion}>
                                <div className="modal-body p-4">
                                    <div className="row g-3">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Nombre</label>
                                            <input
                                                type="text"
                                                name="nombre"
                                                maxLength={200}
                                                required
                                                value={articuloEditando.nombre}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label fw-semibold text-muted small">Código de Barras</label>
                                            <input
                                                type="text"
                                                name="codigo_de_barras"
                                                maxLength={20}
                                                required
                                                value={articuloEditando.codigo_de_barras}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Stock Actual</label>
                                            <input
                                                type="number"
                                                name="stock_actual"
                                                min="0"
                                                required
                                                value={articuloEditando.stock_actual}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Stock Crítico</label>
                                            <input
                                                type="number"
                                                name="stock_critico"
                                                min="0"
                                                required
                                                value={articuloEditando.stock_critico}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <label className="form-label fw-semibold text-muted small">Unidad de Medida</label>
                                            <input
                                                type="text"
                                                name="unidad_de_medida"
                                                maxLength={25}
                                                required
                                                value={articuloEditando.unidad_de_medida}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
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
                                                value={articuloEditando.precio}
                                                onChange={handleCambioEdicion}
                                                className="form-control bg-light"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer px-4 py-3 bg-light">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary rounded-pill px-4"
                                        onClick={() => setArticuloEditando(null)}
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