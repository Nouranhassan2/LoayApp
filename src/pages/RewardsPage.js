// pages/RewardsPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useRewardsManagement from '../hooks/useRewardsManagement';

// مكون تأكيد الاستبدال
const RedeemConfirmModal = ({ reward, onConfirm, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>تأكيد استبدال النقاط</h2>
      <div className="modal-body">
        <p>هل أنت متأكد من استبدال نقاطك بـ:</p>
        <div className="reward-details">
          <h3>{reward.name}</h3>
          <p>{reward.description}</p>
          <p className="points-required">النقاط المطلوبة: {reward.points}</p>
        </div>
      </div>
      <div className="modal-footer">
        <button onClick={onConfirm} className="primary-button">تأكيد الاستبدال</button>
        <button onClick={onClose} className="secondary-button">إلغاء</button>
      </div>
    </div>
  </div>
);

function RewardsPage() {
  const { currentUser } = useAuth();
  const {
    availableRewards,
    userRewards,
    userPoints,
    loading,
    redeemReward
  } = useRewardsManagement(currentUser);

  const [selectedReward, setSelectedReward] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  const handleRedeem = async () => {
    try {
      await redeemReward(selectedReward.id);
      alert('تم استبدال النقاط بنجاح!');
      setSelectedReward(null);
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>جاري تحميل المكافآت...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="rewards-page">
        <div className="page-header">
          <h1>استبدال النقاط</h1>
          <div className="points-balance">
            <span>رصيد النقاط:</span>
            <strong>{userPoints}</strong>
          </div>
        </div>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            المكافآت المتاحة
          </button>
          <button
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            سجل الاستبدال
          </button>
        </div>

        {activeTab === 'available' ? (
          <div className="rewards-grid">
            {availableRewards.map(reward => (
              <div 
                key={reward.id} 
                className={`reward-card ${userPoints < reward.points ? 'disabled' : ''}`}
              >
                <div className="reward-content">
                  <h3>{reward.name}</h3>
                  <p>{reward.description}</p>
                  <div className="points-required">
                    <span>النقاط المطلوبة:</span>
                    <strong>{reward.points}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReward(reward)}
                  className="redeem-button"
                  disabled={userPoints < reward.points}
                >
                  {userPoints < reward.points ? 'نقاط غير كافية' : 'استبدال'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rewards-history">
            {userRewards.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>المكافأة</th>
                    <th>النقاط</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {userRewards.map(reward => (
                    <tr key={reward.id}>
                      <td>{reward.rewardName}</td>
                      <td>{reward.points}</td>
                      <td>{reward.redeemedAt.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${reward.status}`}>
                          {reward.status === 'pending' ? 'قيد المعالجة' : 
                           reward.status === 'completed' ? 'مكتمل' : 'مرفوض'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                لا يوجد سجل استبدال سابق
              </div>
            )}
          </div>
        )}
      </div>

      {selectedReward && (
        <RedeemConfirmModal
          reward={selectedReward}
          onConfirm={handleRedeem}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </div>
  );
}

export default RewardsPage;