<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appointmentsApi, catalogApi } from '@/api'
import ErrorState from '@/components/ErrorState.vue'
import FieldError from '@/components/FieldError.vue'
import FormAlert from '@/components/FormAlert.vue'
import LoadingState from '@/components/LoadingState.vue'
import SlotPicker from '@/components/SlotPicker.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { notify } from '@/stores/toast'
import { duration, formatLongDate, isSunday, money, nextOpenDay, todayISO } from '@/utils/format'
import { rules } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const today = todayISO()

const catalog = useAsync(async () => {
  const [services, stylists] = await Promise.all([catalogApi.services(), catalogApi.stylists()])
  return { services, stylists }
})

const query = (key) => (typeof route.query[key] === 'string' ? route.query[key] : '')

const form = ref(null)
const categoryId = ref(null)
const values = reactive({
  service_ids: [],
  stylist_id: Number(query('stylist')) || '',
  date: query('date') || nextOpenDay(),
  time: query('time'),
  notes: '',
})
const { errors, formError, submitting, submit, messages, fieldAttrs } = useForm()

const services = computed(() => catalog.data.value?.services || [])
const stylists = computed(() => catalog.data.value?.stylists || [])

const categories = computed(() => {
  const seen = new Map()
  services.value.forEach((service) => seen.set(service.category.id, service.category))
  return [...seen.values()]
})

const visibleGroups = computed(() =>
  categories.value
    .filter((category) => categoryId.value === null || category.id === categoryId.value)
    .map((category) => ({ ...category, services: services.value.filter((service) => service.category.id === category.id) })),
)

const selectedServices = computed(() => services.value.filter((service) => values.service_ids.includes(service.id)))
const totalMinutes = computed(() => selectedServices.value.reduce((sum, service) => sum + service.duration_minutes, 0))
const total = computed(() => selectedServices.value.reduce((sum, service) => sum + service.price, 0))
const stylistName = computed(() => stylists.value.find((stylist) => stylist.id === values.stylist_id)?.name)

const availability = useAsync(
  () => catalogApi.availability(values.stylist_id, values.date, values.service_ids),
  { immediate: false },
)
const slots = computed(() => availability.data.value?.slots || [])

watch(
  () => [values.stylist_id, values.date, values.service_ids.join(',')],
  () => {
    if (values.stylist_id && values.date) availability.run()
  },
  { immediate: true },
)

// Si al cambiar servicios o fecha el horario elegido deja de estar libre, se descarta.
watch(slots, (list) => {
  if (values.time && !list.includes(values.time)) values.time = ''
})

const slotPlaceholder = computed(() =>
  values.stylist_id && values.date ? '' : 'Elegí un profesional y una fecha para ver los horarios libres.',
)
const slotEmptyText = computed(() =>
  isSunday(values.date) ? 'Los domingos no atendemos. Elegí otro día.' : 'No hay horarios disponibles para ese día. Probá con otra fecha.',
)

const schema = {
  services: [(ids) => (ids.length ? null : 'Elegí al menos un servicio.')],
  stylist: [rules.required],
  date: [rules.required],
  scheduled_at: [(time) => (time ? null : 'Elegí un horario.')],
}

