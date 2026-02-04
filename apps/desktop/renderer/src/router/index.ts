import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

// Page imports
import SearchPage from '../pages/SearchPage.vue';
import AskPage from '../pages/AskPage.vue';
import SourcesPage from '../pages/SourcesPage.vue';
import DocumentsPage from '../pages/DocumentsPage.vue';
import FavoritesPage from '../pages/FavoritesPage.vue';
import InsightsPage from '../pages/InsightsPage.vue';
import PlaygroundPage from '../pages/PlaygroundPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';

const routes: Array<RouteRecordRaw> = [
    { path: '/', redirect: '/search' },
    { path: '/search', name: 'search', component: SearchPage },
    { path: '/ask', name: 'ask', component: AskPage },
    { path: '/sources', name: 'sources', component: SourcesPage },
    { path: '/documents', name: 'documents', component: DocumentsPage },
    { path: '/favorites', name: 'favorites', component: FavoritesPage },
    { path: '/insights', name: 'insights', component: InsightsPage },
    { path: '/playground', name: 'playground', component: PlaygroundPage },
    { path: '/sources/:id', name: 'source-details', component: () => import('../pages/SourceDetailsPage.vue') },
    { path: '/settings', name: 'settings', component: SettingsPage },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
