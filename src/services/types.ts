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
  type: 'GOAL' | 'HABIT'
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  targetDaysPerWeek: number | null
}

export type Session = {
  id: number
  planId: number
  title: string
  scheduledFor: string
  durationMinutes: number
  notes: string | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
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
