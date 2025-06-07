import React from 'react';
import { Folder, File, Plus, MoreVertical, Trash2, Edit, Download } from 'lucide-react';
import { Folder as FolderType } from '../../../types';

interface FolderListProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onAddFolder: () => void;
  onEditFolder: (folder: FolderType) => void;
  onDeleteFolder: (folderId: string) => void;
  onExportFolder: (folderId: string) => void;
}

const FolderList: React.FC<FolderListProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onExportFolder
}) => {
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  
  const toggleMenu = (folderId: string) => {
    setMenuOpen(menuOpen === folderId ? null : folderId);
  };
  
  const closeMenu = () => {
    setMenuOpen(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">المجلدات</h3>
        <button
          onClick={onAddFolder}
          className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="إضافة مجلد"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {folders.length > 0 ? (
            folders.map(folder => (
              <li key={folder.id}>
                <div
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                    selectedFolderId === folder.id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => onSelectFolder(folder.id)}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-md ${
                      selectedFolderId === folder.id 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Folder className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{folder.name}</p>
                      <p className="text-xs text-gray-500">
                        {folder.contacts.length} {folder.contacts.length === 1 ? 'جهة اتصال' : 'جهات اتصال'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(folder.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 text-gray-500"
                      aria-label="قائمة الإجراءات"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {menuOpen === folder.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={closeMenu}
                        />
                        
                        <div className="absolute left-0 mt-1 py-1 w-40 bg-white rounded-md shadow-lg z-20 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditFolder(folder);
                              closeMenu();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل المجلد
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onExportFolder(folder.id);
                              closeMenu();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Download className="w-4 h-4 ml-2" />
                            تصدير المجلد
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFolder(folder.id);
                              closeMenu();
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف المجلد
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-6 text-center text-gray-500">
              <File className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>لا توجد مجلدات</p>
              <p className="text-sm">قم بإنشاء مجلد جديد للبدء</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FolderList;