// User types
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'employee';
  specialization?: string;
  warningCount?: number;
}

// Client/Member types
export interface Contact {
  id: string;
  phoneNumber: string;
  companyName: string;
  personalName: string;
  nationality: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    snapchat?: string;
    youtube?: string;
  };
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  contacts: Contact[];
  createdAt: string;
}

// Subscription types
export interface EmailCredential {
  id: string;
  provider: string;
  email: string;
  password: string;
}

export type ServiceCategory = 'website' | 'design' | 'management' | 'advertising';
export type SubscriptionTier = 'gold' | 'silver' | 'bronze' | 'regular';
export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'snapchat' | 'youtube';
export type SchedulingType = 'automatic' | 'manual'; // Added scheduling type

export interface WebsiteService {
  type: 'bloggerSetup' | 'wordpressSetup' | 'customWebsite' | 'landingPage';
  price: number;
}

export interface DesignService {
  type: 'poster' | 'socialMediaReel' | 'aiVideo' | 'videoTemplate' | 'storyGraphic';
  platforms: Platform[];
  monthlyInstances: number;
  price: number;
  schedulingType: SchedulingType; // Added scheduling type
}

export interface ManagementService {
  type: 'websiteContent' | 'socialMedia';
  platforms?: Platform[];
  monthlyUpdates: number;
  price: number;
  schedulingType: SchedulingType; // Added scheduling type
}

export interface AdvertisingService {
  type: 'creation' | 'management' | 'tracking';
  platforms: Platform[];
  budget?: number;
  serviceFee: number;
  price: number;
}

export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  tier: SubscriptionTier;
  duration: number; // in months
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'active' | 'expired' | 'deleted';
  emailCredentials: EmailCredential[];
  websiteServices?: WebsiteService[];
  designServices?: DesignService[];
  managementServices?: ManagementService[];
  advertisingServices?: AdvertisingService[];
  manualTasks?: Task[]; // Added for manually scheduled tasks
  createdAt: string;
  deletedAt?: string;
}

// Task types
export interface Task {
  id: string;
  description: string;
  clientId: string;
  clientName: string;
  subscriptionId: string;
  dueDate?: string; // For automatic tasks
  assignedTo?: string;
  assignedToName?: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  serviceCategory: ServiceCategory;
  serviceType: string;
  isDeleted: boolean;
  schedulingType: SchedulingType; // Added to distinguish task origin
}

// Employee types
export interface Employee {
  id: string;
  name: string;
  age: number;
  specialization: string;
  phoneNumber: string;
  whatsappNumber: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  monthlySalary: number;
  performance: 'excellent' | 'good' | 'weak' | null;
  username: string;
  warningCount: number;
  createdAt: string;
}

// Settings types
export interface ServicePrice {
  id: string;
  category: ServiceCategory;
  type: string;
  name: string;
  basePrice: number;
}

export interface AppSettings {
  prices: ServicePrice[];
}

// Statistics types
export interface StatisticsPeriod {
  start: string;
  end: string;
  activeSubscriptions: number;
  newSubscriptions: number;
  expiredSubscriptions: number;
  recycleBinCount: number;
  activeValue: number;
  expiredValue: number;
  performanceIndicator: 'excellent' | 'good' | 'weak';
}
