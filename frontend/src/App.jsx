import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Receipts from './pages/Receipts';
import ReceiptForm from './pages/ReceiptForm';
import Deliveries from './pages/Deliveries';
import DeliveryForm from './pages/DeliveryForm';
import Transfers from './pages/Transfers';
import TransferForm from './pages/TransferForm';
import Adjustments from './pages/Adjustments';
import MoveHistory from './pages/MoveHistory';
import Warehouses from './pages/Warehouses';
import Profile from './pages/Profile';
import Categories from './pages/Categories';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-emerald-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-emerald-500" /></div>;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
      <Route path="/verify-otp" element={<PublicOnly><VerifyOtp /></PublicOnly>} />
      <Route path="/reset-password" element={<PublicOnly><ResetPassword /></PublicOnly>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="receipts/new" element={<ReceiptForm />} />
        <Route path="receipts/:id" element={<ReceiptForm />} />
        <Route path="deliveries" element={<Deliveries />} />
        <Route path="deliveries/new" element={<DeliveryForm />} />
        <Route path="deliveries/:id" element={<DeliveryForm />} />
        <Route path="transfers" element={<Transfers />} />
        <Route path="transfers/new" element={<TransferForm />} />
        <Route path="adjustments" element={<Adjustments />} />
        <Route path="move-history" element={<MoveHistory />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="categories" element={<Categories />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
