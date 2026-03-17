import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '../auth/api'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/AuthLayout'

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      width="18" height="18" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      width="18" height="18" aria-hidden="true">
      <path d="M3 3 21 21" />
      <path d="M10.7 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-4.2 4.6" />
      <path d="M6.8 6.8C4 8.5 2 12 2 12s3.5 6 10 6c1.8 0 3.4-.4 4.7-1.1" />
      <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
    </svg>
  )
}

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const destination =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/profile'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      await auth.login({ email, password })
      navigate(destination, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
      } else {
        setFormError('Unable to sign in right now.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Daily Ritual"
      title="Come back to the plan and keep moving."
      description="Sign in to continue building steady study habits, reviewing progress, and keeping your next session within reach."
      footer={
        <span>
          Need an account? <Link to="/signup">Create one</Link>
        </span>
      }
    >
      <div className="auth-card__header">
        <h2>Welcome back</h2>
        <p>Enter your email and password to continue.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="auth-form__field">
          <label htmlFor="password">Password</label>
          <div className="auth-form__input-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your secure password"
              required
            />
            <button
              className="auth-form__input-button"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>
        </div>

        {formError ? <div className="auth-form__alert">{formError}</div> : null}

        <div className="auth-form__actions">
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
