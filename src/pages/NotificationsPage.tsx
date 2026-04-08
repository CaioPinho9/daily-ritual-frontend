import { useEffect, useEffectEvent, useState, type FormEvent } from 'react'

import { ApiError } from '../auth/api'
import { AppLayout } from '../components/AppLayout'
import { serviceUrls } from '../services/config'
import type { NotificationHistory, ReminderRule } from '../services/types'
import { useServiceClient } from '../services/useServiceClient'

function toLocalDateTimeInput(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 16)
}

export function NotificationsPage() {
  const request = useServiceClient()
  const nextSession = new Date()
  nextSession.setDate(nextSession.getDate() + 1)
  nextSession.setHours(9, 0, 0, 0)

  const [items, setItems] = useState<NotificationHistory[]>([])
  const [planId, setPlanId] = useState('1')
  const [title, setTitle] = useState('')
  const [minutesBefore, setMinutesBefore] = useState('10')
  const [nextSessionAt, setNextSessionAt] = useState(toLocalDateTimeInput(nextSession))
  const [createdRule, setCreatedRule] = useState<ReminderRule | null>(null)
  const [details, setDetails] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const applyNotifications = useEffectEvent((data: NotificationHistory[]) => {
    setItems(data)
  })

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const data = await request<NotificationHistory[]>(`${serviceUrls.notification}/notifications`)
        if (!cancelled) {
          applyNotifications(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load notifications.')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [request])

  const handleCreateRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setDetails({})

    try {
      const rule = await request<ReminderRule>(`${serviceUrls.scheduler}/reminder-rules`, {
        method: 'POST',
        body: JSON.stringify({
          planId: Number(planId),
          title,
          minutesBefore: Number(minutesBefore),
          nextSessionAt,
        }),
      })
      setCreatedRule(rule)
      setTitle('')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setDetails(err.details || {})
      } else {
        setError('Unable to create reminder rule.')
      }
    }
  }

  return (
    <AppLayout
      title="Notifications"
      description="Create reminder rules locally and inspect notification history emitted by the scheduler pipeline."
    >
      <section className="workspace-grid">
        <form className="workspace-card" onSubmit={handleCreateRule}>
          <span className="workspace-card__label">Scheduler</span>
          <h2>Create reminder rule</h2>
          <div className="auth-form">
            <div className="auth-form__field">
              <label htmlFor="reminder-plan-id">Plan id</label>
              <input id="reminder-plan-id" value={planId} onChange={(event) => setPlanId(event.target.value)} required />
              {details.planId ? <span className="auth-form__error">{details.planId}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="reminder-title">Title</label>
              <input id="reminder-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              {details.title ? <span className="auth-form__error">{details.title}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="minutes-before">Minutes before</label>
              <input
                id="minutes-before"
                type="number"
                min="1"
                value={minutesBefore}
                onChange={(event) => setMinutesBefore(event.target.value)}
                required
              />
              {details.minutesBefore ? <span className="auth-form__error">{details.minutesBefore}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="next-session-at">Next session at</label>
              <input
                id="next-session-at"
                type="datetime-local"
                value={nextSessionAt}
                onChange={(event) => setNextSessionAt(event.target.value)}
                required
              />
              {details.nextSessionAt ? <span className="auth-form__error">{details.nextSessionAt}</span> : null}
            </div>
            {error ? <div className="auth-form__alert">{error}</div> : null}
            <button className="button-primary" type="submit">Create reminder</button>
          </div>
          {createdRule ? (
            <p>Created rule #{createdRule.id} for plan #{createdRule.planId}.</p>
          ) : null}
        </form>
        <section className="workspace-card">
          <span className="workspace-card__label">Notification service</span>
          <h2>{items.length} reminder records</h2>
          <p>{error ?? 'Deduplicated reminder history by job id.'}</p>
          <div className="workspace-list">
            {items.map((item) => (
              <article key={item.id} className="workspace-list__item">
                <strong>{item.title}</strong>
                <span>{new Date(item.sentAt).toLocaleString()}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AppLayout>
  )
}
