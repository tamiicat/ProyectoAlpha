import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerMermas() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Historial de Mermas</h3>
                            <span className="small opacity-75">Registro de artículos dañados o dados de baja</span>
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
                                    <th className="py-3">Artículo</th>
                                    <th className="py-3 text-center">Cantidad</th>
                                    <th className="py-3">Motivo</th>
                                    <th className="py-3">Fecha</th>
                                    <th className="py-3 px-4">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">#M-101</td>
                                    <td>Aire Acondicionado</td>
                                    <td className="text-center fw-bold text-danger">2</td>
                                    <td><span className="badge bg-danger bg-opacity-10 text-danger border border-danger">Daño por transporte</span></td>
                                    <td>10/11/2026</td>
                                    <td className="px-4 text-muted small">Carcasa abollada al descargar en bodega.</td>
                                </tr>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">#M-102</td>
                                    <td>Filtro de Compresor Industrial</td>
                                    <td className="text-center fw-bold text-danger">1</td>
                                    <td><span className="badge bg-warning bg-opacity-10 text-warning border border-warning">Defecto de fábrica</span></td>
                                    <td>14/11/2026</td>
                                    <td className="px-4 text-muted small">Sello defectuoso detectado en revisión técnica.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}