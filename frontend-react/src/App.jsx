import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/auth/Login';
import Admin from './pages/paneles/Admin';
import Bodeguero from './pages/paneles/Bodeguero';
import Tecnico from './pages/paneles/Tecnico';
import Finanzas from './pages/paneles/Finanzas';
import Supervisor from './pages/paneles/Supervisor';
import GestionUsuarios from './pages/modulos/GestionUsuarios';
import Inventario from './pages/modulos/Inventario';
import Cardex from './pages/modulos/Cardex';
import CrearCuenta from './pages/modulos/CrearCuenta';
import GestionarInventario from './pages/modulos/GestionarInventario';
import Recepcion from './pages/modulos/Recepcion';
import Despacho from './pages/modulos/Despacho';
import RegistrarMerma from './pages/modulos/RegistrarMerma';
import SolicitarArticulo from './pages/modulos/SolicitarArticulo';
import Diagnostico from './pages/modulos/Diagnostico';
import ReporteFinanciero from './pages/modulos/ReporteFinanciero';
import GestionFacturas from './pages/modulos/GestionFacturas';
import GestionProveedores from './pages/modulos/GestionProveedores';
import Escaner from './pages/modulos/Escaner';
import VerMermas from './pages/modulos/VerMermas';
import GestionObras from './pages/modulos/GestionObras';
import ModuloCompras from './pages/modulos/ModuloCompras';
import GestionClientes from './pages/modulos/GestionClientes';
import Autorizaciones from './pages/modulos/Autorizaciones';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Login */}
        <Route path="/" element={<Login />} />

        {/* Paneles por rol */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/bodeguero" element={<Bodeguero />} />
        <Route path="/tecnico" element={<Tecnico />} />
        <Route path="/finanzas" element={<Finanzas />} />
        <Route path="/supervisor" element={<Supervisor />} />

        {/* Módulos del sistema */}
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
        <Route path="/modulo-compras" element={<ModuloCompras />} />
        <Route path="/gestion-clientes" element={<GestionClientes />} />
        <Route path="/autorizaciones" element={<Autorizaciones />} />

        {/* Ruta comodín: redirige al Login si la URL no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}