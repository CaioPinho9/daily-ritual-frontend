import { useEffect, useEffectEvent, useMemo, useState, type FormEvent } from 'react'

import { ApiError } from '../auth/api'
import { AppLayout } from '../components/AppLayout'
import { serviceUrls } from '../services/config'
import type { Session, SessionSummary } from '../services/types'
import { useServiceClient } from '../services/useServiceClient'

function toLocalDateTimeInput(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 16)
}

function toLocalDateInput(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 10)
}

export function SessionsPage() {
  const request = useServiceClient()
  const now = useMemo(() => new Date(), [])
  const initialStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now])
  const initialEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0), [now])
  const initialScheduledFor = useMemo(() => {
    const nextHour = new Date(now)
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    return nextHour
  }, [now])

  const [sessions, setSessions] = useState<Session[]>([])
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [title, setTitle] = useState('')
  const [planId, setPlanId] = useState('1')
  const [scheduledFor, setScheduledFor] = useState(toLocalDateTimeInput(initialScheduledFor))
  const [durationMinutes, setDurationMinutes] = useState('45')
  const [notes, setNotes] = useState('')
  const [startDate, setStartDate] = useState(toLocalDateInput(initialStart))
  const [endDate, setEndDate] = useState(toLocalDateInput(initialEnd))
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const range = `start=${startDate}&end=${endDate}`

  const applyLoadedData = useEffectEvent((sessionData: Session[], summaryData: SessionSummary) => {
    setSessions(sessionData)
    setSummary(summaryData)
  })

  const load = async () => {
    const [sessionData, summaryData] = await Promise.all([
      request<Session[]>(`${serviceUrls.session}/sessions?${range}`),
      request<SessionSummary>(`${serviceUrls.session}/sessions/summary?${range}`),
    ])
    setSessions(sessionData)
    setSummary(summaryData)
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const [sessionData, summaryData] = await Promise.all([
          request<Session[]>(`${serviceUrls.session}/sessions?${range}`),
          request<SessionSummary>(`${serviceUrls.session}/sessions/summary?${range}`),
        ])
        if (!cancelled) {
          applyLoadedData(sessionData, summaryData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Unable to load sessions.')
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [request, range])

  const resetForm = () => {
    setEditingSessionId(null)
    setTitle('')
    setPlanId('1')
    setScheduledFor(toLocalDateTimeInput(initialScheduledFor))
    setDurationMinutes('45')
    setNotes('')
    setDetails({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setDetails({})

    try {
      await request<Session>(editingSessionId == null ? `${serviceUrls.session}/sessions` : `${serviceUrls.session}/sessions/${editingSessionId}`, {
        method: editingSessionId == null ? 'POST' : 'PUT',
        body: JSON.stringify({
          planId: Number(planId),
          title,
          scheduledFor,
          durationMinutes: Number(durationMinutes),
          notes,
        }),
      })
      resetForm()
      await load()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setDetails(err.details || {})
      } else {
        setError(editingSessionId == null ? 'Unable to schedule session.' : 'Unable to update session.')
      }
    }
  }

  const changeStatus = async (session: Session, action: 'complete' | 'cancel') => {
    await request<Session>(`${serviceUrls.session}/sessions/${session.id}/${action}`, {
      method: 'POST',
    })
    await load()
  }

  const startEditing = (session: Session) => {
    setEditingSessionId(session.id)
    setTitle(session.title)
    setPlanId(String(session.planId))
    setScheduledFor(session.scheduledFor.slice(0, 16))
    setDurationMinutes(String(session.durationMinutes))
    setNotes(session.notes ?? '')
    setError(null)
    setDetails({})
  }

  return (
    <AppLayout
      title="Sessions"
      description="Schedule, edit, complete, or cancel focused study blocks with event-backed tracking."
    >
      <section className="workspace-grid">
        <form className="workspace-card" onSubmit={handleSubmit}>
          <span className="workspace-card__label">{editingSessionId == null ? 'Schedule' : 'Edit session'}</span>
          <h2>{editingSessionId == null ? 'New session' : `Editing #${editingSessionId}`}</h2>
          <div className="auth-form">
            <div className="auth-form__field">
              <label htmlFor="session-title">Title</label>
              <input id="session-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              {details.title ? <span className="auth-form__error">{details.title}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="session-plan">Plan id</label>
              <input id="session-plan" value={planId} onChange={(event) => setPlanId(event.target.value)} required />
              {details.planId ? <span className="auth-form__error">{details.planId}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="session-date">Scheduled for</label>
              <input id="session-date" type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} required />
              {details.scheduledFor ? <span className="auth-form__error">{details.scheduledFor}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="session-duration">Duration in minutes</label>
              <input
                id="session-duration"
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              />
              {details.durationMinutes ? <span className="auth-form__error">{details.durationMinutes}</span> : null}
            </div>
            <div className="auth-form__field">
              <label htmlFor="session-notes">Notes</label>
              <input id="session-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
            {error ? <div className="auth-form__alert">{error}</div> : null}
            <button className="button-primary" type="submit">{editingSessionId == null ? 'Schedule session' : 'Save changes'}</button>
            {editingSessionId != null ? (
              <button className="button-secondary" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>
        <section className="workspace-card">
          <span className="workspace-card__label">Summary</span>
          <h2>{summary?.completed ?? 0} completed</h2>
          <p>{summary?.scheduled ?? 0} scheduled · {summary?.canceled ?? 0} canceled</p>
          <div className="workspace-grid">
            <div className="auth-form__field">
              <label htmlFor="sessions-start">From</label>
              <input id="sessions-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="auth-form__field">
              <label htmlFor="sessions-end">To</label>
              <input id="sessions-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <div className="workspace-list">
            {sessions.map((session) => (
              <article key={session.id} className="workspace-list__item">
                <strong>{session.title}</strong>
                <span>{session.status} · {new Date(session.scheduledFor).toLocaleString()} · {session.durationMinutes} min</span>
                <div className="workspace-actions">
                  {session.status === 'SCHEDULED' ? (
                    <>
                      <button className="button-secondary" type="button" onClick={() => startEditing(session)}>
                        Edit
                      </button>
                      <button className="button-secondary" type="button" onClick={() => void changeStatus(session, 'complete')}>
                        Complete
                      </button>
                      <button className="button-secondary" type="button" onClick={() => void changeStatus(session, 'cancel')}>
                        Cancel
                      </button>
                    </>
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
