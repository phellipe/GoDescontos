import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import DashboardPage from './pages/DashboardPage';
import { useAuthStore } from './stores/authStore';
import { registerServiceWorker } from './services/pushService';

function App() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Register service worker for push notifications
    if ('serviceWorker' in navigator && isAuthenticated) {
      registerServiceWorker().catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </div>
  );
}

export default App;
