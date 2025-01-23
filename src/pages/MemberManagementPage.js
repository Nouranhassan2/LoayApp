// pages/MemberManagementPage.js

import React from 'react';
import useManageMembers from '../hooks/useManageMembers';
import '../App.css';

function MemberManagementPage() {
  const {
    members,
    selectedMemberId,
    setSelectedMemberId,
    memberData,
    formData,
    handleInputChange,
    updateMemberData,
    activities,
    referralLinks,
    referrals,
    redeemedPoints,
    loading,
    formErrors,
    toggleMemberStatus,
    resetMemberPassword,
  } = useManageMembers();

  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar-SA');
  };

  return (
    <div className="container" dir="rtl">
      <h1 className="page-title">إدارة الأعضاء</h1>

      {/* اختيار العضو من القائمة المنسدلة */}
      <div className="form-group">
        <label>اختر العضو:</label>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="form-control"
        >
          <option value="">اختر العضو</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.email})
            </option>
          ))}
        </select>
      </div>

      {/* عرض بيانات العضو */}
      {memberData && (
        <div className="member-panel card">
          {/* بيانات العضو */}
          <h2>بيانات العضو</h2>
          <form>
            <div className="form-group">
              <label>الاسم:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-control ${formErrors.name ? 'error' : ''}`}
              />
              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label>البريد الإلكتروني:</label>
              <input type="email" value={memberData.email} disabled className="form-control" />
            </div>

            <div className="form-group">
              <label>رقم الهاتف:</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`form-control ${formErrors.phoneNumber ? 'error' : ''}`}
              />
              {formErrors.phoneNumber && (
                <span className="error-message">{formErrors.phoneNumber}</span>
              )}
            </div>

            <div className="form-group">
              <label>المدينة:</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className={`form-control ${formErrors.city ? 'error' : ''}`}
              />
              {formErrors.city && <span className="error-message">{formErrors.city}</span>}
            </div>

            <div className="form-group">
              <label>الحي:</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className={`form-control ${formErrors.district ? 'error' : ''}`}
              />
              {formErrors.district && (
                <span className="error-message">{formErrors.district}</span>
              )}
            </div>

            <div className="form-group">
              <label>تاريخ الميلاد:</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>مستوى العضوية:</label>
              <select
                name="membershipLevel"
                value={formData.membershipLevel}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="bronze">برونزي</option>
                <option value="silver">فضي</option>
                <option value="gold">ذهبي</option>
                <option value="platinum">بلاتيني</option>
              </select>
            </div>

            <div className="form-group">
              <label>النقاط الكلية:</label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                className="form-control"
                min="0"
              />
            </div>

            {/* إجراءات العضو */}
            <div className="member-actions">
              <h3>إجراءات العضو</h3>
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={updateMemberData}
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? 'جاري التحديث...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={toggleMemberStatus}
                  className="secondary-button"
                  disabled={loading}
                >
                  {loading
                    ? 'جاري التحديث...'
                    : memberData.isActive
                    ? 'تعطيل العضو'
                    : 'تفعيل العضو'}
                </button>
                <button
                  type="button"
                  onClick={resetMemberPassword}
                  className="secondary-button"
                  disabled={loading}
                >
                  {loading ? 'جاري التحديث...' : 'إعادة تعيين كلمة المرور'}
                </button>
              </div>
            </div>
          </form>

          {/* عرض روابط الإحالة */}
          <div className="referral-links-section">
            <h3>روابط الإحالة</h3>
            {referralLinks.length > 0 ? (
              <ul className="referral-links-list">
                {referralLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.referralLink} target="_blank" rel="noopener noreferrer">
                      {link.referralLink}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>لا توجد روابط إحالة.</p>
            )}
          </div>

          {/* عرض تفاصيل الإحالات */}
          <div className="referrals-section">
            <h3>تفاصيل الإحالات</h3>
            {referrals.length > 0 ? (
              <table className="referrals-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral, index) => (
                    <tr key={index}>
                      <td>{referral.name || 'غير معروف'}</td>
                      <td>{referral.email || 'غير معروف'}</td>
                      <td>
                        {referral.date
                          ? formatDate(referral.date.seconds * 1000)
                          : 'غير محدد'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>لا يوجد إحالات بعد.</p>
            )}
          </div>

          {/* عرض النقاط المستبدلة */}
          <div className="redeemed-points-section">
            <h3>النقاط المستبدلة</h3>
            <p>{redeemedPoints} نقطة</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberManagementPage;
