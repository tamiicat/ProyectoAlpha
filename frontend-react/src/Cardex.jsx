import React from 'react';
import { Link } from 'react-router-dom';

export default function Cardex() {
    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Cardex FYAG</h3>
                            <span className="small opacity-75">Registro de movimientos del inventario</span>
                        </div>
                    </div>
                    <div>
                        <Link to="/admin" className="btn btn-outline-light rounded-pill px-4 fw-semibold">Volver al menú</Link>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-8">
                            <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar por ID, nombre, categoría..." />
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <select className="form-select shadow-sm text-muted">
                                <option>Ordenar por fecha</option>
                                <option>Entradas</option>
                                <option>Salidas</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border mb-4">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID Mov.</th>
                                    <th className="py-3">Artículo</th>
                                    <th className="py-3">Código</th>
                                    <th className="py-3">Tipo</th>
                                    <th className="py-3 text-center">Cant.</th>
                                    <th className="py-3">Fecha/Hora</th>
                                    <th className="py-3">Usuario (Autor)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">#9021</td>
                                    <td>Aire Acondicionado</td>
                                    <td>12034...</td>
                                    <td><span className="badge bg-primary bg-opacity-10 text-primary border border-primary">Ingreso</span></td>
                                    <td className="text-center fw-bold">+15</td>
                                    <td>2026-11-17 14:30</td>
                                    <td>pbdiazferrada_admin</td>
                                </tr>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">#9022</td>
                                    <td>Cámara de Maduración</td>
                                    <td>29149...</td>
                                    <td><span className="badge bg-danger bg-opacity-10 text-danger border border-danger">Salida</span></td>
                                    <td className="text-center fw-bold">-2</td>
                                    <td>2026-11-17 16:15</td>
                                    <td>bodeguero_turno1</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="d-flex justify-content-end gap-3 mt-4">
                        <button className="btn btn-outline-secondary px-4 fw-semibold shadow-sm"><i className="bi bi-file-earmark-excel me-2"></i>Exportar a Excel</button>
                        <button className="btn px-4 fw-semibold shadow-sm text-white" style={{ backgroundColor: '#2b3d52' }}><i className="bi bi-file-earmark-pdf me-2"></i>Exportar a PDF</button>
                    </div>
                </div>
            </div>
        </div>
    );
}