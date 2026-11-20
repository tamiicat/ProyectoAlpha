import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Escaner() {
    const navigate = useNavigate();

    // Datos de ejemplo alineados a Articulo (luego vendrán de Django: GET /articulos?codigo_de_barras=...)
    const [articulos, setArticulos] = useState([
        {
            id_articulo: 500,
            codigo_de_barras: '12034298034821',
            nombre: 'Aire Acondicionado',
            categoria_nombre: 'Climatización',
            ubicacion_nombre: 'Bodega Central - Pasillo A',
            stock_actual: 45,
            stock_critico: 10,
            unidad_de_medida: 'Unidad',
            precio: 350000,
            estado: 'en bodega',
            activo: true
        },
        {
            id_articulo: 501,
            codigo_de_barras: '789456123012',
            nombre: 'Filtro de Compresor Industrial',
            categoria_nombre: 'Repuestos y Componentes',
            ubicacion_nombre: 'Bodega Central - Pasillo B',
            stock_actual: 12,
            stock_critico: 5,
            unidad_de_medida: 'Unidad',
            precio: 42000,
            estado: 'en bodega',
            activo: true
        },
        {
            id_articulo: 502,
            codigo_de_barras: '7801234567890',
            nombre: 'Válvula de Presión 3/4',
            categoria_nombre: 'Repuestos y Componentes',
            ubicacion_nombre: 'Bodega Frío - Sector Equipos',
            stock_actual: 0,
            stock_critico: 5,
            unidad_de_medida: 'Unidad',
            precio: 24500,
            estado: 'sin stock',
            activo: true
        }
    ]);

    const [codigoInput, setCodigoInput] = useState('789456123012');
    const [articuloDetectado, setArticuloDetectado] = useState(articulos[1]);
    const [noEncontrado, setNoEncontrado] = useState(false);

    // Campos para registrar el movimiento en Cardex tras la lectura
    const [tipoMovimiento, setTipoMovimiento] = useState('ingreso');
    const [cantidad, setCantidad] = useState(1);

    const buscarPorCodigo = (codigo) => {
        const limpio = codigo.trim();
        setCodigoInput(limpio);

        if (!limpio) {
            setArticuloDetectado(null);
            setNoEncontrado(false);
            return;
        }

        const encontrado = articulos.find((art) => art.codigo_de_barras === limpio);
        if (encontrado) {
            setArticuloDetectado(encontrado);
            setNoEncontrado(false);
            setCantidad(1);
        } else {
            setArticuloDetectado(null);
            setNoEncontrado(true);
        }
    };

    const handleSimularEscaneo = () => {
        // Alterna entre los artículos de prueba para simular lecturas distintas
        const indiceAleatorio = Math.floor(Math.random() * articulos.length);
        buscarPorCodigo(articulos[indiceAleatorio].codigo_de_barras);
    };

    const handleBuscarSubmit = (e) => {
        e.preventDefault();
        buscarPorCodigo(codigoInput);
    };

    const handleConfirmarMovimiento = (e) => {
        e.preventDefault();
        if (!articuloDetectado) return;

        const cantNum = parseInt(cantidad, 10);
        if (!cantNum || cantNum <= 0) {
            alert('Ingrese una cantidad válida mayor a 0.');
            return;
        }

        if (tipoMovimiento === 'salida' && cantNum > articuloDetectado.stock_actual) {
            alert('No hay suficiente stock para realizar esta salida.');
            return;
        }

        const nuevoStock =
            tipoMovimiento === 'ingreso'
                ? articuloDetectado.stock_actual + cantNum
                : articuloDetectado.stock_actual - cantNum;

        const nuevoEstado = nuevoStock > 0 ? 'en bodega' : 'sin stock';

        // Payload listo para enviar a Django (crea movimiento en Cardex y actualiza Articulo)
        const payloadCardex = {
            id_articulo: articuloDetectado.id_articulo,
            tipo: tipoMovimiento, // 'ingreso' | 'salida' (ENUM de Cardex)
            cantidad: cantNum,
            stock_resultante: nuevoStock,
            costo_unitario: articuloDetectado.precio
        };

        // Actualización visual en local
        setArticulos((prev) =>
            prev.map((art) =>
                art.id_articulo === articuloDetectado.id_articulo
                    ? { ...art, stock_actual: nuevoStock, estado: nuevoEstado }
                    : art
            )
        );
        setArticuloDetectado((prev) => ({
            ...prev,
            stock_actual: nuevoStock,
            estado: nuevoEstado
        }));

        console.log('Movimiento de escáner listo para enviar al backend:', payloadCardex);
        alert(
            `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Salida'} confirmado. Nuevo stock de "${articuloDetectado.nombre}": ${nuevoStock} ${articuloDetectado.unidad_de_medida}.`
        );
    };

    const handleRechazar = () => {
        setCodigoInput('');
        setArticuloDetectado(null);
        setNoEncontrado(false);
        setCantidad(1);
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '850px', margin: '0 auto' }}>
                {/* Header corporativo */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Escáner de Código de Barras</h3>
                            <span className="small opacity-75">Lectura de artículos y ajuste rápido en terreno</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-9">
                            {/* Simulación de Cámara del celular */}
                            <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                                <div className="bg-dark position-relative d-flex flex-column justify-content-center align-items-center" style={{ height: '210px' }}>
                                    <div className="border border-success border-2 rounded position-relative" style={{ width: '200px', height: '115px' }}>
                                        <div className="scan-line bg-success" style={{ height: '2px', width: '100%', position: 'absolute', top: '50%', boxShadow: '0 0 10px #198754' }}></div>
                                    </div>
                                    <span className="position-absolute bottom-0 mb-2 text-white opacity-50 small">Cámara Activa</span>
                                </div>
                                <div className="bg-light px-3 py-2 d-flex justify-content-between align-items-center border-top">
                                    <span className="small text-muted">Compatible con lector USB o entrada manual</span>
                                    <button
                                        type="button"
                                        onClick={handleSimularEscaneo}
                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold"
                                    >
                                        <i className="bi bi-upc-scan me-1"></i> Simular Lectura
                                    </button>
                                </div>
                            </div>

                            {/* Entrada manual / lector USB */}
                            <form onSubmit={handleBuscarSubmit} className="mb-4">
                                <label className="form-label small text-muted fw-bold">Código de Barras (máx. 20 caracteres)</label>
                                <div className="input-group shadow-sm">
                                    <input
                                        type="text"
                                        maxLength={20}
                                        value={codigoInput}
                                        onChange={(e) => setCodigoInput(e.target.value)}
                                        className="form-control bg-light border-light"
                                        placeholder="Escanee o escriba el código de barras..."
                                    />
                                    <button
                                        type="submit"
                                        className="btn text-white fw-semibold px-4"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        Buscar
                                    </button>
                                </div>
                            </form>

                            {/* Alerta si el código no existe */}
                            {noEncontrado && (
                                <div className="alert alert-warning d-flex justify-content-between align-items-center shadow-sm" role="alert">
                                    <div className="small">
                                        <strong>Código no registrado:</strong> No existe un artículo con el código <code>{codigoInput}</code>.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRechazar}
                                        className="btn btn-sm btn-outline-dark ms-2"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                            )}

                            {/* Formulario de Resultados de Lectura */}
                            {articuloDetectado && (
                                <div className="card shadow-sm border-0 bg-light p-4" style={{ borderRadius: '15px' }}>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="fw-bold text-secondary mb-0">Lectura Detectada</h5>
                                        {articuloDetectado.estado === 'en bodega' ? (
                                            <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                                En bodega
                                            </span>
                                        ) : (
                                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                                Sin stock
                                            </span>
                                        )}
                                    </div>

                                    <form onSubmit={handleConfirmarMovimiento}>
                                        <div className="row g-3 mb-3">
                                            <div className="col-12 col-md-4">
                                                <label className="form-label small text-muted fw-bold">ID Artículo</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white shadow-sm border-light"
                                                    value={`#${articuloDetectado.id_articulo}`}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-12 col-md-8">
                                                <label className="form-label small text-muted fw-bold">Producto Asignado</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white shadow-sm border-light fw-semibold"
                                                    value={articuloDetectado.nombre}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small text-muted fw-bold">Ubicación</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white shadow-sm border-light small"
                                                    value={articuloDetectado.ubicacion_nombre}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small text-muted fw-bold">Stock Actual</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-white shadow-sm border-light fw-bold"
                                                    value={`${articuloDetectado.stock_actual} ${articuloDetectado.unidad_de_medida}`}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small text-muted fw-bold">Tipo de Movimiento</label>
                                                <select
                                                    value={tipoMovimiento}
                                                    onChange={(e) => setTipoMovimiento(e.target.value)}
                                                    className="form-select bg-white shadow-sm border-light"
                                                >
                                                    <option value="ingreso">Ingreso a Bodega (+)</option>
                                                    <option value="salida">Salida de Bodega (-)</option>
                                                </select>
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label small text-muted fw-bold">Cantidad</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    required
                                                    value={cantidad}
                                                    onChange={(e) => setCantidad(e.target.value)}
                                                    className="form-control bg-white shadow-sm border-light"
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex gap-3 mt-4">
                                            <button
                                                type="submit"
                                                className="btn w-50 fw-bold text-white shadow-sm py-2"
                                                style={{ backgroundColor: '#2b3d52', borderRadius: '10px' }}
                                            >
                                                Confirmar {tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Salida'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRechazar}
                                                className="btn btn-outline-danger w-50 fw-bold shadow-sm py-2"
                                                style={{ borderRadius: '10px' }}
                                            >
                                                Rechazar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}