import { request } from './client'

export const authApi = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  register: (client) => request('/register', { method: 'POST', body: { client } }),
  logout: () => request('/logout', { method: 'DELETE', auth: true }),
}

export const profileApi = {
  get: () => request('/me', { auth: true }),
  update: (client) => request('/me', { method: 'PATCH', body: { client }, auth: true }),
  changePassword: (client) => request('/me/password', { method: 'PATCH', body: { client }, auth: true }),
}

export const catalogApi = {
  categories: () => request('/categories'),
  services: (query) => request('/services', { query }),
  stylists: (query) => request('/stylists', { query }),
  stylist: (id) => request(`/stylists/${id}`),
  availability: (stylistId, date, serviceIds = []) =>
    request(`/stylists/${stylistId}/availability`, { query: { date, service_ids: serviceIds } }),
}

export const appointmentsApi = {
  list: (scope) => request('/appointments', { query: { scope }, auth: true }),
  get: (id) => request(`/appointments/${id}`, { auth: true }),
  create: (appointment) => request('/appointments', { method: 'POST', body: { appointment }, auth: true }),
  cancel: (id) => request(`/appointments/${id}/cancel`, { method: 'PATCH', auth: true }),
  reschedule: (id, scheduledAt) =>
    request(`/appointments/${id}/reschedule`, { method: 'PATCH', body: { appointment: { scheduled_at: scheduledAt } }, auth: true }),
  availability: (id, date) => request(`/appointments/${id}/availability`, { query: { date }, auth: true }),
}
