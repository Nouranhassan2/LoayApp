// pages/ActivityManagementPage.js
import React, { useState, useEffect } from 'react';
import useManageActivities from '../hooks/useManageActivities';
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Ensure your Firebase config is correctly imported

import '../App.css';

function ActivityManagementPage() {
  // حالة النموذج والبحث
  const [searchTerm, setSearchTerm] = useState('');
  const [recordsPerPage, setRecordsPerPage] = useState(20);
  const [activityForm, setActivityForm] = useState({
    name: '',
    description: '',
    points: '',
    participantsCount: ''
  });

  // حالة التحقق من صحة النموذج
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // استدعاء hook إدارة الأنشطة
  const {
    activities,
    selectedActivity,
    setSelectedActivity,
    addActivity,
    updateActivity,
    deleteActivity,
    fetchActivities,
    exportToExcel
  } = useManageActivities(recordsPerPage, searchTerm);

  // التحقق من صحة النموذج
  const validateForm = () => {
    const errors = {};
    if (!activityForm.name.trim()) {
      errors.name = 'اسم النشاط مطلوب';
    }
    if (!activityForm.description.trim()) {
      errors.description = 'وصف النشاط مطلوب';
    }
    if (!activityForm.points) {
      errors.points = 'عدد النقاط مطلوب';
    } else if (Number(activityForm.points) < 0) {
      errors.points = 'عدد النقاط يجب أن يكون أكبر من أو يساوي صفر';
    }
    if (!activityForm.participantsCount) {
      errors.participantsCount = 'عدد المشتركين مطلوب';
    } else if (Number(activityForm.participantsCount) < 0) {
      errors.participantsCount = 'عدد المشتركين يجب أن يكون أكبر من أو يساوي صفر';
    }
    return errors;
  };

  // معالجة تغيير المدخلات
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActivityForm(prev => ({
      ...prev,
      [name]: value
    }));
    // مسح رسالة الخطأ عند الكتابة
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // معالجة تقديم النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // التحقق من صحة النموذج
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedActivity) {
        await updateActivity(selectedActivity.id, activityForm);
        alert('تم تحديث النشاط بنجاح');
      } else {
        await addActivity(activityForm);
        alert('تم إضافة النشاط بنجاح');
      }
      clearForm();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleActivate = async (activityId) => {
    try {
      const activityRef = doc(db, "activities", activityId);
      console.log("Activating activity with ID:", activityId);
      await updateDoc(activityRef, { isActive: true });
      console.log("Activity activated successfully");
      alert("تم تفعيل النشاط بنجاح");
      fetchActivities();
    } catch (error) {
      console.error("خطأ أثناء تفعيل النشاط:", error);
      alert("تعذر تفعيل النشاط.");
    }
  };
  
  const handleDeactivate = async (activityId) => {
    try {
      const activityRef = doc(db, "activities", activityId); // Correct document reference
      console.log("Deactivating activity with ID:", activityId);
      console.log("Activity reference:", activityRef.path); // Log the document reference path
    console.log("Updating with value: { isActive: false }"); 
      await updateDoc(activityRef, { isActive: false }); // Update isActive to false
      console.log("Activity deactivated successfully");
      alert("تم تعطيل النشاط بنجاح");
      fetchActivities(); // Refresh the activities list to reflect changes
    } catch (error) {
      console.error("خطأ أثناء تعطيل النشاط:", error);
      alert("تعذر تعطيل النشاط. تحقق من إعدادات قاعدة البيانات.");
    }
  };

  // تفريغ النموذج
  const clearForm = () => {
    setActivityForm({
      name: '',
      description: '',
      points: '',
      participantsCount: ''
    });
    setSelectedActivity(null);
    setFormErrors({});
  };

  // معالجة التعديل
  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setActivityForm({
      name: activity.name,
      description: activity.description,
      points: activity.points.toString(),
      participantsCount: activity.participantsCount.toString()
    });
    setFormErrors({});
  };

  // معالجة الحذف
  const handleDelete = async (activityId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا النشاط؟')) {
      try {
        await deleteActivity(activityId);
        alert('تم حذف النشاط بنجاح');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // معالجة التصدير إلى Excel
  const handleExportToExcel = async () => {
    try {
      if (activities.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }
      await exportToExcel();
    } catch (error) {
      alert('حدث خطأ أثناء تصدير البيانات: ' + error.message);
    }
  };



  return (
    <div className="container">
      <h1 className="page-title">إدارة الأنشطة</h1>

      {/* نموذج إضافة/تعديل النشاط */}
      <div className="activity-form card">
        <h2>{selectedActivity ? 'تعديل نشاط' : 'إضافة نشاط جديد'}</h2>

        <form onSubmit={handleSubmit}>
        <div className="form-group">
            <label>اسم النشاط:</label>
            <select
              name="name"
              value={activityForm.name}
              onChange={handleInputChange}
              className={`form-control ${formErrors.name ? 'error' : ''}`}
              required
            >
              <option value="" disabled>
                اختر اسم النشاط
              </option>
              <option value="عدد النقرات">عدد النقرات</option>
              <option value="الإبلاغ عن مشكلة">الإبلاغ عن مشكلة</option>
            </select>
            {formErrors.name && <span className="error-message">{formErrors.name}</span>}
          </div>


        <div className="form-group">
            <label>اسم المشروع:</label>
            <select
              name="projectName"
              value={activityForm.projectName}
              onChange={handleInputChange}
              className={`form-control ${formErrors.projectName ? 'error' : ''}`}
              required
            >
              <option value="" disabled>
                اختر اسم المشروع
              </option>
              <option value="متاجر الحي">متاجر الحي</option>
              <option value="استبيان هنا AI">استبيان هنا AI</option>
            </select>
            {formErrors.projectName && <span className="error-message">{formErrors.projectName}</span>}
          </div>

          <div className="form-group">
            <label>وصف النشاط:</label>
            <textarea
              name="description"
              value={activityForm.description}
              onChange={handleInputChange}
              className={`form-control ${formErrors.description ? 'error' : ''}`}
              rows="3"
              placeholder="أدخل وصف النشاط"
            />
            {formErrors.description && <span className="error-message">{formErrors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label>عدد النقاط:</label>
              <input
                type="number"
                name="points"
                value={activityForm.points}
                onChange={handleInputChange}
                min="0"
                className={`form-control ${formErrors.points ? 'error' : ''}`}
                placeholder="أدخل عدد النقاط"
              />
              {formErrors.points && <span className="error-message">{formErrors.points}</span>}
            </div>

            <div className="form-group half-width">
              <label>عدد المشتركين:</label>
              <input
                type="number"
                name="participantsCount"
                value={activityForm.participantsCount}
                onChange={handleInputChange}
                min="0"
                className={`form-control ${formErrors.participantsCount ? 'error' : ''}`}
                placeholder="أدخل عدد المشتركين"
              />
              {formErrors.participantsCount && <span className="error-message">{formErrors.participantsCount}</span>}
            </div>
          </div>

          <div className="form-buttons">
            <button 
              type="submit" 
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحفظ...' : selectedActivity ? 'تحديث النشاط' : 'إضافة النشاط'}
            </button>
            <button 
              type="button" 
              onClick={clearForm} 
              className="secondary-button"
              disabled={isSubmitting}
            >
              إعادة تعيين
            </button>
          </div>
        </form>
      </div>

      {/* شريط البحث وأدوات الإدارة */}
      <div className="search-toolbar">
        <div className="tools-group">
          <h3>إجمالي عدد الأنشطة: {activities.length}</h3>
          <button 
            onClick={handleExportToExcel} 
            className="export-button"
            disabled={activities.length === 0}
          >
            تصدير Excel
          </button>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="بحث باسم النشاط"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => fetchActivities()} className="search-button">
            بحث
          </button>
        </div>
        <select
          value={recordsPerPage}
          onChange={(e) => setRecordsPerPage(Number(e.target.value))}
          className="records-per-page"
        >
          <option value={20}>20 سجل</option>
          <option value={50}>50 سجل</option>
        </select>
      </div>

     
    {/* جدول الأنشطة */}
<div className="table-container">
  {activities.length > 0 ? (
<table
  className="activities-table"
  style={{ tableLayout: "fixed", width: "100%", borderCollapse: "collapse" }}
>
  <thead>
    <tr>
      <th style={{ width: "10%", textAlign: "center" }}>اسم النشاط</th>
      <th style={{ width: "10%", textAlign: "center" }}>اسم المشروع</th>
      <th style={{ width: "30%", textAlign: "center" }}>الوصف</th>
      <th style={{ width: "10%", textAlign: "center" }}>النقاط</th>
      <th style={{ width: "10%", textAlign: "center" }}>عدد المشتركين</th>
      <th style={{ width: "10%", textAlign: "center" }}>تاريخ الإنشاء</th>
      <th style={{ width: "10%", textAlign: "center" }}>الإجراءات</th>
    </tr>
  </thead>
<tbody>
  {activities.map((activity) => (
    <tr key={activity.id}>
      <td style={{ textAlign: "center" }}>{activity.name}</td>
      <td style={{ textAlign: "center" }}>{activity.projectName}</td>
      <td style={{ textAlign: "center" }}>{activity.description}</td>
      <td style={{ textAlign: "center" }}>{activity.points}</td>
      <td style={{ textAlign: "center" }}>{activity.participantsCount}</td>
      <td style={{ textAlign: "center" }}>{activity.createdAt}</td>
      <td style={{ textAlign: "center" }}>
        <button
          onClick={() => handleEdit(activity)}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "5px 10px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          تعديل
        </button>
        <button
          onClick={() => handleDelete(activity.id)}
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            padding: "5px 10px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginLeft: "5px",
          }}
        >
          حذف
        </button>
        {/* Activate and Deactivate Buttons */}
        {activity.isActive ? (
          <button
            onClick={() => handleDeactivate(activity.id)}
            style={{
              backgroundColor: "#ffc107",
              color: "black",
              padding: "5px 10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginLeft: "5px",
            }}
          >
            تعطيل
          </button>
        ) : (
          <button
            onClick={() => handleActivate(activity.id)}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "5px 10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginLeft: "5px",
            }}
          >
            تفعيل
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>

</table>

 
  ) : (
    <div className="no-data">
      {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد أنشطة مضافة'}
    </div>
  )}
</div>
    </div>
  );
}

export default ActivityManagementPage;