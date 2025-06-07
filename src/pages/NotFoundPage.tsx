import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center animate-fade-in">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">الصفحة غير موجودة</h2>
        <p className="text-gray-600 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
        
        <Link 
          to="/"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          <span>العودة للصفحة الرئيسية</span>
        </Link>
      </div>
    </div>
  );
};




export default NotFoundPage;