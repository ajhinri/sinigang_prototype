import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginWithSso } from '../../services/authService'
import { clearAllDayzeroStorage, clearUserDayzeroStorage } from '../../services/storage'

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetNotice, setResetNotice] = useState('')

  const resolveUserIdByEmail = async (typedEmail) => {
    const response = await fetch('/mock/users.json')
    const users = await response.json()
    const normalized = typedEmail.trim().toLowerCase()
    return users.find((entry) => entry.email.toLowerCase() === normalized)?.id ?? null
  }

  const handleResetCurrentUser = async () => {
    setResetNotice('')
    if (!email.trim()) {
      setResetNotice('Enter an email first to reset that test user.')
      return
    }

    const userId = await resolveUserIdByEmail(email)
    if (!userId) {
      setResetNotice('No matching test user found for that email.')
      return
    }

    clearUserDayzeroStorage(userId)
    setResetNotice(`Reset test data for ${email.trim().toLowerCase()}.`)
  }

  const handleResetAll = () => {
    clearAllDayzeroStorage()
    setResetNotice('All local DayZero test data has been reset.')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your company email.')
      return
    }

    try {
      setIsLoading(true)
      const { user, nextRoute } = await loginWithSso(email)
      onLogin(user)
      navigate(nextRoute, { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete SSO login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Amdocs Onboarding Platform</p>
        <h1>DayZero Sign In</h1>
        <p className="subtext">
          Sign in with your Amdocs account to access your training workspace and role dashboard.
        </p>

        <form onSubmit={handleSubmit} className="form-stack">
          <label htmlFor="email">Company Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="your.name@amdocs.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
          />

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Continue with SSO'}
          </button>
        </form>

        <div className="helper-box">
          <p>Test accounts:</p>
          <p>intern1@amdocs.com or manager1@amdocs.com</p>
        </div>

        <details className="reset-tools">
          <summary>Testing tools</summary>
          <div className="reset-tools__actions">
            <button type="button" className="button button--ghost" onClick={handleResetCurrentUser}>
              Reset current email
            </button>
            <button type="button" className="button button--ghost" onClick={handleResetAll}>
              Reset all local data
            </button>
          </div>
          {resetNotice ? <p className="muted-text">{resetNotice}</p> : null}
        </details>
      </section>
    </main>
  )
}

export default LoginPage
