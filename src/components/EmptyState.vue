<script setup>
defineProps({
  icon: { type: String, default: '' },
  message: { type: String, required: true },
})
</script>

<template>
  <div class="empty">
    <div v-if="icon" class="icon" aria-hidden="true">{{ icon }}</div>
    <p>{{ message }}</p>
    <slot />
  </div>
</template>
