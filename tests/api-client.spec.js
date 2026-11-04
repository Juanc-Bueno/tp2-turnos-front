import { describe, expect, it, vi } from 'vitest'
import { ApiError, configureAuth, request } from '@/api/client'
import { formatDateTime, formatTime } from '@/utils/format'
import { mockApi } from './helpers'

describe('cliente HTTP', () => {
  it('manda el token solo en las peticiones protegidas', async () => {
    configureAuth({ tokenGetter: () => 'xyz', unauthorizedHandler: () => {} })
    const calls = mockApi({ 'GET /stylists': { json: [] }, 'GET /me': { json: {} } })

    await request('/stylists')
    await request('/me', { auth: true })

    expect(calls[0].headers.Authorization).toBeUndefined()
    expect(calls[1].headers.Authorization).toBe('Bearer xyz')
  })

  it('ante un 401 en una petición protegida avisa para cerrar la sesión', async () => {
    const handler = vi.fn()
    configureAuth({ tokenGetter: () => 'vencido', unauthorizedHandler: handler })
    mockApi({ 'GET /appointments': { status: 401, json: { error: 'Token inválido o ausente' } } })

    await expect(request('/appointments', { auth: true })).rejects.toMatchObject({ status: 401, message: 'Token inválido o ausente' })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('convierte una falla de red en un ApiError legible', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await request('/services').catch((err) => err)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.isNetwork).toBe(true)
    expect(error.message).toMatch(/No pudimos conectarnos/)
  })
})

describe('formato de fechas', () => {
  it('muestra la hora del local sin convertir a la zona del navegador', () => {
    expect(formatTime('2030-05-06T10:30:00-03:00')).toBe('10:30')
    expect(formatDateTime('2030-05-06T10:30:00-03:00')).toBe('Lunes 6 de mayo, 10:30 hs')
  })
})
