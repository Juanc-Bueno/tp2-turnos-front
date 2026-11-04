const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const MIN_PASSWORD = 8

export const rules = {
  required: (value) => (String(value ?? '').trim() ? null : 'Este campo es obligatorio.'),
  email: (value) => (!value || EMAIL.test(value.trim()) ? null : 'Ingresá un email válido.'),
  minLength: (min) => (value) => (!value || value.length >= min ? null : `Debe tener al menos ${min} caracteres.`),
  sameAs: (other, label) => (value) => (value === other ? null : `No coincide con ${label}.`),
}

// Corre las reglas de cada campo y devuelve { campo: [mensajes] } solo con los que fallan.
export function validate(values, schema) {
  const errors = {}
  Object.entries(schema).forEach(([field, fieldRules]) => {
    const messages = fieldRules.map((rule) => rule(values[field])).filter(Boolean)
    if (messages.length) errors[field] = messages
  })
  return errors
}
