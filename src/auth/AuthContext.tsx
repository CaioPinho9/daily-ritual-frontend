import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  ApiError,
  fetchProfile,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
  signup as signupRequest,
} from './api'
import { AuthContext } from './authContextValue'
import { tokenStorage } from './tokenStorage'
import type { AuthStatus, LoginPayload, SignupPayload, User } from './types'

export type AuthContextValue = {
  status: AuthStatus
  user: User | null
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  signup: (payload: SignupPayload) => Promise<void>
  logout: () => Promise<void>
  getValidAccessToken: () => Promise<string | null>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const refreshInFlight = useRef<Promise<string | null> | null>(null)

  const setAuthenticatedSession = useCallback((accessToken: string, nextUser: User) => {
    tokenStorage.set(accessToken)
    startTransition(() => {
      setUser(nextUser)
      setStatus('authenticated')
    })
  }, [])

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    startTransition(() => {
      setUser(null)
      setStatus('unauthenticated')
    })
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (!refreshInFlight.current) {
      refreshInFlight.current = (async () => {
        try {
          const response = await refreshSessionRequest()
          tokenStorage.set(response.accessToken)
          return response.accessToken
        } catch {
          tokenStorage.clear()
          return null
        } finally {
          refreshInFlight.current = null
        }
      })()
    }

    return refreshInFlight.current
  }, [])

  const resolveProfile = useCallback(
    async (candidateToken?: string | null) => {
      const existingToken = candidateToken ?? tokenStorage.get()

      if (!existingToken) {
        const refreshedToken = await refreshAccessToken()
        if (!refreshedToken) {
          clearSession()
          return
        }

        const refreshedUser = await fetchProfile(refreshedToken)
        setAuthenticatedSession(refreshedToken, refreshedUser)
        return
      }

      try {
        const nextUser = await fetchProfile(existingToken)
        setAuthenticatedSession(existingToken, nextUser)
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error
        }

        const refreshedToken = await refreshAccessToken()
        if (!refreshedToken) {
          clearSession()
          return
        }

        const refreshedUser = await fetchProfile(refreshedToken)
        setAuthenticatedSession(refreshedToken, refreshedUser)
      }
    },
    [clearSession, refreshAccessToken, setAuthenticatedSession],
  )

  useEffect(() => {
    void resolveProfile().catch(() => {
      clearSession()
    })
  }, [clearSession, resolveProfile])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginRequest(payload)
      const nextUser = await fetchProfile(response.accessToken)
      setAuthenticatedSession(response.accessToken, nextUser)
    },
    [setAuthenticatedSession],
  )

  const signup = useCallback(
    async (payload: SignupPayload) => {
      await signupRequest(payload)
      await login({
        email: payload.email,
        password: payload.password,
      })
    },
    [login],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const getValidAccessToken = useCallback(async () => {
    const existingToken = tokenStorage.get()
    if (existingToken) {
      return existingToken
    }

    return refreshAccessToken()
  }, [refreshAccessToken])

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        isAuthenticated: status === 'authenticated',
        login,
        signup,
        logout,
        getValidAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
