// AddActivityPage.js
/*
import React, { useState } from 'react';

function AddActivityPage() {
  const [activityName, setActivityName] = useState('');
  const [activityDescription, setActivityDescription] = useState('');

  const handleAddActivity = (e) => {
    e.preventDefault();
    // هنا يمكن إضافة منطق حفظ النشاط في قاعدة البيانات
    console.log('Activity Added:', { activityName, activityDescription });
  };
/*
  return (
    <div className="add-activity-page">
      <h2>إضافة نشاط جديد</h2>
      <form onSubmit={handleAddActivity}>
        <div className="form-group">
          <label>زفت النشاط:</label>
          <input
            type="text"
            className="form-control"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>وصف النشاط:</label>
          <textarea
            className="form-control"
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">إضافة النشاط</button>
      </form>
    </div>
  );
}

export default AddActivityPage;*/
