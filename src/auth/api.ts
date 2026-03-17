import type {
  ApiErrorDetails,
  ApiErrorResponse,
  LoginPayload,
  SignupPayload,
  User,
} from './types'

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8080'

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: ApiErrorDetails

  constructor(status: number, payload: ApiErrorResponse) {
    super(payload.message || 'Request failed')
    this.name = 'ApiError'
    this.status = status
    this.code = payload.code
    this.details = payload.details || undefined
  }
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers()

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    let payload: ApiErrorResponse = {}

    try {
      payload = (await response.json()) as ApiErrorResponse
    } catch {
      payload = {
        message: response.status === 401 ? 'Authentication failed' : 'Request failed',
      }
    }

    throw new ApiError(response.status, payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

type AccessTokenResponse = {
  accessToken: string
}

export async function signup(payload: SignupPayload) {
  return request<User>('/users/signup', {
    method: 'POST',
    body: payload,
  })
}

export async function login(payload: LoginPayload) {
  return request<AccessTokenResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function refreshSession() {
  return request<AccessTokenResponse>('/auth/refresh', {
    method: 'POST',
  })
}

export async function logout() {
  return request<void>('/auth/logout', {
    method: 'POST',
  })
}

export async function fetchProfile(token: string) {
  return request<User>('/users/me', {
    token,
  })
}
