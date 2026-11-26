import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export default function SolicitarArticulo() {
    const navigate = useNavigate();

    const [obras, setObras] = useState([]);
    const [articulos, setArticulos] = useState([]);
    const [solicitudesRecientes, setSolicitudesRecientes] = useState([]);
    const [errorCarga, setErrorCarga] = useState('');
    const [enviando, setEnviando] = useState(false);

    // Estado de la cabecera
    const [idObra, setIdObra] = useState('');
    const [comentarios, setComentarios] = useState('');

    // Estado para agregar ítems al detalle
    const [idArticuloActual, setIdArticuloActual] = useState('');
    const [cantidadActual, setCantidadActual] = useState('');
    const [detalles, setDetalles] = useState([]);

    useEffect(() => {
        apiFetch('/obras/')
            .then((data) => {
                const lista = Array.isArray(data) ? data : (data.obras || []);
                setObras(
                    lista.map((o, idx) => ({
                        id_obra: o.id_obra ?? o.id ?? idx + 1,
                        nombre: o.nombre ?? `Obra #${o.id_obra ?? o.id ?? idx + 1}`,
                        estado: o.estado ?? ''
                    }))
                );
            })
            .catch((err) => {
                console.error('Error al cargar obras en SolicitarArticulo:', err.message);
                setErrorCarga((prev) => prev || 'No se pudieron cargar las obras desde el servidor.');
            });

        apiFetch('/inventario/items/')
            .then((data) => {
                const lista = Array.isArray(data) ? data : (data.items || []);
                setArticulos(
                    lista.map((item, idx) => ({
                        id_articulo: item.id_articulo ?? item.id ?? idx + 1,
                        sku: item.sku ?? item.codigo_de_barras ?? `SKU-${idx + 1}`,
                        nombre: item.nombre ?? 'Sin nombre',
                        stock_actual: Number(item.stock_actual ?? item.stock ?? 0),
                        unidad_de_medida: item.unidad_de_medida ?? 'Unidad'
                    }))
                );
            })
            .catch((err) => {
                console.error('Error al cargar inventario en SolicitarArticulo:', err.message);
                setErrorCarga((prev) => prev || 'No se pudieron cargar los artículos desde el servidor.');
            });

        apiFetch('/solicitudes/')
            .then((data) => {
                const lista = Array.isArray(data) ? data : (data.solicitudes || []);
                setSolicitudesRecientes(lista);
            })
            .catch((err) => {
                console.error('Error al cargar historial de solicitudes:', err.message);
            });
    }, []);

    const handleAgregarArticulo = () => {
        if (!idArticuloActual) {
            alert('Seleccione un artículo.');
            return;
        }

        const cantNum = parseInt(cantidadActual, 10);
        if (!cantNum || cantNum <= 0) {
            alert('Ingrese una cantidad válida mayor a 0.');
            return;
        }

        const articuloEncontrado = articulos.find(
            (art) => String(art.id_articulo) === String(idArticuloActual)
        );
        if (!articuloEncontrado) return;

        const existe = detalles.find((item) => item.id_articulo === articuloEncontrado.id_articulo);
        if (existe) {
            setDetalles((prev) =>
                prev.map((item) =>
                    item.id_articulo === articuloEncontrado.id_articulo
                        ? { ...item, cantidad: item.cantidad + cantNum }
                        : item
                )
            );
        } else {
            setDetalles((prev) => [
                ...prev,
                {
                    id_articulo: articuloEncontrado.id_articulo,
                    sku: articuloEncontrado.sku,
                    nombre: articuloEncontrado.nombre,
                    unidad_de_medida: articuloEncontrado.unidad_de_medida,
                    cantidad: cantNum
                }
            ]);
        }

        setIdArticuloActual('');
        setCantidadActual('');
    };

    const handleQuitarArticulo = (id_articulo) => {
        setDetalles((prev) => prev.filter((item) => item.id_articulo !== id_articulo));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!idObra) {
            alert('Debe seleccionar una obra de destino.');
            return;
        }

        if (detalles.length === 0) {
            alert('Debe agregar al menos un artículo a la solicitud.');
            return;
        }

        const obraSeleccionada = obras.find((o) => String(o.id_obra) === String(idObra));
        const textoObservacion = `Obra #OB-${idObra}${obraSeleccionada ? ` (${obraSeleccionada.nombre})` : ''}${comentarios.trim() ? ` - ${comentarios.trim()}` : ''}`;

        setEnviando(true);
        try {
            const respuestas = [];
            for (const item of detalles) {
                const resp = await apiFetch('/solicitudes/', {
                    method: 'POST',
                    body: JSON.stringify({
                        sku: item.sku,
                        cantidad: item.cantidad,
                        observacion: textoObservacion
                    })
                });
                if (resp?.solicitud) respuestas.push(resp.solicitud);
            }

            if (respuestas.length > 0) {
                setSolicitudesRecientes((prev) => [...respuestas, ...prev]);
            }

            alert('Solicitud enviada correctamente al servidor.');
            setIdObra('');
            setComentarios('');
            setDetalles([]);
        } catch (err) {
            console.error('Error al enviar solicitud al backend:', err.message);
            alert(`Error al enviar la solicitud: ${err?.message || 'No se pudo comunicar con el servidor.'}`);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Solicitar Artículo</h3>
                            <span className="small opacity-75">Requerimiento de materiales e insumos para obras</span>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-warning mb-4" role="alert">
                            {errorCarga}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Cabecera de la Solicitud: Obra destino */}
                        <div className="row g-4 mb-4">
                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">Proyecto / Obra Destino</label>
                                <select
                                    required
                                    disabled={enviando}
                                    value={idObra}
                                    onChange={(e) => setIdObra(e.target.value)}
                                    className="form-select form-select-lg shadow-sm border-light bg-light text-muted"
                                >
                                    <option value="">Seleccione una obra...</option>
                                    {obras.map((obra) => (
                                        <option key={obra.id_obra} value={obra.id_obra}>
                                            #OB-{obra.id_obra} - {obra.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Sección para agregar múltiples artículos */}
                        <div className="p-4 rounded-4 bg-light border mb-4">
                            <h6 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>
                                Artículos de la Solicitud
                            </h6>
                            <div className="row g-3 align-items-end">
                                <div className="col-12 col-md-6">
                                    <label className="form-label fw-semibold text-muted small">Artículo Requerido</label>
                                    <select
                                        disabled={enviando}
                                        value={idArticuloActual}
                                        onChange={(e) => setIdArticuloActual(e.target.value)}
                                        className="form-select form-select-lg shadow-sm border-0 bg-white text-muted"
                                    >
                                        <option value="">Seleccione un artículo...</option>
                                        {articulos.map((art) => (
                                            <option key={art.id_articulo} value={art.id_articulo}>
                                                {art.nombre} — SKU: {art.sku} (Stock: {art.stock_actual} {art.unidad_de_medida})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-12 col-md-3">
                                    <label className="form-label fw-semibold text-muted small">Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        disabled={enviando}
                                        value={cantidadActual}
                                        onChange={(e) => setCantidadActual(e.target.value)}
                                        className="form-control form-control-lg shadow-sm border-0 bg-white"
                                        placeholder="Ej: 5"
                                    />
                                </div>
                                <div className="col-12 col-md-3 d-grid">
                                    <button
                                        type="button"
                                        disabled={enviando}
                                        onClick={handleAgregarArticulo}
                                        className="btn btn-lg btn-outline-primary fw-semibold shadow-sm bg-white"
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>Agregar
                                    </button>
                                </div>
                            </div>

                            {/* Lista de artículos agregados */}
                            {detalles.length > 0 && (
                                <div className="table-responsive mt-4 bg-white rounded border shadow-sm">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                            <tr>
                                                <th className="py-2 px-3">SKU</th>
                                                <th className="py-2">Artículo</th>
                                                <th className="py-2 text-center">Cantidad</th>
                                                <th className="py-2 text-center">Quitar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detalles.map((item) => (
                                                <tr key={item.id_articulo}>
                                                    <td className="px-3 text-muted fw-semibold">{item.sku}</td>
                                                    <td className="fw-semibold">{item.nombre}</td>
                                                    <td className="text-center fw-bold">
                                                        {item.cantidad} <span className="fw-normal text-muted small">{item.unidad_de_medida}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            disabled={enviando}
                                                            onClick={() => handleQuitarArticulo(item.id_articulo)}
                                                            className="btn btn-sm btn-outline-danger"
                                                            title="Quitar artículo"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Comentarios */}
                        <div className="row g-4 mb-4">
                            <div className="col-12">
                                <label className="form-label fw-semibold text-muted small">
                                    Comentarios / Justificación ({comentarios.length}/500)
                                </label>
                                <textarea
                                    maxLength={500}
                                    disabled={enviando}
                                    value={comentarios}
                                    onChange={(e) => setComentarios(e.target.value)}
                                    className="form-control shadow-sm border-light bg-light"
                                    rows="3"
                                    placeholder="Explique brevemente el motivo del requerimiento..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="d-flex justify-content-end mt-4">
                            <button
                                type="submit"
                                disabled={enviando}
                                className="btn px-5 py-3 fw-bold text-white shadow-sm"
                                style={{ backgroundColor: '#2b3d52', borderRadius: '12px' }}
                            >
                                {enviando ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                        </div>
                    </form>

                    {/* Historial rápido de solicitudes registradas en el backend */}
                    {solicitudesRecientes.length > 0 && (
                        <div className="mt-5 pt-4 border-top">
                            <h6 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>
                                Solicitudes Recientes ({solicitudesRecientes.length})
                            </h6>
                            <div className="table-responsive rounded border shadow-sm">
                                <table className="table table-sm table-hover align-middle mb-0">
                                    <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                        <tr>
                                            <th className="py-2 px-3">ID</th>
                                            <th className="py-2">SKU</th>
                                            <th className="py-2 text-center">Cantidad</th>
                                            <th className="py-2">Observación</th>
                                            <th className="py-2 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {solicitudesRecientes.map((sol, idx) => (
                                            <tr key={sol.id ?? idx}>
                                                <td className="px-3 text-muted small">#{sol.id ?? idx + 1}</td>
                                                <td className="fw-semibold small">{sol.sku}</td>
                                                <td className="text-center fw-bold">{sol.cantidad}</td>
                                                <td className="small text-muted">{sol.observacion}</td>
                                                <td className="text-center">
                                                    <span className="badge bg-warning text-dark rounded-pill">
                                                        {sol.estado ?? 'PENDIENTE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}