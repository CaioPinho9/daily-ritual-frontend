import { useCallback } from 'react'

import { useAuth } from '../auth/useAuth'
import { ApiError } from '../auth/api'

export function useServiceClient() {
  const { fetchWithAuth } = useAuth()

  return useCallback(
    async function request<T>(url: string, init: RequestInit = {}) {
      const headers = new Headers(init.headers)
      if (init.body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      const response = await fetchWithAuth(url, {
        ...init,
        headers,
      })

      if (!response.ok) {
        let payload = {}
        try {
          payload = await response.json()
        } catch {
          payload = { message: 'Request failed' }
        }
        throw new ApiError(response.status, payload)
      }

      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
    },
    [fetchWithAuth],
  )
}
