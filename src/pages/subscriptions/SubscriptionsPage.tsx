import React, { useState, useMemo } from 'react';
import { PlusCircle, Download, Trash2, FileText, Eye, ClipboardList, Edit, Save, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useSubscriptionsStore } from '../../stores/subscriptionsStore';
import { useMembersStore } from '../../stores/membersStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { useTasksStore } from '../../stores/tasksStore';

import { 
  Subscription, 
  WebsiteService, 
  DesignService, 
  ManagementService, 
  AdvertisingService, 
  Platform,
  ServiceCategory, 
  SchedulingType,
  Task
} from '../../types';
import { formatCurrency, getTierBadgeColor, formatTier, isExpiringSoon, generateTasks } from '../../utils/helpers';
import { addMonths, format } from 'date-fns';

// تعريف نوع للخدمة الأساسية
interface BaseService {
  type: string;
  price: number;
}

const SubscriptionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    subscriptions, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription, 
    exportSubscriptions 
  } = useSubscriptionsStore();
  
  const { folders } = useMembersStore();
  const { settings } = useSettingsStore();
  const { 
    addTasks, 
    deleteTasksBySubscription 
  } = useTasksStore();
  
  // States
  const [activeTab, setActiveTab] = useState<'gold' | 'silver' | 'bronze' | 'regular'>('gold');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isEditingManualTask, setIsEditingManualTask] = useState<string | null>(null);
  const [manualTaskEditContent, setManualTaskEditContent] = useState('');

  // Initial form state
  const initialFormData = {
    clientId: '',
    clientName: '',
    clientPhone: '',
    duration: 3,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    emailCredentials: [{ id: Date.now().toString(), provider: '', email: '', password: '' }],
    websiteServices: [] as WebsiteService[],
    designServices: [] as DesignService[],
    managementServices: [] as ManagementService[],
    advertisingServices: [] as AdvertisingService[],
    manualTasks: [] as Task[],
  };

  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
  
  // Flatten contacts for selection
  const allContacts = useMemo(() => folders.flatMap(folder => folder.contacts), [folders]);
  
  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => 
    subscriptions.filter(sub => sub.tier === activeTab && sub.status === 'active'),
    [subscriptions, activeTab]
  );

  // Handlers
  const handleOpenAddModal = () => {
    setFormData(initialFormData);
    setIsAddModalOpen(true);
  };
  
  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsViewModalOpen(true);
  };
  
  const handleDeleteSubscription = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الاشتراك؟ سيتم حذف جميع المهام المرتبطة به.')) {
      await deleteSubscription(id);
      await deleteTasksBySubscription(id);
      if (selectedSubscription?.id === id) {
        setIsViewModalOpen(false);
        setSelectedSubscription(null);
      }
    }
  };
  
  const handleExport = (format: 'pdf' | 'excel' | 'json') => {
    exportSubscriptions(format);
    setIsExportModalOpen(false);
  };
  
  const handleClientChange = (contactId: string) => {
    const contact = allContacts.find(c => c.id === contactId);
    if (contact) {
      setFormData({
        ...formData,
        clientId: contact.id,
        clientName: contact.personalName,
        clientPhone: contact.phoneNumber
      });
    }
  };
  
  const calculateEndDate = (startDate: string, durationMonths: number): string => {
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return '';
      const end = addMonths(start, durationMonths);
      return format(end, 'yyyy-MM-dd');
    } catch (error) {
      console.error("Error calculating end date:", error);
      return '';
    }
  };
  
  const calculateTotalPrice = (): number => {
    let total = 0;
    formData.websiteServices.forEach(service => total += service.price);
    formData.designServices.forEach(service => total += service.price * (service.monthlyInstances || 0) * formData.duration);
    formData.managementServices.forEach(service => total += service.price * (service.monthlyUpdates || 0) * formData.duration);
    formData.advertisingServices.forEach(service => total += service.price || 0);
    return total;
  };

  // Service Handling
  const handleServiceChange = <T extends BaseService>(
    category: keyof Pick<typeof formData, 'websiteServices' | 'designServices' | 'managementServices' | 'advertisingServices'>,
    serviceInfo: BaseService,
    isChecked: boolean
  ) => {
    setFormData(prev => {
      const existingServices = prev[category] as T[];
      if (isChecked) {
        const newService = {
          type: serviceInfo.type,
          price: serviceInfo.price,
          ...(category === 'designServices' && { 
            monthlyInstances: 1, 
            schedulingType: 'automatic' as SchedulingType, 
            platforms: ['facebook'] as Platform[] 
          }),
          ...(category === 'managementServices' && { 
            monthlyUpdates: 1, 
            schedulingType: 'automatic' as SchedulingType, 
            platforms: ['facebook'] as Platform[] 
          }),
          ...(category === 'advertisingServices' && { 
            platforms: ['facebook'] as Platform[], 
            budget: 0 
          }),
        } as T;
        return { ...prev, [category]: [...existingServices, newService] };
      } else {
        return { ...prev, [category]: existingServices.filter(s => s.type !== serviceInfo.type) };
      }
    });
  };

  const handleServiceDetailChange = <T extends BaseService>(
    category: keyof Pick<typeof formData, 'designServices' | 'managementServices' | 'advertisingServices'>,
    serviceType: string,
    field: keyof T,
    value: any
  ) => {
    setFormData(prev => {
      const updatedServices = (prev[category] as T[]).map(service => 
        service.type === serviceType ? { ...service, [field]: value } : service
      );
      return { ...prev, [category]: updatedServices };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const endDate = calculateEndDate(formData.startDate, formData.duration);
    const totalPrice = calculateTotalPrice();
    const subscriptionId = Date.now().toString();

    let automaticTasks: Task[] = [];
    let manualTasksForSubscription: Task[] = [];

    // Generate tasks for design services
    formData.designServices.forEach(service => {
      const totalInstances = (service.monthlyInstances || 0) * formData.duration;
      if (service.schedulingType === 'automatic') {
        const tasks = generateTasks({
          subscriptionId,
          clientId: formData.clientId,
          clientName: formData.clientName,
          serviceCategory: 'design',
          serviceType: service.type,
          totalInstances,
          startDate: formData.startDate,
          endDate,
          baseDescription: `تصميم ${service.type} (${service.platforms?.join(', ')})`
        });
        automaticTasks = [...automaticTasks, ...tasks];
      } else {
        for (let i = 0; i < totalInstances; i++) {
          manualTasksForSubscription.push({
            id: `${subscriptionId}-manual-design-${service.type}-${i + 1}`,
            description: `مهمة يدوية: تصميم ${service.type} (${service.platforms?.join(', ')}) - ${i + 1} من ${totalInstances}`,
            clientId: formData.clientId,
            clientName: formData.clientName,
            subscriptionId,
            dueDate: '',
            status: 'pending',
            serviceCategory: 'design',
            serviceType: service.type,
            isDeleted: false,
            schedulingType: 'manual',
          });
        }
      }
    });

    // Generate tasks for management services
    formData.managementServices.forEach(service => {
      const totalInstances = (service.monthlyUpdates || 0) * formData.duration;
      if (service.schedulingType === 'automatic') {
        const tasks = generateTasks({
          subscriptionId,
          clientId: formData.clientId,
          clientName: formData.clientName,
          serviceCategory: 'management',
          serviceType: service.type,
          totalInstances,
          startDate: formData.startDate,
          endDate,
          baseDescription: `إدارة ${service.type} (${service.platforms?.join(', ')})`
        });
        automaticTasks = [...automaticTasks, ...tasks];
      } else {
        for (let i = 0; i < totalInstances; i++) {
          manualTasksForSubscription.push({
            id: `${subscriptionId}-manual-mgmt-${service.type}-${i + 1}`,
            description: `مهمة يدوية: إدارة ${service.type} (${service.platforms?.join(', ')}) - ${i + 1} من ${totalInstances}`,
            clientId: formData.clientId,
            clientName: formData.clientName,
            subscriptionId,
            dueDate: '',
            status: 'pending',
            serviceCategory: 'management',
            serviceType: service.type,
            isDeleted: false,
            schedulingType: 'manual',
          });
        }
      }
    });

    // Create new subscription
    const newSubscription: Subscription = {
      id: subscriptionId,
      clientId: formData.clientId,
      clientName: formData.clientName,
      clientPhone: formData.clientPhone,
      duration: formData.duration,
      startDate: formData.startDate,
      endDate,
      totalPrice,
      emailCredentials: formData.emailCredentials,
      websiteServices: formData.websiteServices,
      designServices: formData.designServices,
      managementServices: formData.managementServices,
      advertisingServices: formData.advertisingServices,
      manualTasks: manualTasksForSubscription,
      tier: 'regular',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    await addSubscription(newSubscription);
    
    if (automaticTasks.length > 0) {
      await addTasks(automaticTasks);
    }
    
    setIsAddModalOpen(false);
  };

  // Manual Task Handling
  const handleToggleManualTask = (taskId: string) => {
    if (!selectedSubscription) return;

    const updatedTasks = (selectedSubscription.manualTasks || []).map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
        };
      }
      return task;
    });

    const updatedSubscription = { 
      ...selectedSubscription, 
      manualTasks: updatedTasks 
    };
    
    updateSubscription(updatedSubscription);
    setSelectedSubscription(updatedSubscription);
  };

  const handleEditManualTask = (task: Task) => {
    setIsEditingManualTask(task.id);
    setManualTaskEditContent(task.description);
  };

  const handleSaveManualTaskEdit = (taskId: string) => {
    if (!selectedSubscription) return;

    const updatedTasks = (selectedSubscription.manualTasks || []).map(task =>
      task.id === taskId ? { ...task, description: manualTaskEditContent } : task
    );
    
    const updatedSubscription = { 
      ...selectedSubscription, 
      manualTasks: updatedTasks 
    };
    
    updateSubscription(updatedSubscription);
    setSelectedSubscription(updatedSubscription);
    setIsEditingManualTask(null);
    setManualTaskEditContent('');
  };

  const handleCancelManualTaskEdit = () => {
    setIsEditingManualTask(null);
    setManualTaskEditContent('');
  };
  
  // Tab component
  const TabButton = ({ 
    tier, 
    label, 
    count 
  }: { 
    tier: 'gold' | 'silver' | 'bronze' | 'regular', 
    label: string, 
    count: number 
  }) => (
    <button
      className={`px-4 py-2.5 rounded-md text-sm font-medium ${
        activeTab === tier 
          ? 'bg-primary-100 text-primary-800' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab(tier)}
    >
      {label} ({count})
    </button>
  );
  
  // Count subscriptions by tier
  const goldCount = useMemo(() => subscriptions.filter(sub => sub.tier === 'gold' && sub.status === 'active').length, [subscriptions]);
  const silverCount = useMemo(() => subscriptions.filter(sub => sub.tier === 'silver' && sub.status === 'active').length, [subscriptions]);
  const bronzeCount = useMemo(() => subscriptions.filter(sub => sub.tier === 'bronze' && sub.status === 'active').length, [subscriptions]);
  const regularCount = useMemo(() => subscriptions.filter(sub => sub.tier === 'regular' && sub.status === 'active').length, [subscriptions]);

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="الاشتراكات"
        subtitle="إدارة اشتراكات العملاء والخدمات والمهام اليدوية"
        action={
          user?.role === 'admin' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="btn btn-outline flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span>تصدير</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة اشتراك</span>
              </button>
            </div>
          )
        }
      />
      
      {/* Tabs */}
      <div className="flex overflow-x-auto mb-6 pb-2 no-scrollbar">
        <div className="inline-flex rounded-md bg-gray-50 p-1 shadow-sm">
          <TabButton tier="gold" label="ذهبي" count={goldCount} />
          <TabButton tier="silver" label="فضي" count={silverCount} />
          <TabButton tier="bronze" label="برونزي" count={bronzeCount} />
          <TabButton tier="regular" label="عادي" count={regularCount} />
        </div>
      </div>
      
      {/* Subscriptions Grid */}
      {filteredSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map(subscription => (
            <div 
              key={subscription.id} 
              className={`card hover:shadow-lg transition-all duration-200 ${
                isExpiringSoon(subscription.endDate) ? 'border-warning-300' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 text-lg">{subscription.clientName}</h3>
                  <span className={`badge ${getTierBadgeColor(subscription.tier)}`}>
                    {formatTier(subscription.tier)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{subscription.clientPhone}</p>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">تاريخ الانتهاء:</span>
                  <span className={`font-medium ${isExpiringSoon(subscription.endDate) ? 'text-warning-600' : 'text-gray-900'}`}>
                    {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('ar-KW') : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">إجمالي الاشتراك:</span>
                  <span className="font-medium text-primary-600">{formatCurrency(subscription.totalPrice)}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleViewSubscription(subscription)}
                    className="btn btn-outline flex-1 text-sm"
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    عرض
                  </button>
                  
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteSubscription(subscription.id)}
                      className="btn btn-outline text-error-600 border-error-300 hover:bg-error-50 flex-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`لا توجد اشتراكات ${formatTier(activeTab)}`}
          description="لم يتم العثور على اشتراكات في هذه الفئة"
          icon={<ClipboardList className="w-6 h-6" />}
          action={
            user?.role === 'admin' && (
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary"
              >
                إنشاء اشتراك جديد
              </button>
            )
          }
        />
      )}
      
      {/* Add Subscription Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة اشتراك جديد"
        size="3xl" // Increase modal size
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="subscription-form"
              className="btn btn-primary"
            >
              إضافة اشتراك
            </button>
          </>
        }
      >
        <form id="subscription-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Client, Duration, Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="client" className="form-label">
                العميل <span className="text-error-500">*</span>
              </label>
              <select
                id="client"
                className="form-input"
                value={formData.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              >
                <option value="">اختر عميلاً...</option>
                {allContacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.personalName} - {contact.phoneNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="duration" className="form-label">
                مدة الاشتراك <span className="text-error-500">*</span>
              </label>
              <select
                id="duration"
                className="form-input"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                required
              >
                <option value="1">1 شهر</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">12 شهر</option>
                <option value="24">24 شهر</option>
                <option value="36">36 شهر</option>
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="form-label">
                تاريخ البدء <span className="text-error-500">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
          </div>
          
          {/* Email Credentials */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">بيانات اعتماد البريد الإلكتروني</h4>
            {formData.emailCredentials.map((credential, index) => (
              <div key={credential.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                  type="text"
                  className="form-input"
                  placeholder="مزود الخدمة (Gmail, etc.)"
                  value={credential.provider}
                  onChange={(e) => {
                    const updated = [...formData.emailCredentials];
                    updated[index].provider = e.target.value;
                    setFormData({ ...formData, emailCredentials: updated });
                  }}
                />
                <input
                  type="email"
                  className="form-input"
                  placeholder="البريد الإلكتروني"
                  value={credential.email}
                  onChange={(e) => {
                    const updated = [...formData.emailCredentials];
                    updated[index].email = e.target.value;
                    setFormData({ ...formData, emailCredentials: updated });
                  }}
                />
                <input
                  type="password"
                  className="form-input"
                  placeholder="كلمة المرور"
                  value={credential.password}
                  onChange={(e) => {
                    const updated = [...formData.emailCredentials];
                    updated[index].password = e.target.value;
                    setFormData({ ...formData, emailCredentials: updated });
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline text-sm w-full"
              onClick={() => setFormData({
                ...formData,
                emailCredentials: [...formData.emailCredentials, { id: Date.now().toString(), provider: '', email: '', password: '' }]
              })}
            >
              إضافة بريد إلكتروني آخر
            </button>
          </div>
          
          {/* Service Selection */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">الخدمات المشمولة في الاشتراك</h4>
            <div className="space-y-4">
              {/* Website Services - No scheduling needed */} 
              <div className="p-4 border border-gray-200 rounded-md">
                <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات المواقع الإلكترونية</h5>
                <div className="grid grid-cols-2 gap-2">
                  {settings.prices
                    .filter(price => price.category === 'website')
                    .map(price => (
                      <label key={price.id} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="ml-2 form-checkbox"
                          checked={formData.websiteServices.some(s => s.type === price.type)}
                          onChange={(e) => handleServiceChange('websiteServices', price, e.target.checked)}
                        />
                        <span className="text-sm">{price.name} ({formatCurrency(price.basePrice)})</span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Design Services - With Scheduling */} 
              <div className="p-4 border border-gray-200 rounded-md">
                <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات التصميم</h5>
                <div className="space-y-3">
                  {settings.prices
                    .filter(price => price.category === 'design')
                    .map(price => {
                      const isSelected = formData.designServices.some(s => s.type === price.type);
                      const currentService = formData.designServices.find(s => s.type === price.type);
                      return (
                        <div key={price.id} className={`p-3 border rounded-md ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
                          <label className="flex items-center mb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="ml-2 form-checkbox"
                              checked={isSelected}
                              onChange={(e) => handleServiceChange('designServices', price, e.target.checked)}
                            />
                            <span className="text-sm font-medium">{price.name} ({formatCurrency(price.basePrice)}/شهرياً لكل وحدة)</span>
                          </label>
                          {isSelected && currentService && (
                            <div className="pl-6 space-y-2 mt-2">
                              <div>
                                <label htmlFor={`design-${price.type}-instances`} className="form-label text-xs">عدد الوحدات الشهرية:</label>
                                <input 
                                  type="number"
                                  id={`design-${price.type}-instances`}
                                  className="form-input form-input-sm"
                                  min="1"
                                  value={currentService.monthlyInstances}
                                  onChange={(e) => handleServiceDetailChange('designServices', price.type, 'monthlyInstances', parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div>
                                <label className="form-label text-xs">نوع الجدولة:</label>
                                <div className="flex gap-4">
                                  <label className="flex items-center text-sm">
                                    <input 
                                      type="radio" 
                                      name={`design-${price.type}-scheduling`}
                                      className="ml-1 form-radio"
                                      value="automatic"
                                      checked={currentService.schedulingType === 'automatic'}
                                      onChange={(e) => handleServiceDetailChange('designServices', price.type, 'schedulingType', e.target.value as SchedulingType)}
                                    />
                                    آلي
                                  </label>
                                  <label className="flex items-center text-sm">
                                    <input 
                                      type="radio" 
                                      name={`design-${price.type}-scheduling`}
                                      className="ml-1 form-radio"
                                      value="manual"
                                      checked={currentService.schedulingType === 'manual'}
                                      onChange={(e) => handleServiceDetailChange('designServices', price.type, 'schedulingType', e.target.value as SchedulingType)}
                                    />
                                    يدوي
                                  </label>
                                </div>
                              </div>
                              {/* Add Platform Selection Here if needed */}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Management Services - With Scheduling */} 
              <div className="p-4 border border-gray-200 rounded-md">
                 <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات الإدارة</h5>
                 <div className="space-y-3">
                  {settings.prices
                    .filter(price => price.category === 'management')
                    .map(price => {
                      const isSelected = formData.managementServices.some(s => s.type === price.type);
                      const currentService = formData.managementServices.find(s => s.type === price.type);
                      return (
                        <div key={price.id} className={`p-3 border rounded-md ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
                          <label className="flex items-center mb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="ml-2 form-checkbox"
                              checked={isSelected}
                              onChange={(e) => handleServiceChange('managementServices', price, e.target.checked)}
                            />
                            <span className="text-sm font-medium">{price.name} ({formatCurrency(price.basePrice)}/شهرياً لكل تحديث)</span>
                          </label>
                          {isSelected && currentService && (
                            <div className="pl-6 space-y-2 mt-2">
                              <div>
                                <label htmlFor={`mgmt-${price.type}-updates`} className="form-label text-xs">عدد التحديثات الشهرية:</label>
                                <input 
                                  type="number"
                                  id={`mgmt-${price.type}-updates`}
                                  className="form-input form-input-sm"
                                  min="1"
                                  value={currentService.monthlyUpdates}
                                  onChange={(e) => handleServiceDetailChange('managementServices', price.type, 'monthlyUpdates', parseInt(e.target.value) || 1)}
                                />
                              </div>
                              <div>
                                <label className="form-label text-xs">نوع الجدولة:</label>
                                <div className="flex gap-4">
                                  <label className="flex items-center text-sm">
                                    <input 
                                      type="radio" 
                                      name={`mgmt-${price.type}-scheduling`}
                                      className="ml-1 form-radio"
                                      value="automatic"
                                      checked={currentService.schedulingType === 'automatic'}
                                      onChange={(e) => handleServiceDetailChange('managementServices', price.type, 'schedulingType', e.target.value as SchedulingType)}
                                    />
                                    آلي
                                  </label>
                                  <label className="flex items-center text-sm">
                                    <input 
                                      type="radio" 
                                      name={`mgmt-${price.type}-scheduling`}
                                      className="ml-1 form-radio"
                                      value="manual"
                                      checked={currentService.schedulingType === 'manual'}
                                      onChange={(e) => handleServiceDetailChange('managementServices', price.type, 'schedulingType', e.target.value as SchedulingType)}
                                    />
                                    يدوي
                                  </label>
                                </div>
                              </div>
                              {/* Add Platform Selection Here if needed */}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Advertising Services - No scheduling needed, but budget input */} 
              <div className="p-4 border border-gray-200 rounded-md">
                <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات الإعلانات</h5>
                 <div className="space-y-3">
                  {settings.prices
                    .filter(price => price.category === 'advertising')
                    .map(price => {
                      const isSelected = formData.advertisingServices.some(s => s.type === price.type);
                      const currentService = formData.advertisingServices.find(s => s.type === price.type);
                      return (
                        <div key={price.id} className={`p-3 border rounded-md ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
                          <label className="flex items-center mb-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="ml-2 form-checkbox"
                              checked={isSelected}
                              onChange={(e) => handleServiceChange('advertisingServices', price, e.target.checked)}
                            />
                            <span className="text-sm font-medium">{price.name} (رسوم الخدمة: {formatCurrency(price.basePrice)})</span>
                          </label>
                          {isSelected && currentService && (
                            <div className="pl-6 space-y-2 mt-2">
                              <div>
                                <label htmlFor={`ad-${price.type}-budget`} className="form-label text-xs">ميزانية الإعلان (اختياري):</label>
                                <input 
                                  type="number"
                                  id={`ad-${price.type}-budget`}
                                  className="form-input form-input-sm"
                                  min="0"
                                  placeholder="0.00"
                                  value={currentService.budget || ''}
                                  onChange={(e) => handleServiceDetailChange('advertisingServices', price.type, 'budget', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              {/* Add Platform Selection Here */}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Subscription Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">ملخص الاشتراك</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">مدة الاشتراك:</span>
                <span className="font-medium">{formData.duration} شهر</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">تاريخ البدء:</span>
                <span className="font-medium">{formData.startDate ? new Date(formData.startDate).toLocaleDateString('ar-KW') : 'N/A'}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">تاريخ الانتهاء:</span>
                <span className="font-medium">
                  {calculateEndDate(formData.startDate, formData.duration) ? new Date(calculateEndDate(formData.startDate, formData.duration)).toLocaleDateString('ar-KW') : 'N/A'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">إجمالي السعر:</span>
                  <span className="text-primary-600">{formatCurrency(calculateTotalPrice())}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
      
      {/* View Subscription Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => { setIsViewModalOpen(false); setSelectedSubscription(null); handleCancelManualTaskEdit(); }}
        title={`تفاصيل الاشتراك - ${selectedSubscription?.clientName}`}
        size="2xl"
        footer={
          <div className="flex justify-between w-full">
            {user?.role === 'admin' && selectedSubscription && (
              <button
                onClick={() => handleDeleteSubscription(selectedSubscription.id)}
                className="btn btn-danger-outline flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الاشتراك</span>
              </button>
            )}
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => { setIsViewModalOpen(false); setSelectedSubscription(null); handleCancelManualTaskEdit(); }}
            >
              إغلاق
            </button>
          </div>
        }
      >
        {selectedSubscription && (
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">المعلومات الأساسية</h4>
              <p><strong>العميل:</strong> {selectedSubscription.clientName} ({selectedSubscription.clientPhone})</p>
              <p><strong>الفئة:</strong> <span className={`badge ${getTierBadgeColor(selectedSubscription.tier)}`}>{formatTier(selectedSubscription.tier)}</span></p>
              <p><strong>المدة:</strong> {selectedSubscription.duration} شهر</p>
              <p><strong>تاريخ البدء:</strong> {new Date(selectedSubscription.startDate).toLocaleDateString('ar-KW')}</p>
              <p><strong>تاريخ الانتهاء:</strong> {new Date(selectedSubscription.endDate).toLocaleDateString('ar-KW')}</p>
              <p><strong>السعر الإجمالي:</strong> {formatCurrency(selectedSubscription.totalPrice)}</p>
            </div>

            {/* Services */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">الخدمات</h4>
              {/* Display selected services - simplified */} 
              {selectedSubscription.websiteServices && selectedSubscription.websiteServices.length > 0 && (
                <p><strong>المواقع:</strong> {selectedSubscription.websiteServices.map(s => s.type).join(', ')}</p>
              )}
              {selectedSubscription.designServices && selectedSubscription.designServices.length > 0 && (
                <p><strong>التصميم:</strong> {selectedSubscription.designServices.map(s => `${s.type} (${s.monthlyInstances}/شهر - ${s.schedulingType === 'manual' ? 'يدوي' : 'آلي'})`).join(', ')}</p>
              )}
              {selectedSubscription.managementServices && selectedSubscription.managementServices.length > 0 && (
                <p><strong>الإدارة:</strong> {selectedSubscription.managementServices.map(s => `${s.type} (${s.monthlyUpdates}/شهر - ${s.schedulingType === 'manual' ? 'يدوي' : 'آلي'})`).join(', ')}</p>
              )}
              {selectedSubscription.advertisingServices && selectedSubscription.advertisingServices.length > 0 && (
                <p><strong>الإعلانات:</strong> {selectedSubscription.advertisingServices.map(s => s.type).join(', ')}</p>
              )}
            </div>

            {/* Email Credentials */}
            {selectedSubscription.emailCredentials && selectedSubscription.emailCredentials.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">بيانات اعتماد البريد الإلكتروني</h4>
                {selectedSubscription.emailCredentials.map(cred => (
                  <p key={cred.id}>{cred.provider}: {cred.email} (كلمة المرور مخفية)</p>
                ))}
              </div>
            )}

            {/* Manual Tasks Section */}
            {selectedSubscription.manualTasks && selectedSubscription.manualTasks.length > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">المهام اليدوية لهذا الاشتراك</h4>
                <ul className="space-y-2">
                  {selectedSubscription.manualTasks.map(task => (
                    <li key={task.id} className={`flex items-center justify-between p-2 rounded ${task.status === 'completed' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      {isEditingManualTask === task.id ? (
                        <div className="flex-grow flex items-center gap-2 mr-2">
                          <input 
                            type="text"
                            value={manualTaskEditContent}
                            onChange={(e) => setManualTaskEditContent(e.target.value)}
                            className="form-input form-input-sm flex-grow"
                          />
                          <button onClick={() => handleSaveManualTaskEdit(task.id)} className="btn btn-success btn-sm p-1">
                            <Save className="w-3 h-3" />
                          </button>
                          <button onClick={handleCancelManualTaskEdit} className="btn btn-ghost btn-sm p-1">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          className={`flex-grow text-sm cursor-pointer ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}
                          onClick={() => handleEditManualTask(task)}
                          title="انقر للتعديل"
                        >
                          {task.description}
                        </span>
                      )}
                      <div className="flex items-center">
                        {task.status !== 'completed' && isEditingManualTask !== task.id && (
                           <button 
                            onClick={() => handleEditManualTask(task)}
                            className="btn btn-ghost btn-sm p-1 mr-2"
                            title="تعديل"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                        <input 
                          type="checkbox" 
                          className="form-checkbox ml-2"
                          checked={task.status === 'completed'}
                          onChange={() => handleToggleManualTask(task.id)}
                          disabled={isEditingManualTask === task.id}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contract Download Button */}
            <div className="text-center pt-4 border-t">
              <button className="btn btn-outline flex items-center gap-1 mx-auto">
                <FileText className="w-4 h-4" />
                <span>تنزيل العقد (PDF)</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="تصدير الاشتراكات"
      >
        <p className="mb-4">اختر الصيغة التي ترغب في تصدير بيانات الاشتراكات بها:</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => handleExport('json')} className="btn btn-primary">JSON (للاستيراد)</button>
          <button onClick={() => handleExport('excel')} className="btn btn-outline">Excel</button>
          <button onClick={() => handleExport('pdf')} className="btn btn-outline">PDF</button>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;

