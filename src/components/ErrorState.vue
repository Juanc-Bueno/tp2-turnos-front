<script setup>
defineProps({
  error: { type: [Object, String], required: true },
  retryable: { type: Boolean, default: true },
})
defineEmits(['retry'])
</script>

<template>
  <div class="error-state" role="alert">
    <p>{{ typeof error === 'string' ? error : error.message }}</p>
    <button v-if="retryable" type="button" class="secondary sm" @click="$emit('retry')">Reintentar</button>
  </div>
</template>
