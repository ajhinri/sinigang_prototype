import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getInternProfileKey, getStorageJson } from '../../services/storage'
import { ensureRepoForCareerTrack } from '../../services/taskService'
import { buildTrainingPlan, loadTrainingTemplates, savePlanToProfile } from '../../services/trainingService'

function TaskList({ title, tasks }) {
  return (
    <section className="plan-column">
      <h2>{title}</h2>
      <ul className="plan-list">
        {tasks.map((task, index) => (
          <li key={`${title}-${index}`}>{task}</li>
        ))}
      </ul>
    </section>
  )
}

function TrainingPlanPage({ session }) {
  const navigate = useNavigate()
  const profileKey = getInternProfileKey(session.userId)
  const [profile, setProfile] = useState(() => getStorageJson(profileKey, null))
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const interests = profile?.careerInterests ?? []

  useEffect(() => {
    setProfile(getStorageJson(profileKey, null))
  }, [profileKey])

  if (!profile || interests.length === 0) {
    return <Navigate to="/intern/career-selection" replace />
  }

  const handleGeneratePlan = async () => {
    try {
      setError('')
      setIsGenerating(true)
      const templates = await loadTrainingTemplates()
      const generatedPlan = buildTrainingPlan(templates, interests)
      const updatedProfile = savePlanToProfile(session.userId, generatedPlan)
      await ensureRepoForCareerTrack(session.userId)
      setProfile(updatedProfile)
    } catch {
      setError('Unable to generate training plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const plan = profile.generatedPlan

  return (
    <main className="page-shell">
      <section className="surface">
        <h1>Personal Training Plan</h1>
        <p className="subtext">Generated from your selected interests and team-focused DayZero templates.</p>

        <div className="tag-row">
          {interests.map((interest) => (
            <span key={interest} className="tag-pill">
              {interest}
            </span>
          ))}
        </div>

        {!plan ? (
          <div className="empty-state">
            <p>No plan generated yet.</p>
            <button type="button" className="button" onClick={handleGeneratePlan} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate 2-Week Plan'}
            </button>
          </div>
        ) : (
          <>
            <div className="plan-grid">
              <TaskList title="Week 1 - Core Technical Focus" tasks={plan.week1} />
              <TaskList title="Week 2 - Workflow Simulation" tasks={plan.week2} />
            </div>

            <div className="actions-row actions-row--spread">
              <p className="muted-text">Generated: {new Date(plan.generatedAt).toLocaleString()}</p>
              <button type="button" className="button" onClick={() => navigate('/intern/dashboard')}>
                Continue to DayZero Dashboard
              </button>
            </div>
          </>
        )}

        {error ? <p className="error-text">{error}</p> : null}

        <p className="subtle-link">
          Need to update your interests? <Link to="/intern/career-selection">Back to Career Selection</Link>
        </p>
      </section>
    </main>
  )
}

export default TrainingPlanPage
