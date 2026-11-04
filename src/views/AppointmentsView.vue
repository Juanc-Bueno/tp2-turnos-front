<script setup>
import { ref, watch } from 'vue'
import { appointmentsApi } from '@/api'
import AppointmentItem from '@/components/AppointmentItem.vue'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useSession } from '@/stores/session'

const session = useSession()

const tabs = [
  { scope: 'upcoming', label: 'Próximos', empty: 'No tenés turnos próximos.' },
  { scope: 'history', label: 'Historial', empty: 'Todavía no tenés turnos pasados ni cancelados.' },
]
const active = ref(tabs[0])

const appointments = useAsync(() => appointmentsApi.list(active.value.scope), { initial: [] })
watch(active, () => appointments.run())

function onTabKeydown(event, index) {
  const offset = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
  if (!offset) return
  const next = (index + offset + tabs.length) % tabs.length
  active.value = tabs[next]
  document.getElementById(`tab-${tabs[next].scope}`)?.focus()
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <h1>Mis turnos</h1>
        <p class="muted" style="margin: 0">Hola, {{ session.state.client?.name }}.</p>
      </div>
      <div class="actions">
        <RouterLink :to="{ name: 'booking' }" class="btn">+ Reservar turno</RouterLink>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Turnos">
      <button
        v-for="(tab, index) in tabs"
        :id="`tab-${tab.scope}`"
        :key="tab.scope"
        type="button"
        role="tab"
        :aria-selected="active.scope === tab.scope"
        :tabindex="active.scope === tab.scope ? 0 : -1"
        aria-controls="appointments-panel"
        @click="active = tab"
        @keydown="onTabKeydown($event, index)"
      >
        {{ tab.label }}
      </button>
    </div>

    <section id="appointments-panel" class="card" role="tabpanel" :aria-labelledby="`tab-${active.scope}`">
      <LoadingState v-if="appointments.loading.value" label="Cargando tus turnos…" />
      <ErrorState v-else-if="appointments.error.value" :error="appointments.error.value" @retry="appointments.retry" />
      <EmptyState v-else-if="!appointments.data.value.length" icon="🗓️" :message="active.empty">
        <RouterLink v-if="active.scope === 'upcoming'" :to="{ name: 'booking' }" class="btn">Reservar ahora</RouterLink>
      </EmptyState>
      <template v-else>
        <AppointmentItem v-for="appointment in appointments.data.value" :key="appointment.id" :appointment="appointment" />
      </template>
    </section>
  </div>
</template>
