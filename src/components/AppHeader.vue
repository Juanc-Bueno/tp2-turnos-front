<script setup>
import { useRouter } from 'vue-router'
import { BUSINESS_NAME } from '@/router'
import { useSession } from '@/stores/session'
import { notify } from '@/stores/toast'

const session = useSession()
const router = useRouter()

async function logout() {
  await session.logout()
  notify('Cerraste sesión.')
  router.push({ name: 'home' })
}
</script>

<template>
  <header class="topbar">
    <div class="container">
      <RouterLink :to="{ name: 'home' }" class="brand">
        <span class="brand-name">{{ BUSINESS_NAME }}</span>
      </RouterLink>
      <nav class="nav" aria-label="Principal">
        <RouterLink :to="{ name: 'home' }" exact-active-class="active">Inicio</RouterLink>
        <template v-if="session.isLoggedIn.value">
          <RouterLink :to="{ name: 'appointments' }" active-class="active">Mis turnos</RouterLink>
          <RouterLink :to="{ name: 'profile' }" active-class="active">Mi perfil</RouterLink>
          <RouterLink :to="{ name: 'booking' }" class="btn sm">Reservar</RouterLink>
          <button type="button" class="link" @click="logout">Salir</button>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }" active-class="active">Ingresar</RouterLink>
          <RouterLink :to="{ name: 'register' }" class="btn sm">Crear cuenta</RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>
