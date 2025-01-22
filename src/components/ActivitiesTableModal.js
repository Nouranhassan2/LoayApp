import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, increment, query, where } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext'; // Import the AuthContext hook


const ActivitiesTableModal = ({ activities, userId, onClose }) => {
  const { currentUser } = useAuth(); // Access the authenticated user's data
  const [referralLinks, setReferralLinks] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]); // To store selected activities
  const [selectedProject, setSelectedProject] = useState(null); // To store selected project

  useEffect(() => {
    const fetchReferralLinks = async () => {
      try {
        const referralLinksRef = collection(db, 'referralLinks');
        const q = query(referralLinksRef, where('memberId', '==', userId));
        const snapshot = await getDocs(q);

        const links = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReferralLinks(links);
      } catch (err) {
        console.error('Error fetching referral links:', err);
      }
    };

    if (userId) {
      fetchReferralLinks();
    }
  }, [userId]);

  useEffect(() => {
    console.log('Updated Selected Activities:', selectedActivities);
  }, [selectedActivities]);
  
  useEffect(() => {
    console.log('Updated Selected Project:', selectedProject);
  }, [selectedProject]);
  

  const handleActivitySelection = (activity) => {
    setSelectedActivities((prev) =>
      prev.find((a) => a.id === activity.id)
        ? prev.filter((a) => a.id !== activity.id) // Remove if already selected
        : [...prev, activity] // Add if not selected
    );
    console.log('Selected Activities:', selectedActivities);
  };


  const handleSubscribe = async () => {
    if (!selectedActivities.length || !selectedProject) {
      alert('يرجى اختيار نشاط ومشروع قبل الاشتراك');
      return;
    }
  
    if (!currentUser) {
      alert('تعذر الحصول على تفاصيل المستخدم. يرجى تسجيل الدخول.');
      return;
    }
  
    try {
      const userActivitiesCollection = collection(db, 'users_activities');
  
      for (const activity of selectedActivities) {
        const activityRef = doc(userActivitiesCollection, activity.id);
        const activitySnapshot = await getDoc(activityRef);
  
        if (activitySnapshot.exists()) {
          const activityData = activitySnapshot.data();
  
          // Check if the user already exists in the document
          const existingUsers = activityData.users || [];
          const userAlreadyExists = existingUsers.some((user) => user.id === currentUser.uid);
  
          if (userAlreadyExists) {
            alert(`المستخدم مسجل بالفعل في النشاط: ${activity.name}`);
          } else {
            // Add the user to the activity document and update the referral link
            await updateDoc(activityRef, {
              users: [
                ...existingUsers,
                {
                  id: currentUser.uid,
                  name: currentUser.name,
                  email: currentUser.email,
                },
              ],
              participantsCount: increment(1),
              referralLink: selectedProject.referralLink || 'غير متوفر', // Add the referral link here
            });
            console.log(`تم تسجيل المستخدم في النشاط: ${activity.name}`);
          }
        } else {
          // Create a new document for the activity with the user and referral link
          await setDoc(activityRef, {
            ...activity,
            users: [
              {
                id: currentUser.uid,
                name: currentUser.name,
                email: currentUser.email,
              },
            ],
            participantsCount: 1,
            projectName: selectedProject.projectName || 'غير متوفر',
            referralLink: selectedProject.referralLink || 'غير متوفر', // Add the referral link here
            createdAt: new Date(),
          });
          console.log(`تم إنشاء نشاط جديد وتسجيل المستخدم: ${activity.name}`);
        }
      }
  
      alert('تم الاشتراك بنجاح!');
      setSelectedActivities([]); // Reset selected activities
      setSelectedProject(null); // Reset selected project
    } catch (error) {
      console.error('Error during subscription:', error);
      alert('حدث خطأ أثناء الاشتراك. حاول مرة أخرى.');
    }
  };
  
  
  

  // const handleSubscribe = async () => {
  
  //   if (!selectedActivities.length || !selectedProject) {
  //     alert('يرجى اختيار نشاط ومشروع قبل الاشتراك');
  //     return;
  //   }
  
  //   if (!currentUser) {
  //     alert('تعذر الحصول على تفاصيل المستخدم. يرجى تسجيل الدخول.');
  //     return;
  //   }
  
  //   try {
  //     const userActivitiesCollection = collection(db, 'users_activities');
  
  //     for (const activity of selectedActivities) {
  //       const activityRef = doc(userActivitiesCollection, activity.id);
  //       const activitySnapshot = await getDoc(activityRef);
  
  //       if (activitySnapshot.exists()) {
  //         const activityData = activitySnapshot.data();
  
  //         // Check if the user already exists in the document
  //         const existingUsers = activityData.users || [];
  //         const userAlreadyExists = existingUsers.some((user) => user.id === currentUser.uid);
  
  //         if (userAlreadyExists) {
  //           alert(`المستخدم مسجل بالفعل في النشاط: ${activity.name}`);
  //         } else {
  //           // Add the user to the activity document
  //           await updateDoc(activityRef, {
  //             users: [...existingUsers, { id: currentUser.uid, name: currentUser.name, email: currentUser.email }],
  //             participantsCount: increment(1),
  //           });
  //           console.log(`تم تسجيل المستخدم في النشاط: ${activity.name}`);
  //         }
  //       } else {
  //         // Create a new document for the activity with the user
  //         await setDoc(activityRef, {
  //           ...activity,
  //           users: [{ id: currentUser.uid, name: currentUser.name, email: currentUser.email }],
  //           participantsCount: 1,
  //           projectName: selectedProject,
  //         });
  //         console.log(`تم إنشاء نشاط جديد وتسجيل المستخدم: ${activity.name}`);
  //       }
  //     }
  
  //     alert('تم الاشتراك بنجاح!');
  //     setSelectedActivities([]); // Reset selected activities
  //     setSelectedProject(null); // Reset selected project
  //   } catch (error) {
  //     console.error('Error during subscription:', error);
  //     alert('حدث خطأ أثناء الاشتراك. حاول مرة أخرى.');
  //   }
  // };
  

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>تفاصيل الأنشطة</h2>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'space-between' }}>
          {/* جدول الأنشطة */}
          <table style={{ border: '1px solid #ccc', width: '48%' }}>
            <thead>
              <tr>
                <th>اختيار</th>
                <th>اسم النشاط</th>
                <th>وصف النشاط</th>
                <th>عدد النقاط</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <input
                        type="checkbox"
                        onChange={() => handleActivitySelection(activity)}
                      />
                    </td>
                    <td>{activity.name}</td>
                    <td>{activity.description}</td>
                    <td>{activity.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">لا توجد أنشطة متاحة</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* جدول روابط الإحالة */}
          <table style={{ border: '1px solid #ccc', width: '48%' }}>
            <thead>
              <tr>
                <th>اختيار</th>
                <th>اسم المشروع</th>
                <th>اسم الرابط</th>
              </tr>
            </thead>
            <tbody>
              {referralLinks.length > 0 ? (
                referralLinks.map((link) => (
                  <tr key={link.id}>
                    <td>
                    <input
  type="radio"
  name="selectedProject"
  onChange={() => {
    setSelectedProject({
      projectName: link.projectName,
      referralLink: link.referralLink, // Ensure this value is correct
    });
    console.log('Updated Selected Project:', {
      projectName: link.projectName,
      referralLink: link.referralLink,
    });
  }}
/>


                    </td>
                    <td>{link.projectName}</td>
                    <td>
                      <a href={link.referralLink} target="_blank" rel="noopener noreferrer">
                        {link.referralLink}
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">لا توجد روابط متاحة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={handleSubscribe}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          اشتراك
        </button>

        <button onClick={onClose} className="close-button">
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default ActivitiesTableModal;
