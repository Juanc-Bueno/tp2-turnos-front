<script setup>
import { BUSINESS_NAME } from '@/router'

const year = new Date().getFullYear()
const adminUrl = new URL('/admin', import.meta.env.VITE_API_URL || 'http://localhost:3000').href
</script>

<template>
  <footer class="footer">
    <div class="container button-row" style="justify-content: space-between">
      <span>© {{ year }} {{ BUSINESS_NAME }}</span>
      <a :href="adminUrl" class="muted">Acceso administración</a>
    </div>
  </footer>
</template>
