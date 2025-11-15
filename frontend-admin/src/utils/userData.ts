import Cookies from 'js-cookie'

export interface MinimalUserData {
  fullName?: string
}

const USER_DATA_COOKIE_KEY = 'userData'

export function getUserData<T = MinimalUserData>(): T | null {
  const raw = Cookies.get(USER_DATA_COOKIE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getUserFullName(defaultName = 'User'): string {
  const data = getUserData()
  return data?.fullName || defaultName
}
