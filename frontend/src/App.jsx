//
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Fruits from './pages/Fruits.jsx';
import Products from './pages/Products.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Vendors from './pages/Vendors.jsx';
import BoxSizes from './pages/BoxSizes.jsx';
import Stock from './pages/Stock.jsx';
import Orders from './pages/Orders.jsx';
import Reports from './pages/Reports.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'Administrator' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="fruits"    element={<AdminOnly><Fruits /></AdminOnly>} />
        <Route path="products"  element={<Products />} />
        <Route path="suppliers" element={<AdminOnly><Suppliers /></AdminOnly>} />
        <Route path="boxsizes"  element={<AdminOnly><BoxSizes /></AdminOnly>} />
        <Route path="vendors"   element={<Vendors />} />
        <Route path="stock"     element={<AdminOnly><Stock /></AdminOnly>} />
        <Route path="orders"    element={<Orders />} />
        <Route path="reports"   element={<AdminOnly><Reports /></AdminOnly>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
