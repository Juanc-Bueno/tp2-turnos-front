<script setup>
import { computed } from 'vue'

const props = defineProps({
  stylist: { type: Object, required: true },
  size: { type: String, default: '' },
})

const initials = computed(() =>
  props.stylist.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase(),
)
</script>

<template>
  <img v-if="stylist.photo_url" :src="stylist.photo_url" :alt="stylist.name" class="avatar" :class="size" />
  <span v-else class="avatar" :class="size" aria-hidden="true">{{ initials }}</span>
</template>
