<script setup>
defineProps({ appointment: { type: Object, required: true } })
</script>

<template>
  <span class="badge" :class="appointment.status">{{ appointment.status_label }}</span>
</template>
