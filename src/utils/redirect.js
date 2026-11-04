// Solo se vuelve a rutas internas de la app, para no redirigir a otro sitio.
export function safeRedirect(value, fallback) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
}
