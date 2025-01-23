import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useProfile from '../hooks/useProfile';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

function ProfilePage() {
  const { currentUser } = useAuth();

  const {
    profile,
    userActivities,
    loading,
    error,
    updateProfile,
  } = useProfile(currentUser);

  // Holds the real-time "dynamic" counts for each activity (either complaints or visits)
  const [dynamicCounts, setDynamicCounts] = useState({});

  function updateCount(activityId, newCount) {
    setDynamicCounts((prev) => ({
      ...prev,
      [activityId]: newCount,
    }));
  }

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedReferralCode, setSelectedReferralCode] = useState(null);
  const [complaints, setComplaints] = useState([]);

  const handleShowComplaints = async (referralCode) => {
    if (selectedReferralCode === referralCode) {
      setSelectedReferralCode(null);
      setComplaints([]);
      return;
    }
    setSelectedReferralCode(referralCode);

    try {
      const complaintsQ = query(
        collection(db, 'complaints'),
        where('referralCode', '==', referralCode)
      );
      const snapshot = await getDocs(complaintsQ);
      const results = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setComplaints(results);
    } catch (err) {
      console.error('خطأ أثناء جلب الشكاوى:', err);
    }
  };

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const shareWhatsApp = (referralLink, projectName) => {
    const message = `👋 شارك رابط الإحالة الخاص بك:\n\nاسم المشروع: ${projectName}\nرابط الإحالة: ${referralLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // REAL-TIME LISTENERS
  useEffect(() => {
    if (!userActivities) return;

    const unsubscribes = [];

    userActivities.forEach((activity) => {
      const { id, referralCode } = activity;
      const activityName = (activity.name || '').trim(); // normalize name

      if (!referralCode) {
        updateCount(id, 0);
        return;
      }

      if (activityName === 'عدد النقرات') {
        // Listen for visitsCount in referralLinks
        const linksQ = query(
          collection(db, 'referralLinks'),
          where('referralCode', '==', referralCode),
          limit(1)
        );
        const unsub = onSnapshot(linksQ, (snap) => {
          if (!snap.empty) {
            const refLinkDoc = snap.docs[0];
            const data = refLinkDoc.data();
            updateCount(id, data.visitsCount || 0);
          } else {
            updateCount(id, 0);
          }
        });
        unsubscribes.push(unsub);

      } else if (activityName === 'الابلاغ عن مشكلة') {
        // Listen for complaint count
        const complaintsQ = query(
          collection(db, 'complaints'),
          where('referralCode', '==', referralCode)
        );
        const unsub = onSnapshot(complaintsQ, (snap) => {
          updateCount(id, snap.docs.length);
        });
        unsubscribes.push(unsub);

      } else {
        // fallback
        updateCount(id, 0);
      }
    });

    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [userActivities]);

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
              <button type="submit" className="primary-button">
                حفظ
              </button>
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
            {/* Basic Profile Info */}
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
                <span className="info-value">
                  {profile.phoneNumber || 'غير محدد'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">:العنوان </span>
                <span className="info-value">
                  {profile.district || 'غير محدد'}, {profile.city || 'غير محدد'}
                </span>
              </div>
            </div>

            {/* جدول الأنشطة */}
            <div className="profile-section">
              <h3>أنشطتي</h3>
              {userActivities && userActivities.length > 0 ? (
                <table className="activities-table">
                  <thead>
                    <tr>
                      <th>اسم النشاط</th>
                      <th>اسم المشروع</th>
                      <th>عدد النقاط</th>
                      <th>رابط الإحالة</th>
                      <th>عدد المستخدمين الذين استخدموا رابط الإحالة</th>
                      <th>عدد النقاط المكتسبة</th>
                      <th>عدد المشاركين</th>
                      <th>عرض التفاصيل</th>
                      <th>مشاركة عبر فيسبوك</th>
                      <th>مشاركة عبر واتساب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivities.map((activity) => {
                      // dynamicValue => either # of visits or # of complaints
                      const dynamicValue = dynamicCounts[activity.id] ?? 0;

                      // Our new "عدد النقاط المكتسبة" = (points) * (dynamicValue)
                      const earnedPoints = (activity.points || 0) * dynamicValue;

                      return (
                        <React.Fragment key={activity.id}>
                          <tr>
                            <td>{activity.name || 'غير متوفر'}</td>
                            <td>{activity.projectName || 'غير متوفر'}</td>
                            <td>{activity.points || 0}</td>

                            {/* Display the referralLink if present */}
                            <td>
                              {activity.referralLink ? (
                                <a
                                  href={activity.referralLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  رابط
                                </a>
                              ) : (
                                'غير متوفر'
                              )}
                            </td>

                            {/* This is the dynamic count column */}
                            <td>{dynamicValue}</td>

                            {/* NEW computed total points */}
                            <td>{earnedPoints}</td>

                            <td>{activity.participantsCount || 0}</td>

                            <td>
                              {activity.referralCode ? (
                                <button
                                  style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() =>
                                    handleShowComplaints(activity.referralCode)
                                  }
                                >
                                  عرض التفاصيل
                                </button>
                              ) : (
                                <span>—</span>
                              )}
                            </td>

                            {/* Facebook share */}
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
                                  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                                    activity.projectName
                                  )}`;
                                  window.open(
                                    facebookUrl,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                              >
                                فيسبوك
                              </button>
                            </td>

                            {/* WhatsApp share */}
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
                                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                                    message
                                  )}`;
                                  window.open(
                                    whatsappUrl,
                                    '_blank',
                                    'noopener,noreferrer'
                                  );
                                }}
                              >
                                واتساب
                              </button>
                            </td>
                          </tr>

                          {/* If this activity is selected for complaints */}
                          {selectedReferralCode === activity.referralCode && (
                            <tr>
                              <td colSpan="10" style={{ background: '#f9f9f9' }}>
                                <h4>الشكاوي الخاصة بهذا الرابط:</h4>
                                {complaints.length > 0 ? (
                                  <div
                                    style={{
                                      marginTop: '10px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '10px',
                                    }}
                                  >
                                    {complaints.map((comp) => {
                                      let complaintDate = 'غير محدد';
                                      if (comp.createdAt && comp.createdAt.seconds) {
                                        const dateObj = new Date(
                                          comp.createdAt.seconds * 1000
                                        );
                                        complaintDate =
                                          dateObj.toLocaleDateString('ar-SA') +
                                          ' - ' +
                                          dateObj.toLocaleTimeString('ar-SA');
                                      }

                                      return (
                                        <div
                                          key={comp.id}
                                          style={{
                                            border: '1px solid #ddd',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            backgroundColor: '#fff',
                                          }}
                                        >
                                          <div style={{ marginBottom: '4px' }}>
                                            <strong>تاريخ الشكوى:</strong>{' '}
                                            {complaintDate}
                                          </div>
                                          <div>
                                            <strong>نص الشكوى:</strong>{' '}
                                            {comp.message}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p>لا توجد شكاوي مسجلة لهذا الرابط.</p>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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
