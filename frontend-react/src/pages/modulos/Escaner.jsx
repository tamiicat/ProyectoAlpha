import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { apiFetch } from '../../services/api';

export default function Escaner() {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const scannerRef = useRef(null);
    const timerCamaraRef = useRef(null);
    const montadoRef = useRef(true);
    const operandoCamaraRef = useRef(false);

    const [codigoInput, setCodigoInput] = useState('');
    const [articuloDetectado, setArticuloDetectado] = useState(null);
    const [noEncontrado, setNoEncontrado] = useState(false);
    const [errorConsulta, setErrorConsulta] = useState('');
    const [buscando, setBuscando] = useState(false);
    const [confirmando, setConfirmando] = useState(false);

    // Cámara
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [errorCamara, setErrorCamara] = useState('');

    // Historial de lecturas de la sesión
    const [historial, setHistorial] = useState([]);

    // Campos para registrar el movimiento en Cardex tras la lectura
    const [tipoMovimiento, setTipoMovimiento] = useState('ingreso');
    const [cantidad, setCantidad] = useState(1);

    const detenerCamara = async () => {
        if (timerCamaraRef.current) {
            clearTimeout(timerCamaraRef.current);
            timerCamaraRef.current = null;
        }

        if (operandoCamaraRef.current) return;
        operandoCamaraRef.current = true;

        const instancia = scannerRef.current;
        scannerRef.current = null;

        try {
            if (instancia) {
                try {
                    if (instancia.isScanning) {
                        await instancia.stop();
                    }
                } catch {
                    // Ignorar si ya estaba detenida o no llegó a iniciar
                }
                try {
                    await instancia.clear();
                } catch {
                    // Ignorar si el nodo ya no existe en el DOM
                }
            }
        } finally {
            operandoCamaraRef.current = false;
            if (montadoRef.current) {
                setCamaraActiva(false);
            }
        }
    };

    useEffect(() => {
        montadoRef.current = true;
        return () => {
            montadoRef.current = false;
            detenerCamara();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const iniciarCamara = async () => {
        if (operandoCamaraRef.current || camaraActiva) return;
        setErrorCamara('');
        setCamaraActiva(true);

        timerCamaraRef.current = setTimeout(async () => {
            timerCamaraRef.current = null;
            if (!montadoRef.current) return;

            const contenedor = document.getElementById('lector-camara-fyag');
            if (!contenedor) {
                if (montadoRef.current) setCamaraActiva(false);
                return;
            }

            operandoCamaraRef.current = true;
            try {
                const html5QrCode = new Html5Qrcode('lector-camara-fyag');
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 260, height: 140 } },
                    async (decodedText) => {
                        const textoLimpio = String(decodedText || '').slice(0, 20);
                        operandoCamaraRef.current = false;
                        await detenerCamara();
                        if (montadoRef.current) {
                            buscarPorCodigo(textoLimpio);
                        }
                    },
                    () => {
                        // Errores por frame sin código se ignoran
                    }
                );
            } catch {
                scannerRef.current = null;
                if (montadoRef.current) {
                    setCamaraActiva(false);
                    setErrorCamara(
                        'No se pudo iniciar la cámara o se denegó el permiso. Puedes usar el lector USB o escribir el código manualmente.'
                    );
                }
            } finally {
                operandoCamaraRef.current = false;
            }
        }, 150);
    };

    const buscarPorCodigo = async (codigo) => {
        const limpio = String(codigo || '').trim();
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
            if (!montadoRef.current) return;

            const lista = Array.isArray(data)
                ? data
                : (data.items || data.articulos || data.results || []);

            const encontrado = lista.find(
                (art) =>
                    String(art.codigo_de_barras ?? '').trim().toLowerCase() === limpio.toLowerCase() ||
                    String(art.sku ?? '').trim().toLowerCase() === limpio.toLowerCase()
            );

            if (encontrado) {
                const normalizado = normalizarArticulo(encontrado);
                setArticuloDetectado(normalizado);
                setNoEncontrado(false);
                setCantidad(1);

                setHistorial((prev) => {
                    const sinDuplicado = prev.filter((h) => h.codigo !== normalizado.codigo_de_barras);
                    return [
                        {
                            codigo: normalizado.codigo_de_barras,
                            nombre: normalizado.nombre,
                            ubicacion: normalizado.ubicacion_nombre,
                            stock: normalizado.stock_actual,
                            unidad: normalizado.unidad_de_medida,
                            hora: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                        },
                        ...sinDuplicado
                    ].slice(0, 6);
                });
            } else {
                setArticuloDetectado(null);
                setNoEncontrado(true);
            }
        } catch (err) {
            if (!montadoRef.current) return;
            setArticuloDetectado(null);
            setNoEncontrado(false);
            setErrorConsulta(err?.message || 'No se pudo consultar el artículo en el servidor.');
        } finally {
            if (montadoRef.current) {
                setBuscando(false);
            }
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
            if (!montadoRef.current) return;

            setArticuloDetectado((prev) => ({
                ...prev,
                stock_actual: nuevoStock,
                estado: nuevoEstado
            }));

            setHistorial((prev) =>
                prev.map((h) =>
                    h.codigo === articuloDetectado.codigo_de_barras ? { ...h, stock: nuevoStock } : h
                )
            );

            alert(
                `${tipoMovimiento === 'ingreso' ? 'Ingreso' : 'Salida'} confirmado en el servidor. Nuevo stock de "${articuloDetectado.nombre}": ${nuevoStock} ${articuloDetectado.unidad_de_medida}.`
            );
        } catch (err) {
            if (!montadoRef.current) return;
            alert(`No se pudo registrar el movimiento: ${err?.message || 'Error en el servidor.'}`);
        } finally {
            if (montadoRef.current) {
                setConfirmando(false);
            }
        }
    };

    const handleRechazar = async () => {
        await detenerCamara();
        if (!montadoRef.current) return;
        setCodigoInput('');
        setArticuloDetectado(null);
        setNoEncontrado(false);
        setErrorConsulta('');
        setErrorCamara('');
        setCantidad(1);
        inputRef.current?.focus();
    };

    const handleVolver = async () => {
        await detenerCamara();
        navigate(-1);
    };

    return (
        <div className="container-xl mt-4 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '900px', margin: '0 auto' }}>
                {/* Header corporativo */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Escáner de Código de Barras</h3>
                            <span className="small opacity-75">Lectura con cámara, pistola USB o ingreso manual</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={handleVolver} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-10">
                            {/* Lector USB / entrada manual + Botón Cámara */}
                            <form onSubmit={handleBuscarSubmit} className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label small text-muted fw-bold mb-0">
                                        Código de Barras (máx. 20 caracteres · EAN-13, UPC, Code 128 o interno)
                                    </label>
                                </div>
                                <div className="input-group shadow-sm">
                                    <span className="input-group-text bg-light border-light text-muted">
                                        <i className="bi bi-upc-scan"></i>
                                    </span>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        autoFocus
                                        maxLength={20}
                                        disabled={buscando || confirmando}
                                        value={codigoInput}
                                        onChange={(e) => setCodigoInput(e.target.value)}
                                        className="form-control bg-light border-light"
                                        placeholder="Escanee con pistola USB o escriba el código..."
                                    />
                                    <button
                                        type="button"
                                        disabled={buscando || confirmando}
                                        onClick={camaraActiva ? detenerCamara : iniciarCamara}
                                        className={`btn fw-semibold ${camaraActiva ? 'btn-danger' : 'btn-outline-secondary'}`}
                                        title="Escanear usando la cámara"
                                    >
                                        <i className={`bi ${camaraActiva ? 'bi-camera-video-off' : 'bi-camera'} me-1`}></i>
                                        {camaraActiva ? 'Cerrar Cámara' : 'Usar Cámara'}
                                    </button>
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

                            {/* Contenedor de Cámara en vivo */}
                            {camaraActiva && (
                                <div className="card border-0 bg-dark text-white p-3 mb-4 rounded-4 text-center">
                                    <small className="mb-2 opacity-75">
                                        Apunta la cámara al código de barras o QR del producto
                                    </small>
                                    <div id="lector-camara-fyag" style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }} />
                                </div>
                            )}

                            {errorCamara && (
                                <div className="alert alert-warning small shadow-sm" role="alert">
                                    <i className="bi bi-camera-video-off me-2"></i>{errorCamara}
                                </div>
                            )}

                            {errorConsulta && (
                                <div className="alert alert-danger shadow-sm" role="alert">
                                    {errorConsulta}
                                </div>
                            )}

                            {/* Alerta si el código no existe */}
                            {noEncontrado && (
                                <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2 shadow-sm" role="alert">
                                    <div className="small">
                                        <strong>Código no registrado:</strong> No existe un artículo con el código <code>{codigoInput}</code>.
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                await detenerCamara();
                                                navigate('/gestionar-inventario');
                                            }}
                                            className="btn btn-sm text-white fw-semibold"
                                            style={{ backgroundColor: '#2b3d52' }}
                                        >
                                            <i className="bi bi-plus-circle me-1"></i>Crear artículo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRechazar}
                                            className="btn btn-sm btn-outline-dark"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Formulario de Resultados de Lectura */}
                            {articuloDetectado && (
                                <div className="card shadow-sm border-0 bg-light p-4 mb-4" style={{ borderRadius: '15px' }}>
                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                        <div>
                                            <h5 className="fw-bold text-secondary mb-0">Lectura Detectada</h5>
                                            <small className="text-muted">Código: {articuloDetectado.codigo_de_barras}</small>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            {articuloDetectado.stock_actual <= articuloDetectado.stock_critico && (
                                                <span className="badge bg-warning text-dark">Stock Crítico</span>
                                            )}
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
                                                Limpiar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Historial de lecturas de la sesión */}
                            <div className="mt-4 pt-3 border-top">
                                <h6 className="fw-bold text-secondary mb-3">
                                    <i className="bi bi-clock-history me-2"></i>Lecturas Recientes en esta Sesión
                                </h6>
                                {historial.length === 0 ? (
                                    <div className="text-center text-muted small py-3 bg-light rounded-3">
                                        Aún no has escaneado artículos. Usa la cámara, una pistola USB o escribe un código arriba.
                                    </div>
                                ) : (
                                    <div className="table-responsive rounded border">
                                        <table className="table table-sm table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="ps-3">Hora</th>
                                                    <th>Código</th>
                                                    <th>Artículo</th>
                                                    <th>Bodega</th>
                                                    <th className="text-end pe-3">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {historial.map((h) => (
                                                    <tr
                                                        key={h.codigo}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => buscarPorCodigo(h.codigo)}
                                                        title="Clic para volver a cargar"
                                                    >
                                                        <td className="ps-3 text-muted small">{h.hora}</td>
                                                        <td><code>{h.codigo}</code></td>
                                                        <td className="fw-semibold">{h.nombre}</td>
                                                        <td className="small text-muted">{h.ubicacion}</td>
                                                        <td className="text-end pe-3 fw-bold">
                                                            {h.stock} <span className="fw-normal text-muted small">{h.unidad}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}