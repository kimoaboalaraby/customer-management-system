import { create } from 'zustand';
import {
  Subscription,
  SubscriptionTier,
  ServiceCategory,
  Task
} from '../types';
import { db } from '../firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  query,
  where,
  writeBatch,
  Timestamp,
  serverTimestamp,
  getDoc,
  setDoc,
  FieldValue
} from 'firebase/firestore';
import { formatCurrency } from '../utils/helpers';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF interface
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// --- Firestore Collection References ---
const subscriptionsCollectionRef = collection(db, 'subscriptions');
const recycledSubscriptionsCollectionRef = collection(db, 'recycledSubscriptions');
const tasksCollectionRef = collection(db, 'tasks');

// --- Helper Functions ---
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Helper to convert Firestore Timestamps in nested objects/arrays
const convertTimestampsToISO = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }
  if (data instanceof FieldValue) {
    return data; // Return FieldValue as is
  }
  if (Array.isArray(data)) {
    return data.map(convertTimestampsToISO);
  }
  if (data !== null && typeof data === 'object') {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = convertTimestampsToISO(data[key]);
    }
    return newData;
  }
  return data;
};

// Helper to convert ISO strings back to Timestamps for Firestore
const convertISOToTimestamps = (data: any): any => {
  if (typeof data === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
    try {
      return Timestamp.fromDate(new Date(data));
    } catch (e) {
      return data;
    }
  }
  if (Array.isArray(data)) {
    return data.map(convertISOToTimestamps);
  }
  if (data !== null && typeof data === 'object') {
    const newData: { [key: string]: any } = {};
    for (const key in data) {
      newData[key] = convertISOToTimestamps(data[key]);
    }
    return newData;
  }
  return data;
};

const exportSubscriptionsToJson = (subscriptions: Subscription[], filename: string) => {
  const serializableSubscriptions = subscriptions.map(convertTimestampsToISO);
  const json = JSON.stringify(serializableSubscriptions, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `${filename}.json`);
};

