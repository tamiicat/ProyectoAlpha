import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GestionUsuarios() {
    const navigate = useNavigate();

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Administradores</h3>
                            <span className="small opacity-75">Registro de administradores</span>
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
                                    <th className="py-3">Nombres</th>
                                    <th className="py-3">RUT</th>
                                    <th className="py-3">Correo Electrónico</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">1</td>
                                    <td>Pedro Benjamín Aedo Lagos</td>
                                    <td>18.902.213-1</td>
                                    <td>p.aedolagos@gmail.com</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}