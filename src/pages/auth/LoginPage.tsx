import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h2>
        <p className="text-gray-600">أدخل بيانات الدخول للوصول إلى نظام إدارة العملاء والمهام</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-error-50 text-error-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          <label htmlFor="username" className="form-label">
            اسم المستخدم
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="form-input pr-10"
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          <label htmlFor="password" className="form-label">
            كلمة المرور
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="form-input pr-10"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        
<div>
  <button
    type="submit"
    className="btn btn-primary w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    disabled={isLoading}
  >
    {isLoading ? (
      <span className="flex items-center">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        جاري تسجيل الدخول...
      </span>
    ) : (
      'تسجيل الدخول'
    )}
  </button>
</div>
</form>

<div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
  <p>
    للمساعدة في تسجيل الدخول، يرجى التواصل مع مدير النظام.
  </p>
  <div className="mt-4 text-xs text-gray-500 space-y-1">
    <p className="font-medium">بيانات تجريبية:</p>
    <p className="bg-gray-100 p-1 rounded">مدير: <span className="font-semibold">admin / admin123</span></p>
    <p className="bg-gray-100 p-1 rounded">مصمم: <span className="font-semibold">designer / design123</span></p>
  </div>
</div>
    </div>
  );
};

export default LoginPage;