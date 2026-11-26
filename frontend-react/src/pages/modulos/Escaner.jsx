import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function Escaner() {
    const navigate = useNavigate();

    const [codigoInput, setCodigoInput] = useState('');
    const [articuloDetectado, setArticuloDetectado] = useState(null);
    const [noEncontrado, setNoEncontrado] = useState(false);
    const [errorConsulta, setErrorConsulta] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [confirmando, setConfirmando] = useState(false);

    // Campos para registrar el movimiento en Cardex tras la lectura
    const [tipoMovimiento, setTipoMovimiento] = useState('ingreso');
    const [cantidad, setCantidad] = useState(1);

    const normalizarArticulo = (item) => ({
        id_articulo: item.id_articulo ?? item.id ?? '-',
        codigo_de_barras: item.codigo_de_barras ?? item.sku ?? '',
        nombre: item.nombre ?? 'Sin nombre',
        categoria_nombre: item.categoria_nombre ?? item.categoria ?? 'Sin categoría',
        ubicacion_nombre: item.ubicacion_nombre ?? item.ubicacion ?? 'Sin ubicación',
        stock_actual: Number(item.stock_actual ?? item.stock ?? 0),
        stock_critico: Number(item.stock_critico ?? 0),
        unidad_de_medida: item.unidad_de_medida ?? 'Unidad',
        precio: Number(item.precio ?? item.precio_unitario ?? 0),
        estado: item.estado ?? (Number(item.stock_actual ?? item.stock ?? 0) > 0 ? 'en bodega' : 'sin stock'),
        activo: item.activo !== undefined ? Boolean(item.activo) : true
    });

    const buscarPorCodigo = async (codigo) => {
        const limpio = codigo.trim();
        setCodigoInput(limpio);
        setErrorConsulta('');

        if (!limpio) {
            setArticuloDetectado(null);
            setNoEncontrado(false);
            return;
        }

        setBuscando(true);
        try {
            const data = await apiFetch(`/inventario/items/?codigo_de_barras=${encodeURIComponent(limpio)}`);
            const lista = Array.isArray(data)
                ? data
                : (data.items || data.articulos || data.results || []);

            const encontrado = lista.find(
                (art) =>
                    String(art.codigo_de_barras ?? '').trim() === limpio ||
                    String(art.sku ?? '').trim() === limpio
            ) || lista[0];

            if (encontrado) {
                setArticuloDetectado(normalizarArticulo(encontrado));
                setNoEncontrado(false);
                setCantidad(1);
            } else {
                setArticuloDetectado(null);
                setNoEncontrado(true);
            }
        } catch (err) {
            setArticuloDetectado(null);
            setNoEncontrado(false);
            setErrorConsulta(err?.message || 'No se pudo consultar el artículo en el servidor.');
        } finally {
            setBuscando(false);
        }
    };

    const handleBuscarSubmit = (e) => {
        e.preventDefault();
        buscarPorCodigo(codigoInput);
    };

    const handleConfirmarMovimiento = async (e) => {
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

        const payloadCardex = {
            id_articulo: articuloDetectado.id_articulo,
            sku: articuloDetectado.codigo_de_barras,
            tipo: tipoMovimiento,
            cantidad: cantNum,
            stock_resultante: nuevoStock,
            costo_unitario: articuloDetectado.precio
        };

        setConfirmando(true);
        try {
            await apiFetch('/cardex/', {
                method: 'POST',
                body: JSON.stringify(payloadCardex)
            });

            setArticuloDetectado((prev) => ({
                ...prev,
                stock_actual: nuevoStock,
                estado: nuevoEstado
            }));

            alert(
                `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Salida'} confirmado en el servidor. Nuevo stock de "${articuloDetectado.nombre}": ${nuevoStock} ${articuloDetectado.unidad_de_medida}.`
            );
        } catch (err) {
            alert(`No se pudo registrar el movimiento: ${err?.message || 'Error en el servidor.'}`);
        } finally {
            setConfirmando(false);
        }
    };

    const handleRechazar = () => {
        setCodigoInput('');
        setArticuloDetectado(null);
        setNoEncontrado(false);
        setErrorConsulta('');
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
                            {/* Lector USB / entrada manual */}
                            <form onSubmit={handleBuscarSubmit} className="mb-4">
                                <label className="form-label small text-muted fw-bold">Código de Barras (máx. 20 caracteres)</label>
                                <div className="input-group shadow-sm">
                                    <input
                                        type="text"
                                        maxLength={20}
                                        disabled={buscando || confirmando}
                                        value={codigoInput}
                                        onChange={(e) => setCodigoInput(e.target.value)}
                                        className="form-control bg-light border-light"
                                        placeholder="Escanee o escriba el código de barras..."
                                    />
                                    <button
                                        type="submit"
                                        disabled={buscando || confirmando}
                                        className="btn text-white fw-semibold px-4"
                                        style={{ backgroundColor: '#2b3d52' }}
                                    >
                                        {buscando ? 'Buscando...' : 'Buscar'}
                                    </button>
                                </div>
                            </form>

                            {errorConsulta && (
                                <div className="alert alert-danger shadow-sm" role="alert">
                                    {errorConsulta}
                                </div>
                            )}

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
                                                    disabled={confirmando}
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
                                                    disabled={confirmando}
                                                    value={cantidad}
                                                    onChange={(e) => setCantidad(e.target.value)}
                                                    className="form-control bg-white shadow-sm border-light"
                                                />
                                            </div>
                                        </div>

                                        <div className="d-flex gap-3 mt-4">
                                            <button
                                                type="submit"
                                                disabled={confirmando}
                                                className="btn w-50 fw-bold text-white shadow-sm py-2"
                                                style={{ backgroundColor: '#2b3d52', borderRadius: '10px' }}
                                            >
                                                {confirmando
                                                    ? 'Registrando...'
                                                    : `Confirmar ${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Salida'}`}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={confirmando}
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