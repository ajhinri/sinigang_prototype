import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getInternProfileKey, getStorageJson } from '../../services/storage'
import {
  commitAndPush,
  ensureRepoForCareerTrack,
  getAssignedTasks,
  getRepoState,
  getWorkspace,
  saveWorkspace,
  submitPullRequest,
  upsertTaskFile,
} from '../../services/taskService'

const QUICK_PROMPTS = [
  'How do I use BillingDBConnector?',
  'Why was my PR rejected?',
  'Show me hints for this task',
]

function getMockResponse(prompt, activeTask, lastReview) {
  const lowerPrompt = prompt.toLowerCase()

  if (lowerPrompt.includes('billingdbconnector')) {
    return 'Use BillingDBConnector in the service layer and wrap initialization in try/catch. Avoid DriverManager in this workflow.'
  }

  if (lowerPrompt.includes('rejected') || lowerPrompt.includes('pr')) {
    if (lastReview?.status === 'changes_requested') {
      return `Your last review requested changes: ${lastReview.feedback}`
    }

    return 'If rejected, compare your code against acceptance criteria and hints before resubmitting.'
  }

  if (lowerPrompt.includes('hint')) {
    return activeTask?.hints?.join(' ') || 'No additional hints available for this task.'
  }

  return 'I can help with task hints, review feedback, and team standards. Try one of the quick prompts.'
}

