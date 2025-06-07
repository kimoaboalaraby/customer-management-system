import React, { useState } from 'react';
import { UserPlus, Search, UserCog, UserCircle, Edit, Trash2, Lock } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useEmployeesStore } from '../../stores/employeesStore';
import { Employee } from '../../types';
import { getPerformanceColor, formatCurrency } from '../../utils/helpers';

// ملاحظة: يجب تعديل ملف التعريفات (../../types) لإضافة خاصية password كخاصية اختيارية
// export interface Employee {
//   ...
//   password?: string;
//   ...
// }

const EmployeesPage: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, updateCredentials } = useEmployeesStore();
  
  // State for searching and modals
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    age: 0,
    specialization: 'design',
    phoneNumber: '',
    whatsappNumber: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    },
    monthlySalary: 0,
    username: '',
    password: '' // الآن هذه الخاصية مقبولة لأنها جزء من نوع البيانات Employee
  });
  
  // Credentials form state
  const [credentialsData, setCredentialsData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  // Filtered employees based on search
  const filteredEmployees = employees.filter(employee => 
    employee.name.includes(searchTerm) || 
    employee.specialization.includes(searchTerm) ||
    employee.phoneNumber.includes(searchTerm)
  );
  
  // Handlers
  const handleOpenAddModal = (employee?: Employee) => {
    if (employee) {
      setFormData({
        ...employee,
        password: '' // Don't include password when editing
      });
    } else {
      setFormData({
        name: '',
        age: 0,
        specialization: 'design',
        phoneNumber: '',
        whatsappNumber: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        },
        monthlySalary: 0,
        username: '',
        password: ''
      });
    }
    setIsAddModalOpen(true);
  };
  
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewModalOpen(true);
  };
  
  const handleOpenCredentialsModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCredentialsData({
      username: employee.username,
      password: '',
      confirmPassword: ''
    });
    setIsCredentialsModalOpen(true);
  };
  
  const handleSubmitEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.id) {
      // Update existing employee
      updateEmployee(formData as Employee);
    } else {
      // Add new employee
      addEmployee({
        name: formData.name || '',
        age: formData.age || 0,
        specialization: formData.specialization || 'design',
        phoneNumber: formData.phoneNumber || '',
        whatsappNumber: formData.whatsappNumber || '',
        socialMedia: formData.socialMedia || {},
        monthlySalary: formData.monthlySalary || 0,
        username: formData.username || '',
        password: formData.password || '',
      });
    }
    
    setIsAddModalOpen(false);
  };
  
  const handleSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;
    
    if (credentialsData.password !== credentialsData.confirmPassword) {
      // In a real app, you'd show an error message
      return;
    }
    
    updateCredentials(selectedEmployee.id, credentialsData.username, credentialsData.password);
    setIsCredentialsModalOpen(false);
  };
  
  const handleDeleteEmployee = (id: string) => {
    // In a real app, you'd show a confirmation dialog first
    deleteEmployee(id);
  };
  
  const getPerformanceLabel = (performance: 'excellent' | 'good' | 'weak' | null) => {
    switch (performance) {
      case 'excellent':
        return 'ممتاز';
      case 'good':
        return 'جيد';
      case 'weak':
        return 'ضعيف';
      default:
        return 'غير محدد';
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="الموظفين"
        subtitle="إدارة فريق العمل وتتبع الأداء"
        action={
          <button
            onClick={() => handleOpenAddModal()}
            className="btn btn-primary flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف</span>
          </button>
        }
      />
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="البحث عن موظف..."
            className="form-input pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Employees Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="card hover:shadow-lg transition-all duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <UserCircle className="h-8 w-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{employee.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {employee.specialization === 'design' ? 'مصمم' : 
                         employee.specialization === 'content' ? 'كاتب محتوى' :
                         employee.specialization === 'advertising' ? 'مختص إعلانات' :
                         employee.specialization === 'management' ? 'مدير' : 
                         employee.specialization}
                      </p>
                    </div>
                  </div>
                  
                  {employee.performance && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getPerformanceColor(employee.performance)}`}>
                      {getPerformanceLabel(employee.performance)}
                    </span>
                  )}
                </div>
                
                <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الراتب الشهري:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(employee.monthlySalary)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">التحذيرات:</span>
                    <span className={`font-medium ${
                      employee.warningCount >= 3 ? 'text-error-600' : 
                      employee.warningCount > 0 ? 'text-warning-600' : 
                      'text-gray-900'
                    }`}>
                      {employee.warningCount} / 4
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 mt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleViewEmployee(employee)}
                    className="btn btn-outline flex-1 text-sm"
                  >
                    <UserCog className="w-4 h-4 ml-1" />
                    التفاصيل
                  </button>
                  
                  <button
                    onClick={() => handleOpenAddModal(employee)}
                    className="btn btn-outline flex-1 text-sm"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="لا يوجد موظفين"
          description="لم يتم العثور على موظفين يطابقون معايير البحث"
          icon={<UserCog className="w-6 h-6" />}
          action={
            <button
              onClick={() => handleOpenAddModal()}
              className="btn btn-primary"
            >
              إضافة موظف جديد
            </button>
          }
        />
      )}
      
      {/* Add/Edit Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={formData.id ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}
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
              form="employee-form"
              className="btn btn-primary"
            >
              {formData.id ? 'حفظ التغييرات' : 'إضافة موظف'}
            </button>
          </>
        }
      >
        <form id="employee-form" onSubmit={handleSubmitEmployee} className="space-y-4">
          <div>
            <label htmlFor="name" className="form-label">
              الاسم <span className="text-error-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="age" className="form-label">
              العمر <span className="text-error-500">*</span>
            </label>
            <input
              id="age"
              type="number"
              className="form-input"
              value={formData.age || ''}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="specialization" className="form-label">
              التخصص <span className="text-error-500">*</span>
            </label>
            <select
              id="specialization"
              className="form-input"
              value={formData.specialization || 'design'}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              required
            >
              <option value="design">مصمم</option>
              <option value="content">كاتب محتوى</option>
              <option value="advertising">مختص إعلانات</option>
              <option value="management">مدير</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="phone" className="form-label">
              رقم الهاتف <span className="text-error-500">*</span>
            </label>
            <input
              id="phone"
              type="text"
              className="form-input"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="whatsapp" className="form-label">
              رقم الواتساب
            </label>
            <input
              id="whatsapp"
              type="text"
              className="form-input"
              value={formData.whatsappNumber || ''}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            />
          </div>
          
          <div>
            <label htmlFor="salary" className="form-label">
              الراتب الشهري <span className="text-error-500">*</span>
            </label>
            <input
              id="salary"
              type="number"
              className="form-input"
              value={formData.monthlySalary || ''}
              onChange={(e) => setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) })}
              required
            />
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">وسائل التواصل الاجتماعي</h4>
            
            <div className="space-y-3">
              <div>
                <label htmlFor="facebook" className="form-label">
                  فيسبوك
                </label>
                <input
                  id="facebook"
                  type="text"
                  className="form-input"
                  value={formData.socialMedia?.facebook || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: {
                      ...formData.socialMedia,
                      facebook: e.target.value
                    }
                  })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              
              <div>
                <label htmlFor="instagram" className="form-label">
                  انستجرام
                </label>
                <input
                  id="instagram"
                  type="text"
                  className="form-input"
                  value={formData.socialMedia?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: {
                      ...formData.socialMedia,
                      instagram: e.target.value
                    }
                  })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              
              <div>
                <label htmlFor="twitter" className="form-label">
                  تويتر
                </label>
                <input
                  id="twitter"
                  type="text"
                  className="form-input"
                  value={formData.socialMedia?.twitter || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: {
                      ...formData.socialMedia,
                      twitter: e.target.value
                    }
                  })}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
          </div>
          
          {!formData.id && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">بيانات تسجيل الدخول</h4>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="username" className="form-label">
                    اسم المستخدم <span className="text-error-500">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required={!formData.id}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="form-label">
                    كلمة المرور <span className="text-error-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!formData.id}
                  />
                </div>
              </div>
            </div>
          )}
        </form>
      </Modal>
      
      {/* View Employee Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="تفاصيل الموظف"
        footer={
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  if (selectedEmployee) {
                    handleOpenCredentialsModal(selectedEmployee);
                  }
                }}
                className="btn btn-outline"
              >
                <Lock className="w-4 h-4 ml-1" />
                تعديل بيانات الدخول
              </button>
              
              {selectedEmployee && (
                <button
                  onClick={() => {
                    if (selectedEmployee) {
                      handleDeleteEmployee(selectedEmployee.id);
                      setIsViewModalOpen(false);
                    }
                  }}
                  className="btn btn-outline text-error-600 border-error-300 hover:bg-error-50"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف الموظف
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="btn btn-primary"
            >
              إغلاق
            </button>
          </div>
        }
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gray-100 rounded-full">
                <UserCircle className="h-10 w-10 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">{selectedEmployee.name}</h3>
                <p className="text-gray-600">
                  {selectedEmployee.specialization === 'design' ? 'مصمم' : 
                   selectedEmployee.specialization === 'content' ? 'كاتب محتوى' :
                   selectedEmployee.specialization === 'advertising' ? 'مختص إعلانات' :
                   selectedEmployee.specialization === 'management' ? 'مدير' : 
                   selectedEmployee.specialization}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">المعلومات الشخصية</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">العمر:</span>
                  <span className="font-medium">{selectedEmployee.age} سنة</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium">{selectedEmployee.phoneNumber}</span>
                </div>
                
                {selectedEmployee.whatsappNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">رقم الواتساب:</span>
                    <span className="font-medium">{selectedEmployee.whatsappNumber}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">الراتب الشهري:</span>
                  <span className="font-medium">{formatCurrency(selectedEmployee.monthlySalary)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">الأداء والتحذيرات</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">مستوى الأداء:</span>
                  <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${getPerformanceColor(selectedEmployee.performance)}`}>
                    {getPerformanceLabel(selectedEmployee.performance)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">عدد التحذيرات:</span>
                  <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                    selectedEmployee.warningCount >= 3 ? 'bg-error-100 text-error-800' : 
                    selectedEmployee.warningCount > 0 ? 'bg-warning-100 text-warning-800' : 
                    'bg-success-100 text-success-800'
                  }`}>
                    {selectedEmployee.warningCount} / 4
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">وسائل التواصل الاجتماعي</h4>
              
              {selectedEmployee.socialMedia && Object.entries(selectedEmployee.socialMedia).some(([_, value]) => value) ? (
                <div className="space-y-2">
                  {selectedEmployee.socialMedia.facebook && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">فيسبوك:</span>
                      <a 
                        href={selectedEmployee.socialMedia.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {selectedEmployee.socialMedia.facebook}
                      </a>
                    </div>
                  )}
                  
                  {selectedEmployee.socialMedia.instagram && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">انستجرام:</span>
                      <a 
                        href={selectedEmployee.socialMedia.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {selectedEmployee.socialMedia.instagram}
                      </a>
                    </div>
                  )}
                  
                  {selectedEmployee.socialMedia.twitter && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">تويتر:</span>
                      <a 
                        href={selectedEmployee.socialMedia.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        {selectedEmployee.socialMedia.twitter}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">لا توجد حسابات تواصل اجتماعي مسجلة</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">بيانات تسجيل الدخول</h4>
              
              <div className="flex justify-between">
                <span className="text-gray-600">اسم المستخدم:</span>
                <span className="font-medium">{selectedEmployee.username}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Credentials Modal */}
      <Modal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        title="تعديل بيانات تسجيل الدخول"
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsCredentialsModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="credentials-form"
              className="btn btn-primary"
            >
              حفظ التغييرات
            </button>
          </>
        }
      >
        <form id="credentials-form" onSubmit={handleSubmitCredentials} className="space-y-4">
          <div>
            <label htmlFor="username" className="form-label">
              اسم المستخدم <span className="text-error-500">*</span>
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={credentialsData.username}
              onChange={(e) => setCredentialsData({ ...credentialsData, username: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">
              كلمة المرور الجديدة <span className="text-error-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={credentialsData.password}
              onChange={(e) => setCredentialsData({ ...credentialsData, password: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="form-label">
              تأكيد كلمة المرور <span className="text-error-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              value={credentialsData.confirmPassword}
              onChange={(e) => setCredentialsData({ ...credentialsData, confirmPassword: e.target.value })}
              required
            />
            {credentialsData.password !== credentialsData.confirmPassword && (
              <p className="form-error">كلمة المرور غير متطابقة</p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeesPage;