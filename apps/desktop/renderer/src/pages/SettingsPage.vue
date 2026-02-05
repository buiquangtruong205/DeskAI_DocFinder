<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {{ t.settings.title }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ t.settings.description }}
      </p>
    </div>

    <!-- Settings Sections -->
    <div class="space-y-8">
      
      <!-- Theme Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Palette class="w-5 h-5 mr-2 text-indigo-500" />
          {{ t.settings.theme.title }}
        </h2>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Light Theme -->
          <button
            @click="setTheme('light')"
            class="relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            :class="settings.theme === 'light' 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
          >
            <div class="flex items-center justify-between mb-3">
              <Sun class="w-6 h-6 text-yellow-500" />
              <div v-if="settings.theme === 'light'" class="w-3 h-3 bg-indigo-500 rounded-full"></div>
            </div>
            <div class="text-left">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ t.settings.theme.light }}</h3>
              <div class="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full w-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
              </div>
            </div>
          </button>

          <!-- Dark Theme -->
          <button
            @click="setTheme('dark')"
            class="relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            :class="settings.theme === 'dark' 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
          >
            <div class="flex items-center justify-between mb-3">
              <Moon class="w-6 h-6 text-indigo-400" />
              <div v-if="settings.theme === 'dark'" class="w-3 h-3 bg-indigo-500 rounded-full"></div>
            </div>
            <div class="text-left">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ t.settings.theme.dark }}</h3>
              <div class="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full w-full bg-gradient-to-r from-slate-600 to-slate-800"></div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Language Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Languages class="w-5 h-5 mr-2 text-green-500" />
          {{ t.settings.language.title }}
        </h2>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Vietnamese -->
          <button
            @click="setLanguage('vi')"
            class="relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            :class="settings.language === 'vi' 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-8 h-6 bg-red-500 relative rounded-sm overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center">
                  <Star class="w-4 h-4 text-yellow-400" />
                </div>
              </div>
              <div v-if="settings.language === 'vi'" class="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div class="text-left">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ t.settings.language.vietnamese }}</h3>
            </div>
          </button>

          <!-- English -->
          <button
            @click="setLanguage('en')"
            class="relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
            :class="settings.language === 'en' 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="w-8 h-6 bg-blue-600 relative rounded-sm overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-white to-red-500"></div>
                <div class="absolute inset-0 bg-blue-600"></div>
                <div class="absolute top-0 left-0 w-4 h-3 bg-blue-800"></div>
              </div>
              <div v-if="settings.language === 'en'" class="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div class="text-left">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ t.settings.language.english }}</h3>
            </div>
          </button>
        </div>
      </div>

      <!-- Reset Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <RotateCcw class="w-5 h-5 mr-2 text-orange-500" />
          {{ t.settings.reset }}
        </h2>
        
        <div class="flex items-center justify-between">
          <p class="text-gray-600 dark:text-gray-400">
            {{ t.settings.resetConfirm }}
          </p>
          <button
            @click="handleReset"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 flex items-center"
          >
            <RotateCcw class="w-4 h-4 mr-2" />
            {{ t.settings.reset }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSettingsStore } from '../stores/settings.store';
import { useI18n } from '../i18n';
import { Palette, Sun, Moon, Languages, Star, RotateCcw } from 'lucide-vue-next';

const settingsStore = useSettingsStore();
const { t } = useI18n();

const settings = computed(() => settingsStore.settings);

const setTheme = (theme: 'light' | 'dark') => {
  settingsStore.setTheme(theme);
};

const setLanguage = (language: 'vi' | 'en') => {
  settingsStore.setLanguage(language);
};

const handleReset = () => {
  if (confirm(t.value.settings.resetConfirm)) {
    settingsStore.resetSettings();
  }
};
</script>
