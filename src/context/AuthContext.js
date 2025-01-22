// context/AuthContext.js

import React, { useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // وظيفة لجلب بيانات المستخدم من Firestore
  const fetchUserData = async (user) => {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      setCurrentUser({ uid: user.uid, email: user.email, ...userData });
    } else {
      // إذا لم يكن للمستخدم بيانات في Firestore، يمكنك إنشاء مستند جديد أو التعامل مع الحالة
      const userData = {
        id: user.uid,
        name: user.displayName || user.email || 'مستخدم بدون اسم',
        email: user.email || '',
        role: 'member',
        isActive: true,
        createdAt: Timestamp.now(),
        points: 0,
        referralCode: '',
        phoneNumber: user.phoneNumber || '',
        city: '',
        district: '',
        birthDate: null,
        joinDate: Timestamp.now(),
        membershipLevel: 'bronze',
      };
      await setDoc(docRef, userData);
      setCurrentUser({ uid: user.uid, ...userData });
    }
    setLoading(false);
  };

  // دالة تسجيل الخروج
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    logout, // تأكد من تضمين دالة logout هنا
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
