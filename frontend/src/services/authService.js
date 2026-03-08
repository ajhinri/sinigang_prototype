import {
  getInternProfileKey,
  getRepoSimKey,
  getStorageJson,
  getWorkspaceKey,
  setStorageJson,
} from './storage'

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function createEmptyInternProfile(user) {
  return {
    userId: user.id,
    name: user.name,
    teamId: user.teamId,
    careerInterests: [],
    planId: null,
    progress: {
      completedTaskIds: [],
      currentDay: 1,
    },
    createdAt: new Date().toISOString(),
  }
}

function createEmptyWorkspace(user) {
  return {
    userId: user.id,
    activeTaskId: null,
    notes: '',
    updatedAt: new Date().toISOString(),
  }
}

function createRepoSimulation(user) {
  return {
    userId: user.id,
    files: {
      'README.md': '# DayZero Sandbox\n\nThis local repo is initialized for training tasks.\n',
    },
    commits: [],
    pullRequests: [],
    initializedAt: new Date().toISOString(),
  }
}

function bootstrapInternData(user) {
  const profileKey = getInternProfileKey(user.id)
  const workspaceKey = getWorkspaceKey(user.id)
  const repoKey = getRepoSimKey(user.id)

  if (!getStorageJson(profileKey, null)) {
    setStorageJson(profileKey, createEmptyInternProfile(user))
  }

  if (!getStorageJson(workspaceKey, null)) {
    setStorageJson(workspaceKey, createEmptyWorkspace(user))
  }

  if (!getStorageJson(repoKey, null)) {
    setStorageJson(repoKey, createRepoSimulation(user))
  }
}

function shouldGoToCareerSelection(user) {
  const profile = getStorageJson(getInternProfileKey(user.id), null)
  if (!profile) {
    return true
  }

  return !Array.isArray(profile.careerInterests) || profile.careerInterests.length === 0
}

function shouldGoToTrainingPlan(user) {
  const profile = getStorageJson(getInternProfileKey(user.id), null)
  if (!profile) {
    return false
  }

  return Boolean(profile.careerInterests?.length) && !profile.generatedPlan
}

export async function loginWithSso(email) {
  await delay(1000)

  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail.endsWith('@amdocs.com')) {
    throw new Error('Please use your Amdocs company email.')
  }

  const usersResponse = await fetch('/mock/users.json')
  const users = await usersResponse.json()

  const user = users.find((entry) => entry.email.toLowerCase() === normalizedEmail)

  if (!user) {
    throw new Error('No account found in company directory.')
  }

  if (user.role === 'intern') {
    bootstrapInternData(user)
  }

  return {
    user,
    nextRoute:
      user.role === 'manager'
        ? '/admin/dashboard'
        : shouldGoToCareerSelection(user)
          ? '/intern/career-selection'
          : shouldGoToTrainingPlan(user)
            ? '/intern/training-plan'
            : '/intern/dashboard',
  }
}
