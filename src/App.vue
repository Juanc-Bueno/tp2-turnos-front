<script setup>
import AppFooter from '@/components/AppFooter.vue'
import AppHeader from '@/components/AppHeader.vue'
import ToastStack from '@/components/ToastStack.vue'
</script>

<template>
  <a class="skip-link" href="#main">Saltar al contenido</a>
  <AppHeader />
  <main id="main" class="page" tabindex="-1">
    <RouterView />
  </main>
  <AppFooter />
  <ToastStack />
</template>
