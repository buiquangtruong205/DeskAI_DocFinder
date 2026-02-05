import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
}

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<AppSettings>({
    theme: 'dark',
    language: 'vi'
  });

  // Getters
  const isDarkMode = computed(() => settings.value.theme === 'dark');
  const currentLanguage = computed(() => settings.value.language);

  // Actions
  const setTheme = (theme: 'light' | 'dark') => {
    settings.value.theme = theme;
    applyTheme(theme);
    saveSettings();
  };

  const setLanguage = (language: 'vi' | 'en') => {
    settings.value.language = language;
    saveSettings();
  };

  const applyTheme = (theme: 'light' | 'dark') => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const saveSettings = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings.value));
  };

  const loadSettings = () => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        settings.value = { ...settings.value, ...parsed };
        applyTheme(settings.value.theme);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    } else {
      // Apply default theme
      applyTheme(settings.value.theme);
    }
  };

  const resetSettings = () => {
    settings.value = {
      theme: 'dark',
      language: 'vi'
    };
    applyTheme(settings.value.theme);
    saveSettings();
  };

  return {
    settings,
    isDarkMode,
    currentLanguage,
    setTheme,
    setLanguage,
    loadSettings,
    resetSettings
  };
});
