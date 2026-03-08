import { NavLink } from 'react-router-dom'
import { LayoutGrid, FolderGit2, Code2, ListTodo, ChevronsLeft, ChevronsRight } from 'lucide-react'

function InternSidebar({ isCollapsed, onToggleCollapse }) {
  const links = [
    {
      to: '/intern/dashboard',
      label: 'DayZero Dashboard',
      icon: LayoutGrid,
    },
    {
      to: '/intern/tasks',
      label: 'Tasks',
      icon: ListTodo,
    },
    {
      to: '/intern/repository',
      label: 'Project Repository',
      icon: FolderGit2,
    },
    {
      to: '/intern/task-workspace',
      label: 'Simulated IDE',
      icon: Code2,
    },
  ]

  return (
    <aside className={`intern-sidebar ${isCollapsed ? 'intern-sidebar--collapsed' : ''}`}>
      <p className="intern-sidebar__section">Workspace</p>
      <nav className="intern-sidebar__nav">
        {links.map((entry) => {
          const Icon = entry.icon
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              className={({ isActive }) => `intern-sidebar__link ${isActive ? 'intern-sidebar__link--active' : ''}`}
            >
              <Icon size={16} />
              <span>{entry.label}</span>
            </NavLink>
          )
        })}
      </nav>
      <button
        type="button"
        className="intern-sidebar__collapse"
        onClick={() => onToggleCollapse(!isCollapsed)}
      >
        {isCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
      </button>
    </aside>
  )
}

export default InternSidebar
