import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

export default function ReporteFinanciero() {
    const [registros, setRegistros] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [seleccionados, setSeleccionados] = useState([]);

    // Paginación y cantidad visible
    const [filasPorPagina, setFilasPorPagina] = useState(10);
    const [paginaActual, setPaginaActual] = useState(1);

    const cargarRegistros = async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const data = await apiFetch('/reporte-financiero/');
            const lista = Array.isArray(data)
                ? data
                : (data.registros || data.movimientos || data.results || []);

            const normalizados = lista.map((reg, idx) => {
                const tipoCrudo = String(reg.tipo || '').toLowerCase();
                return {
                    id_registro: reg.id_registro ?? reg.id ?? idx + 1,
                    numero_documento: reg.numero_documento ?? reg.documento ?? reg.numero ?? '-',
                    fecha: reg.fecha ?? reg.created_at ?? '',
                    concepto: reg.concepto ?? reg.descripcion ?? '',
                    entidad: reg.entidad ?? reg.proveedor ?? reg.cliente ?? '',
                    tipo: tipoCrudo === 'ingreso' ? 'ingreso' : 'egreso',
                    monto_neto: Number(reg.monto_neto ?? reg.neto ?? 0),
                    iva: Number(reg.iva ?? 0),
                    monto_bruto: Number(reg.monto_bruto ?? reg.total ?? reg.monto ?? 0)
                };
            });

            setRegistros(normalizados);
            setSeleccionados([]);
        } catch (err) {
            setRegistros([]);
            setSeleccionados([]);
            setErrorCarga(err?.message || 'No se pudo cargar el reporte financiero desde el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarRegistros();
    }, []);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, filtroTipo, filasPorPagina]);

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const registrosFiltrados = registros.filter((reg) => {
        const coincideTipo = filtroTipo === '' || reg.tipo === filtroTipo;
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            reg.concepto.toLowerCase().includes(termino) ||
            reg.entidad.toLowerCase().includes(termino) ||
            reg.numero_documento.toLowerCase().includes(termino) ||
            String(reg.id_registro).includes(termino);
        return coincideTipo && coincideBusqueda;
    });

    const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / filasPorPagina));
    const paginaSegura = Math.min(paginaActual, totalPaginas);
    const indiceInicio = (paginaSegura - 1) * filasPorPagina;
    const indiceFin = Math.min(indiceInicio + filasPorPagina, registrosFiltrados.length);
    const registrosPaginados = registrosFiltrados.slice(indiceInicio, indiceFin);

    // Totales calculados dinámicamente sobre los registros filtrados
    const totalIngresos = registrosFiltrados
        .filter((r) => r.tipo === 'ingreso')
        .reduce((acc, r) => acc + r.monto_bruto, 0);

    const totalEgresos = registrosFiltrados
        .filter((r) => r.tipo === 'egreso')
        .reduce((acc, r) => acc + r.monto_bruto, 0);

    const balanceNeto = totalIngresos - totalEgresos;

    // Lógica de selección individual y masiva (sobre los registros visibles en la página actual)
    const todosSeleccionados =
        registrosPaginados.length > 0 &&
        registrosPaginados.every((r) => seleccionados.includes(r.id_registro));

    const handleToggleTodos = () => {
        if (todosSeleccionados) {
            const idsPagina = registrosPaginados.map((r) => r.id_registro);
            setSeleccionados((prev) => prev.filter((id) => !idsPagina.includes(id)));
        } else {
            const idsPagina = registrosPaginados.map((r) => r.id_registro);
            setSeleccionados((prev) => Array.from(new Set([...prev, ...idsPagina])));
        }
    };

    const handleToggleUno = (id) => {
        setSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const obtenerRegistrosSeleccionados = () => {
        return registros.filter((r) => seleccionados.includes(r.id_registro));
    };

    // Exportación real a CSV (compatible con Excel) solo con los registros marcados
    const handleExportarExcel = () => {
        const elegidos = obtenerRegistrosSeleccionados();
        if (elegidos.length === 0) return;

        const encabezados = [
            'ID Transaccion',
            'N° Documento',
            'Fecha',
            'Concepto',
            'Proveedor / Cliente',
            'Tipo',
            'Monto Neto',
            'IVA (19%)',
            'Total Bruto'
        ];

        const filas = elegidos.map((r) => [
            `#TR-${r.id_registro}`,
            r.numero_documento,
            r.fecha,
            `"${r.concepto}"`,
            `"${r.entidad}"`,
            r.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
            r.monto_neto,
            r.iva,
            r.monto_bruto
        ]);

        const contenidoCSV = [
            encabezados.join(';'),
            ...filas.map((f) => f.join(';'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `reporte_financiero_fyag_${new Date().toISOString().slice(0, 10)}.csv`;
        enlace.click();
        URL.revokeObjectURL(url);
    };

    // Exportación a PDF mediante impresión (solo imprime las filas seleccionadas)
    const handleExportarPDF = () => {
        if (seleccionados.length === 0) return;
        window.print();
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Reporte Financiero</h3>
                            <span className="small opacity-75">Balance de ingresos y egresos de inventario</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    {errorCarga && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4 d-print-none" role="alert">
                            <span>{errorCarga}</span>
                            <button type="button" onClick={cargarRegistros} className="btn btn-sm btn-outline-danger ms-3">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Tarjetas de Resumen */}
                    <div className="row g-4 mb-4">
                        <div className="col-12 col-md-4">
                            <div className="p-4 border rounded shadow-sm bg-light">
                                <span className="text-muted small fw-semibold d-block mb-1">Ingresos Totales</span>
                                <h4 className="fw-bold text-success mb-0">{formatearCLP(totalIngresos)}</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="p-4 border rounded shadow-sm bg-light">
                                <span className="text-muted small fw-semibold d-block mb-1">Egresos / Compras</span>
                                <h4 className="fw-bold text-danger mb-0">{formatearCLP(totalEgresos)}</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="p-4 border rounded shadow-sm bg-light">
                                <span className="text-muted small fw-semibold d-block mb-1">Balance Neto</span>
                                <h4 className={`fw-bold mb-0 ${balanceNeto >= 0 ? 'text-primary' : 'text-danger'}`}>
                                    {balanceNeto >= 0 ? '+' : ''}
                                    {formatearCLP(balanceNeto)}
                                </h4>
                            </div>
                        </div>
                    </div>

                    {/* Filtros (ocultos al imprimir) */}
                    <div className="row g-3 mb-3 d-print-none">
                        <div className="col-12 col-md-8">
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="form-control bg-light border-light shadow-sm"
                                placeholder="Buscar por N° documento, concepto o proveedor/cliente..."
                            />
                        </div>
                        <div className="col-12 col-md-4">
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="form-select bg-light border-light shadow-sm text-muted"
                            >
                                <option value="">Todos los movimientos</option>
                                <option value="ingreso">Solo Ingresos</option>
                                <option value="egreso">Solo Egresos / Compras</option>
                            </select>
                        </div>
                    </div>

                    {/* Selector de cantidad por página */}
                    <div className="d-flex justify-content-end align-items-center gap-2 mb-3 d-print-none">
                        <label htmlFor="selectFilasReporte" className="small text-muted fw-semibold mb-0">
                            Mostrar:
                        </label>
                        <select
                            id="selectFilasReporte"
                            value={filasPorPagina}
                            onChange={(e) => setFilasPorPagina(Number(e.target.value))}
                            className="form-select form-select-sm bg-light border-secondary-subtle fw-semibold"
                            style={{ width: 'auto', minHeight: '36px' }}
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="small text-muted">por página</span>
                    </div>

                    {/* Tabla con selección por checkbox */}
                    <div className="table-responsive shadow-sm rounded border mb-3">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 ps-4 d-print-none" style={{ width: '45px' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={todosSeleccionados}
                                            onChange={handleToggleTodos}
                                            title="Seleccionar todos en esta página"
                                        />
                                    </th>
                                    <th className="py-3">ID / Doc.</th>
                                    <th className="py-3">Fecha</th>
                                    <th className="py-3">Concepto / Entidad</th>
                                    <th className="py-3 text-center">Tipo</th>
                                    <th className="py-3 text-end">Monto Neto</th>
                                    <th className="py-3 text-end">IVA (19%)</th>
                                    <th className="py-3 text-end px-4">Total Bruto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Cargando reporte financiero desde el servidor...
                                        </td>
                                    </tr>
                                ) : registrosPaginados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            {errorCarga
                                                ? 'No hay datos disponibles por un error de conexión o autenticación.'
                                                : 'No hay registros financieros para los filtros aplicados.'}
                                        </td>
                                    </tr>
                                ) : (
                                    registrosPaginados.map((reg) => {
                                        const estaSeleccionado = seleccionados.includes(reg.id_registro);
                                        return (
                                            <tr
                                                key={reg.id_registro}
                                                onClick={() => handleToggleUno(reg.id_registro)}
                                                style={{ cursor: 'pointer' }}
                                                className={`${estaSeleccionado ? 'table-active' : 'd-print-none'}`}
                                            >
                                                <td className="ps-4 d-print-none" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        checked={estaSeleccionado}
                                                        onChange={() => handleToggleUno(reg.id_registro)}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="fw-semibold text-muted">#TR-{reg.id_registro}</div>
                                                    <div className="small text-muted">{reg.numero_documento}</div>
                                                </td>
                                                <td className="small text-muted">{reg.fecha}</td>
                                                <td>
                                                    <div className="fw-semibold">{reg.concepto}</div>
                                                    <div className="small text-muted">{reg.entidad}</div>
                                                </td>
                                                <td className="text-center">
                                                    {reg.tipo === 'ingreso' ? (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success">
                                                            Ingreso
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                                            Egreso
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end">{formatearCLP(reg.monto_neto)}</td>
                                                <td className="text-end">{formatearCLP(reg.iva)}</td>
                                                <td className="text-end px-4 fw-bold">{formatearCLP(reg.monto_bruto)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Controles de paginación */}
                    {!cargando && registrosFiltrados.length > 0 && (
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mb-4 pt-2 d-print-none">
                            <span className="small text-muted">
                                Mostrando <strong>{indiceInicio + 1}–{indiceFin}</strong> de{' '}
                                <strong>{registrosFiltrados.length}</strong> registros
                            </span>
                            <div className="d-flex align-items-center gap-2">
                                <button
                                    type="button"
                                    disabled={paginaSegura <= 1}
                                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                >
                                    <i className="bi bi-chevron-left me-1"></i> Anterior
                                </button>
                                <span className="small fw-semibold px-2" style={{ color: '#2b3d52' }}>
                                    Página {paginaSegura} de {totalPaginas}
                                </span>
                                <button
                                    type="button"
                                    disabled={paginaSegura >= totalPaginas}
                                    onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                >
                                    Siguiente <i className="bi bi-chevron-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Barra inferior de estado de selección y botones de exportación */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 pt-3 border-top d-print-none">
                        <div className="small text-muted fw-semibold">
                            {seleccionados.length === 0 ? (
                                <span>Seleccione uno o más registros de la tabla para exportar.</span>
                            ) : (
                                <span className="text-primary">
                                    {seleccionados.length} registro(s) seleccionado(s) para exportar.
                                </span>
                            )}
                        </div>
                        <div className="d-flex gap-3">
                            <button
                                type="button"
                                onClick={handleExportarExcel}
                                disabled={seleccionados.length === 0}
                                className="btn btn-outline-secondary px-4 fw-semibold shadow-sm"
                            >
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                Exportar Excel {seleccionados.length > 0 && `(${seleccionados.length})`}
                            </button>
                            <button
                                type="button"
                                onClick={handleExportarPDF}
                                disabled={seleccionados.length === 0}
                                className="btn px-4 fw-semibold shadow-sm text-white"
                                style={{ backgroundColor: '#2b3d52' }}
                            >
                                <i className="bi bi-file-earmark-pdf me-2"></i>
                                Exportar PDF {seleccionados.length > 0 && `(${seleccionados.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}