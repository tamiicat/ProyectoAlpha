import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReporteFinanciero() {
    const navigate = useNavigate();

    // Datos de ejemplo alineados a Factura (egresos/compras) y Despachos/Ventas (ingresos)
    // Luego vendrán de la API de Django: GET /reporte-financiero
    const registrosMock = [
        {
            id_registro: 8012,
            numero_documento: 'FAC-001452',
            fecha: '2026-11-12',
            concepto: 'Compra Insumos Climatización',
            entidad: 'Distribuidora Frío Sur Ltda.',
            tipo: 'egreso',
            monto_neto: 1975555,
            iva: 375355,
            monto_bruto: 2350910
        },
        {
            id_registro: 8013,
            numero_documento: 'BOL-000891',
            fecha: '2026-11-15',
            concepto: 'Venta de Equipamiento Industrial',
            entidad: 'Agroindustrial Ñuble Ltda.',
            tipo: 'ingreso',
            monto_neto: 5722680,
            iva: 1087310,
            monto_bruto: 6809990
        },
        {
            id_registro: 8014,
            numero_documento: 'FAC-001489',
            fecha: '2026-11-18',
            concepto: 'Reposición Válvulas y Repuestos',
            entidad: 'Importadora Industrial Chile S.A.',
            tipo: 'egreso',
            monto_neto: 1486882,
            iva: 282508,
            monto_bruto: 1769390
        },
        {
            id_registro: 8015,
            numero_documento: 'BOL-000904',
            fecha: '2026-11-19',
            concepto: 'Servicio Instalación Cámara de Frío',
            entidad: 'Frigorífico San Carlos S.A.',
            tipo: 'ingreso',
            monto_neto: 4739504,
            iva: 900506,
            monto_bruto: 5640010
        }
    ];

    const [filtroTipo, setFiltroTipo] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [seleccionados, setSeleccionados] = useState([]);

    const formatearCLP = (valor) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(valor);
    };

    const registrosFiltrados = registrosMock.filter((reg) => {
        const coincideTipo = filtroTipo === '' || reg.tipo === filtroTipo;
        const termino = busqueda.toLowerCase();
        const coincideBusqueda =
            reg.concepto.toLowerCase().includes(termino) ||
            reg.entidad.toLowerCase().includes(termino) ||
            reg.numero_documento.toLowerCase().includes(termino) ||
            String(reg.id_registro).includes(termino);
        return coincideTipo && coincideBusqueda;
    });

    // Totales calculados dinámicamente sobre los registros visibles
    const totalIngresos = registrosFiltrados
        .filter((r) => r.tipo === 'ingreso')
        .reduce((acc, r) => acc + r.monto_bruto, 0);

    const totalEgresos = registrosFiltrados
        .filter((r) => r.tipo === 'egreso')
        .reduce((acc, r) => acc + r.monto_bruto, 0);

    const balanceNeto = totalIngresos - totalEgresos;

    // Lógica de selección individual y masiva
    const todosSeleccionados =
        registrosFiltrados.length > 0 &&
        registrosFiltrados.every((r) => seleccionados.includes(r.id_registro));

    const handleToggleTodos = () => {
        if (todosSeleccionados) {
            setSeleccionados([]);
        } else {
            setSeleccionados(registrosFiltrados.map((r) => r.id_registro));
        }
    };

    const handleToggleUno = (id) => {
        setSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const obtenerRegistrosSeleccionados = () => {
        return registrosMock.filter((r) => seleccionados.includes(r.id_registro));
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
                    <div className="d-print-none">
                        <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
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
                    <div className="row g-3 mb-4 d-print-none">
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

                    {/* Tabla con selección por checkbox */}
                    <div className="table-responsive shadow-sm rounded border mb-4">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 ps-4 d-print-none" style={{ width: '45px' }}>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={todosSeleccionados}
                                            onChange={handleToggleTodos}
                                            title="Seleccionar todos"
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
                                {registrosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No hay registros financieros para los filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    registrosFiltrados.map((reg) => {
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

                    {/* Barra inferior de estado de selección y botones de exportación */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 d-print-none">
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