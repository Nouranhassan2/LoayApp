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
  // Removed addDoc and Timestamp import (we won’t use them for creation)
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

  // --------------------------------------------------------------------
  // 1) Fetch projects (still done directly from Firestore for now)
  // --------------------------------------------------------------------
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

  // --------------------------------------------------------------------
  // 2) Fetch members (still from Firestore)
  // --------------------------------------------------------------------
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

  // --------------------------------------------------------------------
  // 3) Fetch user's existing referral links (still from Firestore)
  // --------------------------------------------------------------------
  const fetchReferralLinks = async () => {
    if (!currentUser) return;
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

  // --------------------------------------------------------------------
  // 4) Create a referral link (NOW via the unified API endpoint)
  // --------------------------------------------------------------------
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
      // Call the new unified endpoint instead of using Firestore client SDK
      const response = await fetch(
        "https://us-central1-loyapp-343d9.cloudfunctions.net/api/api/referrals/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: selectedMember,
            projectId: selectedProject,
            creatorUserId: currentUser.uid,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'حدث خطأ أثناء إنشاء رابط الإحالة');
      }

      // If successful
      const result = await response.json();
      alert('تم إنشاء رابط الإحالة بنجاح!');

      // Re-fetch the local list of referralLinks from Firestore
      // so your UI updates with the newly created link
      await fetchReferralLinks();
    } catch (error) {
      console.error('خطأ في إنشاء رابط الإحالة:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------
  // 5) Fetch stats & referrals (still partial, direct from Firestore)
  // --------------------------------------------------------------------
  const fetchStatsAndReferrals = async (referralCode) => {
    setLoading(true);
    try {
      // For demonstration, still directly queries Firestore:
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

      // Example stats calculation
      setStats({
        clicks: referralsList.length * 2, // افتراض
        signUps: referralsList.length,
        rewards: referralsList.length * 10, // افتراض
      });
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات والإحالات:', error);
      setReferrals([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------
  // 6) Helper functions for copying/sharing
  // --------------------------------------------------------------------
  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    alert('تم نسخ رابط الإحالة إلى الحافظة');
  };

  const shareOnWhatsApp = (link) => {
    const message = encodeURIComponent('انضم إلي في هذا المشروع المميز!\n' + link);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const shareUrl = isMobile
      ? `whatsapp://send?text=${message}`
      : `https://web.whatsapp.com/send?text=${message}`;
    window.open(shareUrl, '_blank');
  };

  const shareOnInstagram = (link) => {
    const message = `انضم إلي في هذا المشروع المميز!\n${link}`;
    copyToClipboard(message);
    alert('تم نسخ الرسالة للمشاركة على إنستجرام.');
  };

  const handleReferralLinkClick = (referralLink) => {
    setCurrentReferralLink(referralLink);
    fetchStatsAndReferrals(referralLink.referralCode);
  };

  // --------------------------------------------------------------------
  // 7) Get display names for members/projects
  // --------------------------------------------------------------------
  const getMemberNameById = (memberId) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : 'عضو غير معروف';
  };

  const getProjectNameById = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'مشروع غير معروف';
  };

  // --------------------------------------------------------------------
  // 8) Initialize data
  // --------------------------------------------------------------------
  useEffect(() => {
    fetchProjects();
    fetchMembers();
    fetchReferralLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------
  // Return all state/functions needed by the UI
  // --------------------------------------------------------------------
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
