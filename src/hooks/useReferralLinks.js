// hooks/useReferralLinks.js

import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';

const useReferralLinks = () => {
  const [referralLinks, setReferralLinks] = useState([]);
  const [stats, setStats] = useState({});
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [currentReferralLink, setCurrentReferralLink] = useState('');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');

  const currentUser = auth.currentUser;

  // جلب المشاريع من مجموعة Loyapp ومستند projects
  const fetchProjects = async () => {
    try {
      const projectsDocRef = doc(db, 'Loyapp', 'projects');
      const projectsDocSnap = await getDoc(projectsDocRef);
      if (projectsDocSnap.exists()) {
        const data = projectsDocSnap.data();
        if (data.items && Array.isArray(data.items)) {
          setProjects(data.items);
        } else {
          console.error('لم يتم العثور على مصفوفة المشاريع في مستند projects.');
          setProjects([]);
        }
      } else {
        console.error('لم يتم العثور على مستند projects في مجموعة Loyapp.');
        setProjects([]);
      }
    } catch (error) {
      console.error('خطأ في جلب المشاريع:', error);
      setProjects([]);
    }
  };

  // جلب قائمة الأعضاء
  const fetchMembers = async () => {
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
    }
  };

  // جلب روابط الإحالة الخاصة بالمستخدم
  const fetchReferralLinks = async () => {
    setLoading(true);
    try {
      const referralLinksRef = collection(db, 'referralLinks');
      const q = query(referralLinksRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const links = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        links.push({ id: docSnap.id, ...data });
      });
      setReferralLinks(links);
    } catch (error) {
      console.error('خطأ في جلب روابط الإحالة:', error);
      setReferralLinks([]);
    } finally {
      setLoading(false);
    }
  };

  // إنشاء رابط إحالة جديد
  const generateReferralLink = async () => {
    if (!selectedProject) {
      alert('يرجى اختيار مشروع قبل إنشاء رابط الإحالة');
      return;
    }
  
    if (!selectedMember) {
      alert('يرجى اختيار العضو الذي تريد ربط الرابط به');
      return;
    }
  
    setLoading(true);
    try {
      const selectedProjectObj = projects.find((p) => p.id === selectedProject);
      if (!selectedProjectObj) {
        alert('المشروع المحدد غير موجود');
        setLoading(false);
        return;
      }
  
      const referralCode = `REF-${selectedMember}-${Date.now()}`;
      const referralLink = `${selectedProjectObj.link}?ref=${referralCode}&project=${selectedProject}`;
  
      // Save referral link with projectName
      const newReferralLink = {
        userId: currentUser.uid,
        memberId: selectedMember,
        referralCode,
        referralLink,
        projectId: selectedProject,
        projectName: selectedProjectObj.name, // Add projectName here
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'referralLinks'), newReferralLink);
  
      alert('تم إنشاء رابط الإحالة بنجاح!');
      // Refresh the referral links list
      await fetchReferralLinks();
    } catch (error) {
      console.error('خطأ في إنشاء رابط الإحالة:', error);
      alert('حدث خطأ أثناء إنشاء رابط الإحالة');
    } finally {
      setLoading(false);
    }
  };
  

  // جلب الإحصائيات والإحالات لرابط إحالة محدد
  const fetchStatsAndReferrals = async (referralCode) => {
    setLoading(true);
    try {
      // جلب الإحالات
      const referralsRef = collection(db, 'users');
      const q = query(referralsRef, where('referredBy', '==', referralCode));
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

      // تحديث الإحصائيات
      setStats({
        clicks: referralsList.length * 2, // مثال: عدد النقرات ضعف عدد التسجيلات
        signUps: referralsList.length,
        rewards: referralsList.length * 10, // مثال: 10 نقاط لكل تسجيل
      });
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات والإحالات:', error);
      setReferrals([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // نسخ الرابط إلى الحافظة
  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    alert('تم نسخ رابط الإحالة إلى الحافظة');
  };

  // مشاركة الرابط على واتساب
  const shareOnWhatsApp = (link) => {
    const message = encodeURIComponent('انضم إلي في هذا المشروع المميز!\n' + link);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const shareUrl = isMobile
      ? `whatsapp://send?text=${message}`
      : `https://web.whatsapp.com/send?text=${message}`;
    window.open(shareUrl, '_blank');
  };

  // مشاركة الرابط على إنستجرام
  const shareOnInstagram = (link) => {
    const message = `انضم إلي في هذا المشروع المميز!\n${link}`;
    copyToClipboard(message);
    alert('تم نسخ الرسالة للمشاركة على إنستجرام.');
  };

  // عند اختيار رابط إحالة لعرض إحصائياته
  const handleReferralLinkClick = (referralLink) => {
    setCurrentReferralLink(referralLink);
    fetchStatsAndReferrals(referralLink.referralCode);
  };

  // دالة للحصول على اسم العضو من معرفه
  const getMemberNameById = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : 'عضو غير معروف';
  };

  // دالة للحصول على اسم المشروع من معرفه
  const getProjectNameById = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'مشروع غير معروف';
  };

  useEffect(() => {
    fetchProjects();
    fetchMembers();
    fetchReferralLinks();
  }, []);

  return {
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
    members,
    selectedMember,
    setSelectedMember,
    getMemberNameById,
    getProjectNameById,
  };
};

export default useReferralLinks;
