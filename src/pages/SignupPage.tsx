import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError } from '../auth/api'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/AuthLayout'

type FieldErrors = {
  name?: string
  email?: string
  password?: string
}

export function SignupPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)
    setIsSubmitting(true)

    try {
      await auth.signup({ name, email, password })
      navigate('/profile', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message)
        setFieldErrors(error.details || {})
      } else {
        setFormError('Unable to create your account right now.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="daily-ritual"
      title="Start building a study rhythm that lasts."
      description="Create your account to organize routines, protect your progress, and keep your learning space ready whenever you return."
      footer={
        <span>
          Already have an account? <Link to="/login">Sign in</Link>
        </span>
      }
    >
      <div className="auth-card__header">
        <h2>Create your account</h2>
        <p>Set up your account and step into your personal study space.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Caio Pinho"
            required
          />
          {fieldErrors.name ? <span className="auth-form__error">{fieldErrors.name}</span> : null}
        </div>

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
          {fieldErrors.email ? (
            <span className="auth-form__error">{fieldErrors.email}</span>
          ) : null}
        </div>

        <div className="auth-form__field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 chars, upper, lower, number, symbol"
            required
          />
          {fieldErrors.password ? (
            <span className="auth-form__error">{fieldErrors.password}</span>
          ) : (
            <span className="auth-form__helper">
              Choose a strong password you will remember.
            </span>
          )}
        </div>

        {formError ? <div className="auth-form__alert">{formError}</div> : null}

        <div className="auth-form__actions">
          <button className="button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
