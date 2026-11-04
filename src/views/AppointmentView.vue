<script setup>
import { nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { appointmentsApi } from '@/api'
import ErrorState from '@/components/ErrorState.vue'
import FormAlert from '@/components/FormAlert.vue'
import LoadingState from '@/components/LoadingState.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { notify } from '@/stores/toast'
import { duration, formatDateTime, formatTime, money } from '@/utils/format'

const route = useRoute()
const appointment = useAsync(() => appointmentsApi.get(route.params.id))

const confirming = ref(false)
const confirmButton = ref(null)
const cancelButton = ref(null)
const { formError, submitting, submit } = useForm()

function askCancel() {
  confirming.value = true
  nextTick(() => confirmButton.value?.focus())
}

function keepAppointment() {
  confirming.value = false
  nextTick(() => cancelButton.value?.focus())
}

function cancelAppointment() {
  submit(async () => {
    appointment.data.value = await appointmentsApi.cancel(route.params.id)
    confirming.value = false
    notify('Turno cancelado.')
  })
}
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'appointments' }" class="back-link">← Mis turnos</RouterLink></p>

    <LoadingState v-if="appointment.loading.value" label="Cargando turno…" />
    <ErrorState
      v-else-if="appointment.error.value"
      :error="appointment.error.value"
      :retryable="appointment.error.value.status !== 404"
      @retry="appointment.retry"
    />

    <div v-else-if="appointment.data.value" class="layout-2-1">
      <div class="card">
        <div class="card-title">
          <h1 style="margin: 0">Tu turno</h1>
          <StatusBadge :appointment="appointment.data.value" />
        </div>

        <dl class="detail">
          <dt>Fecha</dt>
          <dd>{{ formatDateTime(appointment.data.value.scheduled_at) }}</dd>
          <dt>Duración estimada</dt>
          <dd>
            {{ duration(appointment.data.value.duration_minutes) }}
            (hasta las {{ formatTime(appointment.data.value.ends_at) }})
          </dd>
          <dt>Profesional</dt>
          <dd>{{ appointment.data.value.stylist.name }}</dd>
          <template v-if="appointment.data.value.notes">
            <dt>Notas</dt>
            <dd>{{ appointment.data.value.notes }}</dd>
          </template>
        </dl>

        <template v-if="appointment.data.value.cancellable">
          <FormAlert :message="formError" style="margin-top: 20px" />

          <div v-if="confirming" class="confirm-box" role="alertdialog" aria-labelledby="confirm-text">
            <p id="confirm-text">¿Seguro que querés cancelar este turno? No se puede deshacer.</p>
            <div class="button-row">
              <button ref="confirmButton" type="button" class="danger" :disabled="submitting" @click="cancelAppointment">
                {{ submitting ? 'Cancelando…' : 'Sí, cancelar turno' }}
              </button>
              <button type="button" class="secondary" :disabled="submitting" @click="keepAppointment">No, mantenerlo</button>
            </div>
          </div>

          <div v-else class="form-actions" style="margin-top: 20px">
            <RouterLink :to="{ name: 'reschedule', params: { id: appointment.data.value.id } }" class="btn secondary">
              Reprogramar
            </RouterLink>
            <button ref="cancelButton" type="button" class="danger" @click="askCancel">Cancelar turno</button>
          </div>
        </template>
      </div>

      <aside class="card summary" aria-labelledby="services-title">
        <h3 id="services-title">Servicios</h3>
        <ul class="service-list">
          <li v-for="service in appointment.data.value.services" :key="service.id">
            <span>{{ service.name }}</span><span class="price">{{ money(service.price_at_booking) }}</span>
          </li>
        </ul>
        <div class="total" style="margin-top: 8px"><span>Total</span><span>{{ money(appointment.data.value.total) }}</span></div>
        <p class="hint" style="margin: 0">Se respeta el precio vigente al momento de reservar.</p>
      </aside>
    </div>
  </div>
</template>
