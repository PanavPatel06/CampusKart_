import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrintOrder from './pages/PrintOrder';
import AddProduct from './pages/AddProduct';
import ProductList from './pages/ProductList';
import Cart from './pages/Cart';
import DeliveryDashboard from './pages/DeliveryDashboard';

import { CartProvider } from './context/CartContext';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <CartProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/print-order" element={<PrintOrder />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/delivery" element={<DeliveryDashboard />} />
          </Route>
        </Routes>
      </CartProvider>
    </div>
  );
}

export default App;
