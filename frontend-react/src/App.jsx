import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Inventario from './Inventario';
import Admin from './Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/inventario" element={<Inventario />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;