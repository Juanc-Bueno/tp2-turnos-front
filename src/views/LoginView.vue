<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FieldError from '@/components/FieldError.vue'
import FormAlert from '@/components/FormAlert.vue'
import { useForm } from '@/composables/useForm'
import { useSession } from '@/stores/session'
import { notify } from '@/stores/toast'
import { safeRedirect } from '@/utils/redirect'
import { rules } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const session = useSession()

const form = ref(null)
const values = reactive({ email: '', password: '' })
const { formError, submitting, submit, messages, fieldAttrs } = useForm()

const schema = { email: [rules.required, rules.email], password: [rules.required] }

function onSubmit() {
  submit(async () => {
    const client = await session.login(values.email.trim(), values.password)
    notify(`¡Hola, ${client.name}!`)
    router.replace(safeRedirect(route.query.redirect, { name: 'appointments' }))
  }, { values, schema, form: form.value })
}
</script>

<template>
  <div class="container">
    <div class="card narrow">
      <h1>Ingresar</h1>
      <p class="muted">Accedé para reservar y gestionar tus turnos.</p>

      <form ref="form" class="form" novalidate @submit.prevent="onSubmit">
        <FormAlert :message="formError" />
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="values.email" type="email" autocomplete="username" required v-bind="fieldAttrs('email')" />
          <FieldError id="email-error" :messages="messages('email')" />
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <input id="password" v-model="values.password" type="password" autocomplete="current-password" required v-bind="fieldAttrs('password')" />
          <FieldError id="password-error" :messages="messages('password')" />
        </div>
        <button type="submit" class="btn block" :disabled="submitting">
          {{ submitting ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <p class="muted" style="margin: 16px 0 0; text-align: center">
        ¿No tenés cuenta? <RouterLink :to="{ name: 'register', query: route.query }">Registrate</RouterLink>
      </p>
    </div>
  </div>
</template>
