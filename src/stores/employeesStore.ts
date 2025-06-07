import { create } from 'zustand';
import { Employee } from '../types';
import { generateId } from '../utils/helpers';

// Mock employees
const mockEmployees: Employee[] = [
  {
    id: '2',
    name: 'أحمد المصمم',
    age: 28,
    specialization: 'design',
    phoneNumber: '+965 1234 5678',
    whatsappNumber: '+965 1234 5678',
    socialMedia: {
      instagram: 'https://instagram.com/ahmed_designer',
    },
    monthlySalary: 800,
    performance: 'excellent',
    username: 'designer',
    warningCount: 0,
    createdAt: '2024-10-01T10:00:00Z'
  },
  {
    id: '3',
    name: 'سارة الكاتبة',
    age: 32,
    specialization: 'content',
    phoneNumber: '+965 8765 4321',
    whatsappNumber: '+965 8765 4321',
    socialMedia: {
      facebook: 'https://facebook.com/sarah_writer',
      twitter: 'https://twitter.com/sarah_writer',
    },
    monthlySalary: 750,
    performance: 'good',
    username: 'writer',
    warningCount: 2,
    createdAt: '2024-11-15T14:30:00Z'
  }
];

type EmployeesState = {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
  
  // Employee CRUD operations
  addEmployee: (employee: Omit<Employee, 'id' | 'performance' | 'warningCount' | 'createdAt'>) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  
  // Performance management
  updatePerformance: (id: string, performance: 'excellent' | 'good' | 'weak') => void;
  incrementWarning: (id: string) => void;
  resetWarnings: (id: string) => void;
  
  // Password management - in a real app, would be more secure
  updateCredentials: (id: string, username: string, password: string) => void;
};

export const useEmployeesStore = create<EmployeesState>((set) => ({
  employees: mockEmployees,
  isLoading: false,
  error: null,
  
  addEmployee: (employeeData) => {
    const newEmployee: Employee = {
      id: generateId(),
      ...employeeData,
      performance: null,
      warningCount: 0,
      createdAt: new Date().toISOString()
    };
    
    set(state => ({
      employees: [...state.employees, newEmployee]
    }));
  },
  
  updateEmployee: (updatedEmployee) => {
    set(state => ({
      employees: state.employees.map(employee => 
        employee.id === updatedEmployee.id ? updatedEmployee : employee
      )
    }));
  },
  
  deleteEmployee: (id) => {
    set(state => ({
      employees: state.employees.filter(employee => employee.id !== id)
    }));
  },
  
  updatePerformance: (id, performance) => {
    set(state => ({
      employees: state.employees.map(employee => 
        employee.id === id 
          ? { ...employee, performance } 
          : employee
      )
    }));
  },
  
  incrementWarning: (id) => {
    set(state => ({
      employees: state.employees.map(employee => 
        employee.id === id 
          ? { 
              ...employee, 
              warningCount: employee.warningCount + 1 
            } 
          : employee
      )
    }));
  },
  
  resetWarnings: (id) => {
    set(state => ({
      employees: state.employees.map(employee => 
        employee.id === id 
          ? { ...employee, warningCount: 0 } 
          : employee
      )
    }));
  },
  
  updateCredentials: (id, username, password) => {
    // In a real app, we would properly hash the password
    // and perform this on the server side
    set(state => ({
      employees: state.employees.map(employee => 
        employee.id === id 
          ? { ...employee, username } 
          : employee
      )
    }));
  }
}));