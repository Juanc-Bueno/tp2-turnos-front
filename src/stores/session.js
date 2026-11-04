import { computed, reactive, readonly } from 'vue'
import { authApi } from '@/api'

const STORAGE_KEY = 'turnos.session'

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const saved = loadSaved()
const state = reactive({ token: saved.token || null, client: saved.client || null })

function persist() {
  if (state.token) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, client: state.client }))
  else localStorage.removeItem(STORAGE_KEY)
}

function start({ token, client }) {
  state.token = token
  state.client = client
  persist()
  return client
}

function clear() {
  state.token = null
  state.client = null
  persist()
}

export const session = {
  state: readonly(state),
  isLoggedIn: computed(() => Boolean(state.token)),
  token: () => state.token,

  async login(email, password) {
    return start(await authApi.login(email, password))
  },

  async register(client) {
    return start(await authApi.register(client))
  },

  // Si la API no responde igual se cierra la sesión local.
  async logout() {
    try {
      await authApi.logout()
    } catch {
      // el token ya no sirve o no hay conexión: no hay nada más que hacer
    } finally {
      clear()
    }
  },

  setClient(client) {
    state.client = client
    persist()
  },

  clear,
}

export function useSession() {
  return session
}
