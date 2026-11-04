<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { catalogApi } from '@/api'
import ErrorState from '@/components/ErrorState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StylistAvatar from '@/components/StylistAvatar.vue'
import { useAsync } from '@/composables/useAsync'
import { addDays, formatLongDate, nextOpenDay, todayISO } from '@/utils/format'

const route = useRoute()

const date = ref(typeof route.query.date === 'string' ? route.query.date : nextOpenDay())
const today = todayISO()

const stylist = useAsync(() => catalogApi.stylist(route.params.id))
const availability = useAsync(() => catalogApi.availability(route.params.id, date.value))

watch(date, () => {
  if (date.value) availability.run()
})

const slots = computed(() => availability.data.value?.slots || [])
</script>

<template>
  <div class="container">
    <p><RouterLink :to="{ name: 'home' }" class="back-link">← Volver</RouterLink></p>

    <LoadingState v-if="stylist.loading.value" label="Cargando profesional…" />
    <ErrorState
      v-else-if="stylist.error.value"
      :error="stylist.error.value"
      :retryable="stylist.error.value.status !== 404"
      @retry="stylist.retry"
    />

    <div v-else-if="stylist.data.value" class="layout-2-1">
      <section class="card" aria-labelledby="slots-title">
        <div class="card-title">
          <h2 id="slots-title">Horarios libres</h2>
          <div class="field">
            <label for="stylist-date" class="sr-only">Fecha</label>
            <input id="stylist-date" v-model="date" type="date" :min="today" />
          </div>
        </div>
        <p class="muted">{{ formatLongDate(date) }}</p>

        <LoadingState v-if="availability.loading.value" label="Buscando horarios libres…" />
        <ErrorState v-else-if="availability.error.value" :error="availability.error.value" @retry="availability.retry" />
        <template v-else-if="slots.length">
          <div class="slots">
            <RouterLink
              v-for="slot in slots"
              :key="slot"
              :to="{ name: 'booking', query: { stylist: stylist.data.value.id, date, time: slot } }"
              class="slot-link"
            >
              {{ slot }}
            </RouterLink>
          </div>
          <p class="hint" style="margin-top: 12px">Elegí un horario para reservarlo.</p>
        </template>
        <div v-else class="empty-slots">No hay horarios disponibles para este día. Probá con otra fecha.</div>

        <div class="button-row" style="margin-top: 16px">
          <button v-if="date > today" type="button" class="secondary sm" @click="date = addDays(date, -1)">← Día anterior</button>
          <button type="button" class="secondary sm" @click="date = addDays(date, 1)">Día siguiente →</button>
        </div>
      </section>

      <aside class="card">
        <div class="person" style="flex-direction: column; text-align: center">
          <StylistAvatar :stylist="stylist.data.value" size="lg" />
          <div>
            <h1 style="margin: 0; font-size: 1.55rem">{{ stylist.data.value.name }}</h1>
            <span class="muted">{{ stylist.data.value.specialty }}</span>
          </div>
        </div>
        <p v-if="stylist.data.value.bio" style="margin-top: 16px">{{ stylist.data.value.bio }}</p>
      </aside>
    </div>
  </div>
</template>
