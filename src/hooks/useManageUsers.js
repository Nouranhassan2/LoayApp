// hooks/useManageUsers.js

import { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import {
  collection,
  setDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { citiesList, getDistrictsForCity } from '../components/citiesData';

const useManageUsers = (recordsPerPage, searchTerm) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cities] = useState(citiesList);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // جلب المستخدمين مع معالجة البيانات
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, 'users');
      let q;

      if (searchTerm) {
        q = query(
          usersRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          limit(recordsPerPage)
        );
      } else {
        // لا نستخدم orderBy('name') هنا لتجنب استبعاد المستندات التي لا تحتوي على الحقل 'name'
        q = query(usersRef, limit(recordsPerPage));
      }

      const querySnapshot = await getDocs(q);
      const usersList = [];
      querySnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        const formattedUser = {
          ...userData,
          id: docSnap.id,
          joinDate:
            userData.joinDate instanceof Timestamp
              ? userData.joinDate.toDate().toISOString().split('T')[0]
              : userData.joinDate || '',
          birthDate:
            userData.birthDate instanceof Timestamp
              ? userData.birthDate.toDate().toISOString().split('T')[0]
              : userData.birthDate || '',
        };
        usersList.push(formattedUser);
      });

      // ترتيب النتائج بعد جلبها
      if (!searchTerm) {
        usersList.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
      }

      setUsers(usersList);
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      setError('حدث خطأ أثناء جلب بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  // جلب الأدوار المتاحة
  const fetchRoles = async () => {
    try {
      const rolesDocRef = doc(db, 'Loyapp', 'roles');
      const rolesSnapshot = await getDoc(rolesDocRef);

      if (rolesSnapshot.exists()) {
        const rolesData = rolesSnapshot.data();
        const rolesList = rolesData.items || [];
        setRoles(rolesList);
      } else {
        console.log('لا يوجد مستند roles');
        setRoles(['admin', 'member']);
      }
    } catch (error) {
      console.error('خطأ في جلب الأدوار:', error);
      setError('حدث خطأ أثناء جلب الأدوار المتاحة');
    }
  };

  // تحديث قائمة الأحياء عند اختيار المدينة
  const updateDistricts = (cityName) => {
    if (cityName) {
      setDistricts(getDistrictsForCity(cityName));
    } else {
      setDistricts([]);
    }
  };

  // إضافة مستخدم جديد
  const addUser = async (user) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      const uid = userCredential.user.uid;

      const userData = {
        id: uid,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
        createdAt: Timestamp.now(),
        ...(user.role === 'member' && {
          points: Number(user.points) || 0,
          referralCode: user.referralCode || '',
          phoneNumber: user.phoneNumber || '',
          city: user.city || '',
          district: user.district || '',
          birthDate: user.birthDate ? Timestamp.fromDate(new Date(user.birthDate)) : null,
          joinDate: Timestamp.fromDate(new Date()),
          membershipLevel: user.membershipLevel || 'bronze',
        }),
      };

      await setDoc(doc(db, 'users', uid), userData);
      await fetchUsers();
      return { success: true, message: 'تم إضافة المستخدم بنجاح' };
    } catch (error) {
      console.error('خطأ في إضافة المستخدم:', error);
      let errorMessage = 'حدث خطأ أثناء إضافة المستخدم';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // تحديث بيانات المستخدم
  const updateUser = async (userId, updatedData) => {
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', userId);

      const dataToUpdate = {
        ...updatedData,
        updatedAt: Timestamp.now(),
        ...(updatedData.birthDate && {
          birthDate: Timestamp.fromDate(new Date(updatedData.birthDate)),
        }),
        ...(updatedData.joinDate && {
          joinDate: Timestamp.fromDate(new Date(updatedData.joinDate)),
        }),
      };

      delete dataToUpdate.password;
      delete dataToUpdate.id;
      delete dataToUpdate.email; // لا نسمح بتغيير البريد الإلكتروني

      await updateDoc(userRef, dataToUpdate);
      await fetchUsers();
      return { success: true, message: 'تم تحديث بيانات المستخدم بنجاح' };
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      throw new Error('حدث خطأ أثناء تحديث بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  // حذف المستخدم
  const deleteUserAccount = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const functions = getFunctions();
      const deleteUserFunction = httpsCallable(functions, 'deleteUserAccount');
      const result = await deleteUserFunction({ uid: userId });

      if (result.data.success) {
        // تم حذف المستخدم بنجاح
        await fetchUsers();
        return { success: true, message: 'تم حذف المستخدم بنجاح' };
      }
      throw new Error(result.data.message || 'فشل حذف المستخدم');
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      let errorMessage = 'حدث خطأ أثناء حذف المستخدم';
      if (error.code === 'functions/not-found') {
        errorMessage = 'المستخدم غير موجود';
      }
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // تفعيل/تعطيل حساب المستخدم
  const toggleUserAccount = async (userId, isActive) => {
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !isActive,
        lastStatusUpdate: Timestamp.now(),
      });
      await fetchUsers();
      return {
        success: true,
        message: `تم ${isActive ? 'تعطيل' : 'تفعيل'} حساب المستخدم بنجاح`,
      };
    } catch (error) {
      console.error('خطأ في تغيير حالة المستخدم:', error);
      throw new Error('حدث خطأ أثناء محاولة تغيير حالة المستخدم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [recordsPerPage, searchTerm]);

  return {
    users,
    roles,
    selectedUser,
    setSelectedUser,
    addUser,
    updateUser,
    deleteUserAccount,
    toggleUserAccount,
    fetchUsers,
    cities,
    districts,
    updateDistricts,
    loading,
    error,
  };
};

export default useManageUsers;
