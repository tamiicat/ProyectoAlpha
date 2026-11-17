import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Inventario() {
    const navigate = useNavigate();

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
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
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
                                    <th className="py-3 text-center">Stock Actual</th>
                                    <th className="py-3 text-center">Stock Crítico</th>
                                    <th className="py-3">Estado</th>
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
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}