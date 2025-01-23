// pages/NotificationsPage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useNotificationsManagement from '../hooks/useNotificationsManagement';

const NotificationModal = ({ notification, onClose, onConfirm }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>{notification.title}</h2>
      <div className="modal-body">
        <p>{notification.content}</p>
        <p className="notification-info">
          النوع: {notification.type}
          <br />
          بواسطة: {notification.createdBy}
          <br />
          التاريخ: {notification.createdAt?.toLocaleString()}
        </p>
      </div>
      <div className="modal-buttons">
        <button onClick={onConfirm} className="primary-button">تأكيد القراءة</button>
        <button onClick={onClose} className="secondary-button">إغلاق</button>
      </div>
    </div>
  </div>
);

const ReadersModal = ({ readers, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>قائمة القراء</h2>
      <div className="modal-body">
        {readers.length > 0 ? (
          <table className="readers-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>تاريخ القراءة</th>
              </tr>
            </thead>
            <tbody>
              {readers.map((reader, index) => (
                <tr key={index}>
                  <td>{reader.name}</td>
                  <td>{reader.readAt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">لم يقرأ أحد هذا الإشعار بعد</p>
        )}
      </div>
      <div className="modal-buttons">
        <button onClick={onClose} className="secondary-button">إغلاق</button>
      </div>
    </div>
  </div>
);

function NotificationsPage() {
  const { currentUser } = useAuth();
  const {
    notifications,
    selectedNotification,
    setSelectedNotification,
    readers,
    addNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    fetchReaders
  } = useNotificationsManagement(currentUser);

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    type: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [showReadersModal, setShowReadersModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title || !notificationForm.content || !notificationForm.type) {
      alert('جميع الحقول مطلوبة');
      return;
    }

    try {
      if (selectedNotification) {
        await updateNotification(selectedNotification.id, notificationForm);
        alert('تم تحديث الإشعار بنجاح');
      } else {
        await addNotification(notificationForm);
        alert('تم إضافة الإشعار بنجاح');
      }
      clearForm();
    } catch (error) {
      alert(error.message);
    }
  };

  const clearForm = () => {
    setNotificationForm({
      title: '',
      content: '',
      type: ''
    });
    setSelectedNotification(null);
  };

  const handleEdit = (notification) => {
    setSelectedNotification(notification);
    setNotificationForm({
      title: notification.title,
      content: notification.content,
      type: notification.type
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      try {
        await deleteNotification(id);
        alert('تم حذف الإشعار بنجاح');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleRead = async (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
  };

  const handleShowReaders = async (notificationId) => {
    try {
      await fetchReaders(notificationId);
      setShowReadersModal(true);
    } catch (error) {
      alert(error.message);
    }
  };

  const confirmRead = async () => {
    try {
      if (await markAsRead(selectedNotification.id)) {
        alert('تم تسجيل قراءتك للإشعار بنجاح');
      } else {
        alert('لقد قرأت هذا الإشعار مسبقاً');
      }
      setShowModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h1 className="page-title">إدارة الإشعارات</h1>

      <div className="card">
        <h2>{selectedNotification ? 'تعديل إشعار' : 'إضافة إشعار جديد'}</h2>
        <form onSubmit={handleSubmit} className="notification-form">
          <div className="form-group">
            <label>عنوان الإشعار:</label>
            <input
              type="text"
              name="title"
              value={notificationForm.title}
              onChange={handleInputChange}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>محتوى الإشعار:</label>
            <textarea
              name="content"
              value={notificationForm.content}
              onChange={handleInputChange}
              className="form-control"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>نوع الإشعار:</label>
            <select
              name="type"
              value={notificationForm.type}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="">اختر نوع الإشعار</option>
              <option value="عام">عام</option>
              <option value="مهم">مهم</option>
              <option value="عاجل">عاجل</option>
            </select>
          </div>

          <div className="form-buttons">
            <button type="submit" className="primary-button">
              {selectedNotification ? 'تحديث الإشعار' : 'إضافة الإشعار'}
            </button>
            <button type="button" onClick={clearForm} className="secondary-button">
              إعادة تعيين
            </button>
          </div>
        </form>
      </div>

      <div className="search-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="بحث في الإشعارات"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>النوع</th>
              <th>المنشئ</th>
              <th>التاريخ</th>
              <th>عدد القراء</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.map(notification => (
              <tr key={notification.id}>
                <td>{notification.title}</td>
                <td>{notification.type}</td>
                <td>{notification.createdBy}</td>
                <td>{notification.createdAt?.toLocaleString()}</td>
                <td>{notification.readCount || 0}</td>
                <td className="actions-cell">
                  <button onClick={() => handleRead(notification)} className="primary-button">
                    قراءة
                  </button>
                  <button onClick={() => handleEdit(notification)} className="edit-button">
                  تعديل
                  </button>
                  <button onClick={() => handleDelete(notification.id)} className="delete-button">
                    حذف
                  </button>
                  <button onClick={() => handleShowReaders(notification.id)} className="details-button">
                    القراء
                  </button>
                </td>
              </tr>
            ))}
            {filteredNotifications.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">
                  لا توجد إشعارات متاحة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* نافذة عرض الإشعار */}
      {showModal && selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setShowModal(false)}
          onConfirm={confirmRead}
        />
      )}

      {/* نافذة عرض القراء */}
      {showReadersModal && (
        <ReadersModal
          readers={readers}
          onClose={() => setShowReadersModal(false)}
        />
      )}
    </div>
  );
}

export default NotificationsPage;