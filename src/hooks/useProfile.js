import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const useProfile = (currentUser) => {
  const hasFetched = useRef(false); // Prevent duplicate calls
  const [profile, setProfile] = useState(null);
  const [referralLinks, setReferralLinks] = useState([]);
  const [userActivities, setUserActivities] = useState([]); // New state for user activities
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser && !hasFetched.current) {
      console.log('Fetching data for user:', currentUser.uid);
      hasFetched.current = true; // Set the flag to true
      fetchProfile();
      fetchReferralLinks(currentUser.uid);
      fetchUserActivities(currentUser.uid);
    } else {
      console.log('Fetch skipped. Either no user or already fetched.');
    }
  }, [currentUser]);
  

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }
    } catch (err) {
      setError('حدث خطأ أثناء جلب البيانات');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralLinks = async (memberId) => {
    try {
      setLoading(true);
      const referralLinksRef = collection(db, 'referralLinks');
      const q = query(referralLinksRef, where('memberId', '==', memberId));
      const snapshot = await getDocs(q);

      const links = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReferralLinks(links);
    } catch (err) {
      setError('حدث خطأ أثناء جلب روابط الإحالة');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivities = async (userId) => {
    try {
      setLoading(true);
      console.log('Fetching activities for userId:', userId);
  
      const userActivitiesRef = collection(db, 'users_activities');
      const snapshot = await getDocs(userActivitiesRef);
  
      // Filter and map activities where the user exists in the `users` array
      const activities = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const users = data.users || [];
          const isUserInActivity = users.some((user) => user.id === userId); // Check if user exists
  
          if (isUserInActivity) {
            console.log('User found in activity:', data.name); // Debugging log
            return { id: doc.id, ...data }; // Include the activity data
          }
          return null; // Return null if user is not found
        })
        .filter((activity) => activity !== null); // Remove nulls from the array
  
      console.log('Fetched User Activities:', activities);
      setUserActivities(activities); // Update state with filtered activities
    } catch (err) {
      setError('حدث خطأ أثناء جلب الأنشطة');
      console.error('Error fetching user activities:', err);
    } finally {
      setLoading(false);
    }
  };
  

  const updateProfile = async (updatedData) => {
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid); // Reference to the user's document
      await updateDoc(userDocRef, updatedData); // Update the user's data
      await fetchProfile(); // Refresh the profile data after update
      return true; // Indicate success
    } catch (err) {
      setError('حدث خطأ أثناء تحديث البيانات');
      console.error(err);
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    referralLinks,
    userActivities,
    loading,
    error,
    updateProfile, // Include the updateProfile function
    refreshProfile: fetchProfile,
  };
};

export default useProfile;