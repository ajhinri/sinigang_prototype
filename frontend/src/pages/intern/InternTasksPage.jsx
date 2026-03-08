import { Navigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getInternProfileKey, getStorageJson } from '../../services/storage'
import { getTaskBoard } from '../../services/taskService'

const COLUMN_LABELS = {
  backlog: 'Backlogs',
  'this-week': 'This Week',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
}

function InternTasksPage({ session }) {
  const profile = getStorageJson(getInternProfileKey(session.userId), null)
  const [board, setBoard] = useState(null)

  const interests = profile?.careerInterests ?? []
  const plan = profile?.generatedPlan

  useEffect(() => {
    async function hydrateBoard() {
      const nextBoard = await getTaskBoard(session.userId)
      setBoard(nextBoard)
    }

    hydrateBoard()
  }, [session.userId])

  const columns = useMemo(() => {
    const base = Object.keys(COLUMN_LABELS).reduce((acc, key) => {
      acc[key] = []
      return acc
    }, {})

    if (!board?.items) {
      return base
    }

    return board.items.reduce((acc, item) => {
      acc[item.status] = [...(acc[item.status] ?? []), item]
      return acc
    }, base)
  }, [board])

  if (interests.length === 0) {
    return <Navigate to="/intern/career-selection" replace />
  }

  if (!plan) {
    return <Navigate to="/intern/training-plan" replace />
  }

  return (
    <main className="page-shell">
      <section className="surface surface--full">
        <div className="page-title-block">
          <h1>Tasks Board</h1>
          <p className="subtext">Track your DayZero work across backlog, active work, and review.</p>
        </div>

        <div className="kanban-grid">
          {Object.entries(COLUMN_LABELS).map(([key, label]) => (
            <section key={key} className="kanban-column">
              <header className="kanban-column__header">
                <h2>{label}</h2>
                <span className="kanban-column__count">{columns[key]?.length ?? 0}</span>
              </header>
              <div className="kanban-column__list">
                {columns[key]?.length ? (
                  columns[key].map((item) => (
                    <article key={item.id} className="kanban-card">
                      <p className="kanban-card__title">{item.title}</p>
                      <p className="kanban-card__meta">Week {item.week}</p>
                    </article>
                  ))
                ) : (
                  <p className="muted-text">No tasks here yet.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

export default InternTasksPage
