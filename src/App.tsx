import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import MembersPage from './pages/members/MembersPage';
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import RecycleBinPage from './pages/recyclebin/RecycleBinPage';
import StatisticsPage from './pages/statistics/StatisticsPage';
import DailyTasksPage from './pages/tasks/DailyTasksPage';
import SettingsPage from './pages/settings/SettingsPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route component
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole?: 'admin' | 'employee' 
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/dashboard/" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { initialize, isLoading } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        <AuthLayout>
          <LoginPage />
        </AuthLayout>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard\" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="tasks" element={<DailyTasksPage />} />
        
        {/* Admin-only routes */}
        <Route path="statistics" element={
          <ProtectedRoute requiredRole="admin">
            <StatisticsPage />
          </ProtectedRoute>
        } />
        <Route path="recyclebin" element={
          <ProtectedRoute requiredRole="admin">
            <RecycleBinPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute requiredRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="employees" element={
          <ProtectedRoute requiredRole="admin">
            <EmployeesPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;