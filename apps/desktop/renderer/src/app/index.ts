import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from '../App.vue';
import router from '../router';
import '../styles/index.css'; // Assuming Tailwind or global styles are here

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
