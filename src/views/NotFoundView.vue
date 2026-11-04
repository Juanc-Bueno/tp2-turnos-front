<script setup>
import EmptyState from '@/components/EmptyState.vue'
</script>

<template>
  <div class="container">
    <div class="card narrow">
      <h1>Página no encontrada</h1>
      <EmptyState icon="🧭" message="La dirección que buscás no existe o fue movida.">
        <RouterLink :to="{ name: 'home' }" class="btn">Ir al inicio</RouterLink>
      </EmptyState>
    </div>
  </div>
</template>
