import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Recycle, 
  BarChart3, 
  CalendarDays, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  UserCog 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
            
            <div className="flex items-center gap-2">
              <Building2 className="h-7 w-7 text-primary-600" />
              <h1 className="text-lg md:text-xl font-bold text-gray-900">نظام إدارة العملاء والمهام</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'مدير النظام' : 'موظف'}
              </p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-primary-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-l border-gray-200 py-6 px-4">
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
              <span>لوحة التحكم</span>
            </NavLink>
            
            <NavLink to="/members" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users className="w-5 h-5" />
              <span>الأعضاء</span>
            </NavLink>
            
            <NavLink to="/subscriptions" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ClipboardList className="w-5 h-5" />
              <span>الاشتراكات</span>
            </NavLink>
            
            <NavLink to="/tasks" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <CalendarDays className="w-5 h-5" />
              <span>المهام اليومية</span>
            </NavLink>
            
            {user?.role === 'admin' && (
              <>
                <NavLink to="/recyclebin" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Recycle className="w-5 h-5" />
                  <span>سلة المهملات</span>
                </NavLink>
                
                <NavLink to="/statistics" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <BarChart3 className="w-5 h-5" />
                  <span>الإحصائيات</span>
                </NavLink>
                
                <NavLink to="/employees" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <UserCog className="w-5 h-5" />
                  <span>الموظفين</span>
                </NavLink>
                
                <NavLink to="/settings" className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}>
                  <Settings className="w-5 h-5" />
                  <span>الإعدادات</span>
                </NavLink>
              </>
            )}
          </nav>
        </aside>
        
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-30 lg:hidden"
            onClick={closeMobileMenu}
          />
        )}
        
        {/* Sidebar - Mobile */}
        <aside 
          className={`fixed top-[73px] right-0 bottom-0 w-64 bg-white border-l border-gray-200 py-6 px-4 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <nav className="space-y-1">
            <NavLink 
              to="/dashboard" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>لوحة التحكم</span>
            </NavLink>
            
            <NavLink 
              to="/members" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Users className="w-5 h-5" />
              <span>الأعضاء</span>
            </NavLink>
            
            <NavLink 
              to="/subscriptions" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <ClipboardList className="w-5 h-5" />
              <span>الاشتراكات</span>
            </NavLink>
            
            <NavLink 
              to="/tasks" 
              className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <CalendarDays className="w-5 h-5" />
              <span>المهام اليومية</span>
            </NavLink>
            
            {user?.role === 'admin' && (
              <>
                <NavLink 
                  to="/recyclebin" 
                  className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Recycle className="w-5 h-5" />
                  <span>سلة المهملات</span>
                </NavLink>
                
                <NavLink 
                  to="/statistics" 
                  className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>الإحصائيات</span>
                </NavLink>
                
                <NavLink 
                  to="/employees" 
                  className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <UserCog className="w-5 h-5" />
                  <span>الموظفين</span>
                </NavLink>
                
                <NavLink 
                  to="/settings" 
                  className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Settings className="w-5 h-5" />
                  <span>الإعدادات</span>
                </NavLink>
              </>
            )}
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} نظام إدارة العملاء والمهام. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;