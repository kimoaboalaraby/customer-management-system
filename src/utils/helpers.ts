import { format, addDays, differenceInDays, isAfter } from 'date-fns';

// تعريف نوع Task لاستخدامه في الدوال
interface Task {
  id: string;
  description: string;
  clientId: string;
  clientName: string;
  subscriptionId: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'in-progress';
  serviceCategory: string;
  serviceType: string;
  isDeleted: boolean;
  schedulingType: 'automatic' | 'manual';
}

// تعريف نوع PerformanceRating
type PerformanceRating = 'excellent' | 'good' | 'weak';

// تعريف نوع ServicePrice
interface ServicePrice {
  category: string;
  type: string;
  basePrice: number;
}

/**
 * Generates a random ID
 * @returns A random string ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Format currency in Kuwaiti Dinar
 * @param amount - The numeric amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) {
    console.error('Invalid amount provided to formatCurrency');
    return '٠٫٠٠٠ د.ك';
  }
  return new Intl.NumberFormat('ar-KW', {
    style: 'currency',
    currency: 'KWD',
    minimumFractionDigits: 3
  }).format(amount);
};

/**
 * Format date to Arabic locale string
 * @param dateString - The date string to format
 * @returns Formatted date string in Arabic
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date.toLocaleDateString('ar-KW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'islamic'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'تاريخ غير صالح';
  }
};

/**
 * Calculate performance rating
 * @param completed - Number of completed tasks
 * @param total - Total number of tasks
 * @returns Performance rating
 */
export const calculatePerformance = (
  completed: number, 
  total: number
): PerformanceRating => {
  if (total <= 0) return 'excellent';
  
  const percentage = (completed / total) * 100;
  
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  return 'weak';
};

/**
 * Get CSS class for performance badge color
 * @param performance - The performance rating
 * @returns Tailwind CSS classes
 */
export const getPerformanceColor = (
  performance: PerformanceRating | null
): string => {
  switch (performance) {
    case 'excellent': return 'bg-green-100 text-green-800';
    case 'good': return 'bg-blue-100 text-blue-800';
    case 'weak': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS class for subscription tier badge color
 * @param tier - The subscription tier
 * @returns Tailwind CSS classes
 */
export const getTierBadgeColor = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'gold': return 'bg-yellow-100 text-yellow-800';
    case 'silver': return 'bg-gray-100 text-gray-800';
    case 'bronze': return 'bg-amber-100 text-amber-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

/**
 * Format tier name in Arabic
 * @param tier - The subscription tier
 * @returns Arabic name for the tier
 */
export const formatTier = (tier: string): string => {
  switch (tier.toLowerCase()) {
    case 'gold': return 'ذهبي';
    case 'silver': return 'فضي';
    case 'bronze': return 'برونزي';
    default: return 'عادي';
  }
};

/**
 * Check if a subscription is expiring soon (within 7 days)
 * @param endDate - The subscription end date
 * @returns Boolean indicating if expiring soon
 */
export const isExpiringSoon = (endDate: string): boolean => {
  try {
    const end = new Date(endDate);
    const now = new Date();
    if (isNaN(end.getTime())) return false;
    
    const diffDays = differenceInDays(end, now);
    return diffDays >= 0 && diffDays <= 7;
  } catch (error) {
    console.error('Error checking expiration date:', error);
    return false;
  }
};

/**
 * Generate automatic tasks for a subscription
 * @param params - Object containing all required parameters
 * @returns Array of generated tasks
 */
export const generateTasks = ({
  subscriptionId,
  clientId,
  clientName,
  serviceCategory,
  serviceType,
  totalInstances,
  startDate,
  endDate,
  baseDescription
}: {
  subscriptionId: string;
  clientId: string;
  clientName: string;
  serviceCategory: string;
  serviceType: string;
  totalInstances: number;
  startDate: string;
  endDate: string;
  baseDescription: string;
}): Task[] => {
  // التحقق من المدخلات
  if (!subscriptionId || !clientId || !startDate || !endDate) {
    console.error('Missing required parameters');
    return [];
  }

  if (totalInstances <= 0) return [];

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date format');
      return [];
    }

    if (isAfter(start, end)) {
      console.error('Start date must be before end date');
      return [];
    }

    const tasks: Task[] = [];
    const totalDays = differenceInDays(end, start);
    const interval = Math.max(1, Math.floor(totalDays / totalInstances));

    for (let i = 0; i < totalInstances; i++) {
      const dueDate = addDays(start, i * interval);
      tasks.push({
        id: `${subscriptionId}-${serviceCategory}-${serviceType}-${i}-${generateId()}`,
        description: `${baseDescription} - ${i + 1} من ${totalInstances}`,
        clientId,
        clientName,
        subscriptionId,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        status: 'pending',
        serviceCategory,
        serviceType,
        isDeleted: false,
        schedulingType: 'automatic'
      });
    }

    return tasks;
  } catch (error) {
    console.error('Error generating tasks:', error);
    return [];
  }
};

/**
 * Get service price from settings
 * @param settings - The system settings object
 * @param category - The service category
 * @param type - The service type
 * @returns The base price for the service
 */
export const getServicePrice = (
  settings: { prices?: ServicePrice[] },
  category: string,
  type: string
): number => {
  if (!settings?.prices?.length) return 0;
  
  const priceInfo = settings.prices.find(p => 
    p.category === category && p.type === type
  );
  
  return priceInfo?.basePrice || 0;
};

/**
 * Calculate subscription end date
 * @param startDate - Start date string
 * @param durationMonths - Duration in months
 * @returns End date string in YYYY-MM-DD format
 */
export const calculateEndDate = (
  startDate: string,
  durationMonths: number
): string => {
  try {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '';
    
    const end = addMonths(start, durationMonths);
    return format(end, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error calculating end date:', error);
    return '';
  }
};

// دالة مساعدة لإضافة أشهر (بديل إذا لم تكن من date-fns)
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}