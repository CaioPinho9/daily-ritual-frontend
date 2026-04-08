import { NavLink, useNavigate } from 'react-router-dom'
import { useState, type ReactNode } from 'react'

import { useAuth } from '../auth/useAuth'
import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/plans', label: 'Plans' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
]

export function AppLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
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

  return (
    <main className="workspace-page">
      <aside className="workspace-sidebar">
        <div className="workspace-sidebar__brand">
          <span>Daily Ritual</span>
          <strong>{user?.name ?? 'Workspace'}</strong>
        </div>

        <nav className="workspace-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `workspace-nav__link${isActive ? ' workspace-nav__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="workspace-sidebar__footer">
          <ThemeToggle />
          <button className="button-secondary" type="button" onClick={handleLogout}>
            {isLoggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </aside>

      <section className="workspace-content">
        <header className="workspace-hero">
          <span className="workspace-hero__eyebrow">Study planner / habit tracker</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        {children}
      </section>
    </main>
  )
}
