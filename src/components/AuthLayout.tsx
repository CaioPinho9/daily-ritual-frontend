import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { ThemeToggle } from './ThemeToggle'

type AuthLayoutProps = {
  eyebrow: string
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="app-shell">
      <section className="app-shell__hero">
        <div className="app-shell__theme-switch">
          <ThemeToggle />
        </div>
        <div className="app-shell__hero-panel">
          <div className="app-shell__eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p>{description}</p>

          <div className="app-shell__notes">
            <div className="app-shell__note">
              <strong>Built for focus</strong>
              <span>Keep your study plans, sessions, and progress in one place.</span>
            </div>
            <div className="app-shell__note">
              <strong>Pick up where you left off</strong>
              <span>Your session stays available when you return to the app.</span>
            </div>
            <div className="app-shell__note">
              <strong>Private by default</strong>
              <span>Your personal area stays reserved for signed-in access.</span>
            </div>
            <div className="app-shell__note">
              <strong>Start simple</strong>
              <span>Create your account, sign in, and get ready for the rest of the tracker.</span>
            </div>
          </div>
        </div>
      </section>

      <aside className="auth-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <Link className="app-shell__eyebrow" to="/">
              Daily Ritual
            </Link>
            {children}
          </div>
          <div className="auth-card__footer">{footer}</div>
        </div>
      </aside>
    </div>
  )
}
