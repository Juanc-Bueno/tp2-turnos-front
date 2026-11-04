import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { session } from '@/stores/session'
import { mockApi, mountApp, resetSession, signIn, waitForRoute } from './helpers'

const services = [
  { id: 1, name: 'Corte de pelo', description: 'Corte y peinado.', duration_minutes: 30, price: 4500, category: { id: 1, name: 'Cabello' } },
  { id: 2, name: 'Manicura', description: null, duration_minutes: 45, price: 3200, category: { id: 2, name: 'Uñas' } },
]
const stylist = { id: 3, name: 'Lucía Gómez', specialty: 'Cortes', bio: 'Cortes modernos.', photo_url: null }
const appointment = {
  id: 99,
  scheduled_at: '2030-05-06T10:30:00-03:00',
  ends_at: '2030-05-06T11:00:00-03:00',
  status: 'confirmed',
  status_label: 'Confirmado',
  duration_minutes: 30,
  cancellable: true,
  notes: 'Primera vez',
  total: 4500,
  stylist: { id: 3, name: 'Lucía Gómez' },
  services: [{ id: 1, name: 'Corte de pelo', price_at_booking: 4500 }],
}
const cancelled = { ...appointment, status: 'cancelled', status_label: 'Cancelado', cancellable: false }

describe('Pantallas', () => {
  afterEach(() => {
    resetSession()
    document.body.innerHTML = ''
  })

  it('inicio: lista profesionales y servicios, y filtra por categoría', async () => {
    const calls = mockApi({
      'GET /categories': { json: [{ id: 1, name: 'Cabello' }, { id: 2, name: 'Uñas' }] },
      'GET /stylists': { json: [stylist] },
      'GET /services': ({ url }) => ({
        json: url.searchParams.get('category_id') ? services.filter((s) => s.category.id === 2) : services,
      }),
    })
    const { wrapper } = await mountApp('/')

    expect(wrapper.text()).toContain('Lucía Gómez')
    expect(wrapper.text()).toContain('Corte de pelo')

    const chip = wrapper.findAll('.chips button').find((button) => button.text() === 'Uñas')
    await chip.trigger('click')
    await flushPromises()

    expect(calls.at(-1).url.searchParams.get('category_id')).toBe('2')
    expect(chip.attributes('aria-pressed')).toBe('true')
    expect(wrapper.text()).not.toContain('Corte de pelo')
  })

  it('profesional: muestra los horarios libres como enlaces a la reserva', async () => {
    mockApi({
      'GET /stylists/3': { json: stylist },
      'GET /stylists/3/availability': { json: { date: '2030-05-06', duration_minutes: 30, slots: ['09:00', '09:30'] } },
    })
    const { wrapper } = await mountApp('/profesionales/3?date=2030-05-06')

    expect(wrapper.find('h1').text()).toBe('Lucía Gómez')
    expect(wrapper.text()).toContain('Lunes 6 de mayo')
    expect(wrapper.find('a.slot-link').attributes('href')).toBe('/reservar?stylist=3&date=2030-05-06&time=09:00')
  })

  it('profesional inexistente: error sin reintento', async () => {
    mockApi({
      'GET /stylists/9': { status: 404, json: { error: 'No encontrado' } },
      'GET /stylists/9/availability': { status: 404, json: { error: 'No encontrado' } },
    })
    const { wrapper } = await mountApp('/profesionales/9')

    expect(wrapper.find('[role="alert"]').text()).toContain('No encontrado')
    expect(wrapper.find('.error-state button').exists()).toBe(false)
  })

  describe('con sesión', () => {
    beforeEach(() => signIn())

    it('mis turnos: cambia entre próximos e historial', async () => {
      const calls = mockApi({
        'GET /appointments': ({ url }) => ({ json: url.searchParams.get('scope') === 'upcoming' ? [appointment] : [] }),
      })
      const { wrapper } = await mountApp('/mis-turnos')

      expect(wrapper.text()).toContain('Lunes 6 de mayo, 10:30 hs')
      await wrapper.find('#tab-history').trigger('click')
      await flushPromises()

      expect(calls.at(-1).url.searchParams.get('scope')).toBe('history')
      expect(wrapper.text()).toContain('Todavía no tenés turnos pasados ni cancelados.')
    })

    it('detalle: cancelar pide confirmación y actualiza el estado', async () => {
      const calls = mockApi({
        'GET /appointments/99': { json: appointment },
        'PATCH /appointments/99/cancel': { json: cancelled },
      })
      const { wrapper } = await mountApp('/mis-turnos/99')

      expect(wrapper.find('.badge').text()).toBe('Confirmado')
      await wrapper.findAll('button').find((button) => button.text() === 'Cancelar turno').trigger('click')
      expect(calls.some((call) => call.key === 'PATCH /appointments/99/cancel')).toBe(false)

      await wrapper.findAll('button').find((button) => button.text() === 'Sí, cancelar turno').trigger('click')
      await flushPromises()

      expect(wrapper.find('.badge').text()).toBe('Cancelado')
      expect(wrapper.text()).toContain('Turno cancelado.')
      expect(wrapper.text()).not.toContain('Reprogramar')
    })

    it('reprogramar: envía el horario nuevo y vuelve al detalle', async () => {
      const calls = mockApi({
        'GET /appointments/99': { json: appointment },
        'GET /appointments/99/availability': { json: { date: '2030-05-07', duration_minutes: 30, slots: ['15:00'] } },
        'PATCH /appointments/99/reschedule': { json: { ...appointment, scheduled_at: '2030-05-07T15:00:00-03:00', status: 'pending' } },
      })
      const { wrapper, router } = await mountApp('/mis-turnos/99/reprogramar')

      await wrapper.find('#date').setValue('2030-05-07')
      await flushPromises()
      await wrapper.find('input[type="radio"][value="15:00"]').setValue(true)
      await wrapper.find('form').trigger('submit')

      await waitForRoute(router, '/mis-turnos/99')
      const patch = calls.find((call) => call.key === 'PATCH /appointments/99/reschedule')
      expect(patch.body).toEqual({ appointment: { scheduled_at: '2030-05-07T15:00' } })
    })

    it('perfil: guarda los datos y muestra el error de contraseña actual', async () => {
      mockApi({
        'GET /me': { json: { id: 1, name: 'Juan Pérez', email: 'juan@mail.com', phone: null } },
        'PATCH /me': ({ body }) => ({ json: { id: 1, email: 'juan@mail.com', ...body.client } }),
        'PATCH /me/password': {
          status: 422,
          json: { error: 'Revisá los datos ingresados', errors: { current_password: ['Contraseña actual es incorrecta'] } },
        },
      })
      const { wrapper } = await mountApp('/perfil')

      expect(wrapper.find('#name').element.value).toBe('Juan Pérez')
      await wrapper.find('#name').setValue('Juan P.')
      await wrapper.findAll('form')[0].trigger('submit')
      await flushPromises()
      expect(session.state.client.name).toBe('Juan P.')

      await wrapper.find('#current_password').setValue('mala')
      await wrapper.find('#password').setValue('nuevaclave1')
      await wrapper.find('#password_confirmation').setValue('nuevaclave1')
      await wrapper.findAll('form')[1].trigger('submit')
      await flushPromises()
      expect(wrapper.find('#current_password-error').text()).toBe('Contraseña actual es incorrecta')
    })

    it('token vencido: cierra la sesión y manda a ingresar', async () => {
      mockApi({ 'GET /appointments': { status: 401, json: { error: 'Token inválido o ausente' } } })
      await mountApp('/mis-turnos')

      expect(session.isLoggedIn.value).toBe(false)
    })
  })

  it('ruta inexistente', async () => {
    mockApi({})
    const { wrapper } = await mountApp('/no-existe')
    expect(wrapper.find('h1').text()).toBe('Página no encontrada')
  })
})
