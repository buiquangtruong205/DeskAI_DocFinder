<template>
  <aside class="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col border-r border-slate-800 shadow-xl relative z-20">
    <div class="px-6 py-5 flex items-center border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
        <span class="text-white font-bold text-lg">D</span>
      </div>
      <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">DeskAI</h1>
    </div>

    <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
      <div v-for="(group, index) in navGroups" :key="index" class="mb-6">
        <h3 v-if="group.title" class="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {{ group.title }}
        </h3>
        <router-link 
          v-for="item in group.items" 
          :key="item.name" 
          :to="item.path"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden"
          :class="isActive(item.path) 
            ? 'bg-indigo-500/10 text-white shadow-sm ring-1 ring-indigo-500/20' 
            : 'hover:bg-slate-800/50 hover:text-white'"
        >
          <div v-if="isActive(item.path)" class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-lg"></div>
          <component 
            :is="item.icon" 
            class="w-5 h-5 mr-3 transition-colors duration-200"
            :class="isActive(item.path) ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'" 
          />
          {{ item.label }}
        </router-link>
      </div>
    </nav>

    <div class="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
       <div class="flex items-center p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            U
          </div>
          <div class="ml-3">
            <p class="text-sm font-semibold text-white">User</p>
            <p class="text-xs text-slate-500">Free Plan</p>
          </div>
          <Settings class="w-4 h-4 ml-auto text-slate-500 hover:text-white transition-colors" />
        </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { 
  Search, 
  MessageCircle, 
  Folder, 
  FileText, 
  Star, 
  BarChart2, 
  FlaskConical, 
  Settings 
} from 'lucide-vue-next';

const route = useRoute();

const navGroups = [
  {
    title: 'Cốt lõi',
    items: [
      { name: 'search', label: 'Tìm kiếm', path: '/search', icon: Search },
      { name: 'ask', label: 'Hỏi AI', path: '/ask', icon: MessageCircle },
    ]
  },
  {
    title: 'Kiến thức',
    items: [
      { name: 'sources', label: 'Nguồn', path: '/sources', icon: Folder },
      { name: 'documents', label: 'Tài liệu', path: '/documents', icon: FileText },
      { name: 'favorites', label: 'Yêu thích', path: '/favorites', icon: Star },
    ]
  },
  {
    title: 'Công cụ',
    items: [
      { name: 'insights', label: 'Thông tin', path: '/insights', icon: BarChart2 },
      { name: 'playground', label: 'Thử nghiệm', path: '/playground', icon: FlaskConical },
    ]
  }
  // Settings moved to footer area or keep in group if preferred
];

const isActive = (path: string) => route.path.startsWith(path);
</script>
