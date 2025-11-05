import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import DashboardPage from './pages/DashboardPage';
import MerchantDashboardPage from './pages/merchant/MerchantDashboardPage';
import MerchantCampaignsPage from './pages/merchant/MerchantCampaignsPage';
import ValidateCouponPage from './pages/merchant/ValidateCouponPage';
import CampaignDetailPageMerchant from './pages/merchant/CampaignDetailPage';
import { useAuthStore } from './stores/authStore';
import { registerServiceWorker } from './services/pushService';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

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
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Merchant Routes */}
        <Route
          path="/merchant"
          element={
            <ProtectedRoute requiredRole="MERCHANT">
              <MerchantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant/dashboard"
          element={
            <ProtectedRoute requiredRole="MERCHANT">
              <MerchantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant/campaigns"
          element={
            <ProtectedRoute requiredRole="MERCHANT">
              <MerchantCampaignsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant/campaigns/:id"
          element={
            <ProtectedRoute requiredRole="MERCHANT">
              <CampaignDetailPageMerchant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/merchant/validate"
          element={
            <ProtectedRoute requiredRole="MERCHANT">
              <ValidateCouponPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
