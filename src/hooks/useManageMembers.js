// hooks/useManageMembers.js

import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

const useManageMembers = () => {
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [formData, setFormData] = useState({});
  const [activities, setActivities] = useState([]);
  const [referralLinks, setReferralLinks] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // جلب قائمة الأعضاء
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const membersRef = collection(db, 'users');
      const q = query(membersRef, where('role', '==', 'member'));
      const querySnapshot = await getDocs(q);
      const membersList = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        membersList.push({
          id: docSnap.id,
          name: data.name || 'مستخدم بدون اسم',
          email: data.email || 'لا يوجد بريد إلكتروني',
        });
      });
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب بيانات العضو المحدد
  const fetchMemberData = async (memberId) => {
    setLoading(true);
    try {
      const memberRef = doc(db, 'users', memberId);
      const memberSnap = await getDoc(memberRef);
      if (memberSnap.exists()) {
        const data = memberSnap.data();
        setMemberData(data);
        setFormData({
          name: data.name || '',
          phoneNumber: data.phoneNumber || '',
          city: data.city || '',
          district: data.district || '',
          birthDate:
            data.birthDate instanceof Timestamp
              ? data.birthDate.toDate().toISOString().split('T')[0]
              : '',
          membershipLevel: data.membershipLevel || 'bronze',
          points: data.points || 0,
        });
        await fetchMemberReferralLinks(memberId);
        await fetchMemberReferrals(memberId);
        await fetchMemberActivities(memberId);
        await fetchRedeemedPoints(memberId);
      } else {
        console.error('Member not found');
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  // جلب روابط الإحالة الخاصة بالعضو
  const fetchMemberReferralLinks = async (memberId) => {
    try {
      const referralLinksRef = collection(db, 'referralLinks');
      const q = query(referralLinksRef, where('memberId', '==', memberId));
      const querySnapshot = await getDocs(q);
      const links = [];
      querySnapshot.forEach((docSnap) => {
        links.push(docSnap.data());
      });
      setReferralLinks(links);
    } catch (error) {
      console.error('Error fetching referral links:', error);
    }
  };

  // جلب الإحالات الخاصة برابط الإحالة للعضو
  const fetchMemberReferrals = async (memberId) => {
    try {
      const referralsRef = collection(db, 'users');
      const q = query(referralsRef, where('referredBy', '==', memberId));
      const querySnapshot = await getDocs(q);
      const referralsList = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        referralsList.push({
          name: data.name || 'غير معروف',
          email: data.email || 'غير معروف',
          date: data.createdAt || null,
        });
      });
      setReferrals(referralsList);
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  // جلب الأنشطة والنقاط المكتسبة
  const fetchMemberActivities = async (memberId) => {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(activitiesRef, where('memberId', '==', memberId));
      const querySnapshot = await getDocs(q);
      const activitiesList = [];
      querySnapshot.forEach((docSnap) => {
        activitiesList.push(docSnap.data());
      });
      setActivities(activitiesList);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  // جلب النقاط المستبدلة
  const fetchRedeemedPoints = async (memberId) => {
    try {
      const redemptionsRef = collection(db, 'redemptions');
      const q = query(redemptionsRef, where('memberId', '==', memberId));
      const querySnapshot = await getDocs(q);
      let totalRedeemed = 0;
      querySnapshot.forEach((docSnap) => {
        totalRedeemed += docSnap.data().points || 0;
      });
      setRedeemedPoints(totalRedeemed);
    } catch (error) {
      console.error('Error fetching redeemed points:', error);
    }
  };

  // تحديث بيانات العضو
  const updateMemberData = async () => {
    setLoading(true);
    setFormErrors({});
    try {
      // تحقق من صحة البيانات
      const errors = {};
      if (!formData.name.trim()) errors.name = 'الاسم مطلوب';
      if (!formData.phoneNumber.trim()) errors.phoneNumber = 'رقم الهاتف مطلوب';
      if (!formData.city.trim()) errors.city = 'المدينة مطلوبة';
      if (!formData.district.trim()) errors.district = 'الحي مطلوب';
      if (!/^\d+$/.test(formData.phoneNumber)) errors.phoneNumber = 'رقم الهاتف يجب أن يحتوي على أرقام فقط';
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setLoading(false);
        return;
      }

      const memberRef = doc(db, 'users', selectedMemberId);
      const updatedData = {
        ...formData,
        birthDate: formData.birthDate ? Timestamp.fromDate(new Date(formData.birthDate)) : null,
        updatedAt: Timestamp.now(),
      };
      await updateDoc(memberRef, updatedData);
      alert('تم تحديث بيانات العضو بنجاح');
    } catch (error) {
      console.error('Error updating member data:', error);
      alert('حدث خطأ أثناء تحديث بيانات العضو');
    } finally {
      setLoading(false);
    }
  };

  // تفعيل/تعطيل العضو
  const toggleMemberStatus = async () => {
    if (!window.confirm('هل أنت متأكد من تغيير حالة العضو؟')) return;
    setLoading(true);
    try {
      const memberRef = doc(db, 'users', selectedMemberId);
      const newStatus = !memberData.isActive;
      await updateDoc(memberRef, { isActive: newStatus });
      setMemberData((prevData) => ({ ...prevData, isActive: newStatus }));
      alert(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} العضو بنجاح`);
    } catch (error) {
      console.error('Error toggling member status:', error);
      alert('حدث خطأ أثناء تغيير حالة العضو');
    } finally {
      setLoading(false);
    }
  };

  // إعادة تعيين كلمة مرور العضو
  const resetMemberPassword = async () => {
    if (!window.confirm('هل أنت متأكد من إعادة تعيين كلمة مرور العضو؟')) return;
    setLoading(true);
    try {
      const email = memberData.email;
      await sendPasswordResetEmail(auth, email);
      alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للعضو');
    } catch (error) {
      console.error('Error resetting member password:', error);
      alert('حدث خطأ أثناء إعادة تعيين كلمة مرور العضو');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      fetchMemberData(selectedMemberId);
    } else {
      setMemberData(null);
      setFormData({});
      setActivities([]);
      setReferralLinks([]);
      setReferrals([]);
      setRedeemedPoints(0);
    }
  }, [selectedMemberId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };

  return {
    members,
    selectedMemberId,
    setSelectedMemberId,
    memberData,
    formData,
    handleInputChange,
    updateMemberData,
    activities,
    referralLinks,
    referrals,
    redeemedPoints,
    loading,
    formErrors,
    toggleMemberStatus,
    resetMemberPassword,
  };
};

export default useManageMembers;
