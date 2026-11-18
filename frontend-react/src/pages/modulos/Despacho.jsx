import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const despachosMock = [
    {
        id: '001',
        fecha: '03/10/2026',
        cliente: 'Alberto Andrés Sepúlveda Ortiz',
        articulo: 'Aire Acondicionado',
        cantidad: 1,
        precio: '$680.990',
        direccion: 'Pje. Alegría #42, Talca, Maule',
        cantidadOriginal: 12,
        fechaCompra: '03/10/2026',
        fechaEntrega: '06/10/2026',
        infoBoleta: 'Boleta N° 45892 - Pagado'
    },
    {
        id: '002',
        fecha: '12/11/2026',
        cliente: 'Agrícola Santa Rosa Ltda.',
        articulo: 'Filtro de Compresor Industrial',
        cantidad: 4,
        precio: '$420.000',
        direccion: 'Camino a Coihueco Km 8, Chillán',
        cantidadOriginal: 25,
        fechaCompra: '11/11/2026',
        fechaEntrega: '15/11/2026',
        infoBoleta: 'Factura N° 10421 - Pendiente'
    },
    {
        id: '003',
        fecha: '18/11/2026',
        cliente: 'Comercial El Roble SpA',
        articulo: 'Termostato Digital Trifásico',
        cantidad: 3,
        precio: '$195.500',
        direccion: 'Av. Libertad #850, Chillán',
        cantidadOriginal: 18,
        fechaCompra: '17/11/2026',
        fechaEntrega: '20/11/2026',
        infoBoleta: 'Boleta N° 46105 - Pagado'
    }
];

export default function Despacho() {
    const navigate = useNavigate();
    const [seleccionado, setSeleccionado] = useState(0);
    const [confirmado, setConfirmado] = useState(false);

    const despacho = despachosMock[seleccionado];

    const handleCambio = (e) => {
        setSeleccionado(Number(e.target.value));
        setConfirmado(false);
    };

    return (
        <div className="container-xl mt-5 mb-5">
            <div className="shadow-lg" style={{ borderRadius: '25px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center p-4 px-5" style={{ backgroundColor: '#2b3d52', color: 'white' }}>
                    <div className="d-flex align-items-center mb-3 mb-md-0">
                        <img src="/img/logo-fyag.png" alt="Logo FYAG" style={{ height: '60px', objectFit: 'contain' }} />
                        <h3 className="ms-4 mb-0 fw-semibold">Despacho de Compra</h3>
                    </div>
                    <div>
                        <button onClick={() => navigate(-1)} className="btn btn-outline-light rounded-pill px-4 fw-semibold">
                            Volver al menú
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="bg-white p-4 p-md-5 border-top-0">
                    
                    {/* Selector de Despacho */}
                    <div className="row mb-4 align-items-center">
                        <div className="col-12 col-md-7">
                            <label className="form-label fw-semibold text-muted small">Seleccionar Orden de Despacho</label>
                            <select
                                className="form-select shadow-sm border-light bg-light"
                                value={seleccionado}
                                onChange={handleCambio}
                            >
                                {despachosMock.map((item, index) => (
                                    <option key={item.id} value={index}>
                                        Despacho #{item.id} — {item.cliente} ({item.articulo})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {confirmado && (
                            <div className="col-12 col-md-5 mt-3 mt-md-4 text-md-end">
                                <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 fs-6">
                                    Despacho #{despacho.id} confirmado
                                </span>
                            </div>
                        )}
                    </div>

                    <hr className="mb-4 opacity-25" />

                    <div className="row g-4 align-items-center">
                        {/* Detalles del Despacho */}
                        <div className="col-12 col-md-6 border-end pe-md-4">
                            <p className="text-muted small mb-3">Fecha: {despacho.fecha}</p>
                            <p className="mb-2"><strong>Cliente:</strong> {despacho.cliente}</p>
                            <p className="mb-2"><strong>Artículo:</strong> {despacho.articulo}</p>
                            <p className="mb-2"><strong>Cantidad:</strong> {despacho.cantidad}</p>
                            <p className="mb-2"><strong>Precio:</strong> {despacho.precio}</p>
                            <p className="mb-3"><strong>Dirección de entrega:</strong> {despacho.direccion}</p>

                            <hr className="my-3 opacity-25" />

                            <p className="mb-2"><strong>Cantidad original:</strong> {despacho.cantidadOriginal}</p>
                            <p className="mb-2"><strong>Fecha de Compra:</strong> {despacho.fechaCompra}</p>
                            <p className="mb-0"><strong>Fecha de Entrega:</strong> {despacho.fechaEntrega}</p>
                        </div>

                        {/* Tarjeta de Boleta y Botón */}
                        <div className="col-12 col-md-6 ps-md-4 d-flex flex-column justify-content-between">
                            <div className="card bg-light border shadow-sm text-center p-4 mb-4" style={{ borderRadius: '15px' }}>
                                <div className="mb-2">
                                    <i className="bi bi-paperclip fs-1 text-secondary"></i>
                                </div>
                                <h5 className="fw-bold text-secondary mb-1">Boleta</h5>
                                <p className="text-muted mb-1">{despacho.articulo}</p>
                                <span className="small text-muted opacity-75">{despacho.infoBoleta}</span>
                            </div>

                            <div className="d-flex justify-content-end">
                                <button
                                    type="button"
                                    onClick={() => setConfirmado(true)}
                                    disabled={confirmado}
                                    className="btn px-4 py-3 fw-bold text-white shadow-sm"
                                    style={{ backgroundColor: confirmado ? '#198754' : '#2b3d52', borderRadius: '12px' }}
                                >
                                    {confirmado ? 'Despacho Confirmado' : 'Confirmar Despacho'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}