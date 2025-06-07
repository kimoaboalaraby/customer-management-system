import React, { useState } from 'react';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { useSettingsStore } from '../../stores/settingsStore';
import { ServicePrice } from '../../types';

const SettingsPage: React.FC = () => {
  const { settings, addPrice, updatePrice, deletePrice } = useSettingsStore();
  
  // State for selected category and modals
  const [selectedCategory, setSelectedCategory] = useState<'website' | 'design' | 'management' | 'advertising'>('website');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  
  // Form state
  const [priceFormData, setPriceFormData] = useState<{
    id?: string;
    category: 'website' | 'design' | 'management' | 'advertising';
    type: string;
    name: string;
    basePrice: number;
  }>({
    category: 'website',
    type: '',
    name: '',
    basePrice: 0
  });
  
  // Filter prices by category
  const filteredPrices = settings.prices.filter(
    price => price.category === selectedCategory
  );
  
  // Handlers
  const handleOpenPriceModal = (price?: ServicePrice) => {
    if (price) {
      setPriceFormData({
        id: price.id,
        category: price.category as any,
        type: price.type,
        name: price.name,
        basePrice: price.basePrice
      });
    } else {
      setPriceFormData({
        category: selectedCategory,
        type: '',
        name: '',
        basePrice: 0
      });
    }
    setIsPriceModalOpen(true);
  };
  
  const handleSubmitPrice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (priceFormData.id) {
      // Update existing price
      updatePrice(priceFormData.id, {
        category: priceFormData.category,
        type: priceFormData.type,
        name: priceFormData.name,
        basePrice: priceFormData.basePrice
      });
    } else {
      // Add new price
      addPrice({
        category: priceFormData.category,
        type: priceFormData.type,
        name: priceFormData.name,
        basePrice: priceFormData.basePrice
      });
    }
    
    setIsPriceModalOpen(false);
  };
  
  const handleDeletePrice = (id: string) => {
    // In a real app, you'd show a confirmation dialog first
    deletePrice(id);
  };
  
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'website':
        return 'خدمات المواقع الإلكترونية';
      case 'design':
        return 'خدمات التصميم';
      case 'management':
        return 'خدمات الإدارة';
      case 'advertising':
        return 'خدمات الإعلانات';
      default:
        return category;
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="الإعدادات"
        subtitle="تخصيص إعدادات النظام"
      />
      
      <div className="card p-6 mb-6">
        <h2 className="text-xl font-semibold mb-6">أسعار الخدمات</h2>
        
        {/* Category Tabs */}
        <div className="flex overflow-x-auto mb-6 pb-2 no-scrollbar">
          <div className="inline-flex rounded-md bg-gray-50 p-1 shadow-sm">
            <button
              className={`px-4 py-2.5 rounded-md text-sm font-medium ${
                selectedCategory === 'website' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCategory('website')}
            >
              خدمات المواقع
            </button>
            <button
              className={`px-4 py-2.5 rounded-md text-sm font-medium ${
                selectedCategory === 'design' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCategory('design')}
            >
              خدمات التصميم
            </button>
            <button
              className={`px-4 py-2.5 rounded-md text-sm font-medium ${
                selectedCategory === 'management' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCategory('management')}
            >
              خدمات الإدارة
            </button>
            <button
              className={`px-4 py-2.5 rounded-md text-sm font-medium ${
                selectedCategory === 'advertising' 
                  ? 'bg-primary-100 text-primary-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedCategory('advertising')}
            >
              خدمات الإعلانات
            </button>
          </div>
        </div>
        
        {/* Prices Table */}
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الخدمة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  النوع
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر الأساسي
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPrices.map(price => (
                <tr key={price.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{price.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{price.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{price.basePrice.toFixed(2)} د.ك</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    <button
                      onClick={() => handleOpenPriceModal(price)}
                      className="text-primary-600 hover:text-primary-900 ml-3"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeletePrice(price.id)}
                      className="text-error-600 hover:text-error-900"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredPrices.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    لا توجد أسعار مسجلة لهذه الفئة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <button
          onClick={() => handleOpenPriceModal()}
          className="btn btn-primary flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إضافة سعر جديد</span>
        </button>
      </div>
      
      {/* Price Modal */}
      <Modal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        title={priceFormData.id ? 'تعديل سعر خدمة' : 'إضافة سعر خدمة جديد'}
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsPriceModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="price-form"
              className="btn btn-primary"
            >
              {priceFormData.id ? 'حفظ التغييرات' : 'إضافة سعر'}
            </button>
          </>
        }
      >
        <form id="price-form" onSubmit={handleSubmitPrice} className="space-y-4">
          <div>
            <label htmlFor="category" className="form-label">
              الفئة <span className="text-error-500">*</span>
            </label>
            <select
              id="category"
              className="form-input"
              value={priceFormData.category}
              onChange={(e) => setPriceFormData({ 
                ...priceFormData, 
                category: e.target.value as any 
              })}
              required
            >
              <option value="website">خدمات المواقع الإلكترونية</option>
              <option value="design">خدمات التصميم</option>
              <option value="management">خدمات الإدارة</option>
              <option value="advertising">خدمات الإعلانات</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="type" className="form-label">
              النوع <span className="text-error-500">*</span>
            </label>
            <input
              id="type"
              type="text"
              className="form-input"
              value={priceFormData.type}
              onChange={(e) => setPriceFormData({ ...priceFormData, type: e.target.value })}
              required
              placeholder="مثال: bloggerSetup، poster"
            />
            <p className="text-xs text-gray-500 mt-1">
              هذا هو المعرف الفني للخدمة، ويجب أن يكون باللغة الإنجليزية وبدون مسافات.
            </p>
          </div>
          
          <div>
            <label htmlFor="name" className="form-label">
              اسم الخدمة <span className="text-error-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={priceFormData.name}
              onChange={(e) => setPriceFormData({ ...priceFormData, name: e.target.value })}
              required
              placeholder="مثال: إنشاء موقع بلوجر"
            />
          </div>
          
          <div>
            <label htmlFor="basePrice" className="form-label">
              السعر الأساسي <span className="text-error-500">*</span>
            </label>
            <input
              id="basePrice"
              type="number"
              step="0.01"
              className="form-input"
              value={priceFormData.basePrice}
              onChange={(e) => setPriceFormData({ 
                ...priceFormData, 
                basePrice: parseFloat(e.target.value) 
              })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              سعر الوحدة الواحدة من هذه الخدمة بالدينار الكويتي.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;