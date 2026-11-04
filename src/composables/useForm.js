import { nextTick, ref } from 'vue'
import { ApiError } from '@/api/client'
import { validate } from '@/utils/validation'

// Estado común de los formularios: errores por campo (locales o de la API),
// mensaje general y bloqueo mientras hay un envío en curso.
export function useForm() {
  const errors = ref({})
  const formError = ref('')
  const submitting = ref(false)

  function focusFirstInvalid(form) {
    nextTick(() => form?.querySelector('[aria-invalid="true"]')?.focus())
  }

  async function submit(action, { values, schema, form } = {}) {
    if (submitting.value) return false

    errors.value = schema ? validate(values, schema) : {}
    if (Object.keys(errors.value).length) {
      formError.value = 'Revisá los campos marcados.'
      focusFirstInvalid(form)
      return false
    }

    submitting.value = true
    formError.value = ''
    try {
      await action()
      return true
    } catch (err) {
      if (!(err instanceof ApiError)) throw err
      errors.value = err.fieldErrors
      formError.value = err.message
      focusFirstInvalid(form)
      return false
    } finally {
      submitting.value = false
    }
  }

  const messages = (field) => errors.value[field] || []

  const fieldAttrs = (field) =>
    messages(field).length ? { 'aria-invalid': 'true', 'aria-describedby': `${field}-error` } : {}

  return { errors, formError, submitting, submit, messages, fieldAttrs }
}
