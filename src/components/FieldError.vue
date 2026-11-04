<script setup>
defineProps({
  id: { type: String, required: true },
  messages: { type: Array, default: () => [] },
})
</script>

<template>
  <span v-if="messages.length" :id="id" class="field-error">{{ messages.join(' ') }}</span>
</template>
