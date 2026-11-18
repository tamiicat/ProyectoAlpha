import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReporteFinanciero() {
    const navigate = useNavigate();

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
                    <div>
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    <div className="row g-4 mb-5">
                        <div className="col-12 col-md-4">
                            <div className="p-4 border rounded shadow-sm bg-light">
                                <span className="text-muted small fw-semibold d-block mb-1">Ingresos Totales (Mes)</span>
                                <h4 className="fw-bold text-success mb-0">$12.450.000</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="p-4 border rounded shadow-sm bg-light">
                                <span className="text-muted small fw-semibold d-block mb-1">Egresos / Compras</span>
                                <h4 className="fw-bold text-danger mb-0">$4.120.300</h4>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="p-4 border rounded shadow-sm bg-light">
                                <span className="text-muted small fw-semibold d-block mb-1">Balance Neto</span>
                                <h4 className="fw-bold text-primary mb-0">+$8.329.700</h4>
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border mb-4">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID Transacción</th>
                                    <th className="py-3">Concepto</th>
                                    <th className="py-3">Tipo</th>
                                    <th className="py-3 text-end">Monto Neto</th>
                                    <th className="py-3 text-end">IVA (19%)</th>
                                    <th className="py-3 text-end px-4">Total Bruto</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">#TR-8012</td>
                                    <td>Compra Insumos Climatización</td>
                                    <td><span className="badge bg-danger bg-opacity-10 text-danger border border-danger">Egreso</span></td>
                                    <td className="text-end">$1.975.555</td>
                                    <td className="text-end">$375.355</td>
                                    <td className="text-end px-4 fw-bold">$2.350.910</td>
                                </tr>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">#TR-8013</td>
                                    <td>Venta de Equipamiento Industrial</td>
                                    <td><span className="badge bg-success bg-opacity-10 text-success border border-success">Ingreso</span></td>
                                    <td className="text-end">$5.722.680</td>
                                    <td className="text-end">$1.087.310</td>
                                    <td className="text-end px-4 fw-bold">$6.809.990</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-end gap-3">
                        <button className="btn btn-outline-secondary px-4 fw-semibold shadow-sm"><i className="bi bi-file-earmark-excel me-2"></i>Exportar Excel</button>
                        <button className="btn px-4 fw-semibold shadow-sm text-white" style={{ backgroundColor: '#2b3d52' }}><i className="bi bi-file-earmark-pdf me-2"></i>Exportar PDF</button>
                    </div>
                </div>
            </div>
        </div>
    );
}