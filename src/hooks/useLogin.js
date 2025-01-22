import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const useLogin = () => {
  const { setCurrentUser } = useAuth();

  const handleLogin = async (email, password) => {
    try {
      // Authenticate user with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Fetch user data from Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
  
        // Check if user is active
        if (!userData.isActive) {
          console.error("User account is inactive.");
          throw new Error("تم تعطيل الحساب. يرجى التواصل مع الدعم الفني.");
        }
        
        if (userData.isActive) {
        // Set current user if active
        console.error("Entering setCurrentUser.");
        setCurrentUser({ uid: user.uid, email: user.email, ...userData });
        }

      } else {
        // Handle case where user doesn't have Firestore data
        console.error("User data not found in Firestore.");
        throw new Error("لم يتم العثور على بيانات المستخدم.");
      }
    } catch (error) {
      console.error('Error in handleLogin:', error);
      throw error;
    }
  };

  // تسجيل مستخدم جديد
  const handleRegister = async (username, email, password, phoneNumber) => {
    try {
      console.log("Starting registration...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created in Firebase Auth:", user);
  
      const userData = {
        id: user.uid,
        name: username,
        email: user.email,
        role: 'member',
        isActive: true,
        createdAt: Timestamp.now(),
        points: 0,
        referralCode: '',
        phoneNumber: phoneNumber || '',
        city: '',
        district: '',
        birthDate: null,
        joinDate: Timestamp.now(),
        membershipLevel: 'bronze',
      };
  
      console.log("User data to be saved in Firestore:", userData);
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log("User data saved to Firestore successfully");
  
      setCurrentUser({ uid: user.uid, ...userData });
    } catch (error) {
      console.error("Error in handleRegister:", error);
      throw error;
    }
  };
  

  // استعادة كلمة المرور
  const handleForgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error in handleForgotPassword:', error);
      throw error;
    }
  };

  // تسجيل الدخول باستخدام جوجل
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // جلب بيانات المستخدم من Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // إذا لم يكن موجودًا، أضفه مع دور 'member' وتأكد من أن الحقل 'name' موجود
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
      } else {
        // المستخدم موجود، تحديث currentUser
        const userData = docSnap.data();
        setCurrentUser({ uid: user.uid, ...userData });
      }
    } catch (error) {
      console.error('Error during Google Sign-In:', error);
      throw error;
    }
  };

  return {
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleGoogleSignIn,
  };
};

export default useLogin;
