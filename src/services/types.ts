export const PlanStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const

export type PlanStatus = typeof PlanStatus[keyof typeof PlanStatus]

export const PlanTargetUnit = {
  HOURS: 'HOURS',
  MINUTES: 'MINUTES',
  SESSIONS: 'SESSIONS',
} as const

export type PlanTargetUnit = typeof PlanTargetUnit[keyof typeof PlanTargetUnit]

export const PlanTargetPeriod = {
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
} as const

export type PlanTargetPeriod = typeof PlanTargetPeriod[keyof typeof PlanTargetPeriod]

export const SessionStatus = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELED: 'CANCELED',
} as const

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus]

export type Dashboard = {
  totalCompleted: number
  activeStreak: number
  weeklyCompleted: number
}

export type PlanProgress = {
  planId: number
  completedSessions: number
  currentStreak: number
  weeklyCompleted: number
}

export type Plan = {
  id: number
  title: string
  description: string | null
  status: PlanStatus
  targetCount: number
  targetUnit: PlanTargetUnit
  targetPeriod: PlanTargetPeriod
}

export type Session = {
  id: number
  planId: number
  title: string
  startedAt: string
  endedAt: string | null
  durationMinutes: number | null
  notes: string | null
  status: SessionStatus
}

export type SessionSummary = {
  scheduled: number
  completed: number
  canceled: number
}

export type NotificationHistory = {
  id: number
  jobId: number
  title: string
  sentAt: string
}

export type ReminderRule = {
  id: number
  planId: number
  title: string
  minutesBefore: number
  nextSessionAt: string
}
