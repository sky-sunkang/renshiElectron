import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import './style.css'

// 清除旧的登录数据，确保显示登录页
localStorage.removeItem('currentUser')

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
