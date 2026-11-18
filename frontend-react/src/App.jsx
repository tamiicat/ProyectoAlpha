import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Importamos todas las vistas del sistema
import Login from './Login';
import Admin from './Admin';
import Bodeguero from './Bodeguero';
import Tecnico from './Tecnico';
import Finanzas from './Finanzas';
import Supervisor from './Supervisor';
import GestionUsuarios from './GestionUsuarios';
import Inventario from './Inventario';
import Cardex from './Cardex';
import CrearCuenta from './CrearCuenta';
import GestionarInventario from './GestionarInventario';
import Recepcion from './Recepcion';
import Despacho from './Despacho';
import RegistrarMerma from './RegistrarMerma';
import SolicitarArticulo from './SolicitarArticulo';
import Diagnostico from './Diagnostico';
import ReporteFinanciero from './ReporteFinanciero';
import GestionFacturas from './GestionFacturas';
import GestionProveedores from './GestionProveedores';
import Escaner from './Escaner';
import VerMermas from './VerMermas';
import GestionObras from './GestionObras';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/bodeguero" element={<Bodeguero />} />
        <Route path="/tecnico" element={<Tecnico />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/supervisor" element={<Supervisor />} />
        <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/cardex" element={<Cardex />} />
        <Route path="/crear-cuenta" element={<CrearCuenta />} />
        <Route path="/gestionar-inventario" element={<GestionarInventario />} />
        <Route path="/recepcion" element={<Recepcion />} />
        <Route path="/despacho" element={<Despacho />} />
        <Route path="/registrar-merma" element={<RegistrarMerma />} />
        <Route path="/solicitar-articulo" element={<SolicitarArticulo />} />
        <Route path="/diagnostico" element={<Diagnostico />} />
        <Route path="/reporte-financiero" element={<ReporteFinanciero />} />
        <Route path="/gestion-facturas" element={<GestionFacturas />} />
        <Route path="/gestion-proveedores" element={<GestionProveedores />} />
        <Route path="/escaner" element={<Escaner />} />
        <Route path="/ver-mermas" element={<VerMermas />} />
        <Route path="/gestion-obras" element={<GestionObras />} />
      </Routes>
    </BrowserRouter>
  );
}