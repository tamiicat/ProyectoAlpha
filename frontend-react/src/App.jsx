import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inventario from './Inventario';
import Admin from './Admin';
import Escaner from './Escaner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/escaner" element={<Escaner />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;