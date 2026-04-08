import { useAuth } from '../auth/useAuth'
import { AppLayout } from '../components/AppLayout'

export function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <AppLayout
      title="Profile"
      description="The auth service owns your identity, and the rest of the workspace builds on that session."
    >
      <section className="workspace-grid">
        <article className="workspace-card">
          <span className="workspace-card__label">Identity</span>
            <h1>{user.name}</h1>

            <div className="workspace-stats">
              <div className="workspace-stat">
                <span className="workspace-card__label">Email</span>
                <strong>{user.email}</strong>
              </div>
            </div>
          </article>

        <article className="workspace-card">
            <span className="workspace-card__label">What comes next</span>
            <h2>Your study space is ready to grow</h2>
            <p>The foundation is in place for planning, session tracking, and progress views.</p>
            <ul>
              <li>Set meaningful goals and build habits around them.</li>
              <li>Track sessions with enough detail to review what worked.</li>
              <li>Follow streaks and progress over time without losing momentum.</li>
            </ul>
          </article>
      </section>
    </AppLayout>
  )
}
