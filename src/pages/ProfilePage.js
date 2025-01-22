// pages/ProfilePage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useProfile from '../hooks/useProfile';

function ProfilePage() {
  const { currentUser } = useAuth();
  const { profile, referralLinks, userActivities, loading, error, updateProfile } = useProfile(currentUser);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const handleEdit = () => {
    setFormData({
      name: profile.name,
      phoneNumber: profile.phoneNumber,
      address: profile.address,
    });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };
  const shareWhatsApp = (link, projectName) => {
    const message = `👋 شارك رابط الإحالة الخاص بك:\n\nاسم المشروع: ${projectName}\nرابط الإحالة: ${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="container">
      <div className="profile-page">
        <h1>الملف الشخصي</h1>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>الاسم</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>رقم الهاتف</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>العنوان</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="primary-button">حفظ</button>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="secondary-button"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-header">
              <div className="profile-info">
                <h2>{profile.name}</h2>
                <span className="member-level">{profile.membershipLevel}</span>
              </div>
              <button onClick={handleEdit} className="edit-button">
                تعديل البيانات
              </button>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">النقاط</span>
                <span className="stat-value">{profile.points}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">كود الإحالة</span>
                <span className="stat-value">{profile.referralCode}</span>
              </div>
            </div>

            <div className="profile-section">
              <h3>معلومات الاتصال</h3>
              <div className="info-item">
                <span className="info-label">البريد الإلكتروني</span>
                <span className="info-value">{profile.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">رقم الهاتف</span>
                <span className="info-value">{profile.phoneNumber || 'غير محدد'}</span>
              </div>
              <div className="info-item">
                <span className="info-label"> :العنوان </span>
                <span className="info-value">{profile.district || 'غير محدد' },{profile.city || 'غير محدد'}</span>
              </div>
            </div>
           

            <div className="profile-section">
              <h3>رابط الإحالة الخاص بالمشروع</h3>
              {referralLinks.length > 0 ? (
                referralLinks.map((link) => (
                  <div key={link.id} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>
                      <strong>اسم المشروع:</strong> {link.projectName || 'غير متوفر'}
                    </span>
                    <span>
                      <strong>رابط الإحالة:</strong>{' '}
                      <a href={link.referralLink} target="_blank" rel="noopener noreferrer">
                        {link.referralLink}
                      </a>
                    </span>
                    <button
                      onClick={() => shareWhatsApp(link.referralLink, link.projectName)}
                      style={{
                        backgroundColor: '#25D366',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      شير واتساب
                    </button>
                  </div>
                ))
              ) : (
                <p>لا توجد روابط إحالة.</p>
              )}
            </div>

            <div className="profile-section">
  <h3>أنشطتي</h3>
  {userActivities.length > 0 ? (
    <table className="activities-table">
      <thead>
        <tr>
          <th>اسم النشاط</th>
          <th>اسم المشروع</th>
          <th>عدد النقاط</th>
          <th>رابط الإحالة</th>
          <th>عدد المستخدمين الذين استخدموا رابط الإحالة	</th>
          <th> عدد النقاط المكتسبة	</th>
          <th>عدد المشاركين</th>
          <th>عرض التفاصيل</th>
          <th>مشاركة عبر فيسبوك</th>
          <th>مشاركة عبر واتساب</th>
        </tr>
      </thead>
      <tbody>
        {userActivities.map((activity) => (
          <tr key={activity.id}>
            <td>{activity.name || 'غير متوفر'}</td>
            <td>{activity.projectName || 'غير متوفر'}</td>
            <td>{activity.points || 0}</td>
            <td>
  {activity.referralLink ? (
    <a href={activity.referralLink} target="_blank" rel="noopener noreferrer">
      رابط
    </a>
  ) : (
    'غير متوفر'
  )}
</td>            <td></td>
            <td></td>
            <td>{activity.participantsCount || 0}</td>
            <td>
              <button
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => alert(`عرض التفاصيل لنشاط: ${activity.name}`)}
              >
                عرض التفاصيل
              </button>
            </td>
            <td>
              <button
                style={{
                  backgroundColor: '#3b5998',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(activity.projectName)}`;
                  window.open(facebookUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                فيسبوك
              </button>
            </td>
            <td>
              <button
                style={{
                  backgroundColor: '#25D366',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  const message = `👋 شارك نشاطك:\n\nاسم النشاط: ${activity.name}\nاسم المشروع: ${activity.projectName}\nعدد النقاط: ${activity.points}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                واتساب
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>لا توجد أنشطة.</p>
  )}
</div>
</div>




        )}
      </div>
    </div>
  );

}
  



export default ProfilePage;