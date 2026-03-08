import {
  getInternProfileKey,
  getRepoSimKey,
  getStorageJson,
  getTaskBoardKey,
  getWorkspaceKey,
  setStorageJson,
} from './storage'

function nowIso() {
  return new Date().toISOString()
}

async function loadCareerTrackContent() {
  const response = await fetch('/mock/career-track-content.json')
  return response.json()
}

async function loadReviewScenarios() {
  const response = await fetch('/mock/review-scenarios.json')
  return response.json()
}

function getUserProfile(userId) {
  return getStorageJson(getInternProfileKey(userId), null)
}

function resolvePrimaryTrack(userProfile) {
  if (userProfile?.primaryTrack) {
    return userProfile.primaryTrack
  }

  if (Array.isArray(userProfile?.careerInterests) && userProfile.careerInterests.length > 0) {
    return userProfile.careerInterests[0]
  }

  return 'Backend Engineering'
}

function buildDefaultTaskBoard(tasks = []) {
  const weekOneTasks = tasks.filter((task) => task.week === 1)
  const firstWeekTask = weekOneTasks[0]

  const items = tasks.map((task) => {
    let status = 'backlog'

    if (task.week === 1) {
      status = task.taskId === firstWeekTask?.taskId ? 'in-progress' : 'this-week'
    }

    return {
      id: task.taskId,
      title: task.title,
      week: task.week,
      status,
    }
  })

  return {
    items,
    updatedAt: nowIso(),
  }
}

async function getTrackContentForUser(userId) {
  const profile = getUserProfile(userId)
  const primaryTrack = resolvePrimaryTrack(profile)
  const tracks = await loadCareerTrackContent()
  const selectedTrack = tracks.find((track) => track.focusArea === primaryTrack) ?? tracks[0]

  return {
    profile,
    primaryTrack,
    selectedTrack,
  }
}

export async function getAssignedTasks(userId) {
  const { selectedTrack } = await getTrackContentForUser(userId)
  return selectedTrack?.tasks ?? []
}

export async function getWeeklyTaskView(userId, week = 1) {
  const tasks = await getAssignedTasks(userId)
  const weekTasks = tasks.filter((task) => task.week === week)
  const todayTask = weekTasks[0] ?? null

  return {
    todayTask,
    weekTasks,
  }
}

export async function getTaskBoard(userId) {
  const storedBoard = getStorageJson(getTaskBoardKey(userId), null)
  if (storedBoard?.items?.length) {
    return storedBoard
  }

  const tasks = await getAssignedTasks(userId)
  const board = buildDefaultTaskBoard(tasks)
  setStorageJson(getTaskBoardKey(userId), board)
  return board
}

export function saveTaskBoard(userId, board) {
  setStorageJson(getTaskBoardKey(userId), {
    ...board,
    updatedAt: nowIso(),
  })
}

export function getWorkspace(userId) {
  return getStorageJson(getWorkspaceKey(userId), {
    userId,
    activeTaskId: null,
    notes: '',
    lastReview: null,
    updatedAt: nowIso(),
  })
}

export function saveWorkspace(userId, workspace) {
  setStorageJson(getWorkspaceKey(userId), {
    ...workspace,
    userId,
    updatedAt: nowIso(),
  })
}

export function getRepoState(userId) {
  return getStorageJson(getRepoSimKey(userId), {
    userId,
    files: {},
    commits: [],
    pullRequests: [],
    track: null,
    initializedAt: nowIso(),
  })
}

export function saveRepoState(userId, repoState) {
  setStorageJson(getRepoSimKey(userId), {
    ...repoState,
    userId,
  })
}

export async function ensureRepoForCareerTrack(userId) {
  const { selectedTrack } = await getTrackContentForUser(userId)
  const repo = getRepoState(userId)

  if (!selectedTrack) {
    return repo
  }

  if (repo.track === selectedTrack.focusArea && Object.keys(repo.files).length > 0) {
    return repo
  }

  const nextRepo = {
    ...repo,
    track: selectedTrack.focusArea,
    files: {
      ...selectedTrack.repoFiles,
    },
    commits: repo.track === selectedTrack.focusArea ? repo.commits : [],
    pullRequests: repo.track === selectedTrack.focusArea ? repo.pullRequests : [],
    initializedAt: repo.initializedAt || nowIso(),
  }

  saveRepoState(userId, nextRepo)
  return nextRepo
}

export function upsertTaskFile(userId, fileName, content) {
  const repo = getRepoState(userId)
  const updatedRepo = {
    ...repo,
    files: {
      ...repo.files,
      [fileName]: content,
    },
  }

  saveRepoState(userId, updatedRepo)
  return updatedRepo
}

export function commitAndPush(userId, message, changedFile) {
  const repo = getRepoState(userId)
  const commit = {
    id: `c-${Date.now()}`,
    message,
    changedFile,
    createdAt: nowIso(),
  }

  const updatedRepo = {
    ...repo,
    commits: [commit, ...repo.commits],
  }

  saveRepoState(userId, updatedRepo)
  return commit
}

function codeMatchesRule(code, matchRule = {}) {
  const includesAll = matchRule.includesAll ?? []
  const includesAny = matchRule.includesAny ?? []
  const excludes = matchRule.excludes ?? []

  const hasAll = includesAll.every((token) => code.includes(token))
  const hasAny = includesAny.length === 0 || includesAny.some((token) => code.includes(token))
  const hasExcluded = excludes.some((token) => code.includes(token))

  return hasAll && hasAny && !hasExcluded
}

async function reviewCode(code) {
  const scenarios = await loadReviewScenarios()
  const matched = scenarios.find((scenario) => codeMatchesRule(code, scenario.match))
  return matched ?? scenarios[scenarios.length - 1]
}

export async function submitPullRequest(userId, taskId, fileName, code) {
  const review = await reviewCode(code)
  const repo = getRepoState(userId)

  const pullRequest = {
    id: `pr-${Date.now()}`,
    taskId,
    fileName,
    status: review.status,
    feedback: review.feedback,
    hints: review.hints,
    createdAt: nowIso(),
  }

  const updatedRepo = {
    ...repo,
    pullRequests: [pullRequest, ...repo.pullRequests],
  }

  saveRepoState(userId, updatedRepo)

  const workspace = getWorkspace(userId)
  saveWorkspace(userId, {
    ...workspace,
    activeTaskId: taskId,
    lastReview: pullRequest,
  })

  return pullRequest
}
