const ACCESS_TOKEN_KEY = 'daily-ritual.access-token'

export const tokenStorage = {
  get(): string | null {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY)
  },
  set(token: string) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clear() {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}
