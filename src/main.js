import { createApp } from 'vue'
import App from './App.vue'
import router from "@/router/index.js";
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
const app = createApp(App)
const pinia = createPinia();
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }