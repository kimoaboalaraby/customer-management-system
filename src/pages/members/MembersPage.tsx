import React, { useState } from 'react';
import { PlusCircle, Download, Folder as FolderIcon, Users, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import FolderList from './components/FolderList';
import ContactList from './components/ContactList';
import { useMembersStore } from '../../stores/membersStore';
import { Contact, Folder } from '../../types';
import { useAuthStore } from '../../stores/authStore';

const MembersPage: React.FC = () => {
  const { user } = useAuthStore();
  const { folders, addFolder, updateFolder, deleteFolder, addContact, updateContact, deleteContact, exportFolder, exportAllFolders } = useMembersStore();
  
  // State for folder selection and modals
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folders.length > 0 ? folders[0].id : null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isViewContactModalOpen, setIsViewContactModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // State for form data
  const [folderFormData, setFolderFormData] = useState<{ id?: string; name: string }>({ name: '' });
  const [contactFormData, setContactFormData] = useState<Partial<Contact>>({
    phoneNumber: '',
    companyName: '',
    personalName: '',
    nationality: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      tiktok: '',
      snapchat: '',
      youtube: '',
    }
  });
  
  // Computed properties
  const selectedFolder = folders.find(folder => folder.id === selectedFolderId);
  const selectedFolderContacts = selectedFolder?.contacts || [];
  
  // Handler functions
  const handleOpenFolderModal = (folder?: Folder) => {
    if (folder) {
      setFolderFormData({ id: folder.id, name: folder.name });
    } else {
      setFolderFormData({ name: '' });
    }
    setIsFolderModalOpen(true);
  };
  
  const handleOpenContactModal = (contact?: Contact) => {
    if (contact) {
      setContactFormData({ ...contact });
    } else {
      setContactFormData({
        phoneNumber: '',
        companyName: '',
        personalName: '',
        nationality: '',
        socialMedia: {
          facebook: '',
          instagram: '',
          tiktok: '',
          snapchat: '',
          youtube: '',
        }
      });
    }
    setIsContactModalOpen(true);
  };
  
  const handleViewContact = (contact: Contact) => {
    setContactFormData(contact);
    setIsViewContactModalOpen(true);
  };
  
  const handleSubmitFolder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (folderFormData.id) {
      updateFolder(folderFormData.id, folderFormData.name);
    } else {
      addFolder(folderFormData.name);
    }
    
    setIsFolderModalOpen(false);
  };
  
  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFolderId) return;
    
    if (contactFormData.id) {
      updateContact(selectedFolderId, contactFormData as Contact);
    } else {
      addContact(selectedFolderId, {
        phoneNumber: contactFormData.phoneNumber || '',
        companyName: contactFormData.companyName || '',
        personalName: contactFormData.personalName || '',
        nationality: contactFormData.nationality || '',
        socialMedia: contactFormData.socialMedia || {}
      });
    }
    
    setIsContactModalOpen(false);
  };
  
  const handleExport = (format: 'pdf' | 'excel' | 'image' | 'json') => {
    if (selectedFolderId) {
      exportFolder(selectedFolderId, format);
    } else {
      exportAllFolders(format);
    }
    setIsExportModalOpen(false);
  };
  
  const handleDeleteFolder = (folderId: string) => {
    // In a real app, you'd show a confirmation dialog first
    deleteFolder(folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId(folders.length > 1 ? folders[0].id : null);
    }
  };
  
  const handleDeleteContact = (contactId: string) => {
    // In a real app, you'd show a confirmation dialog first
    if (selectedFolderId) {
      deleteContact(selectedFolderId, contactId);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="الأعضاء"
        subtitle="إدارة العملاء وجهات الاتصال"
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
                onClick={() => handleOpenFolderModal()}
                className="btn btn-primary flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة مجلد</span>
              </button>
            </div>
          )
        }
      />
      
      {folders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Folder list */}
          <div className="md:col-span-1">
            <FolderList 
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onAddFolder={() => handleOpenFolderModal()}
              onEditFolder={handleOpenFolderModal}
              onDeleteFolder={handleDeleteFolder}
              onExportFolder={(folderId) => {
                setSelectedFolderId(folderId);
                setIsExportModalOpen(true);
              }}
            />
          </div>
          
          {/* Contact list */}
          <div className="md:col-span-2">
            {selectedFolder ? (
              <ContactList 
                contacts={selectedFolderContacts}
                selectedFolderName={selectedFolder.name}
                onAddContact={() => handleOpenContactModal()}
                onViewContact={handleViewContact}
                onEditContact={handleOpenContactModal}
                onDeleteContact={handleDeleteContact}
              />
            ) : (
              <EmptyState
                title="لم يتم تحديد مجلد"
                description="الرجاء تحديد مجلد لعرض جهات الاتصال"
                icon={<FolderIcon className="w-6 h-6" />}
              />
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          title="لا توجد مجلدات بعد"
          description="أنشئ مجلدًا جديدًا لتنظيم جهات الاتصال الخاصة بك"
          icon={<Users className="w-6 h-6" />}
          action={
            <button
              onClick={() => handleOpenFolderModal()}
              className="btn btn-primary"
            >
              إنشاء مجلد جديد
            </button>
          }
        />
      )}
      
      {/* Folder Modal */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title={folderFormData.id ? 'تعديل مجلد' : 'إضافة مجلد جديد'}
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsFolderModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="folder-form"
              className="btn btn-primary"
            >
              {folderFormData.id ? 'حفظ التغييرات' : 'إضافة مجلد'}
            </button>
          </>
        }
      >
        <form id="folder-form" onSubmit={handleSubmitFolder}>
          <div className="mb-4">
            <label htmlFor="folder-name" className="form-label">
              اسم المجلد
            </label>
            <input
              id="folder-name"
              type="text"
              className="form-input"
              value={folderFormData.name}
              onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
      
      {/* Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={contactFormData.id ? 'تعديل جهة اتصال' : 'إضافة جهة اتصال جديدة'}
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsContactModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="contact-form"
              className="btn btn-primary"
            >
              {contactFormData.id ? 'حفظ التغييرات' : 'إضافة جهة اتصال'}
            </button>
          </>
        }
      >
        <form id="contact-form" onSubmit={handleSubmitContact}>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="form-label">
                رقم الهاتف <span className="text-error-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                className="form-input"
                value={contactFormData.phoneNumber || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, phoneNumber: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label htmlFor="personal-name" className="form-label">
                الاسم الشخصي <span className="text-error-500">*</span>
              </label>
              <input
                id="personal-name"
                type="text"
                className="form-input"
                value={contactFormData.personalName || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, personalName: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label htmlFor="company" className="form-label">
                اسم الشركة / مجال العمل
              </label>
              <input
                id="company"
                type="text"
                className="form-input"
                value={contactFormData.companyName || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, companyName: e.target.value })}
              />
            </div>
            
            <div>
              <label htmlFor="nationality" className="form-label">
                الجنسية
              </label>
              <input
                id="nationality"
                type="text"
                className="form-input"
                value={contactFormData.nationality || ''}
                onChange={(e) => setContactFormData({ ...contactFormData, nationality: e.target.value })}
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
                    value={contactFormData.socialMedia?.facebook || ''}
                    onChange={(e) => setContactFormData({
                      ...contactFormData,
                      socialMedia: {
                        ...contactFormData.socialMedia,
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
                    value={contactFormData.socialMedia?.instagram || ''}
                    onChange={(e) => setContactFormData({
                      ...contactFormData,
                      socialMedia: {
                        ...contactFormData.socialMedia,
                        instagram: e.target.value
                      }
                    })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                
                <div>
                  <label htmlFor="tiktok" className="form-label">
                    تيك توك
                  </label>
                  <input
                    id="tiktok"
                    type="text"
                    className="form-input"
                    value={contactFormData.socialMedia?.tiktok || ''}
                    onChange={(e) => setContactFormData({
                      ...contactFormData,
                      socialMedia: {
                        ...contactFormData.socialMedia,
                        tiktok: e.target.value
                      }
                    })}
                    placeholder="https://tiktok.com/@..."
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
      
      {/* View Contact Modal */}
      <Modal
        isOpen={isViewContactModalOpen}
        onClose={() => setIsViewContactModalOpen(false)}
        title="تفاصيل جهة الاتصال"
        footer={
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setIsViewContactModalOpen(false)}
          >
            إغلاق
          </button>
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-gray-900 mb-2">{contactFormData.personalName}</h3>
            
            <div className="space-y-2">
              <div className="flex items-start">
                <span className="text-gray-500 w-24">رقم الهاتف:</span>
                <span className="text-gray-900">{contactFormData.phoneNumber}</span>
              </div>
              
              {contactFormData.companyName && (
                <div className="flex items-start">
                  <span className="text-gray-500 w-24">الشركة:</span>
                  <span className="text-gray-900">{contactFormData.companyName}</span>
                </div>
              )}
              
              {contactFormData.nationality && (
                <div className="flex items-start">
                  <span className="text-gray-500 w-24">الجنسية:</span>
                  <span className="text-gray-900">{contactFormData.nationality}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">وسائل التواصل الاجتماعي</h4>
            
            {contactFormData.socialMedia && Object.entries(contactFormData.socialMedia).some(([_, value]) => value) ? (
              <div className="space-y-2">
                {contactFormData.socialMedia.facebook && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">فيسبوك:</span>
                    <a 
                      href={contactFormData.socialMedia.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate"
                    >
                      {contactFormData.socialMedia.facebook}
                    </a>
                  </div>
                )}
                
                {contactFormData.socialMedia.instagram && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">انستجرام:</span>
                    <a 
                      href={contactFormData.socialMedia.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate"
                    >
                      {contactFormData.socialMedia.instagram}
                    </a>
                  </div>
                )}
                
                {contactFormData.socialMedia.tiktok && (
                  <div className="flex items-center">
                    <span className="text-gray-500 w-24">تيك توك:</span>
                    <a 
                      href={contactFormData.socialMedia.tiktok} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline truncate"
                    >
                      {contactFormData.socialMedia.tiktok}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">لا توجد حسابات تواصل اجتماعي مسجلة</p>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="تصدير البيانات"
        footer={
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setIsExportModalOpen(false)}
          >
            إلغاء
          </button>
        }
      >
        <p className="text-gray-600 mb-4">
          اختر صيغة التصدير المناسبة:
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <span className="text-xl font-bold mb-1">PDF</span>
            <span className="text-xs text-gray-500">مستند قابل للطباعة</span>
          </button>
          
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <span className="text-xl font-bold mb-1">Excel</span>
            <span className="text-xs text-gray-500">جدول بيانات</span>
          </button>
          
          <button
            onClick={() => handleExport('json')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <span className="text-xl font-bold mb-1">JSON</span>
            <span className="text-xs text-gray-500">بيانات منظمة</span>
          </button>
          
          <button
            onClick={() => handleExport('image')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <span className="text-xl font-bold mb-1">صورة</span>
            <span className="text-xs text-gray-500">لقطة مرئية</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MembersPage;