import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { session } from '@/stores/session'
import { mockApi, mountApp, resetSession, waitForRoute } from './helpers'

const client = { id: 7, name: 'Juan Pérez', email: 'juan@mail.com', phone: '1122334455' }

describe('Ingreso de clientes', () => {
  afterEach(() => {
    resetSession()
    document.body.innerHTML = ''
  })

  it('inicia sesión, guarda el token y vuelve a la página que se había pedido', async () => {
    const calls = mockApi({
      'POST /login': { json: { token: 'abc123', client } },
      'GET /appointments': { json: [] },
    })
    const { wrapper, router } = await mountApp('/mis-turnos')
    expect(router.currentRoute.value.name).toBe('login')

    await wrapper.find('#email').setValue('  juan@mail.com ')
    await wrapper.find('#password').setValue('cliente123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(calls[0].key).toBe('POST /login')
    expect(calls[0].body).toEqual({ email: 'juan@mail.com', password: 'cliente123' })
    expect(session.state.token).toBe('abc123')
    expect(JSON.parse(localStorage.getItem('turnos.session')).client.name).toBe('Juan Pérez')
    await waitForRoute(router, '/mis-turnos')
    expect(wrapper.text()).toContain('Hola, Juan Pérez.')
    expect(wrapper.text()).toContain('No tenés turnos próximos.')
  })

  it('muestra el error de la API con credenciales inválidas y permite reintentar', async () => {
    mockApi({ 'POST /login': { status: 401, json: { error: 'Email o contraseña incorrectos' } } })
    const { wrapper, router } = await mountApp('/ingresar')

    await wrapper.find('#email').setValue('juan@mail.com')
    await wrapper.find('#password').setValue('equivocada')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe('Email o contraseña incorrectos')
    expect(session.isLoggedIn.value).toBe(false)
    expect(router.currentRoute.value.name).toBe('login')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('valida el formulario antes de llamar a la API', async () => {
    const calls = mockApi({})
    const { wrapper } = await mountApp('/ingresar')

    await wrapper.find('#email').setValue('no-es-un-email')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(calls).toHaveLength(0)
    expect(wrapper.find('#email').attributes('aria-invalid')).toBe('true')
    expect(wrapper.find('#email-error').text()).toBe('Ingresá un email válido.')
    expect(wrapper.find('#password-error').text()).toBe('Este campo es obligatorio.')
  })

  it('evita el doble envío mientras la petición está en curso', async () => {
    let resolveLogin
    const calls = mockApi({
      'POST /login': () => ({ json: { token: 'abc123', client } }),
      'GET /appointments': { json: [] },
    })
    const original = globalThis.fetch
    globalThis.fetch = (...args) => new Promise((resolve) => { resolveLogin = () => resolve(original(...args)) })

    const { wrapper } = await mountApp('/ingresar')
    await wrapper.find('#email').setValue('juan@mail.com')
    await wrapper.find('#password').setValue('cliente123')
    await wrapper.find('form').trigger('submit')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('button[type="submit"]').text()).toBe('Ingresando…')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    resolveLogin()
    await flushPromises()
    expect(calls.filter((call) => call.key === 'POST /login')).toHaveLength(1)
  })
})
