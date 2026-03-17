import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAuth } from '../auth/useAuth'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-topbar">
          <div className="profile-topbar__brand">
            <span>daily-ritual</span>
            <strong>Your profile</strong>
          </div>
          <button
            className="button-secondary"
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </header>

        <section className="profile-hero">
          <article className="profile-card">
            <span className="profile-card__label">Welcome back</span>
            <h1>{user.name}</h1>
            <p>
              This is your personal entry point for the routines, sessions, and progress that will
              shape your study flow.
            </p>

            <div className="profile-grid">
              <div className="profile-stat">
                <span className="profile-card__label">Email</span>
                <strong>{user.email}</strong>
              </div>
              <div className="profile-stat">
                <span className="profile-card__label">User Id</span>
                <strong>#{user.id}</strong>
              </div>
            </div>
          </article>

          <aside className="profile-summary">
            <span className="profile-card__label">What comes next</span>
            <h2>Your study space is ready to grow</h2>
            <p>The foundation is in place for planning, session tracking, and progress views.</p>
            <ul>
              <li>Set meaningful goals and build habits around them.</li>
              <li>Track sessions with enough detail to review what worked.</li>
              <li>Follow streaks and progress over time without losing momentum.</li>
            </ul>
          </aside>
        </section>
      </div>
    </main>
  )
}
