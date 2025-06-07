import { create } from 'zustand';
import { ServicePrice, AppSettings } from '../types';
import { generateId } from '../utils/helpers';

// Mock initial settings
const initialPrices: ServicePrice[] = [
  // Website services
  {
    id: 'price-1',
    category: 'website',
    type: 'bloggerSetup',
    name: 'إنشاء موقع بلوجر',
    basePrice: 100
  },
  {
    id: 'price-2',
    category: 'website',
    type: 'wordpressSetup',
    name: 'إنشاء موقع ووردبريس',
    basePrice: 200
  },
  {
    id: 'price-3',
    category: 'website',
    type: 'customWebsite',
    name: 'موقع ويب مخصص',
    basePrice: 350
  },
  {
    id: 'price-4',
    category: 'website',
    type: 'landingPage',
    name: 'صفحة هبوط',
    basePrice: 80
  },
  
  // Design services
  {
    id: 'price-5',
    category: 'design',
    type: 'poster',
    name: 'تصميم بوستر إعلاني',
    basePrice: 25
  },
  {
    id: 'price-6',
    category: 'design',
    type: 'socialMediaReel',
    name: 'فيديو سوشيال ميديا',
    basePrice: 50
  },
  {
    id: 'price-7',
    category: 'design',
    type: 'aiVideo',
    name: 'فيديو ذكاء اصطناعي',
    basePrice: 75
  },
  {
    id: 'price-8',
    category: 'design',
    type: 'videoTemplate',
    name: 'قالب فيديو',
    basePrice: 35
  },
  {
    id: 'price-9',
    category: 'design',
    type: 'storyGraphic',
    name: 'تصميم ستوري',
    basePrice: 15
  },
  
  // Management services
  {
    id: 'price-10',
    category: 'management',
    type: 'websiteContent',
    name: 'إدارة محتوى الموقع',
    basePrice: 20 // per article/update
  },
  {
    id: 'price-11',
    category: 'management',
    type: 'socialMedia',
    name: 'إدارة وسائل التواصل الاجتماعي',
    basePrice: 10 // per post
  },
  
  // Advertising services
  {
    id: 'price-12',
    category: 'advertising',
    type: 'creation',
    name: 'إنشاء حملة إعلانية',
    basePrice: 60
  },
  {
    id: 'price-13',
    category: 'advertising',
    type: 'management',
    name: 'إدارة حملة إعلانية',
    basePrice: 80
  },
  {
    id: 'price-14',
    category: 'advertising',
    type: 'tracking',
    name: 'تتبع وتقارير الحملات',
    basePrice: 40
  }
];

const initialSettings: AppSettings = {
  prices: initialPrices
};

type SettingsState = {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
  
  // Service prices
  getPriceByTypeAndCategory: (category: string, type: string) => ServicePrice | undefined;
  addPrice: (price: Omit<ServicePrice, 'id'>) => void;
  updatePrice: (id: string, updates: Partial<Omit<ServicePrice, 'id'>>) => void;
  deletePrice: (id: string) => void;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: initialSettings,
  isLoading: false,
  error: null,
  
  getPriceByTypeAndCategory: (category, type) => {
    return get().settings.prices.find(price => 
      price.category === category && price.type === type
    );
  },
  
  addPrice: (priceData) => {
    const newPrice: ServicePrice = {
      id: generateId(),
      ...priceData
    };
    
    set(state => ({
      settings: {
        ...state.settings,
        prices: [...state.settings.prices, newPrice]
      }
    }));
  },
  
  updatePrice: (id, updates) => {
    set(state => ({
      settings: {
        ...state.settings,
        prices: state.settings.prices.map(price => 
          price.id === id ? { ...price, ...updates } : price
        )
      }
    }));
  },
  
  deletePrice: (id) => {
    set(state => ({
      settings: {
        ...state.settings,
        prices: state.settings.prices.filter(price => price.id !== id)
      }
    }));
  }
}));