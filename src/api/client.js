const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, fieldErrors = {} } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isNetwork() {
    return this.status === 0
  }
}

let getToken = () => null
let onUnauthorized = () => {}

// La sesión se registra acá para no importar el store desde la capa HTTP.
export function configureAuth({ tokenGetter, unauthorizedHandler }) {
  getToken = tokenGetter
  onUnauthorized = unauthorizedHandler
}

function buildUrl(path, query) {
  const url = new URL(BASE_URL + path)
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) value.forEach((item) => url.searchParams.append(`${key}[]`, item))
    else url.searchParams.set(key, value)
  })
  return url
}

export async function request(path, { method = 'GET', body, query, auth = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.')
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)
  if (response.ok) return data

  if (response.status === 401 && auth) onUnauthorized()

  const message = data?.error || defaultMessage(response.status)
  throw new ApiError(message, { status: response.status, fieldErrors: data?.errors || {} })
}

function defaultMessage(status) {
  if (status === 404) return 'No encontramos lo que buscabas.'
  if (status >= 500) return 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.'
  return 'No se pudo completar la operación.'
}
