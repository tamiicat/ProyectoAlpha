import React from 'react';

export default function Inventario() {
    const productos = [
        { id: 1, nombre: "Filtro de Compresor Industrial", sku: "FLT-1004", stock: 8, estado: "critico" },
        { id: 2, nombre: "Válvula de Presión 3/4", sku: "VAL-2099", stock: 25, estado: "medio" },
        { id: 3, nombre: "Aceite Hidráulico (Tambor 20L)", sku: "ACE-500", stock: 120, estado: "optimo" }
    ];

    const getIndicador = (estado) => {
        if (estado === 'critico') return { borde: 'border-danger', texto: 'text-danger' };
        if (estado === 'medio') return { borde: 'border-warning', texto: 'text-warning' };
        return { borde: 'border-success', texto: 'text-success' };
    };

    return (
        <div className="min-vh-100 py-4" style={{ backgroundColor: '#f8f9fa' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="mb-4">
                            <h4 className="fw-bold mb-1" style={{ color: '#2b3d52' }}>Inventario en Terreno</h4>
                            <p className="text-muted small">Vista móvil con semáforos de stock crítico.</p>
                        </div>

                        {productos.map(producto => {
                            const indicador = getIndicador(producto.estado);
                            return (
                                <div key={producto.id} className={`card shadow-sm mb-3 border-0 border-start border-5 ${indicador.borde}`} style={{ borderRadius: '12px' }}>
                                    <div className="card-body p-3">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                            <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '70%' }}>{producto.nombre}</h6>
                                            <span className={`badge bg-light ${indicador.texto} border ${indicador.borde}`}>
                                                Stock: {producto.stock}
                                            </span>
                                        </div>
                                        <div className="text-muted small mb-3">SKU: {producto.sku}</div>
                                        <button className="btn btn-outline-secondary w-100 fw-bold" style={{ minHeight: '48px', borderRadius: '8px' }}>
                                            Actualizar Stock
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}