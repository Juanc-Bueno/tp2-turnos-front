<script setup>
import StatusBadge from '@/components/StatusBadge.vue'
import { dayOfMonth, formatDateTime, monthShort } from '@/utils/format'

defineProps({ appointment: { type: Object, required: true } })
</script>

<template>
  <article class="appt">
    <div class="date-chip" aria-hidden="true">
      <span class="m">{{ monthShort(appointment.scheduled_at) }}</span>
      <span class="d">{{ dayOfMonth(appointment.scheduled_at) }}</span>
    </div>
    <div class="info">
      <p><strong>{{ formatDateTime(appointment.scheduled_at) }}</strong></p>
      <p class="muted small">
        con {{ appointment.stylist.name }} ·
        {{ appointment.services.map((service) => service.name).join(', ') || 'Sin servicios' }}
      </p>
    </div>
    <div class="right">
      <StatusBadge :appointment="appointment" />
      <div class="small" style="margin-top: 6px">
        <RouterLink :to="{ name: 'appointment', params: { id: appointment.id } }">
          Ver detalle<span class="sr-only"> del turno del {{ formatDateTime(appointment.scheduled_at) }}</span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>
