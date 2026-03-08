import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInternProfileKey, getStorageJson, setStorageJson } from '../../services/storage'

const CAREER_OPTIONS = [
  'Backend Engineering',
  'Frontend Development',
  'DevOps / CI/CD',
  'Cloud Infrastructure',
  'Data Engineering',
  'Artificial Intelligence / Machine Learning',
]

function CareerSelectionPage({ session }) {
  const navigate = useNavigate()
  const profileKey = getInternProfileKey(session.userId)
  const existingProfile = getStorageJson(profileKey, null)

  const [selected, setSelected] = useState(existingProfile?.careerInterests ?? [])
  const [notice, setNotice] = useState('')

  const toggleOption = (option) => {
    setNotice('')
    setSelected((current) =>
      current.includes(option) ? current.filter((value) => value !== option) : [...current, option],
    )
  }

  const saveSelection = () => {
    if (selected.length === 0) {
      setNotice('Please select at least one focus area to continue.')
      return
    }

    setStorageJson(profileKey, {
      ...existingProfile,
      careerInterests: selected,
      generatedPlan: null,
      planId: null,
      updatedAt: new Date().toISOString(),
    })

    setNotice('Interests saved. Redirecting to training plan...')
    setTimeout(() => {
      navigate('/intern/training-plan')
    }, 350)
  }

  return (
    <main className="page-shell">
      <section className="surface">
        <h1>Career Path Selection</h1>
        <p className="subtext">Select one or more focus areas to personalize your DayZero training plan.</p>

        <div className="chip-grid">
          {CAREER_OPTIONS.map((option) => {
            const isActive = selected.includes(option)
            return (
              <button
                key={option}
                type="button"
                className={`chip ${isActive ? 'chip--active' : ''}`}
                onClick={() => toggleOption(option)}
              >
                {option}
              </button>
            )
          })}
        </div>

        {notice ? <p className="notice-text">{notice}</p> : null}

        <div className="actions-row">
          <button type="button" className="button" onClick={saveSelection}>
            Save and Continue
          </button>
        </div>
      </section>
    </main>
  )
}

export default CareerSelectionPage
