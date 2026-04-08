import { useEffect, useEffectEvent, useState, type FormEvent } from 'react'

import { ApiError } from '../auth/api'
import { AppLayout } from '../components/AppLayout'
import { serviceUrls } from '../services/config'
import type { Plan } from '../services/types'
import { useServiceClient } from '../services/useServiceClient'

export function PlansPage() {
  const request = useServiceClient()
  const [plans, setPlans] = useState<Plan[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'GOAL' | 'HABIT'>('GOAL')
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState('4')
  const [statusFilter, setStatusFilter] = useState<'ALL' | Plan['status']>('ALL')
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const visiblePlans = statusFilter === 'ALL'
    ? plans
    : plans.filter((plan) => plan.status === statusFilter)

  const applyPlans = useEffectEvent((data: Plan[]) => {
    setPlans(data)
  })

  const loadPlans = async () => {
    const data = await request<Plan[]>(`${serviceUrls.plan}/plans`)
    setPlans(data)
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const data = await request<Plan[]>(`${serviceUrls.plan}/plans`)
        if (!cancelled) {
          applyPlans(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load plans.')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [request])

  const resetForm = () => {
    setEditingPlanId(null)
    setTitle('')
    setDescription('')
    setType('GOAL')
    setTargetDaysPerWeek('4')
    setDetails({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setDetails({})

    try {
      await request<Plan>(editingPlanId == null ? `${serviceUrls.plan}/plans` : `${serviceUrls.plan}/plans/${editingPlanId}`, {
        method: editingPlanId == null ? 'POST' : 'PUT',
        body: JSON.stringify({
          title,
          description,
          type,
          targetDaysPerWeek: Number(targetDaysPerWeek),
        }),
      })
      resetForm()
      await loadPlans()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setDetails(err.details || {})
      } else {
        setError(editingPlanId == null ? 'Unable to create plan.' : 'Unable to update plan.')
      }
    }
  }

  const updateStatus = async (plan: Plan, nextAction: 'pause' | 'resume' | 'archive') => {
    await request<Plan>(`${serviceUrls.plan}/plans/${plan.id}/${nextAction}`, {
      method: 'POST',
    })
    await loadPlans()
  }

  const startEditing = (plan: Plan) => {
    setEditingPlanId(plan.id)
    setTitle(plan.title)
    setDescription(plan.description ?? '')
    setType(plan.type)
    setTargetDaysPerWeek(String(plan.targetDaysPerWeek ?? 1))
    setError(null)
    setDetails({})
  }

  return (
    <AppLayout
      title="Plans"
      description="Define goals and habits, then edit, pause, resume, or archive them without losing context."
    >
      <section className="workspace-grid">
        <form className="workspace-card" onSubmit={handleSubmit}>
          <span className="workspace-card__label">{editingPlanId == null ? 'Create plan' : 'Edit plan'}</span>
          <h2>{editingPlanId == null ? 'New goal or habit' : `Editing #${editingPlanId}`}</h2>
          <div className="auth-form">
            <div className="auth-form__field">
              <label htmlFor="plan-title">Title</label>
              <input id="plan-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              {details.title ? <span className="auth-form__error">{details.title}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="plan-description">Description</label>
              <input id="plan-description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
            <div className="auth-form__field">
              <label htmlFor="plan-type">Type</label>
              <select id="plan-type" value={type} onChange={(event) => setType(event.target.value as 'GOAL' | 'HABIT')}>
                <option value="GOAL">Goal</option>
                <option value="HABIT">Habit</option>
              </select>
              {details.type ? <span className="auth-form__error">{details.type}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="plan-target">Target days per week</label>
              <input
                id="plan-target"
                type="number"
                min="1"
                max="7"
                value={targetDaysPerWeek}
                onChange={(event) => setTargetDaysPerWeek(event.target.value)}
                required
              />
              {details.targetDaysPerWeek ? <span className="auth-form__error">{details.targetDaysPerWeek}</span> : null}
            </div>
            {error ? <div className="auth-form__alert">{error}</div> : null}
            <button className="button-primary" type="submit">{editingPlanId == null ? 'Create plan' : 'Save changes'}</button>
            {editingPlanId != null ? (
              <button className="button-secondary" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
        <section className="workspace-card">
          <span className="workspace-card__label">Current plans</span>
          <h2>{visiblePlans.length} registered</h2>
          <div className="auth-form__field">
            <label htmlFor="plan-status-filter">Status filter</label>
            <select
              id="plan-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | Plan['status'])}
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div className="workspace-list">
            {visiblePlans.map((plan) => (
              <article key={plan.id} className="workspace-list__item">
                <strong>{plan.title}</strong>
                <span>{plan.type} · {plan.status} · target {plan.targetDaysPerWeek ?? 0} days/week</span>
                <div className="workspace-actions">
                  <button className="button-secondary" type="button" onClick={() => startEditing(plan)}>
                    Edit
                  </button>
                  {plan.status === 'ACTIVE' ? (
                    <button className="button-secondary" type="button" onClick={() => void updateStatus(plan, 'pause')}>
                      Pause
                    </button>
                  ) : null}
                  {plan.status === 'PAUSED' ? (
                    <button className="button-secondary" type="button" onClick={() => void updateStatus(plan, 'resume')}>
                      Resume
                    </button>
                  ) : null}
                  {plan.status !== 'ARCHIVED' ? (
                    <button className="button-secondary" type="button" onClick={() => void updateStatus(plan, 'archive')}>
                      Archive
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AppLayout>
  )
}
