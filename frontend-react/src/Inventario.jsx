import React from 'react';
import { Link } from 'react-router-dom';

export default function Inventario() {
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
                        <Link to="/admin" className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-4 p-md-5 border-top-0">
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
                                <input type="text" className="form-control border-start-0 ps-0" placeholder="Buscar por ID, nombre, categoría, ubicación..." />
                            </div>
                        </div>
                        <div className="col-12 col-md-3">
                            <select className="form-select shadow-sm text-muted">
                                <option>Todas las categorías</option>
                                <option>Climatización</option>
                                <option>Herramientas</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-3">
                            <select className="form-select shadow-sm text-muted">
                                <option>Ordenar por</option>
                                <option>Stock crítico</option>
                                <option>Nombre (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Nombre</th>
                                    <th className="py-3">Código de Barras</th>
                                    <th className="py-3 text-center">Stock Actual</th>
                                    <th className="py-3 text-center">Stock Crítico</th>
                                    <th className="py-3">Estado</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">500</td>
                                    <td>Aire Acondicionado</td>
                                    <td>12034298034821</td>
                                    <td className="text-center fw-bold text-success">45</td>
                                    <td className="text-center text-danger">10</td>
                                    <td><span className="badge bg-success bg-opacity-10 text-success border border-success">Disponible</span></td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-light me-2 text-primary shadow-sm"><i className="bi bi-pencil-square"></i></button>
                                        <button className="btn btn-sm btn-light text-danger shadow-sm"><i className="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}