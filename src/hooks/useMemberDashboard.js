// hooks/useMemberDashboard.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const useMemberDashboard = (currentUser) => {
  const [memberData, setMemberData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    activitiesCount: 0,
    rewardsCount: 0,
    unreadNotifications: 0
  });
  const [loading, setLoading] = useState(true);

  // جلب بيانات العضو
  const fetchMemberData = async () => {
    try {
      if (!currentUser) return;
      
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setMemberData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      throw new Error('حدث خطأ أثناء جلب بيانات العضو');
    }
  };

  // جلب الأنشطة
  const fetchActivities = async () => {
    try {
      if (!currentUser) return;

      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('participants', 'array-contains', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const activitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      console.log("Fetched activities:", activitiesList); // Debugging line

      setActivities(activitiesList);
      console.log('Fetched Activities:', activitiesList); // Debug log

      setStats(prev => ({ ...prev, activitiesCount: activitiesList.length }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw new Error('حدث خطأ أثناء جلب الأنشطة');
    }
  };

  // جلب المكافآت
  const fetchRewards = async () => {
    try {
      if (!currentUser) return;

      const rewardsRef = collection(db, 'rewards');
      const q = query(
        rewardsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(q);
      const rewardsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      setRewards(rewardsList);
      setStats(prev => ({ ...prev, rewardsCount: rewardsList.length }));
    } catch (error) {
      console.error('Error fetching rewards:', error);
      throw new Error('حدث خطأ أثناء جلب المكافآت');
    }
  };

  // جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      if (!currentUser) return;

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const notificationsList = [];
      let unreadCount = 0;

      snapshot.docs.forEach(doc => {
        const notification = doc.data();
        const readers = notification.readers || [];
        const isRead = readers.some(reader => reader.id === currentUser.uid);
        
        if (!isRead) unreadCount++;

        notificationsList.push({
          id: doc.id,
          ...notification,
          isRead,
          createdAt: notification.createdAt?.toDate()
        });
      });

      setNotifications(notificationsList);
      setStats(prev => ({ ...prev, unreadNotifications: unreadCount }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('حدث خطأ أثناء جلب الإشعارات');
    }
  };

  const fetchAllActivities = async () => {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(activitiesRef, orderBy('createdAt', 'desc')); // Order by creation date
  
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        console.log("No activities found."); // Debugging log
        setActivities([]); // Clear activities if no data found
        return;
      }
  
      const activitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || null, // Convert Firestore timestamp to JS Date
      }));
  
      console.log("Fetched all activities:", activitiesList); // Debugging log
      setActivities(activitiesList); // Set activities state
    } catch (error) {
      console.error('Error fetching all activities:', error);
      throw new Error('حدث خطأ أثناء جلب جميع الأنشطة');
    }
  };
  
  // تسجيل قراءة الإشعار
  const markNotificationAsRead = async (notificationId) => {
    try {
      if (!currentUser) return false;

      const notificationRef = doc(db, 'notifications', notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (notificationDoc.exists()) {
        const notification = notificationDoc.data();
        const readers = notification.readers || [];

        if (!readers.some(reader => reader.id === currentUser.uid)) {
          await updateDoc(notificationRef, {
            readers: [
              ...readers,
              {
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email,
                readAt: Timestamp.now()
              }
            ],
            readCount: (notification.readCount || 0) + 1
          });

          // تحديث القائمة المحلية
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === notificationId 
                ? { ...notif, isRead: true }
                : notif
            )
          );

          setStats(prev => ({
            ...prev,
            unreadNotifications: Math.max(0, prev.unreadNotifications - 1)
          }));

          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('حدث خطأ أثناء تسجيل قراءة الإشعار');
    }
  };

  // تحديث البيانات
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMemberData(),
          fetchActivities(),
          fetchRewards(),
          fetchNotifications()
        ]);
        console.log('Activities:', activities); // Debug log
        

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  return {
    memberData,
    activities,
    rewards,
    notifications,
    stats,
    loading,
    fetchAllActivities,
    markNotificationAsRead,
    refreshData: async () => {
      await Promise.all([
        fetchMemberData(),
        fetchActivities(),
        fetchRewards(),
        fetchNotifications()
      ]);
    }
  };
};

export default useMemberDashboard;