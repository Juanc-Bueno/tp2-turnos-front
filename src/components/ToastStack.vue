<script setup>
import { useToasts } from '@/stores/toast'

const { toasts, dismiss } = useToasts()
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type" :role="toast.type === 'error' ? 'alert' : 'status'">
      <span>{{ toast.message }}</span>
      <button type="button" class="link" aria-label="Cerrar aviso" @click="dismiss(toast.id)">✕</button>
    </div>
  </div>
</template>
