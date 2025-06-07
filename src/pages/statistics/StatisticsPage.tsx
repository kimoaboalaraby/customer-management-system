import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, DollarSign, BadgePercent } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useSubscriptionsStore } from '../../stores/subscriptionsStore';
import { formatCurrency } from '../../utils/helpers';
import { subMonths, format, isAfter, isBefore, isSameMonth } from 'date-fns';

// تعريف الأنواع المستخدمة
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
type PerformanceIndicatorType = 'excellent' | 'good' | 'weak';

// واجهة لتوحيد هيكل التواريخ
interface DateRange {
  start: Date;
  end: Date;
}

// واجهة لهيكل البيانات المرجعة من getDateRanges
interface DateRanges {
  current: DateRange;
  previous: DateRange;
}

// واجهة لهيكل بيانات الإحصائيات
interface Stats {
  activeSubscriptionsCount: number;
  newSubscriptionsCount: number;
  expiredSubscriptionsCount: number;
  deletedSubscriptionsCount: number;
  activeValue: number;
  expiredValue: number;
  performanceIndicator: PerformanceIndicatorType;
}

// واجهة لهيكل بيانات الرسم البياني
interface ChartData {
  name: string;
  value: number;
}

const StatisticsPage: React.FC = () => {
  const { subscriptions } = useSubscriptionsStore();
  const [period, setPeriod] = useState<PeriodType>('monthly');
  
  // الحصول على نطاقات التاريخ بناءً على الفترة المحددة
  const getDateRanges = (): DateRanges => {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return {
          current: {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: now
          },
          previous: {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
          }
        };
      case 'weekly':
        return {
          current: {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
            end: now
          },
          previous: {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 1)
          }
        };
      case 'yearly':
        return {
          current: {
            start: new Date(now.getFullYear(), 0, 1),
            end: now
          },
          previous: {
            start: new Date(now.getFullYear() - 1, 0, 1),
            end: new Date(now.getFullYear() - 1, 11, 31)
          }
        };
      case 'monthly':
      default:
        return {
          current: {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: now
          },
          previous: {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end: new Date(now.getFullYear(), now.getMonth(), 0)
          }
        };
    }
  };
  
  // حساب الإحصائيات
  const calculateStats = (): Stats => {
    const dateRanges = getDateRanges();
    const now = new Date();
    
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const activeSubscriptionsCount = activeSubscriptions.length;
    
    let newSubscriptionsCount = 0;
    let expiredSubscriptionsCount = 0;
    let deletedSubscriptionsCount = 0;
    let activeValue = 0;
    let expiredValue = 0;
    
    // حساب بناءً على الفترة
    if (period === 'daily') {
      // حسابات يومية
      const today = format(dateRanges.current.start, 'yyyy-MM-dd');
      
      newSubscriptionsCount = subscriptions.filter(
        sub => format(new Date(sub.createdAt), 'yyyy-MM-dd') === today
      ).length;
      
      expiredSubscriptionsCount = subscriptions.filter(
        sub => format(new Date(sub.endDate), 'yyyy-MM-dd') === today
      ).length;
      
      deletedSubscriptionsCount = subscriptions.filter(
        sub => sub.status === 'deleted' && 
        sub.deletedAt && 
        format(new Date(sub.deletedAt), 'yyyy-MM-dd') === today
      ).length;
    } else {
      // أسبوعي، شهري، سنوي
      const { current } = dateRanges;
      
      newSubscriptionsCount = subscriptions.filter(sub => {
        const createdDate = new Date(sub.createdAt);
        return isAfter(createdDate, current.start) && isBefore(createdDate, current.end);
      }).length;
      
      expiredSubscriptionsCount = subscriptions.filter(sub => {
        const endDate = new Date(sub.endDate);
        return isAfter(endDate, current.start) && isBefore(endDate, current.end);
      }).length;
      
      deletedSubscriptionsCount = subscriptions.filter(sub => {
        if (sub.status !== 'deleted' || !sub.deletedAt) return false;
        const deletedDate = new Date(sub.deletedAt);
        return isAfter(deletedDate, current.start) && isBefore(deletedDate, current.end);
      }).length;
    }
    
    // حساب القيم
    activeValue = activeSubscriptions.reduce((sum, sub) => sum + sub.totalPrice, 0);
    
    expiredValue = subscriptions
      .filter(sub => sub.status === 'deleted' || new Date(sub.endDate) < now)
      .reduce((sum, sub) => sum + sub.totalPrice, 0);
    
    // تحديد مؤشر الأداء
    let performanceIndicator: PerformanceIndicatorType = 'good';
    
    // هذا حساب مبسط - في تطبيق حقيقي، ستكون لديك منطق أكثر تعقيدًا
    if (newSubscriptionsCount > expiredSubscriptionsCount + deletedSubscriptionsCount) {
      performanceIndicator = 'excellent';
    } else if (newSubscriptionsCount < expiredSubscriptionsCount + deletedSubscriptionsCount) {
      performanceIndicator = 'weak';
    }
    
    return {
      activeSubscriptionsCount,
      newSubscriptionsCount,
      expiredSubscriptionsCount,
      deletedSubscriptionsCount,
      activeValue,
      expiredValue,
      performanceIndicator
    };
  };
  
  const stats = calculateStats();
  
  // إنشاء بيانات الرسم البياني
  const getSubscriptionsByTier = (): ChartData[] => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    const goldCount = activeSubscriptions.filter(sub => sub.tier === 'gold').length;
    const silverCount = activeSubscriptions.filter(sub => sub.tier === 'silver').length;
    const bronzeCount = activeSubscriptions.filter(sub => sub.tier === 'bronze').length;
    const regularCount = activeSubscriptions.filter(sub => sub.tier === 'regular').length;
    
    return [
      { name: 'ذهبي', value: goldCount },
      { name: 'فضي', value: silverCount },
      { name: 'برونزي', value: bronzeCount },
      { name: 'عادي', value: regularCount }
    ];
  };
  
  const getMonthlyRevenue = (): ChartData[] => {
    const months: ChartData[] = [];
    const today = new Date();
    
    // إنشاء آخر 6 أشهر
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      months.push({
        name: format(month, 'MMM'),
        value: 0
      });
    }
    
    // حساب الإيرادات لكل شهر
    subscriptions.forEach(sub => {
      const createdDate = new Date(sub.createdAt);
      
      months.forEach(month => {
        const monthIndex = months.findIndex(m => m.name === month.name);
        const monthDate = subMonths(today, monthIndex);
        
        if (isSameMonth(createdDate, monthDate)) {
          month.value += sub.totalPrice;
        }
      });
    });
    
    return months;
  };
  
  const COLORS = ['#f59e0b', '#94a3b8', '#d97706', '#3b82f6'];

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="الإحصائيات"
        subtitle="تحليل أداء الأعمال والإيرادات"
      />
      
      {/* محدد الفترة */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex space-x-4 space-x-reverse">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              period === 'daily' 
                ? 'bg-primary-100 text-primary-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => setPeriod('daily')}
          >
            يومي
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              period === 'weekly' 
                ? 'bg-primary-100 text-primary-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => setPeriod('weekly')}
          >
            أسبوعي
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              period === 'monthly' 
                ? 'bg-primary-100 text-primary-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => setPeriod('monthly')}
          >
            شهري
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              period === 'yearly' 
                ? 'bg-primary-100 text-primary-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            onClick={() => setPeriod('yearly')}
          >
            سنوي
          </button>
        </div>
      </div>
      
      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="inline-flex items-center justify-center p-3 rounded-lg bg-primary-50 text-primary-700 mb-4">
            <Calendar className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {stats.activeSubscriptionsCount}
          </h3>
          <p className="text-gray-600">الاشتراكات النشطة</p>
        </div>
        
        <div className="card p-6">
          <div className="inline-flex items-center justify-center p-3 rounded-lg bg-accent-50 text-accent-700 mb-4">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {stats.newSubscriptionsCount}
          </h3>
          <p className="text-gray-600">اشتراكات جديدة</p>
        </div>
        
        <div className="card p-6">
          <div className="inline-flex items-center justify-center p-3 rounded-lg bg-secondary-50 text-secondary-700 mb-4">
            <DollarSign className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {formatCurrency(stats.activeValue)}
          </h3>
          <p className="text-gray-600">قيمة الاشتراكات النشطة</p>
        </div>
        
        <div className="card p-6">
          <div className={`inline-flex items-center justify-center p-3 rounded-lg mb-4 ${
            stats.performanceIndicator === 'excellent' 
              ? 'bg-success-50 text-success-700'
              : stats.performanceIndicator === 'good'
                ? 'bg-accent-50 text-accent-700'
                : 'bg-error-50 text-error-700'
          }`}>
            <BadgePercent className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {stats.performanceIndicator === 'excellent' 
              ? 'ممتاز'
              : stats.performanceIndicator === 'good'
                ? 'جيد'
                : 'ضعيف'
            }
          </h3>
          <p className="text-gray-600">مؤشر الأداء</p>
        </div>
      </div>
      
      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">توزيع الاشتراكات حسب الفئة</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getSubscriptionsByTier()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getSubscriptionsByTier().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'عدد الاشتراكات']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">الإيرادات الشهرية</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getMonthlyRevenue()}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'الإيراد']} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* إحصاءات تفصيلية */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">إحصاءات تفصيلية</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المؤشر
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  القيمة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  الاشتراكات النشطة
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats.activeSubscriptionsCount}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  الاشتراكات الجديدة
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats.newSubscriptionsCount}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  الاشتراكات المنتهية
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats.expiredSubscriptionsCount}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  الاشتراكات المحذوفة
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stats.deletedSubscriptionsCount}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  قيمة الاشتراكات النشطة
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(stats.activeValue)}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  قيمة الاشتراكات المنتهية/المحذوفة
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(stats.expiredValue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;

