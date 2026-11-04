<script setup>
import { reactive, ref, watch } from 'vue'
import { profileApi } from '@/api'
import ErrorState from '@/components/ErrorState.vue'
import FieldError from '@/components/FieldError.vue'
import FormAlert from '@/components/FormAlert.vue'
import LoadingState from '@/components/LoadingState.vue'
import { useAsync } from '@/composables/useAsync'
import { useForm } from '@/composables/useForm'
import { useSession } from '@/stores/session'
import { notify } from '@/stores/toast'
import { MIN_PASSWORD, rules } from '@/utils/validation'

const session = useSession()
const profile = useAsync(profileApi.get)

const dataForm = ref(null)
const data = reactive({ name: '', email: '', phone: '' })
const dataState = useForm()

watch(profile.data, (client) => {
  if (client) Object.assign(data, { name: client.name, email: client.email, phone: client.phone || '' })
})

function saveData() {
  dataState.submit(async () => {
    const client = await profileApi.update({ name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim() })
    session.setClient(client)
    notify('Tus datos se guardaron.')
  }, {
    values: data,
    schema: { name: [rules.required], email: [rules.required, rules.email] },
    form: dataForm.value,
  })
}

const passwordForm = ref(null)
const passwords = reactive({ current_password: '', password: '', password_confirmation: '' })
const passwordState = useForm()

async function savePassword() {
  const ok = await passwordState.submit(() => profileApi.changePassword({ ...passwords }), {
    values: passwords,
    schema: {
      current_password: [rules.required],
      password: [rules.required, rules.minLength(MIN_PASSWORD)],
      password_confirmation: [rules.required, rules.sameAs(passwords.password, 'la contraseña nueva')],
    },
    form: passwordForm.value,
  })
  if (ok) {
    Object.assign(passwords, { current_password: '', password: '', password_confirmation: '' })
    notify('Cambiaste tu contraseña.')
  }
}
</script>

<template>
  <div class="container">
    <div class="page-head">
      <div>
        <h1>Mi perfil</h1>
        <p class="muted" style="margin: 0">Tus datos de contacto y tu contraseña.</p>
      </div>
    </div>

    <LoadingState v-if="profile.loading.value" label="Cargando tus datos…" />
    <ErrorState v-else-if="profile.error.value" :error="profile.error.value" @retry="profile.retry" />

    <div v-else class="grid grid-2" style="align-items: start">
      <section class="card" aria-labelledby="data-title">
        <h2 id="data-title">Datos personales</h2>
        <form ref="dataForm" class="form" novalidate @submit.prevent="saveData">
          <FormAlert :message="dataState.formError.value" />
          <div class="field">
            <label for="name">Nombre</label>
            <input id="name" v-model="data.name" type="text" autocomplete="name" required v-bind="dataState.fieldAttrs('name')" />
            <FieldError id="name-error" :messages="dataState.messages('name')" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" v-model="data.email" type="email" autocomplete="email" required v-bind="dataState.fieldAttrs('email')" />
            <FieldError id="email-error" :messages="dataState.messages('email')" />
          </div>
          <div class="field">
            <label for="phone">Teléfono</label>
            <input id="phone" v-model="data.phone" type="tel" autocomplete="tel" v-bind="dataState.fieldAttrs('phone')" />
            <FieldError id="phone-error" :messages="dataState.messages('phone')" />
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="dataState.submitting.value">
              {{ dataState.submitting.value ? 'Guardando…' : 'Guardar datos' }}
            </button>
          </div>
        </form>
      </section>

      <section class="card" aria-labelledby="password-title">
        <h2 id="password-title">Cambiar contraseña</h2>
        <form ref="passwordForm" class="form" novalidate @submit.prevent="savePassword">
          <FormAlert :message="passwordState.formError.value" />
          <div class="field">
            <label for="current_password">Contraseña actual</label>
            <input
              id="current_password"
              v-model="passwords.current_password"
              type="password"
              autocomplete="current-password"
              required
              v-bind="passwordState.fieldAttrs('current_password')"
            />
            <FieldError id="current_password-error" :messages="passwordState.messages('current_password')" />
          </div>
          <div class="field">
            <label for="password">Contraseña nueva</label>
            <input
              id="password"
              v-model="passwords.password"
              type="password"
              autocomplete="new-password"
              required
              v-bind="passwordState.fieldAttrs('password')"
            />
            <FieldError id="password-error" :messages="passwordState.messages('password')" />
            <span v-if="!passwordState.messages('password').length" class="hint">Mínimo {{ MIN_PASSWORD }} caracteres.</span>
          </div>
          <div class="field">
            <label for="password_confirmation">Repetir contraseña nueva</label>
            <input
              id="password_confirmation"
              v-model="passwords.password_confirmation"
              type="password"
              autocomplete="new-password"
              required
              v-bind="passwordState.fieldAttrs('password_confirmation')"
            />
            <FieldError id="password_confirmation-error" :messages="passwordState.messages('password_confirmation')" />
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="passwordState.submitting.value">
              {{ passwordState.submitting.value ? 'Guardando…' : 'Cambiar contraseña' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
