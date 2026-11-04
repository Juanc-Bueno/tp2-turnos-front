import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mockApi, mountApp, resetSession, signIn, waitForRoute } from './helpers'

const services = [
  { id: 1, name: 'Corte de pelo', description: null, duration_minutes: 30, price: 4500, category: { id: 1, name: 'Cabello' } },
  { id: 2, name: 'Manicura', description: null, duration_minutes: 45, price: 3200, category: { id: 2, name: 'Uñas' } },
]
const stylists = [{ id: 3, name: 'Lucía Gómez', specialty: 'Cortes', bio: null, photo_url: null }]
const appointment = {
  id: 99,
  scheduled_at: '2030-05-06T10:30:00-03:00',
  ends_at: '2030-05-06T11:00:00-03:00',
  status: 'pending',
  status_label: 'Pendiente',
  duration_minutes: 30,
  cancellable: true,
  notes: null,
  total: 4500,
  stylist: { id: 3, name: 'Lucía Gómez' },
  services: [{ id: 1, name: 'Corte de pelo', price_at_booking: 4500 }],
}

async function fillBooking(wrapper) {
  await wrapper.find('input[type="checkbox"][value="1"]').setValue(true)
  await wrapper.find('#stylist').setValue(3)
  await flushPromises()
  await wrapper.find('input[type="radio"][value="10:30"]').setValue(true)
}

describe('Reserva de turnos', () => {
  beforeEach(() => signIn())

  afterEach(() => {
    resetSession()
    document.body.innerHTML = ''
  })

  it('reserva un turno con el horario elegido y muestra el detalle', async () => {
    const calls = mockApi({
      'GET /services': { json: services },
      'GET /stylists': { json: stylists },
      'GET /stylists/3/availability': { json: { date: '2030-05-06', duration_minutes: 30, slots: ['10:00', '10:30'] } },
      'POST /appointments': { status: 201, json: appointment },
      'GET /appointments/99': { json: appointment },
    })
    const { wrapper, router } = await mountApp('/reservar?date=2030-05-06')

    await fillBooking(wrapper)
    expect(wrapper.find('.summary').text()).toContain('Lucía Gómez')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const post = calls.find((call) => call.key === 'POST /appointments')
    expect(post.headers.Authorization).toBe('Bearer token-de-prueba')
    expect(post.body).toEqual({
      appointment: { stylist_id: 3, scheduled_at: '2030-05-06T10:30', service_ids: [1], notes: '' },
    })
    const availability = calls.filter((call) => call.key === 'GET /stylists/3/availability').at(-1)
    expect(availability.url.searchParams.getAll('service_ids[]')).toEqual(['1'])

    await waitForRoute(router, '/mis-turnos/99')
    expect(wrapper.text()).toContain('¡Turno reservado!')
    expect(wrapper.text()).toContain('Tu turno')
  })

  it('si el horario ya fue tomado muestra el error de la API y actualiza los horarios', async () => {
    let availabilityCalls = 0
    const calls = mockApi({
      'GET /services': { json: services },
      'GET /stylists': { json: stylists },
      'GET /stylists/3/availability': () => {
        availabilityCalls += 1
        const slots = availabilityCalls === 1 ? ['10:00', '10:30'] : ['10:00']
        return { json: { date: '2030-05-06', duration_minutes: 30, slots } }
      },
      'POST /appointments': {
        status: 422,
        json: {
          error: 'Revisá los datos ingresados',
          errors: { scheduled_at: ['Fecha y hora el estilista ya tiene un turno en ese horario'] },
        },
      },
    })
    const { wrapper, router } = await mountApp('/reservar?date=2030-05-06')

    await fillBooking(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('booking')
    expect(wrapper.find('.errors').text()).toBe('Revisá los datos ingresados')
    expect(wrapper.find('#scheduled_at-error').text()).toBe('Fecha y hora el estilista ya tiene un turno en ese horario')
    expect(calls.filter((call) => call.key === 'GET /stylists/3/availability').length).toBe(2)
    expect(wrapper.find('input[type="radio"][value="10:30"]').exists()).toBe(false)
  })

  it('no envía la reserva si faltan servicios u horario', async () => {
    const calls = mockApi({
      'GET /services': { json: services },
      'GET /stylists': { json: stylists },
    })
    const { wrapper } = await mountApp('/reservar')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(calls.some((call) => call.key === 'POST /appointments')).toBe(false)
    expect(wrapper.find('#services-error').text()).toBe('Elegí al menos un servicio.')
    expect(wrapper.find('#scheduled_at-error').text()).toBe('Elegí un horario.')
  })

  it('muestra un error con opción de reintentar si no se puede cargar el catálogo', async () => {
    mockApi({ 'GET /services': { status: 500, json: null }, 'GET /stylists': { json: stylists } })
    const { wrapper } = await mountApp('/reservar')

    expect(wrapper.text()).toContain('El servidor tuvo un problema')

    mockApi({ 'GET /services': { json: services }, 'GET /stylists': { json: stylists } })
    await wrapper.find('.error-state button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Corte de pelo')
  })
})
