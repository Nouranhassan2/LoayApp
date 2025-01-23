// hooks/useNotificationsManagement.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  getDoc, 
  arrayUnion, 
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const useNotificationsManagement = (currentUser) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [readers, setReaders] = useState([]);
  
  // جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('حدث خطأ أثناء جلب الإشعارات');
    }
  };

  // إضافة إشعار جديد
  const addNotification = async (notificationData) => {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        createdBy: currentUser?.displayName || currentUser?.email,
        createdAt: Timestamp.now(),
        readCount: 0,
        readers: [],
      });

      // إظهار الإشعار في المتصفح
      if (Notification.permission === 'granted') {
        new Notification(notificationData.title, {
          body: notificationData.content,
        });
      }

      await fetchNotifications();
      return docRef.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw new Error('حدث خطأ أثناء إضافة الإشعار');
    }
  };

  // تحديث إشعار
  const updateNotification = async (notificationId, updatedData) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        ...updatedData,
        updatedAt: Timestamp.now()
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('حدث خطأ أثناء تحديث الإشعار');
    }
  };

  // حذف إشعار 
  const deleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('حدث خطأ أثناء حذف الإشعار');
    }
  };

  // تسجيل قراءة الإشعار
  const markAsRead = async (notificationId) => {
    if (!currentUser) return;

    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (notificationDoc.exists()) {
        const notificationData = notificationDoc.data();
        const readers = notificationData.readers || [];

        if (!readers.some(reader => reader.id === currentUser.uid)) {
          await updateDoc(notificationRef, {
            readers: arrayUnion({
              id: currentUser.uid,
              name: currentUser.displayName || currentUser.email,
              readAt: Timestamp.now()
            }),
            readCount: (notificationData.readCount || 0) + 1
          });
          await fetchNotifications();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('حدث خطأ أثناء تسجيل قراءة الإشعار');
    }
  };

  // جلب قائمة القراء
  const fetchReaders = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);
      
      if (notificationDoc.exists()) {
        const readers = notificationDoc.data().readers || [];
        setReaders(readers.map(reader => ({
          ...reader,
          readAt: reader.readAt.toDate()
        })));
        return readers;
      }
      return [];
    } catch (error) {
      console.error('Error fetching readers:', error);
      throw new Error('حدث خطأ أثناء جلب قائمة القراء');
    }
  };

  // طلب إذن الإشعارات
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
  }, []);

  return {
    notifications,
    selectedNotification,
    setSelectedNotification,
    readers,
    addNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    fetchReaders,
    fetchNotifications
  };
};

export default useNotificationsManagement;