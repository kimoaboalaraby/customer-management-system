import React, { useState } from 'react';
import { CalendarDays, CheckCircle, Clock, InfoIcon } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useTasksStore } from '../../stores/tasksStore';
import { useAuthStore } from '../../stores/authStore';
import { Task } from '../../types';

const DailyTasksPage: React.FC = () => {
  const { user } = useAuthStore();
  const { getTodayTasks, getTomorrowTasks, getUpcomingTasks, completeTask, getClientTasks, exportClientTaskSheet } = useTasksStore();
  
  // Get tasks based on user role
  const todayTasks = getTodayTasks(user?.role === 'employee' ? user.id : undefined);
  const tomorrowTasks = getTomorrowTasks(user?.role === 'employee' ? user.id : undefined);
  const upcomingTasks = getUpcomingTasks(user?.role === 'employee' ? user.id : undefined);
  
  // State for task detail modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [isClientHistoryModalOpen, setIsClientHistoryModalOpen] = useState(false);
  const [clientHistory, setClientHistory] = useState<Task[]>([]);
  
  // Handler functions
  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailModalOpen(true);
  };
  
  const handleCompleteTask = (taskId: string) => {
    if (!user) return;
    completeTask(taskId, user.id);
  };
  
  const handleViewClientHistory = (clientId: string) => {
    const completedTasks = getClientTasks(clientId, true);
    setClientHistory(completedTasks);
    setIsClientHistoryModalOpen(true);
  };
  
  const handleExportClientHistory = (clientId: string, format: 'pdf' | 'excel') => {
    exportClientTaskSheet(clientId, format);
  };
  
  // Task list component
  const TaskList = ({ tasks, title }: { tasks: Task[], title: string }) => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          <p>لا توجد مهام</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="card p-4 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{task.description}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  العميل: {task.clientName}
                </p>
              </div>
              
              <div className="flex gap-2">
                {task.status === 'completed' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    مكتمل
                  </span>
                ) : (
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="btn btn-success text-xs px-3 py-1"
                  >
                    إكمال المهمة
                  </button>
                )}
                
                <button
                  onClick={() => handleOpenTaskDetail(task)}
                  className="btn btn-outline text-xs px-3 py-1"
                >
                  التفاصيل
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="المهام اليومية"
        subtitle="إدارة وتتبع المهام اليومية"
      />
      
      {todayTasks.length === 0 && tomorrowTasks.length === 0 && upcomingTasks.length === 0 ? (
        <EmptyState
          title="لا توجد مهام"
          description="لا توجد مهام مستحقة في الفترة القادمة"
          icon={<CalendarDays className="w-6 h-6" />}
        />
      ) : (
        <div className="space-y-8">
          {/* Today's tasks */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center text-primary-700">
              <CalendarDays className="w-5 h-5 ml-2" />
              مهام اليوم
            </h2>
            <TaskList tasks={todayTasks} title="مهام اليوم" />
          </div>
          
          {/* Tomorrow's tasks */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center text-secondary-700">
              <Clock className="w-5 h-5 ml-2" />
              مهام الغد
            </h2>
            <TaskList tasks={tomorrowTasks} title="مهام الغد" />
          </div>
          
          {/* Upcoming tasks */}
          {upcomingTasks.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center text-accent-700">
                <InfoIcon className="w-5 h-5 ml-2" />
                المهام القادمة
              </h2>
              <TaskList tasks={upcomingTasks} title="المهام القادمة" />
            </div>
          )}
        </div>
      )}
      
      {/* Task Detail Modal */}
      <Modal
        isOpen={isTaskDetailModalOpen}
        onClose={() => setIsTaskDetailModalOpen(false)}
        title="تفاصيل المهمة"
        footer={
          <div className="flex justify-between w-full">
            <button
              onClick={() => {
                if (selectedTask) {
                  handleViewClientHistory(selectedTask.clientId);
                }
              }}
              className="btn btn-outline"
            >
              عرض سجل العميل
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setIsTaskDetailModalOpen(false)}
            >
              إغلاق
            </button>
          </div>
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">{selectedTask.description}</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <p className="text-sm text-gray-500">العميل</p>
                  <p className="font-medium text-gray-900">{selectedTask.clientName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">تاريخ الاستحقاق</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedTask.dueDate).toLocaleDateString('ar-KW')}
                  </p>
                </div>
                
                {selectedTask.assignedToName && (
                  <div>
                    <p className="text-sm text-gray-500">معين إلى</p>
                    <p className="font-medium text-gray-900">{selectedTask.assignedToName}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <p className={`font-medium ${selectedTask.status === 'completed' ? 'text-success-700' : 'text-warning-700'}`}>
                    {selectedTask.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                  </p>
                </div>
                
                {selectedTask.completedAt && (
                  <div>
                    <p className="text-sm text-gray-500">تاريخ الإكمال</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedTask.completedAt).toLocaleString('ar-KW')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {selectedTask.status !== 'completed' && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleCompleteTask(selectedTask.id);
                    setIsTaskDetailModalOpen(false);
                  }}
                  className="btn btn-success w-full"
                >
                  إكمال المهمة
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Client History Modal */}
      <Modal
        isOpen={isClientHistoryModalOpen}
        onClose={() => setIsClientHistoryModalOpen(false)}
        title="سجل مهام العميل"
        footer={
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (selectedTask) {
                    handleExportClientHistory(selectedTask.clientId, 'pdf');
                  }
                }}
                className="btn btn-outline text-sm"
              >
                تصدير PDF
              </button>
              <button
                onClick={() => {
                  if (selectedTask) {
                    handleExportClientHistory(selectedTask.clientId, 'excel');
                  }
                }}
                className="btn btn-outline text-sm"
              >
                تصدير Excel
              </button>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setIsClientHistoryModalOpen(false)}
            >
              إغلاق
            </button>
          </div>
        }
      >
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            {selectedTask?.clientName}
          </h3>
          
          {clientHistory.length > 0 ? (
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المهمة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإكمال
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      منفذ المهمة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientHistory.map(task => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{task.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {task.completedAt ? new Date(task.completedAt).toLocaleString('ar-KW') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{task.assignedToName || '-'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مهام مكتملة لهذا العميل</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default DailyTasksPage;