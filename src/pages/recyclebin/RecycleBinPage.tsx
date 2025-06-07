import React, { useState } from 'react';
import { Recycle, RefreshCw, Eye } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useSubscriptionsStore } from '../../stores/subscriptionsStore';
import { Subscription } from '../../types';
import { formatCurrency, formatTier, getTierBadgeColor } from '../../utils/helpers';
import { Timestamp } from 'firebase/firestore';

const RecycleBinPage: React.FC = () => {
  const { recycledSubscriptions, restoreSubscription } = useSubscriptionsStore();
  
  // State for modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Form state for restoring subscription
  const [formData, setFormData] = useState<Partial<Subscription> | null>(null);
  
  // Handlers
  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsViewModalOpen(true);
  };
  
  const handleOpenRestoreModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      ...subscription,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      duration: subscription.duration
    });
    setIsRestoreModalOpen(true);
  };
  
  const handleRestoreSubscription = async () => {
    if (selectedSubscription && formData) {
      try {
        await restoreSubscription(selectedSubscription.id);
        setIsRestoreModalOpen(false);
      } catch (error) {
        console.error("Error restoring subscription:", error);
      }
    }
  };

  // Helper function to safely parse dates
  const safeParseDate = (dateString: string | Date | Timestamp): Date => {
    if (dateString instanceof Date) return dateString;
    if (typeof dateString === 'string') return new Date(dateString);
    if (dateString?.toDate) return dateString.toDate();
    return new Date();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="سلة المهملات"
        subtitle="استعادة الاشتراكات المحذوفة أو المنتهية"
      />
      
      {recycledSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recycledSubscriptions.map(subscription => (
            <div key={subscription.id} className="card hover:shadow-lg transition-all duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 text-lg">{subscription.clientName}</h3>
                  <span className={`badge ${getTierBadgeColor(subscription.tier)}`}>
                    {formatTier(subscription.tier)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{subscription.clientPhone}</p>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">تاريخ الانتهاء:</span>
                  <span className="font-medium text-gray-900">
                    {safeParseDate(subscription.endDate).toLocaleDateString('ar-KW')}
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
                  
                  <button
                    onClick={() => handleOpenRestoreModal(subscription)}
                    className="btn btn-primary flex-1 text-sm"
                  >
                    <RefreshCw className="w-4 h-4 ml-1" />
                    استعادة
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="سلة المهملات فارغة"
          description="لا توجد اشتراكات محذوفة أو منتهية"
          icon={<Recycle className="w-6 h-6" />}
        />
      )}
      
      {/* View Subscription Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="تفاصيل الاشتراك"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                if (selectedSubscription) {
                  handleOpenRestoreModal(selectedSubscription);
                }
              }}
              className="btn btn-primary"
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              استعادة الاشتراك
            </button>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="btn btn-outline"
            >
              إغلاق
            </button>
          </div>
        }
      >
        {selectedSubscription && (
          <div className="space-y-6">
            {/* Subscription Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-900">{selectedSubscription.clientName}</h3>
                <span className={`badge ${getTierBadgeColor(selectedSubscription.tier)}`}>
                  {formatTier(selectedSubscription.tier)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium">{selectedSubscription.clientPhone}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">مدة الاشتراك:</span>
                  <span className="font-medium">{selectedSubscription.duration} شهر</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ البدء:</span>
                  <span className="font-medium">
                    {safeParseDate(selectedSubscription.startDate).toLocaleDateString('ar-KW')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ الانتهاء:</span>
                  <span className="font-medium">
                    {safeParseDate(selectedSubscription.endDate).toLocaleDateString('ar-KW')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">الحالة:</span>
                  <span className="font-medium text-error-600">
                    {selectedSubscription.status === 'expired' ? 'منتهي' : 'محذوف'}
                  </span>
                </div>
                
                {selectedSubscription.deletedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">تاريخ الحذف:</span>
                    <span className="font-medium">
                      {safeParseDate(selectedSubscription.deletedAt).toLocaleDateString('ar-KW')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 mt-2">
                  <span className="font-medium text-gray-900">إجمالي السعر:</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(selectedSubscription.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Service summary */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">ملخص الخدمات</h4>
              
              <div className="space-y-3">
                {selectedSubscription.websiteServices && selectedSubscription.websiteServices.length > 0 && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">خدمات المواقع:</span>
                    <span className="font-medium">{selectedSubscription.websiteServices.length} خدمة</span>
                  </div>
                )}
                
                {selectedSubscription.designServices && selectedSubscription.designServices.length > 0 && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">خدمات التصميم:</span>
                    <span className="font-medium">{selectedSubscription.designServices.length} خدمة</span>
                  </div>
                )}
                
                {selectedSubscription.managementServices && selectedSubscription.managementServices.length > 0 && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">خدمات الإدارة:</span>
                    <span className="font-medium">{selectedSubscription.managementServices.length} خدمة</span>
                  </div>
                )}
                
                {selectedSubscription.advertisingServices && selectedSubscription.advertisingServices.length > 0 && (
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">خدمات الإعلانات:</span>
                    <span className="font-medium">{selectedSubscription.advertisingServices.length} خدمة</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Restore Subscription Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="استعادة الاشتراك"
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsRestoreModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRestoreSubscription}
            >
              استعادة الاشتراك
            </button>
          </>
        }
      >
        {selectedSubscription && formData && (
          <div className="space-y-6">
            <p className="text-gray-600">
              يمكنك مراجعة وتعديل تفاصيل الاشتراك قبل استعادته:
            </p>
            
            {/* Client Info - Display only, not editable */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">معلومات العميل</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">اسم العميل:</span>
                  <span className="font-medium">{formData.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium">{formData.clientPhone}</span>
                </div>
              </div>
            </div>
            
            {/* Editable Duration */}
            <div>
              <label htmlFor="duration" className="form-label">
                تحديث مدة الاشتراك
              </label>
              <select
                id="duration"
                className="form-input"
                value={formData.duration}
                onChange={(e) => {
                  const duration = parseInt(e.target.value);
                  const startDate = safeParseDate(formData.startDate || selectedSubscription.startDate);
                  const endDate = new Date(startDate.setMonth(startDate.getMonth() + duration)).toISOString();
                  
                  setFormData({ 
                    ...formData, 
                    duration,
                    endDate
                  });
                }}
              >
                <option value="1">1 شهر</option>
                <option value="3">3 أشهر</option>
                <option value="6">6 أشهر</option>
                <option value="12">12 شهر</option>
              </select>
            </div>
            
            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="form-label">
                تحديث تاريخ البدء
              </label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                value={safeParseDate(formData.startDate || selectedSubscription.startDate).toISOString().split('T')[0]}
                onChange={(e) => {
                  const startDate = e.target.value;
                  const duration = formData.duration || selectedSubscription.duration;
                  const endDate = new Date(
                    new Date(startDate).setMonth(
                      new Date(startDate).getMonth() + duration
                    )
                  ).toISOString();
                  
                  setFormData({ 
                    ...formData, 
                    startDate,
                    endDate
                  });
                }}
              />
            </div>
            
            {/* Display calculated end date */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">تاريخ الانتهاء المحسوب:</span>
                <span className="font-medium">
                  {safeParseDate(formData.endDate || selectedSubscription.endDate).toLocaleDateString('ar-KW')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecycleBinPage;