import React from 'react';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 to-primary-100">
      <header className="py-4 px-6 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">نظام إدارة العملاء والمهام</h1>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      
      <footer className="py-4 px-6 bg-white border-t border-gray-200">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} نظام إدارة العملاء والمهام. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;