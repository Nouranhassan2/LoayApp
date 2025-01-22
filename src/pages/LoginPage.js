import React, { useState, useEffect } from 'react';
import useLogin from '../hooks/useLogin';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {

      if (!currentUser.isActive) {
        setErrorMessage('تم تعطيل الحساب. يرجى التواصل مع الدعم الفني.');
        return;
      }

      const role = currentUser.role ? currentUser.role.toLowerCase() : '';
      if (role === 'member') {
        navigate('/member-dashboard');
      } else if (['admin', 'emp', 'manager'].includes(role)) {
        navigate('/dashboard');
      } else {
        navigate('/unauthorized');
      }
    }
  }, [currentUser, navigate]);

  const {
    handleLogin,
    handleForgotPassword,
    handleGoogleSignIn,
  } = useLogin();

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email) {
      setErrorMessage('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('البريد الإلكتروني غير صالح. يرجى التحقق من البريد الإلكتروني المدخل.');
      return;
    }

    if (!isForgotPassword && !password) {
      setErrorMessage('يرجى إدخال كلمة المرور.');
      return;
    }

    try {
      if (isForgotPassword) {
        await handleForgotPassword(email);
        alert('تم إرسال تعليمات إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        setIsForgotPassword(false);
      } else {
        await handleLogin(email, password);
      }
    } catch (error) {
      console.error('Error:', error);

      let errorCode = error.code;

      if (!errorCode && error.message) {
        const matches = error.message.match(/\(auth\/[^\)]+\)/);
        if (matches && matches.length > 0) {
          errorCode = matches[0].replace(/[()]/g, '');
        }

      }

      let message = '';

      if (errorCode) {
        switch (errorCode) {
          case 'auth/user-not-found':
            message = 'المستخدم غير موجود. يرجى التحقق من البريد الإلكتروني المدخل.';
            break;
          case 'auth/wrong-password':
            message = 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.';
            break;
          case 'auth/invalid-email':
            message = 'البريد الإلكتروني غير صالح. يرجى التحقق من البريد الإلكتروني المدخل.';
            break;
          case 'auth/user-disabled':
            message = 'تم تعطيل حسابك. يرجى الاتصال بالدعم الفني.';
            break;
          case 'auth/too-many-requests':
            message = 'تم حظر الحساب مؤقتًا بسبب محاولات فاشلة متعددة. يرجى المحاولة لاحقًا.';
            break;
          case 'auth/invalid-credential':
            message = 'بيانات الدخول غير صالحة. يرجى المحاولة مرة أخرى.';
            break;
          default:
            message = 'حدث خطأ: ' + error.message;
            console.error('Unhandled error code:', errorCode, error.message);
            break;
        }
      } else if (error.message) {
        message = 'حدث خطأ: ' + error.message;
        console.error('Unhandled error message:', error.message);
      } else {
        message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
        console.error('Unhandled error:', error);
      }

      setErrorMessage(message);
    }
  };

  const handleInputChange = () => {
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const onGoogleSignIn = async () => {
    try {
      await handleGoogleSignIn();
    } catch (error) {
      console.error('Error during Google Sign-In:', error);

      let errorCode = error.code;

      if (!errorCode && error.message) {
        const matches = error.message.match(/\(auth\/[^\)]+\)/);
        if (matches && matches.length > 0) {
          errorCode = matches[0].replace(/[()]/g, '');
        }
      }

      let message = '';

      if (errorCode) {
        switch (errorCode) {
          case 'auth/unauthorized-domain':
            message = 'النطاق غير مصرح به. يرجى الاتصال بالمسؤول.';
            break;
          case 'auth/popup-closed-by-user':
            message = 'تم إغلاق نافذة تسجيل الدخول قبل إكمال العملية.';
            break;
          case 'auth/cancelled-popup-request':
            message = 'تم إلغاء طلب تسجيل الدخول.';
            break;
          case 'auth/invalid-credential':
            message = 'بيانات الاعتماد غير صالحة. يرجى المحاولة مرة أخرى.';
            break;
          default:
            message = 'حدث خطأ أثناء تسجيل الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.';
            console.error('Unhandled error code:', errorCode, error.message);
            break;
        }
      } else if (error.message) {
        message = 'حدث خطأ أثناء تسجيل الدخول باستخدام جوجل: ' + error.message;
      } else {
        message = 'حدث خطأ أثناء تسجيل الدخول باستخدام جوجل. يرجى المحاولة مرة أخرى.';
      }

      setErrorMessage(message);
    }
  };

  return (
    <div className="login-page">
      <div className="top-bar">
        <img src={process.env.PUBLIC_URL + '/img/image.png'} alt="Logo" className="navbar-logo" />
      </div>
      <h2>{isForgotPassword ? 'استعادة كلمة المرور' : 'تسجيل الدخول'}</h2>
      <form onSubmit={onSubmit}>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <div className="form-group">
          <label>البريد الإلكتروني:</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              handleInputChange();
            }}
            required
          />
        </div>
        {!isForgotPassword && (
          <div className="form-group">
            <label>كلمة المرور:</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn-link"
              >
                {showPassword ? 'إخفاء' : 'إظهار'} كلمة المرور
              </button>
            </div>
          </div>
        )}
        <div className="form-actions">
          {isForgotPassword ? (
            <button type="submit" className="btn btn-primary">
              استعادة كلمة المرور
            </button>
          ) : (
            <>
              <button type="submit" className="btn btn-primary">
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="btn btn-secondary"
              >
                تسجيل الدخول باستخدام Google
              </button>
            </>
          )}
        </div>
        <div className="form-group links">
          {!isForgotPassword && (
            <>
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="btn btn-link"
              >
                نسيت كلمة المرور؟
              </button>
              <button
                type="button"
                onClick={() => navigate('/member-registration')}
                className="btn btn-link"
              >
                ليس لديك حساب؟ سجل الآن
              </button>
            </>
          )}
          {isForgotPassword && (
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="btn btn-link"
            >
              العودة إلى تسجيل الدخول
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
