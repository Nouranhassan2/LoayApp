// hooks/useMemberRegistration.js
import { useState } from 'react';
import { citiesList, getDistrictsForCity } from '../components/citiesData';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

function useMemberRegistration() {
  const [cities] = useState(citiesList);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateDistricts = (cityName) => {
    const districtsForCity = getDistrictsForCity(cityName);
    setDistricts(districtsForCity);
  };

  const registerMember = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Form data received:", formData); // تحقق من القيم المستلمة
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userData = {
        id: user.uid,
        name: formData.name || 'غير معروف', // تأكد من وجود قيمة افتراضية
        email: user.email,
        phoneNumber: formData.mobile || '',
        city: formData.city || '',
        district: formData.district || '',
        createdAt: Timestamp.now(),
        role: 'member',
      };

      console.log("User data to be saved in Firestore:", userData); // تحقق من القيم التي سيتم تخزينها
      await setDoc(doc(db, 'users', user.uid), userData);

      alert('تم تسجيل عضويتك بنجاح!');
    } catch (err) {
      console.error('Registration failed:', err);
      setError('فشل التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return {
    cities,
    districts,
    loading,
    error,
    updateDistricts,
    registerMember,
  };
}

export default useMemberRegistration;
