import { createApp } from 'vue'
import '@/assets/base.css'
import '@/assets/app.css'
import App from '@/App.vue'
import { configureAuth } from '@/api/client'
import { createAppRouter } from '@/router'
import { session } from '@/stores/session'
import { notify } from '@/stores/toast'

const router = createAppRouter()

configureAuth({
  tokenGetter: session.token,
  unauthorizedHandler: () => {
    if (!session.isLoggedIn.value) return
    session.clear()
    notify('Tu sesión expiró. Ingresá de nuevo para continuar.', 'error')
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
  },
})

createApp(App).use(router).mount('#app')