const exportSubscriptionsToExcel = (subscriptions: Subscription[], filename: string) => {
  const worksheetData = subscriptions.map(sub => ({
    'معرف الاشتراك': sub.id,
    'اسم العميل': sub.clientName,
    'رقم هاتف العميل': sub.clientPhone,
    'الفئة': sub.tier,
    'المدة (أشهر)': sub.duration,
    'تاريخ البدء': sub.startDate instanceof Timestamp ? format(sub.startDate.toDate(), 'yyyy-MM-dd') : format(new Date(sub.startDate), 'yyyy-MM-dd'),
    'تاريخ الانتهاء': sub.endDate instanceof Timestamp ? format(sub.endDate.toDate(), 'yyyy-MM-dd') : format(new Date(sub.endDate), 'yyyy-MM-dd'),
    'السعر الإجمالي': sub.totalPrice,
    'الحالة': sub.status,
    'تاريخ الإنشاء': sub.createdAt instanceof Timestamp ? format(sub.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : format(new Date(sub.createdAt), 'yyyy-MM-dd HH:mm'),
  }));
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الاشتراكات');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  downloadFile(blob, `${filename}.xlsx`);
};

const exportSubscriptionsToPdf = (subscriptions: Subscription[], filename: string) => {
  const doc = new jsPDF();
  doc.text(`قائمة الاشتراكات`, 14, 15);
  const tableColumn = ["العميل", "الفئة", "تاريخ البدء", "تاريخ الانتهاء", "السعر", "الحالة"];
  const tableRows: any[][] = [];
  subscriptions.forEach(sub => {
    const subData = [
      sub.clientName,
      sub.tier,
      sub.startDate instanceof Timestamp ? format(sub.startDate.toDate(), 'yyyy-MM-dd') : format(new Date(sub.startDate), 'yyyy-MM-dd'),
      sub.endDate instanceof Timestamp ? format(sub.endDate.toDate(), 'yyyy-MM-dd') : format(new Date(sub.endDate), 'yyyy-MM-dd'),
      formatCurrency(sub.totalPrice),
      sub.status === 'active' ? 'نشط' : (sub.status === 'expired' ? 'منتهي' : 'محذوف'),
    ];
    tableRows.push(subData);
  });
  doc.autoTable({ head: [tableColumn], body: tableRows, startY: 20 });
  doc.save(`${filename}.pdf`);
};

// --- Zustand Store with Firestore Integration ---
type SubscriptionsState = {
  subscriptions: Subscription[];
  recycledSubscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  fetchRecycledSubscriptions: () => Promise<void>;
  addSubscriptionAndTasks: (subscriptionData: Omit<Subscription, 'id' | 'tier' | 'createdAt' | 'status' | 'endDate'>, automaticTasks: Task[], manualTasks: Task[]) => Promise<string | null>;
  updateSubscription: (subscription: Subscription) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  restoreSubscription: (id: string) => Promise<void>;
  exportSubscriptions: (format: 'pdf' | 'excel' | 'json') => Promise<void>;
  importSubscriptions: (jsonData: Subscription[]) => Promise<void>;
};

const calculateTier = (subscriptionData: Omit<Subscription, 'id' | 'tier' | 'createdAt' | 'status' | 'endDate'>): SubscriptionTier => {
  const categories: ServiceCategory[] = [];
  if (subscriptionData.websiteServices?.length) categories.push('website');
  if (subscriptionData.designServices?.length) categories.push('design');
  if (subscriptionData.managementServices?.length) categories.push('management');
  if (subscriptionData.advertisingServices?.length) categories.push('advertising');
  const uniqueCategories = [...new Set(categories)];
  switch (uniqueCategories.length) {
    case 4: return 'gold';
    case 3: return 'silver';
    case 2: return 'bronze';
    default: return 'regular';
  }
};

export const useSubscriptionsStore = create<SubscriptionsState>((set, get) => ({
  subscriptions: [],
  recycledSubscriptions: [],
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const querySnapshot = await getDocs(subscriptionsCollectionRef);
      const subsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        startDate: doc.data().startDate instanceof Timestamp ? doc.data().startDate.toDate().toISOString() : doc.data().startDate,
        endDate: doc.data().endDate instanceof Timestamp ? doc.data().endDate.toDate().toISOString() : doc.data().endDate,
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
      } as Subscription));
      set({ subscriptions: subsData, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching subscriptions: ", error);
      set({ error: 'فشل تحميل الاشتراكات.', isLoading: false });
    }
  },

  fetchRecycledSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const querySnapshot = await getDocs(recycledSubscriptionsCollectionRef);
      const recycledData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        startDate: doc.data().startDate instanceof Timestamp ? doc.data().startDate.toDate().toISOString() : doc.data().startDate,
        endDate: doc.data().endDate instanceof Timestamp ? doc.data().endDate.toDate().toISOString() : doc.data().endDate,
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
      } as Subscription));
      set({ recycledSubscriptions: recycledData, isLoading: false });
    } catch (error: any) {
      console.error("Error fetching recycled subscriptions: ", error);
      set({ error: 'فشل تحميل الاشتراكات المحذوفة.', isLoading: false });
    }
  },

  addSubscriptionAndTasks: async (subscriptionData, automaticTasks, manualTasks) => {
    set({ isLoading: true });
    const batch = writeBatch(db);
    try {
      const tier = calculateTier(subscriptionData);
      const newSubscriptionId = doc(subscriptionsCollectionRef).id;

      const newSubscription: Subscription = {
        ...subscriptionData,
        id: newSubscriptionId,
        tier,
        status: 'active',
        manualTasks: manualTasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined
        })),
        createdAt: new Date().toISOString(),
        startDate: new Date(subscriptionData.startDate).toISOString(),
        endDate: new Date(subscriptionData.endDate).toISOString()
      };

      const subDocRef = doc(db, 'subscriptions', newSubscriptionId);
      batch.set(subDocRef, {
        ...newSubscription,
        startDate: Timestamp.fromDate(new Date(subscriptionData.startDate)),
        endDate: Timestamp.fromDate(new Date(subscriptionData.endDate)),
        createdAt: serverTimestamp()
      });

      automaticTasks.forEach(task => {
        const taskDocRef = doc(tasksCollectionRef);
        batch.set(taskDocRef, {
          ...task,
          id: taskDocRef.id,
          subscriptionId: newSubscriptionId,
          dueDate: task.dueDate ? Timestamp.fromDate(new Date(task.dueDate)) : null,
          schedulingType: 'automatic'
        });
      });

      await batch.commit();
      set({ isLoading: false });
      await get().fetchSubscriptions();
      return newSubscriptionId;
    } catch (error: any) {
      console.error("Error adding subscription and tasks: ", error);
      set({ error: 'فشل إضافة الاشتراك والمهام.', isLoading: false });
      return null;
    }
  },

  updateSubscription: async (updatedSubscription) => {
    set({ isLoading: true });
    const subDocRef = doc(db, 'subscriptions', updatedSubscription.id);
    try {
      await setDoc(subDocRef, {
        ...updatedSubscription,
        startDate: Timestamp.fromDate(new Date(updatedSubscription.startDate)),
        endDate: Timestamp.fromDate(new Date(updatedSubscription.endDate)),
        createdAt: updatedSubscription.createdAt ? Timestamp.fromDate(new Date(updatedSubscription.createdAt)) : serverTimestamp(),
        manualTasks: (updatedSubscription.manualTasks || []).map(task => ({
          ...task,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined
        }))
      }, { merge: true });
      set({ isLoading: false });
      await get().fetchSubscriptions();
    } catch (error: any) {
      console.error("Error updating subscription: ", error);
      set({ error: 'فشل تحديث الاشتراك.', isLoading: false });
    }
  },

  deleteSubscription: async (id) => {
    set({ isLoading: true });
    const subDocRef = doc(db, 'subscriptions', id);
    const recycledSubDocRef = doc(db, 'recycledSubscriptions', id);
    const batch = writeBatch(db);

    try {
      const subSnapshot = await getDoc(subDocRef);
      if (!subSnapshot.exists()) throw new Error("Subscription not found");

      const subscriptionData = subSnapshot.data();
      batch.set(recycledSubDocRef, {
        ...subscriptionData,
        status: 'deleted',
        deletedAt: serverTimestamp()
      });

      batch.delete(subDocRef);

      const tasksQuery = query(tasksCollectionRef, where("subscriptionId", "==", id));
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach(taskDoc => {
        batch.delete(taskDoc.ref);
      });

      await batch.commit();
      set({ isLoading: false });
      await get().fetchSubscriptions();
      await get().fetchRecycledSubscriptions();
    } catch (error: any) {
      console.error("Error deleting subscription: ", error);
      set({ error: 'فشل حذف الاشتراك ونقل للمحذوفات.', isLoading: false });
    }
  },

  restoreSubscription: async (id) => {
    set({ isLoading: true });
    const subDocRef = doc(db, 'subscriptions', id);
    const recycledSubDocRef = doc(db, 'recycledSubscriptions', id);
    const batch = writeBatch(db);

    try {
      const recycledSnapshot = await getDoc(recycledSubDocRef);
      if (!recycledSnapshot.exists()) throw new Error("Recycled subscription not found");

      const subscriptionData = recycledSnapshot.data();
      batch.set(subDocRef, {
        ...subscriptionData,
        status: 'active',
        deletedAt: null
      });

      batch.delete(recycledSubDocRef);

      await batch.commit();
      set({ isLoading: false });
      await get().fetchSubscriptions();
      await get().fetchRecycledSubscriptions();
    } catch (error: any) {
      console.error("Error restoring subscription: ", error);
      set({ error: 'فشل استعادة الاشتراك.', isLoading: false });
    }
  },

  exportSubscriptions: async (format) => {
    set({ isLoading: true });
    try {
      await get().fetchSubscriptions();
      const activeSubscriptions = get().subscriptions;
      if (activeSubscriptions.length === 0) {
        alert('لا توجد اشتراكات نشطة لتصديرها.');
        set({ isLoading: false });
        return;
      }
      const filename = 'الاشتراكات_النشطة';
      switch (format) {
        case 'json': exportSubscriptionsToJson(activeSubscriptions, filename); break;
        case 'excel': exportSubscriptionsToExcel(activeSubscriptions, filename); break;
        case 'pdf': exportSubscriptionsToPdf(activeSubscriptions, filename); break;
      }
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Error exporting subscriptions: ", error);
      set({ error: 'فشل تصدير الاشتراكات.', isLoading: false });
    }
  },

  importSubscriptions: async (jsonData) => {
    if (!Array.isArray(jsonData)) {
      alert('ملف استيراد غير صالح: يجب أن يكون الملف بصيغة JSON ويحتوي على مصفوفة من الاشتراكات.');
      return;
    }
    const isValid = jsonData.every(item => item && typeof item === 'object' && 'clientName' in item && 'startDate' in item);
    if (!isValid) {
      alert('ملف استيراد غير صالح: بنية البيانات داخل الملف غير متوافقة.');
      return;
    }

    set({ isLoading: true });
    const batch = writeBatch(db);
    let importCount = 0;
    try {
      for (const subData of jsonData) {
        const subId = subData.id || doc(subscriptionsCollectionRef).id;
        const subDocRef = doc(db, 'subscriptions', subId);
        const dataToImport = {
          ...subData,
          id: subId,
          status: subData.status || 'active',
          tier: subData.tier || calculateTier(subData),
          startDate: Timestamp.fromDate(new Date(subData.startDate)),
          endDate: Timestamp.fromDate(new Date(subData.endDate)),
          createdAt: subData.createdAt ? Timestamp.fromDate(new Date(subData.createdAt)) : serverTimestamp(),
          manualTasks: (subData.manualTasks || []).map((task: any) => ({
            ...task,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined
          }))
        };
        delete dataToImport.id;
        
        batch.set(subDocRef, dataToImport);
        importCount++;
      }

      await batch.commit();
      set({ isLoading: false });
      alert(`تم استيراد ${importCount} اشتراك بنجاح.`);
      await get().fetchSubscriptions();
    } catch (error: any) {
      console.error("Error importing subscriptions: ", error);
      set({ error: 'فشل استيراد الاشتراكات.', isLoading: false });
      alert('حدث خطأ أثناء استيراد الاشتراكات.');
    }
  }
}));