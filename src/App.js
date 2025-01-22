// App.js

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import UserManagementPage from './pages/UserManagementPage';
import ActivityManagementPage from './pages/ActivityManagementPage';
import NavigationBar from './components/NavigationBar';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/Settings';
import NotificationsPage from './pages/NotificationsPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import ProfilePage from './pages/ProfilePage';
import RewardsPage from './pages/RewardsPage';
import MemberRegistrationPage from './pages/MemberRegistrationPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import MemberManagementPage from './pages/MemberManagementPage';
import ReferralLinksPage from './pages/ReferralLinksPage'; // <-- إضافة الاستيراد
import './App.css';

function AppContent() {
  const location = useLocation();
  const { currentUser } = useAuth();

  // قائمة المسارات التي يتم فيها إخفاء شريط التنقل
  const hideNavBarPaths = ['/', '/login', '/member-registration'];

  return (
    <div className="app">
      {/* الشريط العلوي بالصورة */}
      {!hideNavBarPaths.includes(location.pathname) && (
        <div className="top-bar">
          <img src={process.env.PUBLIC_URL + '/img/image.png'} alt="Logo" className="navbar-logo" />
        </div>
      )}
      {/* شريط التنقل */}
      {!hideNavBarPaths.includes(location.pathname) && <NavigationBar />}
      <Routes>
        {/* المسارات العامة */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/member-registration" element={<MemberRegistrationPage />} />

        {/* إعادة التوجيه بناءً على حالة تسجيل الدخول */}
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* المسارات المحمية */}
        {/* لوحة التحكم المشتركة */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'emp', 'member']}>
              {currentUser && currentUser.role && currentUser.role.toLowerCase() === 'member' ? (
                <MemberDashboardPage />
              ) : (
                <DashboardPage />
              )}
            </ProtectedRoute>
          }
        />

        {/* مسارات الأعضاء */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['member']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute allowedRoles={['member']}>
              <RewardsPage />
            </ProtectedRoute>
          }
        />

        {/* مسارات الإدارة */}
        <Route
          path="/user-management"
          element={
            <ProtectedRoute allowedRoles={['admin', 'emp']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-management"
          element={
            <ProtectedRoute allowedRoles={['admin', 'emp']}>
              <ActivityManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member-management"
          element={
            <ProtectedRoute allowedRoles={['admin', 'emp']}>
              <MemberManagementPage />
            </ProtectedRoute>
          }
        />
        {/* إضافة مسار صفحة روابط الإحالة */}
        <Route
          path="/referral-links"
          element={
            <ProtectedRoute allowedRoles={['admin', 'emp']}>
              <ReferralLinksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* مسار الإشعارات */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['admin', 'emp', 'member']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* مسار افتراضي */}
        <Route
          path="*"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
