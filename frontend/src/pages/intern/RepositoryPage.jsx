import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getInternProfileKey, getStorageJson } from '../../services/storage'
import { ensureRepoForCareerTrack, getRepoState } from '../../services/taskService'

function RepositoryPage({ session }) {
  const profile = getStorageJson(getInternProfileKey(session.userId), null)
  const [repo, setRepo] = useState(() => getRepoState(session.userId))
  const [selectedFile, setSelectedFile] = useState('README.md')

  const hasGeneratedPlan = Boolean(profile?.generatedPlan)

  useEffect(() => {
    async function hydrateRepo() {
      const ensuredRepo = await ensureRepoForCareerTrack(session.userId)
      setRepo(ensuredRepo)

      const firstFile = Object.keys(ensuredRepo.files)[0]
      if (firstFile) {
        setSelectedFile((current) => current || firstFile)
      }
    }

    hydrateRepo()
  }, [session.userId])

  const fileNames = useMemo(() => Object.keys(repo.files), [repo.files])
  const activeFile = fileNames.includes(selectedFile) ? selectedFile : fileNames[0]

  if (!hasGeneratedPlan) {
    return <Navigate to="/intern/training-plan" replace />
  }

  return (
    <main className="page-shell">
      <section className="surface surface--full">
        <div className="page-title-block">
          <h1>Project Repository</h1>
          <p className="subtext">Browse project files, review commit history, and inspect simulated pull request outcomes.</p>
        </div>

        <div className="repo-meta-strip">
          <p>
            <strong>Branch:</strong> main
          </p>
          <p>
            <strong>Track:</strong> {repo.track ?? profile.primaryTrack ?? 'N/A'}
          </p>
          <p>
            <strong>Files:</strong> {fileNames.length}
          </p>
          <p>
            <strong>Commits:</strong> {repo.commits.length}
          </p>
        </div>

        <div className="repo-layout">
          <div className="panel-card">
            <h2>Files</h2>
          <p className="muted-text">Track: {repo.track ?? profile.primaryTrack ?? 'N/A'}</p>

          <div className="repo-file-list">
            {fileNames.map((fileName) => (
              <button
                key={fileName}
                type="button"
                className={`repo-file-item ${activeFile === fileName ? 'repo-file-item--active' : ''}`}
                onClick={() => setSelectedFile(fileName)}
              >
                {fileName}
              </button>
            ))}
          </div>
        </div>

          <div className="panel-card panel-card--editor">
            <h2>File Preview</h2>
            <p className="muted-text">{activeFile}</p>
            <pre className="file-preview">{activeFile ? repo.files[activeFile] : 'No file selected.'}</pre>
          </div>

          <div className="panel-card">
            <h2>Commit History</h2>
            {repo.commits.length === 0 ? (
              <p className="muted-text">No commits yet.</p>
            ) : (
              <ul className="repo-event-list">
                {repo.commits.map((commit) => (
                  <li key={commit.id}>
                    <p className="repo-event-title">{commit.message}</p>
                    <p className="muted-text">
                      {commit.id} • {commit.changedFile}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="minor-title">Pull Requests</h2>
            {repo.pullRequests.length === 0 ? (
              <p className="muted-text">No pull requests yet.</p>
            ) : (
              <ul className="repo-event-list">
                {repo.pullRequests.map((pr) => (
                  <li key={pr.id}>
                    <p className="repo-event-title">
                      {pr.id} • {pr.status}
                    </p>
                    <p className="muted-text">{pr.feedback}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default RepositoryPage
