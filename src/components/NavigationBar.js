// components/NavigationBar.js

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function NavigationBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!currentUser) return null;

  return (
    <nav className="navigation-bar">
      {/* رسالة الترحيب */}
      <div className="welcome-message">
        <span>مرحبًا، {currentUser.username || currentUser.name || 'مستخدم'}</span>
      </div>
      {/* روابط التنقل */}
      <div className="nav-links">
        {currentUser.role.toLowerCase() === 'member' ? (
          // قائمة الأعضاء
          <>
            <NavLink to="/member-dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              الرئيسية
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
              الملف الشخصي
            </NavLink>
            <NavLink to="/rewards" className={({ isActive }) => (isActive ? 'active' : '')}>
              المكافآت
            </NavLink>
          </>
        ) : (
          // قائمة الإدارة
          <>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
              لوحة التحكم
            </NavLink>
            {(currentUser.role.toLowerCase() === 'admin' || currentUser.role.toLowerCase() === 'emp') && (
              <>
                <NavLink to="/user-management" className={({ isActive }) => (isActive ? 'active' : '')}>
                  إدارة المستخدمين
                </NavLink>
                <NavLink to="/member-management" className={({ isActive }) => (isActive ? 'active' : '')}>
                  إدارة الأعضاء
                </NavLink>
                {/* إضافة رابط صفحة روابط الإحالة */}
                <NavLink to="/referral-links" className={({ isActive }) => (isActive ? 'active' : '')}>
                  روابط الإحالة
                </NavLink>
              </>
            )}
            {currentUser.role.toLowerCase() === 'admin' && (
              <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
                الإعدادات
              </NavLink>
            )}
            <NavLink to="/activity-management" className={({ isActive }) => (isActive ? 'active' : '')}>
              إدارة الأنشطة
            </NavLink>
       
            <NavLink to="/notifications" className={({ isActive }) => (isActive ? 'active' : '')}>
              الإشعارات
            </NavLink>
          </>
        )}
        <button onClick={handleLogout} className="logout-button">
          تسجيل الخروج
        </button>
      </div>
    </nav>
  );
}

export default NavigationBar;
