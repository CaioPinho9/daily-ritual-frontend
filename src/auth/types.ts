export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type SessionEndReason = 'expired' | null

export type User = {
  id: number
  name: string
  email: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type SignupPayload = {
  name: string
  email: string
  password: string
}

export type ApiErrorDetails = Record<string, string>

export type ApiErrorResponse = {
  code?: string
  message?: string
  details?: ApiErrorDetails | null
}
