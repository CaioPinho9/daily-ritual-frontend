import { useEffect, useEffectEvent, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ApiError } from '../auth/api'
import { AppLayout } from '../components/AppLayout'
import { serviceUrls } from '../services/config'
import { PlanStatus, PlanTargetPeriod, PlanTargetUnit, SessionStatus, type Plan, type Session, type SessionSummary } from '../services/types'
import { useServiceClient } from '../services/useServiceClient'

function formatTarget(plan: Pick<Plan, 'targetCount' | 'targetUnit' | 'targetPeriod'>) {
  const unit = plan.targetUnit.toLowerCase()
  const period = plan.targetPeriod.toLowerCase()
  return `${plan.targetCount} ${unit} / ${period}`
}

function toLocalDateTimeInput(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 16)
}

function toLocalDateInput(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60 * 1000)
  return adjusted.toISOString().slice(0, 10)
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000)
}

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function getPeriodStart(period: Plan['targetPeriod'], now: Date) {
  if (period === PlanTargetPeriod.DAY) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === PlanTargetPeriod.WEEK) {
    const day = now.getDay()
    const distanceToMonday = day === 0 ? 6 : day - 1
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday)
  }
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function calculatePlanProgress(plan: Plan, sessions: Session[], now: Date) {
  const periodStart = getPeriodStart(plan.targetPeriod, now)
  const matchingSessions = sessions.filter((session) => {
    if (session.planId !== plan.id || session.status !== SessionStatus.COMPLETED) {
      return false
    }
    return new Date(session.startedAt) >= periodStart
  })

  if (plan.targetUnit === PlanTargetUnit.SESSIONS) {
    return matchingSessions.length
  }

  const totalMinutes = matchingSessions.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0)
  if (plan.targetUnit === PlanTargetUnit.MINUTES) {
    return totalMinutes
  }

  return Math.round((totalMinutes / 60) * 10) / 10
}

function formatProgressValue(value: number, unit: Plan['targetUnit']) {
  return `${value} ${unit.toLowerCase()}`
}

function formatSessionMenuLabel(session: Session) {
  const started = new Date(session.startedAt).toLocaleString()
  if (!session.endedAt) {
    return `Open session · ${started}`
  }
  return `Edit session · ${started}`
}

