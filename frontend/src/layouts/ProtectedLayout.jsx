import { Navigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import InternSidebar from '../components/InternSidebar'

function ProtectedLayout({ session, role, onLogout }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role && session.role !== role) {
    const fallback = session.role === 'manager' ? '/admin/dashboard' : '/intern/career-selection'
    return <Navigate to={fallback} replace />
  }

  if (role === 'intern') {
    return (
      <div className="app-shell">
        <AppHeader session={session} onLogout={onLogout} />
        <div className={`app-shell__body ${isSidebarCollapsed ? 'app-shell__body--collapsed' : ''}`}>
          <InternSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={setIsSidebarCollapsed} />
          <div className="app-shell__content">
            <Outlet />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-frame">
      <AppHeader session={session} onLogout={onLogout} />
      <Outlet />
    </div>
  )
}

export default ProtectedLayout
