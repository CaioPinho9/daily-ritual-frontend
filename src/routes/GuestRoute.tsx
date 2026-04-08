import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useAuth } from '../auth/useAuth'
import { PageState } from '../components/PageState'

export function GuestRoute({ children }: Readonly<{ children: ReactNode }>) {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return (
      <PageState
        title="Checking your session"
        description="If a refresh cookie exists, you will be sent directly to your profile."
      />
    )
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
