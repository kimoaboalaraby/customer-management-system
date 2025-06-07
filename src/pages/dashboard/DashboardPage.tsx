import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CalendarDays, BarChart3 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionsStore } from '../../stores/subscriptionsStore';
import { useTasksStore } from '../../stores/tasksStore';
import { formatCurrency } from '../../utils/helpers';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { subscriptions } = useSubscriptionsStore();
  const { getTodayTasks } = useTasksStore();
  
  const todayTasks = getTodayTasks(user?.role === 'employee' ? user.id : undefined);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  
  const totalActiveValue = activeSubscriptions.reduce((sum, sub) => sum + sub.totalPrice, 0);
  
  // Stats cards based on user role
  const statsCards = [
    {
      title: 'المهام اليومية',
      value: todayTasks.length.toString(),
      icon: <CalendarDays className="h-7 w-7 text-primary-600" />,
      linkTo: '/tasks',
      color: 'bg-primary-50 text-primary-700',
    },
    {
      title: 'العملاء',
      value: '25', // This would be dynamic in a real implementation
      icon: <Users className="h-7 w-7 text-secondary-600" />,
      linkTo: '/members',
      color: 'bg-secondary-50 text-secondary-700',
    },
    {
      title: 'الاشتراكات النشطة',
      value: activeSubscriptions.length.toString(),
      icon: <ClipboardList className="h-7 w-7 text-accent-600" />,
      linkTo: '/subscriptions',
      color: 'bg-accent-50 text-accent-700',
    }
  ];
  
  // Admin-only stats
  if (user?.role === 'admin') {
    statsCards.push({
      title: 'قيمة الاشتراكات',
      value: formatCurrency(totalActiveValue).toString(),
      icon: <BarChart3 className="h-7 w-7 text-success-600" />,
      linkTo: '/statistics',
      color: 'bg-success-50 text-success-700',
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title={`مرحباً، ${user?.name}`}
        subtitle="هنا نظرة عامة على نشاط النظام"
      />
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <Link 
            key={index}
            to={card.linkTo}
            className="card p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className={`inline-flex items-center justify-center p-3 rounded-lg ${card.color} mb-4`}>
              {card.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {card.value}
            </h3>
            <p className="text-gray-600">{card.title}</p>
          </Link>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">المهام المستحقة اليوم</h2>
          
          {todayTasks.length > 0 ? (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {task.clientName}
                    </span>
                    {task.status === 'completed' ? (
                      <span className="text-xs bg-success-100 text-success-800 px-2 py-1 rounded-full">
                        مكتمل
                      </span>
                    ) : (
                      <span className="text-xs bg-warning-100 text-warning-800 px-2 py-1 rounded-full">
                        قيد التنفيذ
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-800">{task.description}</p>
                </div>
              ))}
              
              {todayTasks.length > 5 && (
                <Link to="/tasks" className="text-primary-600 text-sm font-medium hover:text-primary-700 block text-center mt-2">
                  عرض جميع المهام ({todayTasks.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مهام مستحقة اليوم</p>
            </div>
          )}
        </div>
        
        {/* Recent Subscriptions */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">أحدث الاشتراكات</h2>
          
          {activeSubscriptions.length > 0 ? (
            <div className="space-y-3">
              {activeSubscriptions.slice(0, 5).map(subscription => (
                <div key={subscription.id} className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-900">
                      {subscription.clientName}
                    </span>
                    <span className={`badge ${subscription.tier === 'gold' ? 'badge-gold' : subscription.tier === 'silver' ? 'badge-silver' : subscription.tier === 'bronze' ? 'badge-bronze' : 'badge-regular'}`}>
                      {subscription.tier === 'gold' ? 'ذهبي' : 
                        subscription.tier === 'silver' ? 'فضي' : 
                        subscription.tier === 'bronze' ? 'برونزي' : 'عادي'}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-600">{subscription.clientPhone}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subscription.totalPrice)}</span>
                  </div>
                </div>
              ))}
              
              {activeSubscriptions.length > 5 && (
                <Link to="/subscriptions" className="text-primary-600 text-sm font-medium hover:text-primary-700 block text-center mt-2">
                  عرض جميع الاشتراكات ({activeSubscriptions.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد اشتراكات نشطة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;