function TaskWorkspacePage({ session }) {
  const profile = getStorageJson(getInternProfileKey(session.userId), null)
  const [tasks, setTasks] = useState([])
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [workspace, setWorkspaceState] = useState(() => getWorkspace(session.userId))
  const [repo, setRepo] = useState(() => getRepoState(session.userId))
  const [selectedFile, setSelectedFile] = useState('README.md')
  const [openTabs, setOpenTabs] = useState([])
  const [editorValue, setEditorValue] = useState('')
  const [commitMessage, setCommitMessage] = useState('Implement task requirements')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'seed',
      role: 'assistant',
      text: 'Unblock Me is online. Ask for hints or workflow guidance.',
    },
  ])
  const [isThinking, setIsThinking] = useState(false)

  const hasPlan = Boolean(profile?.generatedPlan)

  useEffect(() => {
    async function hydrateWorkspace() {
      const trackRepo = await ensureRepoForCareerTrack(session.userId)
      const loadedTasks = await getAssignedTasks(session.userId)

      setRepo(trackRepo)
      setTasks(loadedTasks)

      const nextTaskId = workspace.activeTaskId || loadedTasks[0]?.taskId || null
      setActiveTaskId(nextTaskId)

      const nextTask = loadedTasks.find((task) => task.taskId === nextTaskId) ?? loadedTasks[0]
      if (!nextTask) {
        return
      }

      const codeForTask = trackRepo.files[nextTask.starterFile] ?? nextTask.starterCode
      const updatedRepo = upsertTaskFile(session.userId, nextTask.starterFile, codeForTask)
      setRepo(updatedRepo)

      setSelectedFile(nextTask.starterFile)
      setOpenTabs([nextTask.starterFile])
      setEditorValue(codeForTask)

      const nextWorkspace = {
        ...workspace,
        activeTaskId: nextTask.taskId,
      }

      saveWorkspace(session.userId, nextWorkspace)
      setWorkspaceState(nextWorkspace)
    }

    hydrateWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.userId])

  const activeTask = useMemo(
    () => tasks.find((task) => task.taskId === activeTaskId) ?? null,
    [tasks, activeTaskId],
  )

  const explorerFiles = useMemo(() => Object.keys(repo.files), [repo.files])

  if (!hasPlan) {
    return <Navigate to="/intern/training-plan" replace />
  }

  const handleSelectTask = (taskId) => {
    setActiveTaskId(taskId)
    const task = tasks.find((item) => item.taskId === taskId)
    if (!task) {
      return
    }

    const nextCode = repo.files[task.starterFile] ?? task.starterCode
    const updatedRepo = upsertTaskFile(session.userId, task.starterFile, nextCode)
    setRepo(updatedRepo)

    setSelectedFile(task.starterFile)
    setOpenTabs((current) => (current.includes(task.starterFile) ? current : [...current, task.starterFile]))
    setEditorValue(nextCode)

    const nextWorkspace = {
      ...workspace,
      activeTaskId: taskId,
    }

    saveWorkspace(session.userId, nextWorkspace)
    setWorkspaceState(nextWorkspace)
  }

  const handleSelectFile = (fileName) => {
    setSelectedFile(fileName)
    setOpenTabs((current) => (current.includes(fileName) ? current : [...current, fileName]))
    setEditorValue(repo.files[fileName] ?? '')
  }

  const handleEditorChange = (nextCode) => {
    setEditorValue(nextCode)
    setNotice('')
    setError('')

    if (!selectedFile) {
      return
    }

    const updatedRepo = upsertTaskFile(session.userId, selectedFile, nextCode)
    setRepo(updatedRepo)
  }

  const handleCommit = () => {
    if (!selectedFile) {
      setError('Select a file before committing.')
      return
    }

    if (!commitMessage.trim()) {
      setError('Please add a commit message before pushing changes.')
      return
    }

    const commit = commitAndPush(session.userId, commitMessage, selectedFile)
    setRepo(getRepoState(session.userId))
    setNotice(`Committed as ${commit.id}. Ready to submit pull request.`)
    setError('')
  }

  const handleSubmitPr = async () => {
    if (!activeTask) {
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const latestRepo = getRepoState(session.userId)
      const taskCode = latestRepo.files[activeTask.starterFile] ?? ''

      const review = await submitPullRequest(
        session.userId,
        activeTask.taskId,
        activeTask.starterFile,
        taskCode,
      )

      setRepo(getRepoState(session.userId))
      setWorkspaceState(getWorkspace(session.userId))
      setNotice(review.status === 'approved' ? 'PR approved. Great work.' : 'Changes requested. Apply hints and resubmit.')
    } catch {
      setError('Unable to submit pull request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitChatPrompt = async (prompt) => {
    if (!prompt.trim()) {
      return
    }

    setChatMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', text: prompt }])
    setChatInput('')
    setIsThinking(true)

    await new Promise((resolve) => {
      setTimeout(resolve, 1200)
    })

    setChatMessages((current) => [
      ...current,
      {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: getMockResponse(prompt, activeTask, workspace.lastReview),
      },
    ])
    setIsThinking(false)
  }

  const handleChatSubmit = (event) => {
    event.preventDefault()
    submitChatPrompt(chatInput)
  }

  return (
    <main className="page-shell">
      <section className="surface surface--full ide-shell">
        <aside className="ide-panel ide-panel--explorer">
          <h2>Explorer</h2>
          <p className="muted-text">Project files and assigned tasks</p>

          <h3 className="minor-title">Assigned Tasks</h3>
          <div className="repo-file-list">
            {tasks.map((task) => (
              <button
                key={task.taskId}
                type="button"
                className={`repo-file-item ${task.taskId === activeTaskId ? 'repo-file-item--active' : ''}`}
                onClick={() => handleSelectTask(task.taskId)}
              >
                Day {task.day}: {task.title}
              </button>
            ))}
          </div>

          <h3 className="minor-title">Files</h3>
          <div className="repo-file-list">
            {explorerFiles.map((fileName) => (
              <button
                key={fileName}
                type="button"
                className={`repo-file-item ${selectedFile === fileName ? 'repo-file-item--active' : ''}`}
                onClick={() => handleSelectFile(fileName)}
              >
                {fileName}
              </button>
            ))}
          </div>

          <p className="subtle-link">
            Need context? <Link to="/intern/dashboard">Back to Dashboard</Link>
          </p>
        </aside>

        <div className="ide-panel ide-panel--editor">
          <div className="ide-tabs">
            {openTabs.map((tabName) => (
              <button
                key={tabName}
                type="button"
                className={`ide-tab ${tabName === selectedFile ? 'ide-tab--active' : ''}`}
                onClick={() => handleSelectFile(tabName)}
              >
                {tabName}
              </button>
            ))}
          </div>

          <div className="ide-task-strip">
            <p className="repo-event-title">{activeTask?.title ?? 'No active task selected'}</p>
            <p className="muted-text">Edit files, commit, then submit PR for review.</p>
          </div>

          <textarea className="code-editor" value={editorValue} onChange={(event) => handleEditorChange(event.target.value)} spellCheck={false} />

          <div className="commit-row">
            <input
              type="text"
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="Commit message"
            />
            <button type="button" className="button" onClick={handleCommit}>
              Commit and Push
            </button>
          </div>

          <div className="actions-row actions-row--spread">
            <p className="muted-text">Commits: {repo.commits.length} | PRs: {repo.pullRequests.length}</p>
            <button type="button" className="button" onClick={handleSubmitPr} disabled={isSubmitting}>
              {isSubmitting ? 'Reviewing...' : 'Submit Pull Request'}
            </button>
          </div>

          {notice ? <p className="notice-text">{notice}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}

          {workspace.lastReview ? (
            <section className={`review-box ${workspace.lastReview.status === 'approved' ? 'review-box--approved' : ''}`}>
              <h3 className="minor-title">Latest AI Review: {workspace.lastReview.status}</h3>
              <p>{workspace.lastReview.feedback}</p>
              {workspace.lastReview.hints.length > 0 ? (
                <ul className="plan-list">
                  {workspace.lastReview.hints.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="ide-panel ide-panel--chat">
          <h2>Unblock Me</h2>
          <p className="muted-text">Mock AI mentor with predefined responses.</p>

          <div className="chat-quick-actions">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="chip" onClick={() => submitChatPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-log">
            {chatMessages.map((message) => (
              <div key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
                {message.text}
              </div>
            ))}
            {isThinking ? <div className="chat-thinking">AI is thinking...</div> : null}
          </div>

          <form className="form-stack" onSubmit={handleChatSubmit}>
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask for a hint..."
            />
            <button type="submit" className="button" disabled={isThinking}>
              Send
            </button>
          </form>
        </aside>
      </section>
    </main>
  )
}

export default TaskWorkspacePage
