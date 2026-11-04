import { ref } from 'vue'

// Estado de carga/error/datos para una llamada a la API, con reintento. Si se
// dispara una llamada nueva antes de que termine la anterior, la respuesta
// vieja se descarta.
export function useAsync(fn, { immediate = true, initial = null } = {}) {
  const data = ref(initial)
  const loading = ref(false)
  const error = ref(null)
  let lastArgs = []
  let current = 0

  async function run(...args) {
    lastArgs = args
    const call = ++current
    loading.value = true
    error.value = null
    try {
      const result = await fn(...args)
      if (call === current) data.value = result
      return result
    } catch (err) {
      if (call === current) error.value = err
      return undefined
    } finally {
      if (call === current) loading.value = false
    }
  }

  const retry = () => run(...lastArgs)

  if (immediate) run()

  return { data, loading, error, run, retry }
}
