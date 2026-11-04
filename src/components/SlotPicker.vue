<script setup>
import ErrorState from '@/components/ErrorState.vue'
import LoadingState from '@/components/LoadingState.vue'

defineProps({
  slots: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: [Object, String], default: null },
  placeholder: { type: String, default: '' },
  emptyText: { type: String, default: 'No hay horarios disponibles para ese día. Probá con otra fecha.' },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
})
defineEmits(['retry'])

const model = defineModel({ type: String, default: '' })
</script>

<template>
  <fieldset :aria-invalid="invalid || undefined" :aria-describedby="describedby">
    <legend class="label">Horario</legend>
    <div v-if="placeholder" class="empty-slots">{{ placeholder }}</div>
    <LoadingState v-else-if="loading" label="Buscando horarios libres…" />
    <ErrorState v-else-if="error" :error="error" @retry="$emit('retry')" />
    <div v-else-if="!slots.length" class="empty-slots">{{ emptyText }}</div>
    <div v-else class="slots">
      <label v-for="slot in slots" :key="slot" class="slot">
        <input v-model="model" type="radio" name="slot" :value="slot" />
        <span>{{ slot }}</span>
      </label>
    </div>
  </fieldset>
</template>
