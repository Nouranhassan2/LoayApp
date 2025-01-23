// pages/UserManagementPage.js

import React, { useState } from 'react';
import useManageUsers from '../hooks/useManageUsers';
import '../App.css';

// مكون النافذة المنبثقة لعرض تفاصيل المستخدم
const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const formatDate = (date) => {
    if (!date) return 'غير محدد';
    return new Date(date).toLocaleDateString('ar-SA');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={stopPropagation}>
        <div className="modal-header">
          <h2>تفاصيل المستخدم</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          <div className="user-detail">
            <strong>الاسم:</strong>
            <span>{user.name || 'غير محدد'}</span>
          </div>
          <div className="user-detail">
            <strong>البريد الإلكتروني:</strong>
            <span>{user.email || 'غير محدد'}</span>
          </div>
          <div className="user-detail">
            <strong>الدور:</strong>
            <span>{user.role || 'غير محدد'}</span>
          </div>
          <div className="user-detail">
            <strong>الحالة:</strong>
            <span className={user.isActive ? 'status-active' : 'status-inactive'}>
              {user.isActive ? 'نشط' : 'معطل'}
            </span>
          </div>

          {user.role === 'member' && (
            <>
              <div className="user-detail">
                <strong>النقاط:</strong>
                <span>{user.points || 0}</span>
              </div>
              <div className="user-detail">
                <strong>كود الإحالة:</strong>
                <span>{user.referralCode || 'غير محدد'}</span>
              </div>
              <div className="user-detail">
                <strong>رقم الهاتف:</strong>
                <span>{user.phoneNumber || 'غير محدد'}</span>
              </div>
              <div className="user-detail">
                <strong>المدينة:</strong>
                <span>{user.city || 'غير محدد'}</span>
              </div>
              <div className="user-detail">
                <strong>الحي:</strong>
                <span>{user.district || 'غير محدد'}</span>
              </div>
              <div className="user-detail">
                <strong>تاريخ الميلاد:</strong>
                <span>{formatDate(user.birthDate)}</span>
              </div>
              <div className="user-detail">
                <strong>تاريخ الانضمام:</strong>
                <span>{formatDate(user.joinDate)}</span>
              </div>
              <div className="user-detail">
                <strong>مستوى العضوية:</strong>
                <span className={`membership-${user.membershipLevel}`}>
                  {user.membershipLevel === 'bronze' && 'برونزي'}
                  {user.membershipLevel === 'silver' && 'فضي'}
                  {user.membershipLevel === 'gold' && 'ذهبي'}
                  {user.membershipLevel === 'platinum' && 'بلاتيني'}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="primary-button" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// المكون الرئيسي
function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    points: 0,
    referralCode: '',
    phoneNumber: '',
    city: '',
    district: '',
    birthDate: '',
    joinDate: '',
    membershipLevel: 'bronze',
  });
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [additionalFields, setAdditionalFields] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  const {
    users,
    roles,
    selectedUser,
    setSelectedUser,
    addUser,
    updateUser,
    deleteUserAccount,
    toggleUserAccount,
    fetchUsers,
    cities,
    districts,
    updateDistricts,
    loading,
    error,
  } = useManageUsers(recordsPerPage, searchTerm);

  const validateForm = () => {
    const errors = {};
    if (!userForm.name.trim()) errors.name = 'الاسم مطلوب';
    if (!userForm.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }
    if (!selectedUser && !userForm.password) {
      errors.password = 'كلمة المرور مطلوبة';
    }
    if (!userForm.role) errors.role = 'الدور مطلوب';

    if (userForm.role === 'member') {
      if (!userForm.city) errors.city = 'المدينة مطلوبة';
      if (!userForm.district) errors.district = 'الحي مطلوب';
      if (!userForm.phoneNumber) errors.phoneNumber = 'رقم الهاتف مطلوب';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));

    // مسح رسالة الخطأ عند الكتابة
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }

    if (name === 'role') {
      handleRoleChange(value);
    } else if (name === 'city') {
      updateDistricts(value);
      setUserForm((prev) => ({ ...prev, district: '' }));
    }
  };

  const handleRoleChange = (role) => {
    if (role === 'member') {
      setAdditionalFields([
        'points',
        'referralCode',
        'phoneNumber',
        'city',
        'district',
        'birthDate',
        'membershipLevel',
      ]);
    } else {
      setAdditionalFields([]);
      // إعادة تعيين الحقول الإضافية
      setUserForm((prev) => ({
        ...prev,
        points: 0,
        referralCode: '',
        phoneNumber: '',
        city: '',
        district: '',
        birthDate: '',
        membershipLevel: 'bronze',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, userForm);
        alert('تم تحديث المستخدم بنجاح');
      } else {
        await addUser(userForm);
        alert('تم إضافة المستخدم بنجاح');
      }
      clearForm();
    } catch (error) {
      alert(error.message);
    }
  };

  const clearForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: '',
      points: 0,
      referralCode: '',
      phoneNumber: '',
      city: '',
      district: '',
      birthDate: '',
      joinDate: '',
      membershipLevel: 'bronze',
    });
    setSelectedUser(null);
    setAdditionalFields([]);
    setFormErrors({});
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      ...user,
      password: '', // لا نعرض كلمة المرور عند التعديل
    });
    handleRoleChange(user.role);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        await deleteUserAccount(userId);
        alert('تم حذف المستخدم بنجاح');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleToggleUser = async (userId, isActive) => {
    const action = isActive ? 'تعطيل' : 'تفعيل';
    if (window.confirm(`هل أنت متأكد من ${action} حساب هذا المستخدم؟`)) {
      try {
        await toggleUserAccount(userId, isActive);
        alert(`تم ${action} الحساب بنجاح`);
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleShowUserDetails = (user) => {
    setUserDetails(user);
    setShowUserDetailsModal(true);
  };

  return (
    <div className="container" dir="rtl">
      <h1 className="page-title">إدارة المستخدمين</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {/* نموذج إضافة/تعديل المستخدم */}
      <div className="user-form card">
        <h2>{selectedUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>الاسم:</label>
            <input
              type="text"
              name="name"
              value={userForm.name}
              onChange={handleInputChange}
              className={`form-control ${formErrors.name ? 'error' : ''}`}
            />
            {formErrors.name && <span className="error-message">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني:</label>
            <input
              type="email"
              name="email"
              value={userForm.email}
              onChange={handleInputChange}
              disabled={!!selectedUser}
              className={`form-control ${formErrors.email ? 'error' : ''}`}
            />
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>

          {!selectedUser && (
            <div className="form-group">
              <label>كلمة المرور:</label>
              <input
                type="password"
                name="password"
                value={userForm.password}
                onChange={handleInputChange}
                className={`form-control ${formErrors.password ? 'error' : ''}`}
              />
              {formErrors.password && (
                <span className="error-message">{formErrors.password}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label>الدور:</label>
            <select
              name="role"
              value={userForm.role}
              onChange={handleInputChange}
              className={`form-control ${formErrors.role ? 'error' : ''}`}
            >
              <option value="">اختر الدور</option>
              {roles.map((role, index) => (
                <option key={index} value={role}>
                  {role === 'member' ? 'عضو' : role}
                </option>
              ))}
            </select>
            {formErrors.role && <span className="error-message">{formErrors.role}</span>}
          </div>

          {/* الحقول الإضافية للعضو */}
          {additionalFields.includes('city') && (
            <div className="form-group">
              <label>المدينة:</label>
              <select
                name="city"
                value={userForm.city}
                onChange={handleInputChange}
                className={`form-control ${formErrors.city ? 'error' : ''}`}
              >
                <option value="">اختر المدينة</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {formErrors.city && <span className="error-message">{formErrors.city}</span>}
            </div>
          )}

          {additionalFields.includes('district') && userForm.city && (
            <div className="form-group">
              <label>الحي:</label>
              <select
                name="district"
                value={userForm.district}
                onChange={handleInputChange}
                className={`form-control ${formErrors.district ? 'error' : ''}`}
              >
                <option value="">اختر الحي</option>
                {districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {formErrors.district && (
                <span className="error-message">{formErrors.district}</span>
              )}
            </div>
          )}

          {additionalFields.includes('phoneNumber') && (
            <div className="form-group">
              <label>رقم الهاتف:</label>
              <input
                type="tel"
                name="phoneNumber"
                value={userForm.phoneNumber}
                onChange={handleInputChange}
                className={`form-control ${formErrors.phoneNumber ? 'error' : ''}`}
                dir="ltr"
              />
              {formErrors.phoneNumber && (
                <span className="error-message">{formErrors.phoneNumber}</span>
              )}
            </div>
          )}

          {additionalFields.includes('birthDate') && (
            <div className="form-group">
              <label>تاريخ الميلاد:</label>
              <input
                type="date"
                name="birthDate"
                value={userForm.birthDate}
                onChange={handleInputChange}
                className="form-control"
                dir="ltr"
              />
            </div>
          )}

          {additionalFields.includes('points') && (
            <div className="form-group">
              <label>النقاط:</label>
              <input
                type="number"
                name="points"
                value={userForm.points}
                onChange={handleInputChange}
                className="form-control"
                min="0"
              />
            </div>
          )}

          {additionalFields.includes('membershipLevel') && (
            <div className="form-group">
              <label>مستوى العضوية:</label>
              <select
                name="membershipLevel"
                value={userForm.membershipLevel}
                onChange={handleInputChange}
                className="form-control"
              >
                <option value="bronze">برونزي</option>
                <option value="silver">فضي</option>
                <option value="gold">ذهبي</option>
                <option value="platinum">بلاتيني</option>
              </select>
            </div>
          )}

          <div className="form-buttons">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading
                ? 'جاري المعالجة...'
                : selectedUser
                ? 'حفظ التعديلات'
                : 'إضافة المستخدم'}
            </button>
            <button
              type="button"
              onClick={clearForm}
              className="secondary-button"
              disabled={loading}
            >
              إعادة تعيين
            </button>
          </div>
        </form>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="search-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="بحث بالاسم"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={fetchUsers} className="search-button" disabled={loading}>
            بحث
          </button>
        </div>
        <select
          value={recordsPerPage}
          onChange={(e) => setRecordsPerPage(Number(e.target.value))}
          className="records-per-page"
          disabled={loading}
        >
          <option value={20}>20 سجل</option>
          <option value={50}>50 سجل</option>
          <option value={100}>100 سجل</option>
        </select>
      </div>

      {/* جدول المستخدمين */}
      <div className="table-container">
        {loading ? (
          <div className="loading">جاري التحميل...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد الإلكتروني</th>
                <th>الدور</th>
                <th>المدينة</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || ''}</td>
                  <td>{user.email || ''}</td>
                  <td>{user.role === 'member' ? 'عضو' : user.role || ''}</td>
                  <td>{user.city || 'غير محدد'}</td>
                  <td>
                    <span className={user.isActive ? 'status-active' : 'status-inactive'}>
                      {user.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="edit-button"
                      disabled={loading}
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="delete-button"
                      disabled={loading}
                    >
                      حذف
                    </button>
                    <button
                      onClick={() => handleShowUserDetails(user)}
                      className="details-button"
                      disabled={loading}
                    >
                      المزيد
                    </button>
                    <button
                      onClick={() => handleToggleUser(user.id, user.isActive)}
                      className={user.isActive ? 'deactivate-button' : 'activate-button'}
                      disabled={loading}
                    >
                      {user.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* النافذة المنبثقة لعرض التفاصيل */}
      {showUserDetailsModal && userDetails && (
        <UserDetailsModal
          user={userDetails}
          onClose={() => setShowUserDetailsModal(false)}
        />
      )}
    </div>
  );
}

export default UserManagementPage;
