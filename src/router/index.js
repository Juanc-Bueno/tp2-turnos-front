import { nextTick } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { session } from '@/stores/session'
import HomeView from '@/views/HomeView.vue'

export const BUSINESS_NAME = import.meta.env.VITE_BUSINESS_NAME || 'Estudio Turnos'

export const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Inicio' } },
  { path: '/profesionales/:id', name: 'stylist', component: () => import('@/views/StylistView.vue'), meta: { title: 'Profesional' } },
  { path: '/ingresar', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: 'Ingresar', guestOnly: true } },
  { path: '/registro', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { title: 'Crear cuenta', guestOnly: true } },
  { path: '/reservar', name: 'booking', component: () => import('@/views/BookingView.vue'), meta: { title: 'Reservar turno', requiresAuth: true } },
  { path: '/mis-turnos', name: 'appointments', component: () => import('@/views/AppointmentsView.vue'), meta: { title: 'Mis turnos', requiresAuth: true } },
  { path: '/mis-turnos/:id', name: 'appointment', component: () => import('@/views/AppointmentView.vue'), meta: { title: 'Turno', requiresAuth: true } },
  { path: '/mis-turnos/:id/reprogramar', name: 'reschedule', component: () => import('@/views/RescheduleView.vue'), meta: { title: 'Reprogramar turno', requiresAuth: true } },
  { path: '/perfil', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { title: 'Mi perfil', requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'Página no encontrada' } },
]

export function createAppRouter(history = createWebHistory()) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (to, from, saved) => saved || { top: 0 },
  })

  router.beforeEach((to) => {
    if (to.meta.requiresAuth && !session.isLoggedIn.value) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }
    if (to.meta.guestOnly && session.isLoggedIn.value) return { name: 'appointments' }
    return true
  })

  // Al cambiar de pantalla se actualiza el título y el foco vuelve al contenido,
  // para que teclado y lectores de pantalla arranquen desde la página nueva.
  router.afterEach((to, from) => {
    document.title = `${to.meta.title} · ${BUSINESS_NAME}`
    if (from.matched.length) nextTick(() => document.getElementById('main')?.focus({ preventScroll: true }))
  })

  return router
}
