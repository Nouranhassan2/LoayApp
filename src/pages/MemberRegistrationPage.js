// pages/MemberRegistrationPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMemberRegistration from '../hooks/useMemberRegistration';

function MemberRegistrationPage() {
  const navigate = useNavigate();
  const {
    cities,
    districts,
    loading,
    error,
    updateDistricts,
    registerMember,
  } = useMemberRegistration();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    city: '',
    district: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // مسح رسالة الخطأ عند الكتابة
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      city: cityName,
      district: '', // إعادة تعيين الحي عند تغيير المدينة
    }));
    updateDistricts(cityName);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    }

    if (!formData.email.trim()) {
      errors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'البريد الإلكتروني غير صالح';
    }

    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    if (!formData.mobile) {
      errors.mobile = 'رقم الجوال مطلوب';
    } else if (!/^05[0-9]{8}$/.test(formData.mobile)) {
      errors.mobile = 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.';
    }

    if (!formData.city) {
      errors.city = 'يرجى اختيار المدينة';
    }

    if (!formData.district) {
      errors.district = 'يرجى اختيار الحي';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من صحة النموذج
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await registerMember(formData);
      alert('تم تسجيل عضويتك بنجاح!');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="container">
            <div className="top-bar">
     <img src={process.env.PUBLIC_URL + '/img/image.png'} alt="Logo" className="navbar-logo" />
     </div>
      <div className="registration-page">
        <h1 className="page-title">تسجيل عضوية جديدة</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label>الاسم</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && (
              <span className="error-message">{formErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={formErrors.email ? 'error' : ''}
              dir="ltr"
            />
            {formErrors.email && (
              <span className="error-message">{formErrors.email}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>كلمة المرور</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={formErrors.password ? 'error' : ''}
                dir="ltr"
              />
              {formErrors.password && (
                <span className="error-message">{formErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label>تأكيد كلمة المرور</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={formErrors.confirmPassword ? 'error' : ''}
                dir="ltr"
              />
              {formErrors.confirmPassword && (
                <span className="error-message">
                  {formErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>رقم الجوال</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              placeholder="05xxxxxxxx"
              className={formErrors.mobile ? 'error' : ''}
              dir="ltr"
            />
            {formErrors.mobile && (
              <span className="error-message">{formErrors.mobile}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>المدينة</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleCityChange}
                className={formErrors.city ? 'error' : ''}
              >
                <option value="">اختر المدينة</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              {formErrors.city && (
                <span className="error-message">{formErrors.city}</span>
              )}
            </div>

            <div className="form-group">
              <label>الحي</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                disabled={!formData.city}
                className={formErrors.district ? 'error' : ''}
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
          </div>

          <div className="form-footer">
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل العضوية'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MemberRegistrationPage;
