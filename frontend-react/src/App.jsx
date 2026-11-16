import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Admin from './Admin';
import Bodeguero from './Bodeguero';
import Tecnico from './Tecnico';
import Inventario from './Inventario';
import Escaner from './Escaner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta de autenticación principal */}
        <Route path="/" element={<Login />} />
        
        {/* Paneles de gestión por rol */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/bodeguero" element={<Bodeguero />} />
        <Route path="/tecnico" element={<Tecnico />} />
        
        {/* Módulos de operabilidad y logística */}
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/escaner" element={<Escaner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;