async function onSubmit() {
  const ok = await submit(async () => {
    const appointment = await appointmentsApi.create({
      stylist_id: values.stylist_id,
      scheduled_at: `${values.date}T${values.time}`,
      service_ids: values.service_ids,
      notes: values.notes.trim(),
    })
    notify('¡Turno reservado! Te enviamos la confirmación por email.')
    router.push({ name: 'appointment', params: { id: appointment.id } })
  }, {
    values: { services: values.service_ids, stylist: values.stylist_id, date: values.date, scheduled_at: values.time },
    schema,
    form: form.value,
  })

  // Otro cliente pudo haber tomado el horario: se refrescan los disponibles.
  if (!ok && errors.value.scheduled_at && values.stylist_id) availability.run()
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <h1>Reservar turno</h1>
        <p class="muted" style="margin: 0">Elegí servicios, profesional y horario.</p>
      </div>
    </div>

    <LoadingState v-if="catalog.loading.value" label="Cargando servicios y profesionales…" />
    <ErrorState v-else-if="catalog.error.value" :error="catalog.error.value" @retry="catalog.retry" />

    <form v-else ref="form" class="layout-2-1" novalidate @submit.prevent="onSubmit">
      <div class="form">
        <FormAlert :message="formError" />

        <div class="card">
          <fieldset v-bind="fieldAttrs('services')">
            <legend>1. ¿Qué te querés hacer?</legend>
            <div class="chips" role="group" aria-label="Filtrar servicios por categoría" style="margin-bottom: 8px">
              <button type="button" :aria-pressed="categoryId === null" @click="categoryId = null">Todas</button>
              <button
                v-for="category in categories"
                :key="category.id"
                type="button"
                :aria-pressed="categoryId === category.id"
                @click="categoryId = category.id"
              >
                {{ category.name }}
              </button>
            </div>
            <template v-for="group in visibleGroups" :key="group.id">
              <p class="muted small" style="margin: 12px 0 6px">{{ group.name }}</p>
              <div class="check-grid">
                <label v-for="service in group.services" :key="service.id" class="check-card">
                  <input v-model="values.service_ids" type="checkbox" :value="service.id" />
                  <span>
                    <strong>{{ service.name }}</strong>
                    <span class="meta">{{ duration(service.duration_minutes) }} · {{ money(service.price) }}</span>
                  </span>
                </label>
              </div>
            </template>
            <FieldError id="services-error" :messages="messages('services')" />
          </fieldset>
        </div>

        <div class="card">
          <fieldset>
            <legend>2. ¿Con quién y cuándo?</legend>
            <div class="form-row">
              <div class="field">
                <label for="stylist">Profesional</label>
                <select id="stylist" v-model="values.stylist_id" required v-bind="fieldAttrs('stylist')">
                  <option value="" disabled>Elegí un profesional</option>
                  <option v-for="stylist in stylists" :key="stylist.id" :value="stylist.id">
                    {{ stylist.name }} — {{ stylist.specialty }}
                  </option>
                </select>
                <FieldError id="stylist-error" :messages="messages('stylist')" />
              </div>
              <div class="field">
                <label for="date">Fecha</label>
                <input id="date" v-model="values.date" type="date" :min="today" required v-bind="fieldAttrs('date')" />
                <FieldError id="date-error" :messages="messages('date')" />
              </div>
            </div>

            <div class="field" style="margin-top: 16px">
              <SlotPicker
                v-model="values.time"
                :slots="slots"
                :loading="availability.loading.value"
                :error="availability.error.value"
                :placeholder="slotPlaceholder"
                :empty-text="slotEmptyText"
                :invalid="messages('scheduled_at').length > 0"
                :describedby="messages('scheduled_at').length ? 'scheduled_at-error' : undefined"
                @retry="availability.retry"
              />
              <span v-if="totalMinutes > 30" class="hint">Se muestran los horarios donde entran los {{ duration(totalMinutes) }} de servicio.</span>
              <FieldError id="scheduled_at-error" :messages="messages('scheduled_at')" />
            </div>
          </fieldset>
        </div>

        <div class="card">
          <div class="field">
            <label for="notes">Notas (opcional)</label>
            <textarea id="notes" v-model="values.notes" placeholder="Algo que el profesional deba saber"></textarea>
          </div>
        </div>
      </div>

      <aside class="card summary" aria-labelledby="summary-title">
        <h3 id="summary-title">Resumen</h3>
        <dl>
          <dt>Profesional</dt>
          <dd>{{ stylistName || '—' }}</dd>
          <dt>Fecha</dt>
          <dd>{{ values.date && values.time ? `${formatLongDate(values.date)}, ${values.time} hs` : '—' }}</dd>
          <dt>Duración</dt>
          <dd>{{ totalMinutes ? duration(totalMinutes) : '—' }}</dd>
        </dl>
        <ul class="service-list small">
          <li v-for="service in selectedServices" :key="service.id">
            <span>{{ service.name }}</span><span class="price">{{ money(service.price) }}</span>
          </li>
        </ul>
        <div class="total"><span>Total</span><span>{{ money(total) }}</span></div>
        <button type="submit" class="btn block lg" :disabled="submitting">
          {{ submitting ? 'Reservando…' : 'Confirmar reserva' }}
        </button>
      </aside>
    </form>
  </div>
</template>
