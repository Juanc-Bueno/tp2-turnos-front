<script setup>
defineProps({ message: { type: String, default: '' } })
</script>

<template>
  <div v-if="message" class="errors" role="alert">
    <strong>{{ message }}</strong>
  </div>
</template>
