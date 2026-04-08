export const serviceUrls = {
  plan: import.meta.env.VITE_PLAN_API_URL?.trim() || 'http://localhost:8081',
  session: import.meta.env.VITE_SESSION_API_URL?.trim() || 'http://localhost:8082',
  progress: import.meta.env.VITE_PROGRESS_API_URL?.trim() || 'http://localhost:8083',
  scheduler: import.meta.env.VITE_SCHEDULER_API_URL?.trim() || 'http://localhost:8084',
  notification: import.meta.env.VITE_NOTIFICATION_API_URL?.trim() || 'http://localhost:8085',
}
