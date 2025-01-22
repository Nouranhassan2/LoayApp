// hooks/useRewardsManagement.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc,
  updateDoc,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const useRewardsManagement = (currentUser) => {
  const [availableRewards, setAvailableRewards] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  // جلب المكافآت المتاحة
  const fetchAvailableRewards = async () => {
    try {
      const rewardsRef = collection(db, 'rewardTypes');
      const querySnapshot = await getDocs(rewardsRef);
      
      const rewards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAvailableRewards(rewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      throw new Error('حدث خطأ أثناء جلب المكافآت المتاحة');
    }
  };

  // جلب مكافآت المستخدم
  const fetchUserRewards = async () => {
    try {
      const rewardsRef = collection(db, 'rewards');
      const q = query(
        rewardsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const rewards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        redeemedAt: doc.data().redeemedAt?.toDate()
      }));

      setUserRewards(rewards);
    } catch (error) {
      console.error('Error fetching user rewards:', error);
      throw new Error('حدث خطأ أثناء جلب مكافآتك');
    }
  };

  // جلب نقاط المستخدم
  const fetchUserPoints = async () => {
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setUserPoints(userDoc.data().points || 0);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
      throw new Error('حدث خطأ أثناء جلب رصيد النقاط');
    }
  };

  // استبدال المكافأة
  const redeemReward = async (rewardId) => {
    try {
      // التحقق من المكافأة
      const rewardRef = doc(db, 'rewardTypes', rewardId);
      const rewardDoc = await getDoc(rewardRef);
      
      if (!rewardDoc.exists()) {
        throw new Error('المكافأة غير موجودة');
      }

      const rewardData = rewardDoc.data();

      // التحقق من رصيد النقاط
      if (userPoints < rewardData.points) {
        throw new Error('رصيد النقاط غير كافٍ');
      }

      // إضافة سجل الاستبدال
      const rewardRecord = {
        userId: currentUser.uid,
        rewardId: rewardId,
        rewardName: rewardData.name,
        points: rewardData.points,
        status: 'pending',
        redeemedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'rewards'), rewardRecord);

      // تحديث نقاط المستخدم
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        points: userPoints - rewardData.points
      });

      // تحديث البيانات المحلية
      await Promise.all([
        fetchUserPoints(),
        fetchUserRewards()
      ]);

      return true;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  };

  // تحديث البيانات
  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAvailableRewards(),
        fetchUserRewards(),
        fetchUserPoints()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser]);

  return {
    availableRewards,
    userRewards,
    userPoints,
    loading,
    redeemReward,
    refreshData
  };
};

export default useRewardsManagement;