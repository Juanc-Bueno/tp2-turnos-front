import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 1

export function notify(message, type = 'success', timeout = 4500) {
  const id = nextId++
  toasts.push({ id, message, type })
  if (timeout) setTimeout(() => dismiss(id), timeout)
  return id
}

export function dismiss(id) {
  const index = toasts.findIndex((toast) => toast.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

export function useToasts() {
  return { toasts, notify, dismiss }
}
