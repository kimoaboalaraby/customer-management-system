import React from 'react';
import { UserCircle, Search, Plus, Phone, Building, MoreVertical, Edit, Trash2, ExternalLink } from 'lucide-react';
import { Contact } from '../../../types';

interface ContactListProps {
  contacts: Contact[];
  selectedFolderName: string;
  onAddContact: () => void;
  onViewContact: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedFolderName,
  onAddContact,
  onViewContact,
  onEditContact,
  onDeleteContact
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  
  const toggleMenu = (contactId: string) => {
    setMenuOpen(menuOpen === contactId ? null : contactId);
  };
  
  const closeMenu = () => {
    setMenuOpen(null);
  };
  
  const filteredContacts = contacts.filter(contact => 
    contact.personalName.includes(searchTerm) || 
    contact.phoneNumber.includes(searchTerm) ||
    contact.companyName.includes(searchTerm)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">جهات الاتصال في {selectedFolderName}</h3>
        <button
          onClick={onAddContact}
          className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="إضافة جهة اتصال"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="search"
            placeholder="بحث في جهات الاتصال..."
            className="form-input pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1">
        {filteredContacts.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {filteredContacts.map(contact => (
              <li 
                key={contact.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onViewContact(contact)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <div className="bg-primary-100 text-primary-700 p-2 rounded-full">
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.personalName}</p>
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 ml-1" />
                        <span>{contact.phoneNumber}</span>
                      </div>
                      {contact.companyName && (
                        <div className="flex items-center mt-0.5 text-sm text-gray-500">
                          <Building className="w-3.5 h-3.5 ml-1" />
                          <span>{contact.companyName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(contact.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                      aria-label="قائمة الإجراءات"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {menuOpen === contact.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={closeMenu}
                        />
                        
                        <div className="absolute left-0 mt-1 py-1 w-40 bg-white rounded-md shadow-lg z-20 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewContact(contact);
                              closeMenu();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <ExternalLink className="w-4 h-4 ml-2" />
                            عرض التفاصيل
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditContact(contact);
                              closeMenu();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل جهة الاتصال
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteContact(contact.id);
                              closeMenu();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف جهة الاتصال
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 h-full">
            <UserCircle className="w-12 h-12 text-gray-300 mb-2" />
            {searchTerm ? (
              <>
                <p>لم يتم العثور على نتائج</p>
                <p className="text-sm">جرب كلمات بحث مختلفة</p>
              </>
            ) : (
              <>
                <p>لا توجد جهات اتصال</p>
                <p className="text-sm">قم بإضافة جهة اتصال جديدة للبدء</p>
                <button
                  onClick={onAddContact}
                  className="mt-3 btn btn-outline text-sm px-3 py-1.5"
                >
                  إضافة جهة اتصال
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;