const authService = {
    login: async (email, password) => {
      // افتراضياً نقوم بإجراء طلب إلى API هنا
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        throw new Error('خطأ في تسجيل الدخول');
      }
  
      return await response.json();
    },
  };
  
  export default authService;
  