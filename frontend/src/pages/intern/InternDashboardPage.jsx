import { Navigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getInternProfileKey, getStorageJson } from '../../services/storage'
import { getAssignedTasks, getRepoState, getTaskBoard, getWeeklyTaskView } from '../../services/taskService'

function InternDashboardPage({ session }) {
  const profile = getStorageJson(getInternProfileKey(session.userId), null)
  const [taskView, setTaskView] = useState({ todayTask: null, weekTasks: [] })
  const [dashboardData, setDashboardData] = useState({ tasks: [], board: null, repo: null })

  const interests = profile?.careerInterests ?? []
  const plan = profile?.generatedPlan

  useEffect(() => {
    async function hydrateDashboard() {
      const [nextView, tasks, board] = await Promise.all([
        getWeeklyTaskView(session.userId, 1),
        getAssignedTasks(session.userId),
        getTaskBoard(session.userId),
      ])
      const repo = getRepoState(session.userId)

      setTaskView(nextView)
      setDashboardData({ tasks, board, repo })
    }

    hydrateDashboard()
  }, [session.userId])

  if (interests.length === 0) {
    return <Navigate to="/intern/career-selection" replace />
  }

  if (!plan) {
    return <Navigate to="/intern/training-plan" replace />
  }

  const { todayTask, weekTasks } = taskView
  const { tasks, board, repo } = dashboardData

  const todoItems = useMemo(() => board?.items ?? [], [board])
  const commits = useMemo(() => repo?.commits ?? [], [repo])
  const highlightTask = todoItems[0]

  const reviewCount = repo?.pullRequests?.length ?? 0
  const commitCount = commits.length

  const statusLabels = {
    backlog: 'Backlog',
    'this-week': 'This Week',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
  }

  const formatCommitHash = (id) => {
    if (!id) {
      return '-----'
    }

    const numeric = Number.parseInt(String(id).replace('c-', ''), 10)
    if (Number.isNaN(numeric)) {
      return String(id).slice(0, 7).toUpperCase()
    }

    return numeric.toString(36).slice(-6).toUpperCase()
  }

  return (
    <main className="page-shell">
      <section className="surface surface--full dashboard-home">
        <div className="dashboard-hero">
          <div className="dashboard-hero__left">
            <div className="dashboard-hero__identity">
              <div className="dashboard-hero__avatar">
                {(session.name?.trim()?.charAt(0) || 'U').toUpperCase()}
              </div>
              <div>
                <p className="dashboard-hero__eyebrow">Today's highlights</p>
                <h1>Hi, {session.name}</h1>
              </div>
            </div>
            <div className="dashboard-welcome-banner">
              <p className="dashboard-welcome-banner__title">Welcome to the home page.</p>
              <p className="dashboard-welcome-banner__body">
                Here's an overview of your DayZero training progress — your tasks, commits, and weekly highlights are all in one place.
              </p>
            </div>
          </div>
          <div className="dashboard-hero__card">
            <p className="metric-card__label">Focus right now</p>
            <p className="dashboard-hero__value">
              {highlightTask ? highlightTask.title : 'You are all caught up today.'}
            </p>
            {todayTask ? <p className="muted-text">Today: {todayTask.title}</p> : null}
          </div>
        </div>

        <div className="dashboard-stat-wrapper">
          <div className="dashboard-stat-grid">
            <article className="stat-card">
              <p className="metric-card__label">Number of Tasks</p>
              <p className="metric-card__value">{tasks.length}</p>
            </article>
            <article className="stat-card">
              <p className="metric-card__label">Current Week</p>
              <p className="metric-card__value">Week 1</p>
              <p className="muted-text">{weekTasks.length} tasks scheduled</p>
            </article>
            <article className="stat-card">
              <p className="metric-card__label">Code Reviews</p>
              <p className="metric-card__value">{reviewCount}</p>
            </article>
            <article className="stat-card">
              <p className="metric-card__label">Commits</p>
              <p className="metric-card__value">{commitCount}</p>
            </article>
          </div>
        </div>

        <div className="dashboard-columns">
          <section className="panel-card">
            <h2>Todo Items</h2>
            {todoItems.length ? (
              <ul className="todo-list">
                {todoItems.map((item) => (
                  <li key={item.id} className="todo-list__item">
                    <span className="todo-list__title">{item.title}</span>
                    <span className="todo-list__meta">{statusLabels[item.status] || 'Pending'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">Congrats, all your todo items are done.</p>
            )}
          </section>

          <section className="panel-card">
            <h2>Recent Commits</h2>
            {commits.length ? (
              <div className="commit-list">
                {commits.slice(0, 6).map((commit) => (
                  <div key={commit.id} className="commit-row">
                    <div>
                      <p className="repo-event-title">{commit.message}</p>
                      <p className="muted-text">{commit.changedFile || 'Updated files'}</p>
                    </div>
                    <span className="commit-hash">{formatCommitHash(commit.id)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-text">No commits yet. Push your first update to see it here.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default InternDashboardPage
