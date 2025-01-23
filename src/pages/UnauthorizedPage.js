// pages/UnauthorizedPage.js
import React from 'react';

function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <h2>غير مصرح لك بالوصول إلى هذه الصفحة</h2>
      <p>الرجاء العودة إلى الصفحة الرئيسية أو تسجيل الدخول بحساب لديه الصلاحيات المناسبة.</p>
    </div>
  );
}

export default UnauthorizedPage;
