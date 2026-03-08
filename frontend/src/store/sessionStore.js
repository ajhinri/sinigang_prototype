import { getStorageJson, removeStorageKey, setStorageJson, STORAGE_KEYS } from '../services/storage'

export function getSession() {
  const session = getStorageJson(STORAGE_KEYS.session, null)

  if (!session) {
    return null
  }

  if (Date.now() > session.expiresAt) {
    removeSession()
    return null
  }

  return session
}

export function setSession(user) {
  const session = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    token: `mock-token-${user.id}-${Date.now()}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
  }

  setStorageJson(STORAGE_KEYS.session, session)
  return session
}

export function removeSession() {
  removeStorageKey(STORAGE_KEYS.session)
}

export function isSessionActive() {
  return Boolean(getSession())
}
