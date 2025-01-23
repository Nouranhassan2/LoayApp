// hooks/useManageActivities.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import * as XLSX from 'xlsx';

const useManageActivities = (recordsPerPage, searchTerm) => {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);

  // جلب الأنشطة
  const fetchActivities = async () => {
    try {
      const activitiesRef = collection(db, 'activities');
      let q;
  
      if (searchTerm) {
        q = query(
          activitiesRef,
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          orderBy('name'), // Requires an index
          limit(recordsPerPage)
        );
      } else {
        q = query(
          activitiesRef,
          orderBy('createdAt', 'desc'), // Sort by creation date
          limit(recordsPerPage)
        );
      }
  
      const querySnapshot = await getDocs(q);
      const activitiesList = [];
      querySnapshot.forEach((doc) => {
        activitiesList.push({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toLocaleDateString('ar-SA') || ''
        });
      });
      console.log("Fetched activities:", activitiesList); // Verify updated data

      setActivities(activitiesList);
    } catch (error) {
      console.error('خطأ في جلب الأنشطة:', error);
      alert('تعذر تحميل الأنشطة. الرجاء المحاولة لاحقًا.');
    }
  };
  

  // التحقق من تكرار اسم النشاط
  const checkActivityNameSimilarity = async (name) => {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(activitiesRef);
      const querySnapshot = await getDocs(q);
      
      const existingNames = querySnapshot.docs.map(doc => doc.data().name.toLowerCase());
      const currentName = name.toLowerCase();

      // التحقق من التطابق التام
      if (existingNames.includes(currentName)) {
        return { exists: true, message: 'يوجد نشاط بنفس الاسم' };
      }

      // التحقق من التشابه (أكثر من 6 حروف متطابقة)
      for (const existingName of existingNames) {
        let commonChars = 0;
        for (let i = 0; i < currentName.length; i++) {
          if (existingName.includes(currentName[i])) {
            commonChars++;
          }
          if (commonChars > 6) {
            return { 
              similar: true, 
              message: 'يوجد تشابه كبير مع نشاط موجود' 
            };
          }
        }
      }

      return { exists: false, similar: false };
    } catch (error) {
      console.error('خطأ في التحقق من تكرار الاسم:', error);
      throw new Error('حدث خطأ أثناء التحقق من تكرار الاسم');
    }
  };

  // إضافة نشاط جديد
  const addActivity = async (activity) => {
    try {
      const similarity = await checkActivityNameSimilarity(activity.name);
      if (similarity.exists) {
        throw new Error(similarity.message);
      }
      if (similarity.similar) {
        if (!window.confirm(similarity.message + '\nهل تريد المتابعة؟')) {
          return false;
        }
      }

      const newActivity = {
        ...activity,
        createdAt: Timestamp.now(),
        participantsCount: Number(activity.participantsCount) || 0,
        points: Number(activity.points) || 0,
        projectName:activity.projectName,
        isActive: true, // Default value for new activities

      };

      const docRef = doc(collection(db, 'activities'));
      await setDoc(docRef, newActivity);
      
      await fetchActivities();
      return true;
    } catch (error) {
      console.error('خطأ في إضافة النشاط:', error);
      throw error;
    }
  };

  // تحديث نشاط
  const updateActivity = async (activityId, updatedData) => {
    try {
      if (updatedData.name !== selectedActivity.name) {
        const similarity = await checkActivityNameSimilarity(updatedData.name);
        if (similarity.exists) {
          throw new Error(similarity.message);
        }
        if (similarity.similar) {
          if (!window.confirm(similarity.message + '\nهل تريد المتابعة؟')) {
            return false;
          }
        }
      }

      const activityRef = doc(db, 'activities', activityId);
      await updateDoc(activityRef, {
        ...updatedData,
        updatedAt: Timestamp.now(),
        participantsCount: Number(updatedData.participantsCount),
        points: Number(updatedData.points)
      });

      await fetchActivities();
      return true;
    } catch (error) {
      console.error('خطأ في تحديث النشاط:', error);
      throw error;
    }
  };

  // حذف نشاط
  const deleteActivity = async (activityId) => {
    try {
      const activityRef = doc(db, 'activities', activityId);
      await deleteDoc(activityRef);
      await fetchActivities();
      return true;
    } catch (error) {
      console.error('خطأ في حذف النشاط:', error);
      throw new Error('حدث خطأ أثناء حذف النشاط');
    }
  };

  // تصدير إلى Excel
  const exportToExcel = () => {
    try {
      const exportData = activities.map(activity => ({
        'اسم النشاط': activity.name,
        'الوصف': activity.description,
        'النقاط': activity.points,
        'عدد المشتركين': activity.participantsCount,
        'تاريخ الإنشاء': activity.createdAt
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      
      // تعديل عرض الأعمدة
      const colWidths = [
        { wch: 20 }, // اسم النشاط
        { wch: 30 }, // الوصف
        { wch: 10 }, // النقاط
        { wch: 15 }, // عدد المشتركين
        { wch: 15 }  // تاريخ الإنشاء
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "الأنشطة");
      XLSX.writeFile(wb, `الأنشطة-${new Date().toLocaleDateString('ar-SA')}.xlsx`);
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      throw new Error('حدث خطأ أثناء تصدير البيانات');
    }
  };

    

  // تحديث البيانات عند تغيير عدد السجلات أو مصطلح البحث
  useEffect(() => {
    fetchActivities();
  }, [recordsPerPage, searchTerm]); // This is already correct
  

  return {
    activities,
    selectedActivity,
    setSelectedActivity,
    addActivity,
    updateActivity,
    deleteActivity,
    fetchActivities,
    exportToExcel
  };
};

export default useManageActivities;