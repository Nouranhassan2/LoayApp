const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// تهيئة Firebase Admin
initializeApp();

// دالة حذف المستخدم
exports.deleteUserAccount = onCall({ maxInstances: 10 }, async (request) => {
  try {
    const { uid } = request.data;
    
    if (!uid) {
      throw new HttpsError(
        'invalid-argument',
        'معرف المستخدم مطلوب'
      );
    }

    const db = getFirestore();
    const auth = getAuth();

    // حذف المستخدم من Authentication
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      console.error('Error deleting user from Auth:', authError);
      // نتجاهل خطأ عدم وجود المستخدم
      if (authError.code !== 'auth/user-not-found') {
        throw new HttpsError('internal', authError.message);
      }
    }

    // حذف بيانات المستخدم من Firestore
    try {
      const batch = db.batch();
      
      // حذف وثيقة المستخدم
      const userRef = db.collection('users').doc(uid);
      batch.delete(userRef);

      // يمكنك إضافة المزيد من عمليات الحذف هنا
      // مثال:
      // const pointsRef = db.collection('points').doc(uid);
      // batch.delete(pointsRef);

      await batch.commit();
    } catch (firestoreError) {
      console.error('Error deleting user data:', firestoreError);
      throw new HttpsError('internal', 'فشل في حذف بيانات المستخدم');
    }

    return {
      success: true,
      message: 'تم حذف المستخدم وبياناته بنجاح'
    };

  } catch (error) {
    console.error('Error in deleteUserAccount:', error);
    throw new HttpsError(
      'internal',
      error.message || 'حدث خطأ أثناء حذف المستخدم'
    );
  }
});