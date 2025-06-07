import { create } from 'zustand';
import { Task } from '../types';
import { generateId } from '../utils/helpers';
import { addDays, format, isBefore, isAfter } from 'date-fns';

// Mock tasks
const mockTasks: Task[] = [
  {
    id: 'task-1',
    description: 'إنشاء تصميم إعلاني لصفحة الانستغرام',
    clientId: 'contact-1',
    clientName: 'محمد العلي',
    subscriptionId: 'sub-1',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    assignedTo: '2',
    assignedToName: 'أحمد المصمم',
    status: 'pending',
    serviceCategory: 'design',
    serviceType: 'poster',
    isDeleted: false,
    schedulingType: 'manual'
  },
  {
    id: 'task-2',
    description: 'كتابة محتوى مقالة للمدونة - أحدث التقنيات',
    clientId: 'contact-1',
    clientName: 'محمد العلي',
    subscriptionId: 'sub-1',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    assignedTo: '3',
    assignedToName: 'سارة الكاتبة',
    status: 'pending',
    serviceCategory: 'management',
    serviceType: 'websiteContent',
    isDeleted: false,
    schedulingType: 'manual'
  },
  {
    id: 'task-3',
    description: 'نشر محتوى على صفحة الفيسبوك',
    clientId: 'contact-2',
    clientName: 'فاطمة السالم',
    subscriptionId: 'sub-2',
    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    assignedTo: '2',
    assignedToName: 'أحمد المصمم',
    status: 'pending',
    serviceCategory: 'management',
    serviceType: 'socialMedia',
    isDeleted: false,
    schedulingType: 'manual'
  }
];

type TasksState = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  
  // Task CRUD operations
  addTask: (task: Omit<Task, 'id' | 'isDeleted'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  
  // Task status management
  completeTask: (taskId: string) => void;
  
  // Task filtering
  getTodayTasks: (userId?: string) => Task[];
  getTomorrowTasks: (userId?: string) => Task[];
  getUpcomingTasks: (userId?: string, days?: number) => Task[];
  
  // Client-specific task history
  getClientTasks: (clientId: string, completed?: boolean) => Task[];
  exportClientTaskSheet: (clientId: string, format: 'pdf' | 'excel') => void;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: mockTasks,
  isLoading: false,
  error: null,
  
  addTask: (taskData) => {
    const newTask: Task = {
      id: generateId(),
      ...taskData,
      isDeleted: false,
      schedulingType: taskData.schedulingType || 'manual'
    };
    
    set(state => ({
      tasks: [...state.tasks, newTask]
    }));
  },
  
  updateTask: (taskId, updates) => {
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    }));
  },
  
  deleteTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId ? { ...task, isDeleted: true } : task
      )
    }));
  },
  
  completeTask: (taskId) => {
    set(state => ({
      tasks: state.tasks.map(task => 
        task.id === taskId ? { 
          ...task, 
          status: 'completed',
          completedAt: new Date().toISOString()
        } : task
      )
    }));
  },
  
  getTodayTasks: (userId) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get().tasks.filter(task => 
      !task.isDeleted && 
      task.status === 'pending' && 
      task.dueDate === today &&
      (!userId || task.assignedTo === userId)
    );
  },
  
  getTomorrowTasks: (userId) => {
    const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    return get().tasks.filter(task => 
      !task.isDeleted && 
      task.status === 'pending' && 
      task.dueDate === tomorrow &&
      (!userId || task.assignedTo === userId)
    );
  },
  
  getUpcomingTasks: (userId, days = 2) => {
    const today = new Date();
    const futureDate = addDays(today, days);
    
    return get().tasks.filter(task => {
      if (!task.dueDate) {
        return false; // Tasks without a dueDate are not "upcoming"
      }
      const taskDate = new Date(task.dueDate);
      return (
        !task.isDeleted && 
        task.status === 'pending' && 
        isAfter(taskDate, today) && 
        isBefore(taskDate, futureDate) &&
        (!userId || task.assignedTo === userId)
      );
    });
  },
  
  getClientTasks: (clientId, completed = false) => {
    return get().tasks.filter(task => 
      !task.isDeleted && 
      task.clientId === clientId &&
      (completed ? task.status === 'completed' : true)
    );
  },
  
  exportClientTaskSheet: (clientId, format) => {
    // In a real implementation, this would generate and download the file
    console.log(`Exporting task sheet for client ${clientId} in ${format} format`);
  }
}));