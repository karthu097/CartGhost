import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartStoreProvider } from './store/CartStore';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import AbandonedCarts from './pages/AbandonedCarts';
import CartDetail from './pages/CartDetail';
import Customers from './pages/Customers';
import AIRecommendations from './pages/AIRecommendations';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <CartStoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/carts" element={<AbandonedCarts />} />
            <Route path="/carts/:id" element={<CartDetail />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/ai-recommendations" element={<AIRecommendations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartStoreProvider>
  );
}
