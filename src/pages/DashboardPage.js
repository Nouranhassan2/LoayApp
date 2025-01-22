// مثال في DashboardPage.js أو أي صفحة أخرى

import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

function DashboardPage() {
  const [rewards, setRewards] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const q = query(collection(db, 'rewards'), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        const rewardsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRewards(rewardsData);
      } catch (error) {
        console.error('Error fetching rewards:', error);
        setError('حدث خطأ أثناء جلب المكافآت. الرجاء المحاولة مرة أخرى لاحقًا.');
      }
    };

    fetchRewards();
  }, []);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <h2>لوحة التحكم</h2>
      {/* عرض المكافآت أو البيانات الأخرى */}
      {rewards.map(reward => (
        <div key={reward.id}>
          <h3>{reward.title}</h3>
          <p>{reward.description}</p>
        </div>
      ))}
    </div>
  );
}

export default DashboardPage;
