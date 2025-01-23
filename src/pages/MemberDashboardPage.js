// pages/MemberDashboardPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useMemberDashboard from '../hooks/useMemberDashboard';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Correct path to your firebaseConfig file

import ActivitiesTableModal from '../components/ActivitiesTableModal';

// مكون البطاقة الإحصائية
const StatCard = ({ title, value, icon, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </div>
);

// مكون النافذة المنبثقة للإشعار
const NotificationModal = ({ notification, onConfirm, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content notification-modal">
      <div className="modal-header">
        <h2>{notification.title}</h2>
        <span className={`notification-type ${notification.type}`}>
          {notification.type}
        </span>
      </div>
      <div className="modal-body">
        <p>{notification.content}</p>
        <div className="notification-info">
          <span>بواسطة: {notification.createdBy}</span>
          <span>التاريخ: {notification.createdAt.toLocaleString()}</span>
        </div>
      </div>
      <div className="modal-footer">
        <button 
          className="primary-button" 
          onClick={onConfirm}
          disabled={notification.isRead}
        >
          {notification.isRead ? 'تم القراءة' : 'تأكيد القراءة'}
        </button>
        <button className="secondary-button" onClick={onClose}>
          إغلاق
        </button>
      </div>
    </div>
  </div>
);

function MemberDashboardPage() {
  const { currentUser } = useAuth();
  const {
    memberData,
    activities,
    rewards,
    notifications,
    stats,
    loading,
    markNotificationAsRead,
    fetchAllActivities,

    refreshData
  } = useMemberDashboard(currentUser);

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false); 
  const [referralLinks, setReferralLinks] = useState([]);
  const handleOpenModal = async () => {
    try {
      console.log('Fetching activities...');
      await fetchAllActivities(); // Fetch activities
      console.log('Activities fetched:', activities);
  
      // Fetch referral links
      console.log('Fetching referral links...');
      const referralLinksRef = collection(db, 'referralLinks');
      const q = query(referralLinksRef, where('memberId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
  
      const links = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      console.log('Referral Links fetched:', links); // Debug fetched referral links
      setReferralLinks(links);
  
      // Open modal
      console.log('Opening modal...');
      setShowActivitiesModal(true);
    } catch (error) {
      console.error('Error fetching data for modal:', error);
    }
  };
  
  
  if (loading) {
    return (
      <div className="loading-container">
        جاري تحميل البيانات...
      </div>
    );
  }

  const handleReadNotification = async () => {
    if (!selectedNotification || selectedNotification.isRead) return;

    try {
      await markNotificationAsRead(selectedNotification.id);
      await refreshData();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>مرحباً، {memberData?.name}</h1>
        <div className="member-info">
          <span className="member-level">
            المستوى: {memberData?.membershipLevel}
          </span>
          <Link to="/profile" className="view-profile-link">
            عرض الملف الشخصي
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="النقاط"
          value={memberData?.points || 0}
          icon="🏆"
          color="primary"
        />
        <StatCard
          title="الأنشطة"
          value={stats.activitiesCount}
          icon="📋"
          color="success"
        />
        <StatCard
          title="المكافآت"
          value={stats.rewardsCount}
          icon="🎁"
          color="warning"
        />
        <StatCard
          title="إشعارات جديدة"
          value={stats.unreadNotifications}
          icon="🔔"
          color="danger"
        />
      </div>

      <div className="dashboard-sections">
        {/* قسم الأنشطة */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>آخر الأنشطة</h2>
            <button className="view-all-button" onClick={handleOpenModal}>
  عرض الكل
</button>

          </div>
          <div className="activities-list">
            {activities.length > 0 ? (
              activities.map(activity => (
                <div key={activity.id} className="activity-card">
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                  <div className="activity-info">
                    <span>النقاط: {activity.points}</span>
                    <span>التاريخ: {activity.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">لا توجد أنشطة حالية</p>
            )}
          </div>
        </section>

        {/* قسم المكافآت */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>المكافآت</h2>
            <Link to="/rewards" className="view-all-link">
              عرض الكل
            </Link>
          </div>
          <div className="rewards-list">
            {rewards.length > 0 ? (
              rewards.map(reward => (
                <div key={reward.id} className="reward-card">
                  <h3>{reward.title}</h3>
                  <p>النقاط المطلوبة: {reward.requiredPoints}</p>
                  <div className="reward-status">
                    <span className={`status ${reward.status}`}>
                      {reward.status === 'available' ? 'متاح' : 'تم الاستبدال'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">لا توجد مكافآت متاحة</p>
            )}
          </div>
        </section>

        {/* قسم الإشعارات */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>آخر الإشعارات</h2>
            <Link to="/notifications" className="view-all-link">
              عرض الكل
            </Link>
          </div>
          <div className="notifications-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => setSelectedNotification(notification)}
                >
                  <div className="notification-header">
                    <h3>{notification.title}</h3>
                    <span className={`notification-type ${notification.type}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p>{notification.content}</p>
                  <div className="notification-footer">
                    <span>{notification.createdAt.toLocaleString()}</span>
                    {!notification.isRead && (
                      <span className="unread-badge">جديد</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">لا توجد إشعارات</p>
            )}
          </div>
        </section>
      </div>

      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onConfirm={handleReadNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}

{showActivitiesModal && (
  <ActivitiesTableModal
    activities={activities}
    referralLinks={referralLinks}
    userId={currentUser.uid}
    onClose={() => setShowActivitiesModal(false)}
  />
)}

    </div>
  );
}

export default MemberDashboardPage;

