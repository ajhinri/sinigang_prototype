import { useEffect, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'

function AppHeader({ session, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const avatarInitial = (session?.name?.trim()?.charAt(0) || 'U').toUpperCase()

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img src="/assets/amdocs_logo.png" alt="Amdocs logo" className="app-header__logo" />
        <p className="app-header__title">DayZero</p>
      </div>

      <div className="app-header__actions">
        <div ref={dropdownRef} className="app-header__dropdown-wrap">
          <button
            type="button"
            className="app-header__avatar"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            {avatarInitial}
          </button>
          {dropdownOpen && (
            <div className="app-header__dropdown">
              <p className="app-header__dropdown-name">{session?.name}</p>
              <p className="app-header__dropdown-email">{session?.email}</p>
              <hr className="app-header__dropdown-divider" />
              <button type="button" className="app-header__dropdown-signout" onClick={onLogout}>
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader
