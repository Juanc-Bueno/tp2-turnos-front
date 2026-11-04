<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FieldError from '@/components/FieldError.vue'
import FormAlert from '@/components/FormAlert.vue'
import { useForm } from '@/composables/useForm'
import { useSession } from '@/stores/session'
import { notify } from '@/stores/toast'
import { safeRedirect } from '@/utils/redirect'
import { MIN_PASSWORD, rules } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const session = useSession()

const form = ref(null)
const values = reactive({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
const { formError, submitting, submit, messages, fieldAttrs } = useForm()

function onSubmit() {
  const schema = {
    name: [rules.required],
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(MIN_PASSWORD)],
    password_confirmation: [rules.required, rules.sameAs(values.password, 'la contraseña')],
  }

  submit(async () => {
    await session.register({ ...values, name: values.name.trim(), email: values.email.trim() })
    notify('¡Cuenta creada! Ya podés reservar tu turno.')
    router.replace(safeRedirect(route.query.redirect, { name: 'booking' }))
  }, { values, schema, form: form.value })
}
</script>

<template>
  <div class="container">
    <div class="card narrow">
      <h1>Crear cuenta</h1>
      <p class="muted">Solo te lleva un minuto.</p>

      <form ref="form" class="form" novalidate @submit.prevent="onSubmit">
        <FormAlert :message="formError" />
        <div class="field">
          <label for="name">Nombre</label>
          <input id="name" v-model="values.name" type="text" autocomplete="name" required v-bind="fieldAttrs('name')" />
          <FieldError id="name-error" :messages="messages('name')" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model="values.email" type="email" autocomplete="email" required v-bind="fieldAttrs('email')" />
          <FieldError id="email-error" :messages="messages('email')" />
        </div>
        <div class="field">
          <label for="phone">Teléfono</label>
          <input id="phone" v-model="values.phone" type="tel" autocomplete="tel" aria-describedby="phone-hint" />
          <span id="phone-hint" class="hint">Opcional, por si necesitamos avisarte algo.</span>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="password">Contraseña</label>
            <input id="password" v-model="values.password" type="password" autocomplete="new-password" required v-bind="fieldAttrs('password')" />
            <FieldError id="password-error" :messages="messages('password')" />
            <span v-if="!messages('password').length" class="hint">Mínimo {{ MIN_PASSWORD }} caracteres.</span>
          </div>
          <div class="field">
            <label for="password_confirmation">Repetir contraseña</label>
            <input
              id="password_confirmation"
              v-model="values.password_confirmation"
              type="password"
              autocomplete="new-password"
              required
              v-bind="fieldAttrs('password_confirmation')"
            />
            <FieldError id="password_confirmation-error" :messages="messages('password_confirmation')" />
          </div>
        </div>
        <button type="submit" class="btn block" :disabled="submitting">
          {{ submitting ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="muted" style="margin: 16px 0 0; text-align: center">
        ¿Ya tenés cuenta? <RouterLink :to="{ name: 'login', query: route.query }">Ingresá</RouterLink>
      </p>
    </div>
  </div>
</template>
