<script setup>
import { computed, ref, watch } from 'vue'
import { catalogApi } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import ErrorState from '@/components/ErrorState.vue'
import LoadingState from '@/components/LoadingState.vue'
import StylistAvatar from '@/components/StylistAvatar.vue'
import { useAsync } from '@/composables/useAsync'
import { useSession } from '@/stores/session'
import { debounce } from '@/utils/debounce'
import { duration, money } from '@/utils/format'

const session = useSession()

const stylistQuery = ref('')
const serviceQuery = ref('')
const categoryId = ref(null)

const categories = useAsync(catalogApi.categories, { initial: [] })
const stylists = useAsync(() => catalogApi.stylists({ q: stylistQuery.value }), { initial: [] })
const services = useAsync(() => catalogApi.services({ q: serviceQuery.value, category_id: categoryId.value }), { initial: [] })

watch(stylistQuery, debounce(() => stylists.run(), 300))
watch(serviceQuery, debounce(() => services.run(), 300))
watch(categoryId, () => services.run())

const groupedServices = computed(() => {
  const groups = new Map()
  services.data.value.forEach((service) => {
    const name = service.category.name
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(service)
  })
  return [...groups].map(([name, items]) => ({ name, items }))
})

const truncate = (text, length) => (text.length > length ? `${text.slice(0, length - 1)}…` : text)
</script>

<template>
  <section class="hero">
    <div class="container">
      <span class="eyebrow">Reservas online · 24/7</span>
      <h1>Tu turno, <em>en segundos.</em></h1>
      <p>Elegí el servicio, el profesional y el horario que te quede cómodo. Te confirmamos por email y podés reprogramar o cancelar cuando quieras.</p>
      <div class="actions">
        <RouterLink :to="{ name: 'booking' }" class="btn lg">Reservar turno</RouterLink>
        <RouterLink v-if="session.isLoggedIn.value" :to="{ name: 'appointments' }" class="btn lg secondary">Ver mis turnos</RouterLink>
        <RouterLink v-else :to="{ name: 'login' }" class="btn lg secondary">Ya tengo cuenta</RouterLink>
      </div>
      <div class="hero-facts">
        <div><strong>Lun a Sáb</strong><span>9 a 19 hs</span></div>
        <div><strong>30 min</strong><span>Bloques de turno</span></div>
        <div><strong>Sin costo</strong><span>Cancelación online</span></div>
      </div>
    </div>
  </section>

  <div class="container">
    <section class="section" style="margin-top: 0" aria-labelledby="team-title">
      <div class="section-head">
        <div>
          <h2 id="team-title">Nuestro equipo</h2>
          <p class="muted">Elegí con quién querés atenderte y mirá sus horarios libres.</p>
        </div>
        <div class="field search">
          <label for="stylist-search" class="sr-only">Buscar profesional</label>
          <input id="stylist-search" v-model="stylistQuery" type="search" placeholder="Buscar por nombre o especialidad" />
        </div>
      </div>

      <LoadingState v-if="stylists.loading.value" label="Cargando profesionales…" />
      <ErrorState v-else-if="stylists.error.value" :error="stylists.error.value" @retry="stylists.retry" />
      <EmptyState
        v-else-if="!stylists.data.value.length"
        class="card"
        :message="stylistQuery ? `No hay profesionales que coincidan con “${stylistQuery}”.` : 'Todavía no hay profesionales cargados.'"
      />
      <div v-else class="grid grid-3">
        <article v-for="stylist in stylists.data.value" :key="stylist.id" class="card person-card">
          <div class="person">
            <StylistAvatar :stylist="stylist" />
            <div>
              <h3 style="margin: 0">{{ stylist.name }}</h3>
              <span class="muted small">{{ stylist.specialty }}</span>
            </div>
          </div>
          <p v-if="stylist.bio" class="muted small">{{ truncate(stylist.bio, 120) }}</p>
          <div class="actions">
            <RouterLink :to="{ name: 'stylist', params: { id: stylist.id } }" class="btn secondary block">
              Ver horarios<span class="sr-only"> de {{ stylist.name }}</span>
            </RouterLink>
          </div>
        </article>
      </div>
    </section>

    <section class="section" aria-labelledby="services-title">
      <div class="section-head">
        <div>
          <h2 id="services-title">Servicios y precios</h2>
          <p class="muted">Podés combinar varios servicios en un mismo turno.</p>
        </div>
      </div>

      <div class="catalog-tools">
        <div class="chips" role="group" aria-label="Filtrar por categoría">
          <button type="button" :aria-pressed="categoryId === null" @click="categoryId = null">Todas</button>
          <button
            v-for="category in categories.data.value"
            :key="category.id"
            type="button"
            :aria-pressed="categoryId === category.id"
            @click="categoryId = category.id"
          >
            {{ category.name }}
          </button>
        </div>
        <div class="field search">
          <label for="service-search" class="sr-only">Buscar servicio</label>
          <input id="service-search" v-model="serviceQuery" type="search" placeholder="Buscar servicio" />
        </div>
      </div>

      <LoadingState v-if="services.loading.value" label="Cargando servicios…" />
      <ErrorState v-else-if="services.error.value" :error="services.error.value" @retry="services.retry" />
      <EmptyState v-else-if="!groupedServices.length" class="card" message="No hay servicios para ese filtro." />
      <div v-else class="grid grid-2">
        <article v-for="group in groupedServices" :key="group.name" class="card">
          <h3>{{ group.name }}</h3>
          <ul class="service-list">
            <li v-for="service in group.items" :key="service.id">
              <div>
                <strong>{{ service.name }}</strong>
                <div class="muted small">
                  {{ duration(service.duration_minutes) }}<template v-if="service.description"> · {{ service.description }}</template>
                </div>
              </div>
              <span class="price">{{ money(service.price) }}</span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  </div>
</template>
