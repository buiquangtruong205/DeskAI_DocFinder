import { computed } from 'vue';
import { useSettingsStore } from '../stores/settings.store';

// Translation keys
export interface Translations {
  // Navigation
  nav: {
    search: string;
    ask: string;
    sources: string;
    documents: string;
    favorites: string;
    insights: string;
    playground: string;
    settings: string;
    core: string;
    knowledge: string;
    tools: string;
  };
  
  // Settings
  settings: {
    title: string;
    description: string;
    theme: {
      title: string;
      light: string;
      dark: string;
    };
    language: {
      title: string;
      vietnamese: string;
      english: string;
    };
    reset: string;
    resetConfirm: string;
  };
  
  // Common
  common: {
    save: string;
    cancel: string;
    confirm: string;
    user: string;
    freePlan: string;
  };
}

// Vietnamese translations
const vi: Translations = {
  nav: {
    search: 'Tìm kiếm',
    ask: 'Hỏi AI',
    sources: 'Nguồn',
    documents: 'Tài liệu',
    favorites: 'Yêu thích',
    insights: 'Thông tin',
    playground: 'Thử nghiệm',
    settings: 'Cài đặt',
    core: 'Cốt lõi',
    knowledge: 'Kiến thức',
    tools: 'Công cụ'
  },
  settings: {
    title: 'Cài đặt',
    description: 'Cấu hình tùy chọn ứng dụng',
    theme: {
      title: 'Giao diện',
      light: 'Sáng',
      dark: 'Tối'
    },
    language: {
      title: 'Ngôn ngữ',
      vietnamese: 'Tiếng Việt',
      english: 'English'
    },
    reset: 'Đặt lại mặc định',
    resetConfirm: 'Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?'
  },
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    user: 'Người dùng',
    freePlan: 'Gói miễn phí'
  }
};

// English translations
const en: Translations = {
  nav: {
    search: 'Search',
    ask: 'Ask AI',
    sources: 'Sources',
    documents: 'Documents',
    favorites: 'Favorites',
    insights: 'Insights',
    playground: 'Playground',
    settings: 'Settings',
    core: 'Core',
    knowledge: 'Knowledge',
    tools: 'Tools'
  },
  settings: {
    title: 'Settings',
    description: 'Configure application preferences',
    theme: {
      title: 'Theme',
      light: 'Light',
      dark: 'Dark'
    },
    language: {
      title: 'Language',
      vietnamese: 'Tiếng Việt',
      english: 'English'
    },
    reset: 'Reset to Default',
    resetConfirm: 'Are you sure you want to reset all settings to default?'
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    user: 'User',
    freePlan: 'Free Plan'
  }
};

const translations = { vi, en };

// Composable for translations
export const useI18n = () => {
  const settingsStore = useSettingsStore();
  
  const t = computed(() => {
    const lang = settingsStore.currentLanguage;
    return translations[lang] || translations.vi;
  });
  
  return { t };
};