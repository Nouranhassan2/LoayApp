// src/components/AddEditUser.js

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import '../App.css'; // استخدام ملف CSS الرئيسي

function AddEditUser({ userId, roles, onClose, onSave }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const isNewUser = !userId;

  useEffect(() => {
    if (!isNewUser) {
      // جلب بيانات المستخدم للتعديل
      const fetchUser = async () => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || '');
          setEmail(userData.email || '');
          setRole(userData.role || '');
        }
      };
      fetchUser();
    }
  }, [userId]);

  const saveUser = async () => {
    if (isNewUser) {
      // إنشاء مستخدم جديد في Firebase Authentication
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        // إضافة بياناته إلى مجموعة users في Firestore
        await setDoc(doc(db, 'users', uid), {
          name,
          email,
          role,
        });
        onSave();
      } catch (error) {
        console.error('Error creating user:', error);
        alert('حدث خطأ أثناء إنشاء المستخدم. يرجى المحاولة مرة أخرى.');
      }
    } else {
      // تحديث بيانات المستخدم في Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name,
        role,
      });
      onSave();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="add-edit-user modal">
        <h2>{isNewUser ? 'إضافة مستخدم جديد' : 'تعديل مستخدم'}</h2>
        <label>الاسم:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

        <label>البريد الإلكتروني:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isNewUser} />

        {isNewUser && (
          <>
            <label>كلمة المرور:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </>
        )}

        <label>الدور:</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">اختر الدور</option>
          {roles.map((roleItem) => (
            <option key={roleItem.id} value={roleItem.name}>
              {roleItem.name}
            </option>
          ))}
        </select>

        <div className="modal-buttons">
          <button onClick={saveUser}>{isNewUser ? 'إضافة' : 'حفظ'}</button>
          <button onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default AddEditUser;
