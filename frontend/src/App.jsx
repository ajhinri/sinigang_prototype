import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProtectedLayout from './layouts/ProtectedLayout'
import LoginPage from './pages/auth/LoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import CareerSelectionPage from './pages/intern/CareerSelectionPage'
import InternDashboardPage from './pages/intern/InternDashboardPage'
import InternTasksPage from './pages/intern/InternTasksPage'
import RepositoryPage from './pages/intern/RepositoryPage'
import TaskWorkspacePage from './pages/intern/TaskWorkspacePage'
import TrainingPlanPage from './pages/intern/TrainingPlanPage'
import { getInternProfileKey, getStorageJson } from './services/storage'
import { getSession, removeSession, setSession } from './store/sessionStore'

function App() {
  const [session, setActiveSession] = useState(() => getSession())

  const handleLogin = (user) => {
    const nextSession = setSession(user)
    setActiveSession(nextSession)
  }

  const handleLogout = () => {
    removeSession()
    setActiveSession(null)
  }

  const internProfile = session?.role === 'intern' ? getStorageJson(getInternProfileKey(session.userId), null) : null
  const hasCareerInterests = Array.isArray(internProfile?.careerInterests) && internProfile.careerInterests.length > 0
  const hasGeneratedPlan = Boolean(internProfile?.generatedPlan)

  const defaultAuthedRoute =
    session?.role === 'manager'
      ? '/admin/dashboard'
      : session?.role === 'intern'
        ? !hasCareerInterests
          ? '/intern/career-selection'
          : !hasGeneratedPlan
            ? '/intern/training-plan'
            : '/intern/dashboard'
        : '/login'

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to={defaultAuthedRoute} replace /> : <LoginPage onLogin={handleLogin} />}
        />

        <Route element={<ProtectedLayout session={session} role="intern" onLogout={handleLogout} />}>
          <Route path="/intern/career-selection" element={<CareerSelectionPage session={session} />} />
          <Route path="/intern/training-plan" element={<TrainingPlanPage session={session} />} />
          <Route path="/intern/dashboard" element={<InternDashboardPage session={session} />} />
          <Route path="/intern/tasks" element={<InternTasksPage session={session} />} />
          <Route path="/intern/repository" element={<RepositoryPage session={session} />} />
          <Route path="/intern/task-workspace" element={<TaskWorkspacePage session={session} />} />
        </Route>

        <Route element={<ProtectedLayout session={session} role="manager" onLogout={handleLogout} />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to={session ? defaultAuthedRoute : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
