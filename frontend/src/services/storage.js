const STORAGE_KEYS = {
  session: 'dayzero.session',
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function getStorageJson(key, fallback = null) {
  return safeParse(localStorage.getItem(key), fallback)
}

export function setStorageJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeStorageKey(key) {
  localStorage.removeItem(key)
}

export function getInternProfileKey(userId) {
  return `dayzero.internProfile.${userId}`
}

export function getWorkspaceKey(userId) {
  return `dayzero.workspace.${userId}`
}

export function getRepoSimKey(userId) {
  return `dayzero.repoSim.${userId}`
}

export function getTaskBoardKey(userId) {
  return `dayzero.taskBoard.${userId}`
}

export function clearUserDayzeroStorage(userId) {
  removeStorageKey(getInternProfileKey(userId))
  removeStorageKey(getWorkspaceKey(userId))
  removeStorageKey(getRepoSimKey(userId))
  removeStorageKey(getTaskBoardKey(userId))
  removeStorageKey(STORAGE_KEYS.session)
}

export function clearAllDayzeroStorage() {
  const keysToDelete = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key?.startsWith('dayzero.')) {
      keysToDelete.push(key)
    }
  }

  keysToDelete.forEach((key) => removeStorageKey(key))
}

export { STORAGE_KEYS }
