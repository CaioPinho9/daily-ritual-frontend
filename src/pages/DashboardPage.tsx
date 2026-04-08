import { useEffect, useState } from 'react'

import { ApiError } from '../auth/api'
import { AppLayout } from '../components/AppLayout'
import { serviceUrls } from '../services/config'
import type { Dashboard, Plan, PlanProgress } from '../services/types'
import { useServiceClient } from '../services/useServiceClient'

export function DashboardPage() {
  const request = useServiceClient()
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [planId, setPlanId] = useState('')
  const [planProgress, setPlanProgress] = useState<PlanProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void request<Dashboard>(`${serviceUrls.progress}/progress/dashboard`)
      .then(setDashboard)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Unable to load dashboard.')
      })
  }, [request])

  useEffect(() => {
    void request<Plan[]>(`${serviceUrls.plan}/plans`)
      .then((data) => {
        setPlans(data)
        if (data.length > 0) {
          setPlanId(String(data[0].id))
        }
      })
      .catch(() => {
        // The page-level error remains driven by the current explicit action.
      })
  }, [request])

  const loadPlanProgress = async () => {
    setError(null)
    try {
      const data = await request<PlanProgress>(`${serviceUrls.progress}/progress/plans/${Number(planId)}`)
      setPlanProgress(data)
    } catch (err) {
      setPlanProgress(null)
      setError(err instanceof ApiError ? err.message : 'Unable to load plan progress.')
    }
  }

  return (
    <AppLayout
      title="Dashboard"
      description="Track streaks, weekly progress, and plan-specific progress from the derived-state service."
    >
      <section className="workspace-grid">
        <article className="workspace-card">
          <span className="workspace-card__label">Progress</span>
          <h2>{dashboard ? `${dashboard.activeStreak}-day streak` : 'Dashboard summary'}</h2>
          <p>{error ?? 'Derived-state metrics from progress-service.'}</p>
        </article>
        <article className="workspace-card">
          <span className="workspace-card__label">This week</span>
          <h2>{dashboard?.weeklyCompleted ?? 0} completed sessions</h2>
          <p>Total completed sessions: {dashboard?.totalCompleted ?? 0}</p>
        </article>
      </section>
      <section className="workspace-card">
        <span className="workspace-card__label">Per-plan progress</span>
        <h2>Lookup by plan</h2>
        <div className="auth-form">
          <div className="auth-form__field">
            <label htmlFor="progress-plan-id">Plan</label>
            <select id="progress-plan-id" value={planId} onChange={(event) => setPlanId(event.target.value)}>
              <option value="" disabled>Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </div>
          <button className="button-primary" type="button" onClick={() => void loadPlanProgress()}>
            Load progress
          </button>
        </div>
        {planProgress ? (
          <div className="workspace-stats">
            <div className="workspace-stat">
              <span className="workspace-card__label">Completed</span>
              <strong>{planProgress.completedSessions}</strong>
            </div>
            <div className="workspace-stat">
              <span className="workspace-card__label">Current streak</span>
              <strong>{planProgress.currentStreak}</strong>
            </div>
            <div className="workspace-stat">
              <span className="workspace-card__label">Weekly completed</span>
              <strong>{planProgress.weeklyCompleted}</strong>
            </div>
          </div>
        ) : null}
      </section>
    </AppLayout>
  )
}
