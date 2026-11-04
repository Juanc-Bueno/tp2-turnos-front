<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appointmentsApi } from '@/api'
import ErrorState from '@/components/ErrorState.vue'
import FieldError from '@/components/FieldError.vue'
import FormAlert from '@/components/FormAlert.vue'
import LoadingState from '@/components/LoadingState.vue'
import SlotPicker from '@/components/SlotPicker.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { notify } from '@/stores/toast'
import { formatDateTime, formatLongDate, isSunday, nextOpenDay, todayISO } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const today = todayISO()

const appointment = useAsync(() => appointmentsApi.get(route.params.id))
const date = ref('')
const time = ref('')
const form = ref(null)
const { errors, formError, submitting, submit, messages } = useForm()

const availability = useAsync(() => appointmentsApi.availability(route.params.id, date.value), { immediate: false })
const slots = computed(() => availability.data.value?.slots || [])

// Se arranca en el día actual del turno, que es donde suele buscarse otro horario.
watch(appointment.data, (data) => {
  if (!data || date.value) return
  const current = data.scheduled_at.slice(0, 10)
  date.value = current < today ? nextOpenDay() : current
})

watch(
  () => [appointment.data.value?.cancellable, date.value],
  ([cancellable]) => {
    time.value = ''
    if (cancellable && date.value) availability.run()
  },
)

async function onSubmit() {
  const ok = await submit(async () => {
    await appointmentsApi.reschedule(route.params.id, `${date.value}T${time.value}`)
    notify('Turno reprogramado. Queda pendiente de confirmación.')
    router.push({ name: 'appointment', params: { id: route.params.id } })
  }, {
    values: { date: date.value, scheduled_at: time.value },
    schema: {
      date: [(value) => (value ? null : 'Elegí una fecha.')],
      scheduled_at: [(value) => (value ? null : 'Elegí un horario.')],
    },
    form: form.value,
  })

  if (!ok && errors.value.scheduled_at) availability.run()
}
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'appointment', params: { id: route.params.id } }" class="back-link">← Volver al turno</RouterLink></p>

    <LoadingState v-if="appointment.loading.value" label="Cargando turno…" />
    <ErrorState
      v-else-if="appointment.error.value"
      :error="appointment.error.value"
      :retryable="appointment.error.value.status !== 404"
      @retry="appointment.retry"
    />

    <div v-else-if="appointment.data.value" class="card narrow" style="max-width: 640px">
      <h1>Reprogramar turno</h1>
      <p class="muted">
        Actual: {{ formatDateTime(appointment.data.value.scheduled_at) }} con {{ appointment.data.value.stylist.name }}.
        Se mantienen el profesional y los servicios.
      </p>

      <ErrorState
        v-if="!appointment.data.value.cancellable"
        error="Este turno ya no se puede reprogramar."
        :retryable="false"
      />

      <form v-else ref="form" class="form" novalidate @submit.prevent="onSubmit">
        <FormAlert :message="formError" />
        <div class="field">
          <label for="date">Nueva fecha</label>
          <input id="date" v-model="date" type="date" :min="today" required />
          <span class="hint">{{ formatLongDate(date) }}</span>
          <FieldError id="date-error" :messages="messages('date')" />
        </div>
        <div class="field">
          <SlotPicker
            v-model="time"
            :slots="slots"
            :loading="availability.loading.value"
            :error="availability.error.value"
            :empty-text="isSunday(date) ? 'Los domingos no atendemos. Elegí otro día.' : undefined"
            :invalid="messages('scheduled_at').length > 0"
            :describedby="messages('scheduled_at').length ? 'scheduled_at-error' : undefined"
            @retry="availability.retry"
          />
          <FieldError id="scheduled_at-error" :messages="messages('scheduled_at')" />
        </div>
        <p class="hint" style="margin: 0">Al reprogramar, el turno vuelve a quedar pendiente hasta que el local lo confirme.</p>
        <div class="form-actions">
          <RouterLink :to="{ name: 'appointment', params: { id: route.params.id } }" class="btn secondary">Volver</RouterLink>
          <button type="submit" :disabled="submitting">{{ submitting ? 'Guardando…' : 'Confirmar nuevo horario' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
