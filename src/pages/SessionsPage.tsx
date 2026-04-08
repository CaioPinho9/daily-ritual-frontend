import { Navigate, useSearchParams } from 'react-router-dom'

export function SessionsPage() {
  const [searchParams] = useSearchParams()
  const next = new URLSearchParams(searchParams)

  return <Navigate to={`/plans?${next.toString()}`} replace />
}
