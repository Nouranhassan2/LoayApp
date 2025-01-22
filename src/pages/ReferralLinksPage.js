// pages/ReferralLinksPage.js

import React, { useState } from 'react';
import useReferralLinks from '../hooks/useReferralLinks';
import '../App.css';
import * as XLSX from 'xlsx';

function ReferralLinksPage() {
  const {
    referralLinks,
    stats,
    referrals,
    loading,
    generateReferralLink,
    copyToClipboard,
    shareOnWhatsApp,
    shareOnInstagram,
    projects,
    setSelectedProject,
    selectedProject,
    currentReferralLink,
    handleReferralLinkClick,
    getMemberNameById,
    getProjectNameById,
    members,
    selectedMember,
    setSelectedMember,
  } = useReferralLinks();

  // حالة البحث
  const [searchQuery, setSearchQuery] = useState('');

  // تصفية روابط الإحالة بناءً على البحث
  const filteredReferralLinks = referralLinks.filter((link) =>
    getMemberNameById(link.memberId).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getProjectNameById(link.projectId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // وظيفة تصدير بيانات الجدول
  const exportTableData = () => {
    const ws = XLSX.utils.json_to_sheet(filteredReferralLinks.map((link) => ({
      'المشروع': getProjectNameById(link.projectId),
      'العضو': getMemberNameById(link.memberId),
      'رابط الإحالة': link.referralLink,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'روابط الإحالة');
    XLSX.writeFile(wb, 'روابط_الإحالة.xlsx');
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="container" dir="rtl">
      <h1 className="page-title">روابط الإحالة</h1>

      {/* إنشاء رابط إحالة جديد */}
      <div className="card mb-4">
        <h2 className="card-title">إنشاء رابط إحالة جديد</h2>
        <div className="card-body">
          <div className="form-group">
            <label>اختر المشروع:</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="form-control"
            >
              <option value="">اختر المشروع</option>
              {projects.map((project, index) => (
                <option key={index} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>اختر العضو:</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
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
          <button onClick={generateReferralLink} className="btn btn-primary mt-2">
            إنشاء رابط الإحالة
          </button>
        </div>
      </div>

      {/* حقل البحث */}
      <div className="card mb-4">
        <h2 className="card-title">البحث في روابط الإحالة</h2>
        <div className="card-body">
          <input
            type="text"
            placeholder="ابحث باسم العضو أو المشروع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
          />
        </div>
      </div>

      {/* زر لتصدير بيانات الجدول */}
      <div className="mb-4">
        <button onClick={exportTableData} className="btn btn-success">
          تصدير بيانات الجدول
        </button>
      </div>

      {/* قائمة روابط الإحالة */}
      <div className="card mb-4">
        <h2 className="card-title">روابط الإحالة الخاصة بك</h2>
        <div className="card-body">
          {filteredReferralLinks.length > 0 ? (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>المشروع</th>
                  <th>العضو</th>
                  <th>رابط الإحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferralLinks.map((link) => (
                  <tr key={link.id}>
                    <td>{link.projectName }</td>
                    <td>{getMemberNameById(link.memberId)}</td>
                    <td>
                      <a href={link.referralLink} target="_blank" rel="noopener noreferrer">
                        الرابط
                      </a>
                    </td>
                    <td>
                      <button
                        onClick={() => handleReferralLinkClick(link)}
                        className="btn btn-info btn-sm"
                      >
                        عرض التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>لم تقم بإنشاء أي روابط إحالة بعد.</p>
          )}
        </div>
      </div>

      {/* عرض تفاصيل رابط الإحالة المحدد */}
      {currentReferralLink && (
        <div className="card mb-4">
          <h2 className="card-title">
            تفاصيل رابط الإحالة - {getMemberNameById(currentReferralLink.memberId)}
          </h2>
          <div className="card-body">
            {/* عرض الرابط وأزرار المشاركة */}
            <div className="mb-3">
              <label>رابط الإحالة:</label>
              <input
                type="text"
                value={currentReferralLink.referralLink}
                readOnly
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <button
                onClick={() => copyToClipboard(currentReferralLink.referralLink)}
                className="btn btn-secondary mr-2"
              >
                نسخ الرابط
              </button>
              <button
                onClick={() => shareOnWhatsApp(currentReferralLink.referralLink)}
                className="btn btn-success mr-2"
              >
                مشاركة على واتساب
              </button>
              <button
                onClick={() => shareOnInstagram(currentReferralLink.referralLink)}
                className="btn btn-danger"
              >
                مشاركة على إنستجرام
              </button>
            </div>

            {/* عرض الإحصائيات */}
            <div className="mb-3">
              <h3>إحصائيات الإحالة</h3>
              <ul className="list-group">
                <li className="list-group-item">
                  <strong>عدد النقرات:</strong> {stats.clicks || 0}
                </li>
                <li className="list-group-item">
                  <strong>عدد التسجيلات:</strong> {stats.signUps || 0}
                </li>
                <li className="list-group-item">
                  <strong>المكافآت المكتسبة:</strong> {stats.rewards || 0}
                </li>
              </ul>
            </div>

            {/* عرض قائمة الإحالات */}
            <div>
              <h3>الإحالات الخاصة بك</h3>
              {referrals.length > 0 ? (
                <table className="table table-bordered">
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
                            ? new Date(referral.date.seconds * 1000).toLocaleDateString('ar-SA')
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
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferralLinksPage;
