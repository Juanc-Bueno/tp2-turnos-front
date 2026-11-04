import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { vi } from 'vitest'
import App from '@/App.vue'
import { configureAuth } from '@/api/client'
import { createAppRouter } from '@/router'
import { session } from '@/stores/session'

// Reemplaza fetch por respuestas simuladas indexadas por "MÉTODO /ruta"
// (sin el prefijo /api/v1). Devuelve la lista de llamadas para inspeccionarlas.
export function mockApi(handlers) {
  const calls = []
  globalThis.fetch = vi.fn(async (input, options = {}) => {
    const url = new URL(input)
    const method = options.method || 'GET'
    const key = `${method} ${url.pathname.replace(/^\/api\/v1/, '')}`
    const body = options.body ? JSON.parse(options.body) : undefined
    calls.push({ key, url, body, headers: options.headers })

    const handler = handlers[key]
    if (!handler) throw new Error(`No hay respuesta simulada para ${key}`)
    const { status = 200, json } = typeof handler === 'function' ? handler({ url, body }) : handler
    return new Response(status === 204 ? null : JSON.stringify(json), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  return calls
}

window.scrollTo = () => {}

// Espera a que el router termine de navegar (las vistas se cargan en diferido)
// y a que se resuelvan las peticiones de la vista nueva.
export async function waitForRoute(router, fullPath) {
  await vi.waitFor(() => {
    if (router.currentRoute.value.fullPath !== fullPath) throw new Error(`Ruta actual: ${router.currentRoute.value.fullPath}`)
  })
  await flushPromises()
}

export async function mountApp(path) {
  const router = createAppRouter(createMemoryHistory())
  configureAuth({ tokenGetter: session.token, unauthorizedHandler: () => session.clear() })
  router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

export async function signIn(client = { id: 1, name: 'Juan Pérez', email: 'juan@mail.com', phone: null }) {
  mockApi({ 'POST /login': { json: { token: 'token-de-prueba', client } } })
  await session.login(client.email, 'cliente123')
}

export function resetSession() {
  session.clear()
  localStorage.clear()
}
