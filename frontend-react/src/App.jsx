import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inventario from './Inventario';
import Admin from './Admin';
import Escaner from './Escaner';
import Bodeguero from './Bodeguero';
import Tecnico from './Tecnico';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/escaner" element={<Escaner />} />
        <Route path="/bodeguero" element={<Bodeguero />} />
        <Route path="/tecnico" element={<Tecnico />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;