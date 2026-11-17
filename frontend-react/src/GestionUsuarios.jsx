import React from 'react';
import { Link } from 'react-router-dom';

export default function GestionUsuarios() {
    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                
                {/* Cabecera Azul Oscuro con Título y Subtítulo */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img 
                            src="/img/logo-fyag.png" 
                            alt="Logo FYAG" 
                            style={{ height: '60px', objectFit: 'contain' }} 
                        />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Administradores</h3>
                            <span className="small opacity-75">Registro de administradores</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <Link to="/admin" className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </Link>
                    </div>
                </div>

                {/* Cuerpo del Módulo */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    
                    {/* Barra de Herramientas: Búsqueda y Filtros */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control border-start-0 ps-0" 
                                    placeholder="Buscar por ID, nombre, rut, email..." 
                                />
                            </div>
                        </div>
                        <div className="col-12 col-md-3">
                            <select className="form-select shadow-sm text-muted">
                                <option>Todos los administradores</option>
                                <option>Técnicos</option>
                                <option>Bodegueros</option>
                            </select>
                        </div>
                        <div className="col-12 col-md-3">
                            <select className="form-select shadow-sm text-muted">
                                <option>Ordenar por</option>
                                <option>Nombre (A-Z)</option>
                                <option>Más recientes</option>
                            </select>
                        </div>
                    </div>

                    {/* Contenedor de la Tabla Responsiva */}
                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3">Nombres</th>
                                    <th className="py-3">Apellidos</th>
                                    <th className="py-3">RUT</th>
                                    <th className="py-3">Correo Electrónico</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Fila de ejemplo 1 */}
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">1</td>
                                    <td>Pedro Benjamín</td>
                                    <td>Aedo Lagos</td>
                                    <td>18.902.213-1</td>
                                    <td>p.aedolagos@gmail.com</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-light me-2 text-primary shadow-sm" title="Modificar">
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger shadow-sm" title="Eliminar">
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                {/* Fila de ejemplo 2 */}
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">2</td>
                                    <td>Laura Andrea</td>
                                    <td>Díaz Ferrada</td>
                                    <td>20.188.592-0</td>
                                    <td>laura.andrea@gmail.com</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-light me-2 text-primary shadow-sm" title="Modificar">
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger shadow-sm" title="Eliminar">
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                                {/* Fila de ejemplo 3 */}
                                <tr>
                                    <td className="px-4 fw-semibold text-muted">3</td>
                                    <td>Omar José</td>
                                    <td>Solar Quiroz</td>
                                    <td>9.752-053-2</td>
                                    <td>o.solar.quiroz@gmail.com</td>
                                    <td className="text-center">
                                        <button className="btn btn-sm btn-light me-2 text-primary shadow-sm" title="Modificar">
                                            <i className="bi bi-pencil-square"></i>
                                        </button>
                                        <button className="btn btn-sm btn-light text-danger shadow-sm" title="Eliminar">
                                            <i className="bi bi-trash"></i>
                                        </button>
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