export function PlansPage() {
  const request = useServiceClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasAutoStarted = useRef(false)
  const now = useMemo(() => new Date(), [])
  const initialStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now])
  const initialEnd = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 1, 0), [now])
  const initialStartedAt = useMemo(() => {
    const nextHour = new Date(now)
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    return nextHour
  }, [now])
  const initialEndedAt = useMemo(() => addMinutes(initialStartedAt, 45), [initialStartedAt])

  const [plans, setPlans] = useState<Plan[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [summary, setSummary] = useState<SessionSummary | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetCount, setTargetCount] = useState('4')
  const [targetUnit, setTargetUnit] = useState<PlanTargetUnit>(PlanTargetUnit.HOURS)
  const [targetPeriod, setTargetPeriod] = useState<PlanTargetPeriod>(PlanTargetPeriod.WEEK)
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlanStatus>('ALL')
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [planDetails, setPlanDetails] = useState<Record<string, string>>({})
  const [planError, setPlanError] = useState<string | null>(null)

  const [planId, setPlanId] = useState(searchParams.get('planId') ?? '')
  const [startedAt, setStartedAt] = useState(toLocalDateTimeInput(initialStartedAt))
  const [endedAt, setEndedAt] = useState(toLocalDateTimeInput(initialEndedAt))
  const [startDate, setStartDate] = useState(toLocalDateInput(initialStart))
  const [endDate, setEndDate] = useState(toLocalDateInput(initialEnd))
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [isRegisterSessionModalOpen, setIsRegisterSessionModalOpen] = useState(false)
  const [sessionDetails, setSessionDetails] = useState<Record<string, string>>({})
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isSavingLiveSession, setIsSavingLiveSession] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [openMenuPlanId, setOpenMenuPlanId] = useState<number | null>(null)

  const range = `start=${startDate}&end=${endDate}`
  const visiblePlans = statusFilter === 'ALL'
    ? plans
    : plans.filter((plan) => plan.status === statusFilter)
  const activePlans = plans.filter((plan) => plan.status === PlanStatus.ACTIVE)
  const averageTargetCount = activePlans.length === 0 ? 0 : Math.round(activePlans.reduce((sum, plan) => sum + plan.targetCount, 0) / activePlans.length)
  const hoursTargetCount = activePlans.filter((plan) => plan.targetUnit === PlanTargetUnit.HOURS).length
  const highlightedPlan = activePlans[0] ?? visiblePlans[0] ?? null
  const secondaryPlans = visiblePlans.filter((plan) => plan.id !== highlightedPlan?.id).slice(0, 3)
  const highlightedPlanProgress = highlightedPlan ? calculatePlanProgress(highlightedPlan, sessions, now) : null
  const currentLiveSession = useMemo(() => sessions
    .filter((session) => String(session.planId) === planId && session.status === SessionStatus.SCHEDULED && !session.endedAt)
    .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0] ?? null, [sessions, planId])

  const applyLoadedData = useEffectEvent((planData: Plan[], sessionData: Session[], summaryData: SessionSummary) => {
    setPlans(planData)
    setSessions(sessionData)
    setSummary(summaryData)
  })

  useEffect(() => {
    if (!timerStartedAt) {
      return
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - timerStartedAt.getTime()) / 1000)))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [timerStartedAt])

  useEffect(() => {
    if (!currentLiveSession) {
      setTimerStartedAt(null)
      setElapsedSeconds(0)
      return
    }
    const started = new Date(currentLiveSession.startedAt)
    setTimerStartedAt(started)
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000)))
  }, [currentLiveSession])

  const loadWorkspace = async () => {
    const [planData, sessionData, summaryData] = await Promise.all([
      request<Plan[]>(`${serviceUrls.plan}/plans`),
      request<Session[]>(`${serviceUrls.session}/sessions?${range}`),
      request<SessionSummary>(`${serviceUrls.session}/sessions/summary?${range}`),
    ])
    setPlans(planData)
    setSessions(sessionData)
    setSummary(summaryData)
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const [planData, sessionData, summaryData] = await Promise.all([
          request<Plan[]>(`${serviceUrls.plan}/plans`),
          request<Session[]>(`${serviceUrls.session}/sessions?${range}`),
          request<SessionSummary>(`${serviceUrls.session}/sessions/summary?${range}`),
        ])
        if (cancelled) {
          return
        }
        applyLoadedData(planData, sessionData, summaryData)
        if (!searchParams.get('planId') && !planId && planData.length > 0) {
          setPlanId(String(planData[0].id))
        }
        if (searchParams.get('autostart') === '1' && !hasAutoStarted.current) {
          const autoPlanId = searchParams.get('planId') ?? (planData[0] ? String(planData[0].id) : '')
          if (autoPlanId) {
            setPlanId(autoPlanId)
            setTimerStartedAt(new Date())
            setElapsedSeconds(0)
            setLiveError(null)
            hasAutoStarted.current = true
          }
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Unable to load plans.'
        if (!cancelled) {
          setPlanError(message)
          setSessionError(message)
          setLiveError(message)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [request, range, searchParams, planId])

  const resetPlanForm = () => {
    setIsPlanModalOpen(false)
    setEditingPlanId(null)
    setTitle('')
    setDescription('')
    setTargetCount('4')
    setTargetUnit(PlanTargetUnit.SESSIONS)
    setTargetPeriod(PlanTargetPeriod.WEEK)
    setPlanDetails({})
    setPlanError(null)
  }

  const resetRegisterForm = () => {
    setIsRegisterSessionModalOpen(false)
    setEditingSessionId(null)
    setPlanId((current) => current || (plans[0] ? String(plans[0].id) : ''))
    setStartedAt(toLocalDateTimeInput(initialStartedAt))
    setEndedAt(toLocalDateTimeInput(initialEndedAt))
    setSessionDetails({})
    setSessionError(null)
  }

  const handlePlanSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPlanError(null)
    setPlanDetails({})

    try {
      await request<Plan>(editingPlanId == null ? `${serviceUrls.plan}/plans` : `${serviceUrls.plan}/plans/${editingPlanId}`, {
        method: editingPlanId == null ? 'POST' : 'PUT',
        body: JSON.stringify({
          title,
          description,
          targetCount: Number(targetCount),
          targetUnit,
          targetPeriod,
        }),
      })
      resetPlanForm()
      await loadWorkspace()
    } catch (err) {
      if (err instanceof ApiError) {
        setPlanError(err.message)
        setPlanDetails(err.details || {})
      } else {
        setPlanError(editingPlanId == null ? 'Unable to create plan.' : 'Unable to update plan.')
      }
    }
  }

  const updateStatus = async (plan: Plan, nextAction: 'pause' | 'resume' | 'archive') => {
    setOpenMenuPlanId(null)
    await request<Plan>(`${serviceUrls.plan}/plans/${plan.id}/${nextAction}`, {
      method: 'POST',
    })
    await loadWorkspace()
  }

  const startEditingPlan = (plan: Plan) => {
    setOpenMenuPlanId(null)
    setIsPlanModalOpen(true)
    setEditingPlanId(plan.id)
    setTitle(plan.title)
    setDescription(plan.description ?? '')
    setTargetCount(String(plan.targetCount))
    setTargetUnit(plan.targetUnit)
    setTargetPeriod(plan.targetPeriod)
    setPlanError(null)
    setPlanDetails({})
  }

  const openCreatePlanModal = () => {
    setIsPlanModalOpen(true)
    setEditingPlanId(null)
    setTitle('')
    setDescription('')
    setTargetCount('4')
    setTargetUnit(PlanTargetUnit.SESSIONS)
    setTargetPeriod(PlanTargetPeriod.WEEK)
    setPlanDetails({})
    setPlanError(null)
  }

  const selectPlanForLiveSession = async (plan: Plan) => {
    setOpenMenuPlanId(null)
    setPlanId(String(plan.id))
    setLiveError(null)
    const openSession = sessions
      .filter((session) => session.planId === plan.id && session.status === SessionStatus.SCHEDULED && !session.endedAt)
      .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())[0]

    if (openSession) {
      setTimerStartedAt(new Date(openSession.startedAt))
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(openSession.startedAt).getTime()) / 1000)))
      return
    }

    const started = new Date()
    try {
      await request<Session>(`${serviceUrls.session}/sessions`, {
        method: 'POST',
        body: JSON.stringify({
          planId: plan.id,
          startedAt: started.toISOString().slice(0, 16),
          endedAt: null,
        }),
      })
      await loadWorkspace()
    } catch (err) {
      setLiveError(err instanceof ApiError ? err.message : 'Unable to start session.')
    }
  }

  const stopLiveSession = async () => {
    if (!currentLiveSession) {
      return
    }
    setIsSavingLiveSession(true)
    setLiveError(null)

    try {
      await request<Session>(`${serviceUrls.session}/sessions/${currentLiveSession.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          endedAt: new Date().toISOString().slice(0, 16),
        }),
      })
      setTimerStartedAt(null)
      setElapsedSeconds(0)
      await loadWorkspace()
    } catch (err) {
      setLiveError(err instanceof ApiError ? err.message : 'Unable to save live session.')
    } finally {
      setIsSavingLiveSession(false)
    }
  }

  const saveRegisteredSession = async () => {
    setSessionError(null)
    setSessionDetails({})

    try {
      await request<Session>(editingSessionId == null ? `${serviceUrls.session}/sessions` : `${serviceUrls.session}/sessions/${editingSessionId}`, {
        method: editingSessionId == null ? 'POST' : 'PUT',
        body: JSON.stringify({
          planId: Number(planId),
          startedAt,
          endedAt: endedAt || null,
        }),
      })
      resetRegisterForm()
      await loadWorkspace()
    } catch (err) {
      if (err instanceof ApiError) {
        setSessionError(err.message)
        setSessionDetails(err.details || {})
      } else {
        setSessionError(editingSessionId == null ? 'Unable to register session.' : 'Unable to update session.')
      }
    }
  }

  const handleRegisterSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    await saveRegisteredSession()
  }

  const changeSessionStatus = async (session: Session, action: 'complete' | 'cancel') => {
    await request<Session>(`${serviceUrls.session}/sessions/${session.id}/${action}`, {
      method: 'POST',
    })
    await loadWorkspace()
  }

  const startEditingSession = (session: Session) => {
    setIsRegisterSessionModalOpen(true)
    setEditingSessionId(session.id)
    setPlanId(String(session.planId))
    setStartedAt(session.startedAt.slice(0, 16))
    setEndedAt(session.endedAt ? session.endedAt.slice(0, 16) : '')
    setSessionError(null)
    setSessionDetails({})
  }

  const openRegisterSession = (plan: Plan) => {
    setOpenMenuPlanId(null)
    setIsRegisterSessionModalOpen(true)
    setEditingSessionId(null)
    setPlanId(String(plan.id))
    setStartedAt(toLocalDateTimeInput(initialStartedAt))
    setEndedAt(toLocalDateTimeInput(initialEndedAt))
    setSessionDetails({})
    setSessionError(null)
  }

  const openNotifications = (plan: Plan) => {
    setOpenMenuPlanId(null)
    navigate(`/notifications?planId=${plan.id}`)
  }

  const renderPlanMenu = (plan: Plan) => (
    <div className="plan-menu">
      <button
        className="plan-menu__trigger"
        type="button"
        aria-expanded={openMenuPlanId === plan.id}
        aria-label={`Open actions for ${plan.title}`}
        onClick={() => setOpenMenuPlanId((current) => current === plan.id ? null : plan.id)}
      >
        ⋮
      </button>
      {openMenuPlanId === plan.id ? (
        <div className="plan-menu__dropdown">
          <button type="button" onClick={() => startEditingPlan(plan)}>Edit plan</button>
          <button type="button" onClick={() => openRegisterSession(plan)}>Register session</button>
          <button type="button" onClick={() => openNotifications(plan)}>Notification</button>
          {sessions.filter((session) => session.planId === plan.id).length > 0 ? (
            <>
              <div className="plan-menu__section-title">Recent sessions</div>
              {sessions
                .filter((session) => session.planId === plan.id)
                .sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime())
                .slice(0, 3)
                .map((session) => (
                  <button key={session.id} type="button" onClick={() => startEditingSession(session)}>
                    {formatSessionMenuLabel(session)}
                  </button>
                ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  const renderLiveSessionBlock = (plan: Plan) => {
    if (String(plan.id) !== planId || !currentLiveSession || currentLiveSession.planId !== plan.id || !timerStartedAt) {
      return null
    }

    return (
      <div className="plan-session-block">
        <div className="session-timer">
          <span className="workspace-card__label">Elapsed</span>
          <strong>{formatElapsed(elapsedSeconds)}</strong>
          <p>{`Tracking ${plan.title}`}</p>
        </div>
        {liveError ? <div className="auth-form__alert">{liveError}</div> : null}
        <div className="workspace-actions">
          <button className="button-primary" type="button" onClick={() => void stopLiveSession()} disabled={isSavingLiveSession}>
            {isSavingLiveSession ? 'Saving session...' : 'Stop and save'}
          </button>
          <button className="button-secondary" type="button" onClick={() => startEditingSession(currentLiveSession)}>
            Edit session
          </button>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <section className="plans-page">
        <section className="plans-grid">
          {highlightedPlan ? (
            <article className="plan-card plan-card--featured">
              <div className="plan-card__top">
                <div>
                  <div className="plan-card__badge-row">
                    <span className="plan-chip">{highlightedPlan.targetUnit}</span>
                    <span className={`plan-chip plan-chip--status plan-chip--${highlightedPlan.status.toLowerCase()}`}>
                      {highlightedPlan.status}
                    </span>
                  </div>
                  <h3>{highlightedPlan.title}</h3>
                  <p>
                    {highlightedPlan.description || 'No description yet. Use this plan as the anchor for your next focused session.'}
                  </p>
                </div>
                {renderPlanMenu(highlightedPlan)}
              </div>

              <div className="plan-feature-grid">
                <div className="plan-feature-tile">
                  <span>Cadence</span>
                  <strong>{formatTarget(highlightedPlan)}</strong>
                </div>
                <div className="plan-feature-tile">
                  <span>Status</span>
                  <strong>{highlightedPlan.status}</strong>
                </div>
              </div>

              <div className="plan-card__actions">
                <div className="plan-card__stack">
                  <span>{activePlans.length} active plans</span>
                  <span>
                    {highlightedPlanProgress == null
                      ? 'No progress yet'
                      : `${formatProgressValue(highlightedPlanProgress, highlightedPlan.targetUnit)} done this ${highlightedPlan.targetPeriod.toLowerCase()}`}
                  </span>
                </div>
              </div>
              {renderLiveSessionBlock(highlightedPlan)}
            </article>
          ) : (
            <article className="plan-card plan-card--featured plan-card--empty">
              <span className="plan-chip">No plans yet</span>
              <h3>Start your first plan</h3>
              <p>Create a plan and it will become the base for live sessions and manual registration.</p>
            </article>
          )}

          {secondaryPlans.map((plan) => (
            <article key={plan.id} className="plan-card">
              <div className="plan-card__badge-row">
                <span className="plan-chip">{plan.targetUnit}</span>
                <span className={`plan-chip plan-chip--status plan-chip--${plan.status.toLowerCase()}`}>
                  {plan.status}
                </span>
              </div>
              <h3>{plan.title}</h3>
              <p>{plan.description || 'Ready to become your next session.'}</p>
              <div className="plan-card__meta">
                <span>{formatTarget(plan)}</span>
              </div>
              <div className="plan-card__button-row">
                {renderPlanMenu(plan)}
              </div>
              {renderLiveSessionBlock(plan)}
            </article>
          ))}

          <button className="plan-card plan-card--ghost" type="button" onClick={openCreatePlanModal}>
            <span className="plan-card__plus">+</span>
            <strong>New plan</strong>
            <span>Create another target you want to track.</span>
          </button>
        </section>

        <section className="plans-metrics">
          <article className="plans-metric">
            <span>Active plans</span>
            <strong>{activePlans.length}</strong>
          </article>
          <article className="plans-metric">
            <span>Hours-based</span>
            <strong>{hoursTargetCount}</strong>
          </article>
          <article className="plans-metric">
            <span>Average target</span>
            <strong>{averageTargetCount}</strong>
          </article>
          <div className="plans-metrics__actions">
            <div className="auth-form__field">
              <label htmlFor="plan-status-filter">Status filter</label>
              <select
                id="plan-status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | PlanStatus)}
              >
                <option value="ALL">All</option>
                <option value={PlanStatus.ACTIVE}>Active</option>
                <option value={PlanStatus.PAUSED}>Paused</option>
                <option value={PlanStatus.ARCHIVED}>Archived</option>
              </select>
            </div>
          </div>
        </section>

        <section className="plans-lower-grid">
          <section className="plans-column-stack">
            <section className="workspace-card">
              <span className="workspace-card__label">Visible plans</span>
              <h2>{visiblePlans.length} in view</h2>
              <div className="workspace-list">
                {visiblePlans.map((plan) => (
                  <article key={plan.id} className="workspace-list__item">
                    <strong>{plan.title}</strong>
                    <span>{plan.status} · target {formatTarget(plan)}</span>
                    <div className="workspace-actions">
                      <button className="button-secondary" type="button" onClick={() => void selectPlanForLiveSession(plan)}>
                        Start timer
                      </button>
                      {renderPlanMenu(plan)}
                      {plan.status === PlanStatus.ACTIVE ? (
                        <button className="button-secondary" type="button" onClick={() => void updateStatus(plan, 'pause')}>
                          Pause
                        </button>
                      ) : null}
                      {plan.status === PlanStatus.PAUSED ? (
                        <button className="button-secondary" type="button" onClick={() => void updateStatus(plan, 'resume')}>
                          Resume
                        </button>
                      ) : null}
                      {plan.status !== PlanStatus.ARCHIVED ? (
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

          <section className="plans-column-stack">
            <section className="workspace-card">
              <span className="workspace-card__label">Summary</span>
              <h2>{summary?.completed ?? 0} completed</h2>
              <p>{summary?.scheduled ?? 0} scheduled · {summary?.canceled ?? 0} canceled</p>
              <div className="plans-form-card__row">
                <div className="auth-form__field">
                  <label htmlFor="sessions-start">From</label>
                  <input id="sessions-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div className="auth-form__field">
                  <label htmlFor="sessions-end">To</label>
                  <input id="sessions-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
              </div>
            </section>

            <section className="workspace-card">
              <span className="workspace-card__label">Registered sessions</span>
              <h2>{sessions.length} in range</h2>
              <div className="workspace-list">
                {sessions.map((session) => (
                  <article key={session.id} className="workspace-list__item">
                    <strong>{session.title}</strong>
                    <span>
                      {session.status} · {new Date(session.startedAt).toLocaleString()}
                      {session.endedAt ? ` to ${new Date(session.endedAt).toLocaleTimeString()}` : ' · open'}
                      {session.durationMinutes != null ? ` · ${session.durationMinutes} min` : ''}
                    </span>
                    <div className="workspace-actions">
                      {session.status === SessionStatus.SCHEDULED ? (
                        <>
                          <button className="button-secondary" type="button" onClick={() => startEditingSession(session)}>
                            Edit
                          </button>
                          <button className="button-secondary" type="button" onClick={() => void changeSessionStatus(session, 'complete')}>
                            Complete
                          </button>
                          <button className="button-secondary" type="button" onClick={() => void changeSessionStatus(session, 'cancel')}>
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
        </section>

        {isPlanModalOpen ? (
          <div className="modal-backdrop" role="presentation" onClick={resetPlanForm}>
            <div
              className="modal-card plans-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="plan-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <form className="plans-form-card" onSubmit={handlePlanSubmit}>
                <span className="workspace-card__label">{editingPlanId == null ? 'Plan configuration' : 'Editing current plan'}</span>
                <div className="plans-modal__header">
                  <h2 id="plan-modal-title">{editingPlanId == null ? 'Create a new plan' : 'Update plan'}</h2>
                  <button className="plan-icon-button" type="button" onClick={resetPlanForm}>
                    Close
                  </button>
                </div>
                <div className="auth-form">
                  <div className="auth-form__field">
                    <label htmlFor="plan-title">Title</label>
                    <input id="plan-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
                    {planDetails.title ? <span className="auth-form__error">{planDetails.title}</span> : null}
                  </div>
                  <div className="auth-form__field">
                    <label htmlFor="plan-description">Description</label>
                    <input id="plan-description" value={description} onChange={(event) => setDescription(event.target.value)} />
                  </div>
                  <div className="plans-form-card__row">
                    <div className="auth-form__field">
                      <label htmlFor="plan-target-unit">Target unit</label>
                      <select id="plan-target-unit" value={targetUnit} onChange={(event) => setTargetUnit(event.target.value as PlanTargetUnit)}>
                        <option value={PlanTargetUnit.SESSIONS}>Sessions</option>
                        <option value={PlanTargetUnit.MINUTES}>Minutes</option>
                        <option value={PlanTargetUnit.HOURS}>Hours</option>
                      </select>
                      {planDetails.targetUnit ? <span className="auth-form__error">{planDetails.targetUnit}</span> : null}
                    </div>
                    <div className="auth-form__field">
                      <label htmlFor="plan-target">Target count</label>
                      <input id="plan-target" type="number" min="1" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} required />
                      {planDetails.targetCount ? <span className="auth-form__error">{planDetails.targetCount}</span> : null}
                    </div>
                    <div className="auth-form__field">
                      <label htmlFor="plan-target-period">Per</label>
                      <select id="plan-target-period" value={targetPeriod} onChange={(event) => setTargetPeriod(event.target.value as PlanTargetPeriod)}>
                        <option value={PlanTargetPeriod.DAY}>Day</option>
                        <option value={PlanTargetPeriod.WEEK}>Week</option>
                        <option value={PlanTargetPeriod.MONTH}>Month</option>
                      </select>
                      {planDetails.targetPeriod ? <span className="auth-form__error">{planDetails.targetPeriod}</span> : null}
                    </div>
                  </div>
                  {planError ? <div className="auth-form__alert">{planError}</div> : null}
                  <div className="plans-form-card__actions">
                    <button className="button-primary" type="submit">
                      {editingPlanId == null ? 'Create plan' : 'Save changes'}
                    </button>
                    <button className="button-secondary" type="button" onClick={resetPlanForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {isRegisterSessionModalOpen ? (
          <div className="modal-backdrop" role="presentation" onClick={resetRegisterForm}>
            <div
              className="modal-card plans-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="register-session-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <form className="plans-form-card" onSubmit={handleRegisterSubmit}>
                <span className="workspace-card__label">{editingSessionId == null ? 'Register completed session' : 'Edit registered session'}</span>
                <div className="plans-modal__header">
                  <h2 id="register-session-modal-title">{editingSessionId == null ? 'Add something that already happened' : 'Update registered session'}</h2>
                  <button className="plan-icon-button" type="button" onClick={resetRegisterForm}>
                    Close
                  </button>
                </div>
                <div className="auth-form">
                  <div className="auth-form__field">
                    <label htmlFor="session-plan">Plan</label>
                    <select id="session-plan" value={planId} onChange={(event) => setPlanId(event.target.value)} required>
                      <option value="" disabled>Select a plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.title}
                        </option>
                      ))}
                    </select>
                    {sessionDetails.planId ? <span className="auth-form__error">{sessionDetails.planId}</span> : null}
                  </div>
                    <div className="plans-form-card__row">
                      <div className="auth-form__field">
                        <label htmlFor="session-date">Started at</label>
                        <input id="session-date" type="datetime-local" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} required />
                        {sessionDetails.startedAt ? <span className="auth-form__error">{sessionDetails.startedAt}</span> : null}
                      </div>
                      <div className="auth-form__field">
                        <label htmlFor="session-end-date">Ended at</label>
                      <input id="session-end-date" type="datetime-local" value={endedAt} onChange={(event) => setEndedAt(event.target.value)} />
                      {sessionDetails.endedAt ? <span className="auth-form__error">{sessionDetails.endedAt}</span> : null}
                        <span className="auth-form__hint">Leave empty to keep this session open.</span>
                      </div>
                    </div>
                {sessionError ? <div className="auth-form__alert">{sessionError}</div> : null}
                  <div className="plans-form-card__actions">
                    <button className="button-primary" type="submit">
                      {editingSessionId == null ? 'Register completed session' : 'Save changes'}
                    </button>
                    <button className="button-secondary" type="button" onClick={resetRegisterForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>
    </AppLayout>
  )
}
