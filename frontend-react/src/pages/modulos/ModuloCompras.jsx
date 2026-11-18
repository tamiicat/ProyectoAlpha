import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ordenesIniciales = [
    {
        id: 'OC-301',
        proveedor: 'ClimaSur Distribuidora Ltda.',
        articulo: 'Aire Acondicionado Inverter 12000 BTU',
        cantidad: 10,
        total: '$4.850.000',
        fecha: '12/11/2026',
        estado: 'Recibida'
    },
    {
        id: 'OC-302',
        proveedor: 'Insumos Industriales del Sur SpA',
        articulo: 'Filtro de Compresor Industrial',
        cantidad: 25,
        total: '$1.950.000',
        fecha: '16/11/2026',
        estado: 'Aprobada'
    },
    {
        id: 'OC-303',
        proveedor: 'ElectroFrío Chile',
        articulo: 'Termostato Digital Trifásico',
        cantidad: 15,
        total: '$825.000',
        fecha: '18/11/2026',
        estado: 'Pendiente'
    }
];

export default function ModuloCompras() {
    const navigate = useNavigate();
    const [ordenes, setOrdenes] = useState(ordenesIniciales);
    const [proveedor, setProveedor] = useState('');
    const [articulo, setArticulo] = useState('');
    const [cantidad, setCantidad] = useState('');
    const [total, setTotal] = useState('');

    const handleCrearOrden = (e) => {
        e.preventDefault();
        if (!proveedor || !articulo || !cantidad || !total) return;

        const nuevaOrden = {
            id: `OC-${301 + ordenes.length}`,
            proveedor,
            articulo,
            cantidad: Number(cantidad),
            total: `$${Number(total).toLocaleString('es-CL')}`,
            fecha: new Date().toLocaleDateString('es-CL'),
            estado: 'Pendiente'
        };

        setOrdenes([nuevaOrden, ...ordenes]);
        setProveedor('');
        setArticulo('');
        setCantidad('');
        setTotal('');
    };

    const getBadgeClass = (estado) => {
        if (estado === 'Recibida') return 'bg-success bg-opacity-10 text-success border border-success';
        if (estado === 'Aprobada') return 'bg-primary bg-opacity-10 text-primary border border-primary';
        return 'bg-warning bg-opacity-10 text-warning border border-warning';
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                
                {/* Header corporativo */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <div className="ms-4">
                            <h3 className="mb-0 fw-semibold">Módulo de Compras</h3>
                            <span className="small opacity-75">Emisión y seguimiento de órdenes de compra a proveedores</span>
                        </div>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    
                    {/* Formulario Nueva Orden */}
                    <div className="card bg-light border-0 shadow-sm p-4 mb-5" style={{ borderRadius: '15px' }}>
                        <h5 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>Nueva Orden de Compra</h5>
                        <form onSubmit={handleCrearOrden}>
                            <div className="row g-3">
                                <div className="col-12 col-md-4">
                                    <label className="form-label fw-semibold text-muted small">Proveedor</label>
                                    <input
                                        type="text"
                                        className="form-control bg-white border-light shadow-sm"
                                        placeholder="Ej: ClimaSur Ltda."
                                        value={proveedor}
                                        onChange={(e) => setProveedor(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-4">
                                    <label className="form-label fw-semibold text-muted small">Artículo</label>
                                    <input
                                        type="text"
                                        className="form-control bg-white border-light shadow-sm"
                                        placeholder="Ej: Compresor 5HP"
                                        value={articulo}
                                        onChange={(e) => setArticulo(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-6 col-md-2">
                                    <label className="form-label fw-semibold text-muted small">Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control bg-white border-light shadow-sm"
                                        placeholder="Ej: 5"
                                        value={cantidad}
                                        onChange={(e) => setCantidad(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-6 col-md-2">
                                    <label className="form-label fw-semibold text-muted small">Total (CLP)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control bg-white border-light shadow-sm"
                                        placeholder="Ej: 450000"
                                        value={total}
                                        onChange={(e) => setTotal(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="d-flex justify-content-end mt-4">
                                <button type="submit" className="btn px-4 py-2 fw-bold text-white shadow-sm" style={{ backgroundColor: '#2b3d52', borderRadius: '10px' }}>
                                    Generar Orden
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Tabla de Órdenes */}
                    <h5 className="fw-bold mb-3" style={{ color: '#2b3d52' }}>Órdenes Registradas</h5>
                    <div className="table-responsive shadow-sm rounded border">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#f4f6f8', color: '#2b3d52' }}>
                                <tr>
                                    <th className="py-3 px-4">N° Orden</th>
                                    <th className="py-3">Proveedor</th>
                                    <th className="py-3">Artículo</th>
                                    <th className="py-3 text-center">Cant.</th>
                                    <th className="py-3">Total</th>
                                    <th className="py-3">Fecha</th>
                                    <th className="py-3 px-4 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.map((orden) => (
                                    <tr key={orden.id}>
                                        <td className="px-4 fw-semibold text-muted">{orden.id}</td>
                                        <td>{orden.proveedor}</td>
                                        <td>{orden.articulo}</td>
                                        <td className="text-center fw-bold">{orden.cantidad}</td>
                                        <td className="fw-semibold">{orden.total}</td>
                                        <td className="text-muted small">{orden.fecha}</td>
                                        <td className="px-4 text-center">
                                            <span className={`badge ${getBadgeClass(orden.estado)}`}>
                                                {orden.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}