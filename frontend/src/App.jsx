import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Github, LogIn, LogOut, FileText, Folder, Loader, ArrowLeft, ChevronRight, X, Code
} from 'lucide-react';

import './App.css';

/* ============================================
   HamburgerMenu - animated hamburger/X icon
   ============================================ */
function HamburgerMenu({ open }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      className={`hamburger-menu${open ? ' open' : ''}`}
      style={{ transition: 'all 0.3s cubic-bezier(.4,0,.2,1)' }}
    >
      <rect
        x="4"
        y="13"
        width="20"
        height="2.5"
        rx="1.2"
        fill="currentColor"
        className="bar top"
      />
      <rect
        x="4"
        y="13"
        width="20"
        height="2.5"
        rx="1.2"
        fill="currentColor"
        className="bar middle"
      />
      <rect
        x="4"
        y="13"
        width="20"
        height="2.5"
        rx="1.2"
        fill="currentColor"
        className="bar bottom"
      />
    </svg>
  );
}

/* ============================================
   Helper visual components (kept tiny & reusable)
   ============================================ */
const Spinner = () => <Loader className="spin" size={18} />;

function IconBadge({ children }) {
  return <div className="icon-badge">{children}</div>;
}

/* ============================================
   App (top-level) - brand new shell & layout
   ============================================ */
export default function App() {
  const isLoggedIn = document.cookie.includes('isLoggedIn=true');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-root">
      <header className="app-topbar">
        <div className="topbar-left">
          <button
            className="icon-btn"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen(s => !s)}>
            <HamburgerMenu open={sidebarOpen} />
          </button>

          <div className="brand">
            <Github size={26} className="brand-icon" />
            <div className="brand-text">
              <div className="brand-title">OctoGen AI</div>
              <div className="brand-sub">Test-case & AI Assistant</div>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          {selectedRepo && <div className="repo-chip">{selectedRepo}</div>}
          <div className="top-actions">
            <button
              className="auth-btn"
              onClick={() => window.location.href = 'http://localhost:3000/api/auth/logout'}
              title="Logout"
            >
              <LogOut size={16} />
              <span className="auth-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-head">
            <div className="sidebar-title">Repositories</div>
            <div className="sidebar-sub">Connect to GitHub → Select repo</div>
          </div>

          <div className="sidebar-content">
            {/* RepoListView is kept but refactored visually */}
            <RepoListView onRepoSelect={(name) => setSelectedRepo(name)} />
          </div>

          <div className="sidebar-footer">
            <button
              onClick={() => window.location.href = 'http://localhost:3000/api/auth/github'}
              className="btn primary w-full"
            >
              <LogIn size={14} />
              Re-authenticate
            </button>
          </div>
        </aside>

        {/* Main content area */}
        <main className="app-main">
          {!isLoggedIn ? (
            <LoginView />
          ) : !selectedRepo ? (
            <WelcomePanel onOpenRepos={() => setSidebarOpen(true)} />
          ) : (
            <RepoWorkspace repoFullName={selectedRepo} onClose={() => setSelectedRepo(null)} />
          )}
        </main>
      </div>

      <footer className="app-footer">
        <div>© {new Date().getFullYear()} OctoGen AI • Built for devs</div>
      </footer>
    </div>
  );
}

/* ============================================
   Welcome Panel (shown when no repo selected)
   ============================================ */
function WelcomePanel({ onOpenRepos }) {
  return (
    <div className="welcome-panel glass">
      <div className="welcome-hero-anim">
        <div className="spark spark1"></div>
        <div className="spark spark2"></div>
        <div className="spark spark3"></div>
      </div>
      <div className="welcome-left">
        <div className="welcome-logo"><Github size={46} /></div>
        <h2 className="welcome-title">Welcome to OctoGen AI</h2>
        <p className="welcome-desc">
          Browse repositories, generate AI summaries and produce test code with one click.
          Select a repository from the left to get started.
        </p>

        <div className="welcome-cta">
          <button className="btn accent" onClick={onOpenRepos}>Open repositories</button>
          <a className="link" href="#how">How it works</a>
        </div>
      </div>

      <div className="welcome-right">
        <div className="spark-card">
          <h4>Quick tips</h4>
          <ul>
            <li>Pick files, then Generate Summaries.</li>
            <li>Click Code next to a summary to get tests.</li>
            <li>Works with private & public repos (via GitHub OAuth).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   RepoWorkspace: new "editor-like" UX
   - top: title & controls
   - center: resizable two-panel: file tree (left) + ai suggestions (right)
   ============================================ */
function RepoWorkspace({ repoFullName, onClose }) {
  // states used by FileExplorerView and preserved logic inside
  return (
    <div className="workspace">
      <div className="workspace-top glass">
        <div className="workspace-title">
          <button className="icon-btn" onClick={onClose}><ArrowLeft size={16} /></button>
          <div>
            <div className="repo-name">{repoFullName}</div>
            <div className="repo-meta">Repository explorer · AI assistant</div>
          </div>
        </div>

        <div className="workspace-actions">
          <button className="btn ghost" title="Refresh">Refresh</button>
          <button className="btn primary" title="Generate All">Generate All</button>
        </div>
      </div>

      <div className="workspace-body">
        <ResizablePanels
          left={
            <div className="panel-left">
              <FileExplorerView repoFullName={repoFullName} onBack={onClose} />
            </div>
          }
          right={
            <div className="panel-right">
              {/* The AI suggestions are rendered inside FileExplorerView in original code.
                  To keep original logic exactly intact (axios calls, summaries, code generation),
                  FileExplorerView will render both files and suggestions. The 'right' slot here remains for future expansion. */}
              <div className="panel-placeholder">
                <IconBadge><Code size={18} /></IconBadge>
                <div className="placeholder-text">AI suggestions will appear alongside files — pick files and generate summaries.</div>
              </div>
            </div>
          }
          initialWidth={420}
        />
      </div>
    </div>
  );
}

/* ============================================
   ResizablePanels - small utility to drag-resize left panel
   ============================================ */
function ResizablePanels({ left, right, initialWidth = 420 }) {
  const containerRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(initialWidth);
  const draggingRef = useRef(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      const min = 260, max = rect.width - 260;
      if (newWidth < min) newWidth = min;
      if (newWidth > max) newWidth = max;
      setLeftWidth(newWidth);
    };
    const onUp = () => draggingRef.current = false;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return (
    <div className="resizable-container" ref={containerRef}>
      <div className="left-pane" style={{ width: leftWidth }}>{left}</div>
      <div
        className="gutter"
        onMouseDown={() => draggingRef.current = true}
        title="Drag to resize"
      />
      <div className="right-pane">{right}</div>
    </div>
  );
}

/* ============================================
   LoginView (kept intact visually)
   ============================================ */
function LoginView() {
  return (
    <div className="login-wrap">
      <div className="login-card glass">
        <div className="login-top">
          <Github size={56} />
        </div>
        <h2>Sign in to OctoGen AI</h2>
        <p className="muted">Use GitHub to connect your repositories and enable AI features.</p>
        <div className="login-actions">
          <button
            className="btn primary"
            onClick={() => window.location.href = 'http://localhost:3000/api/auth/github'}
          >
            <LogIn size={16} /> Sign in with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   RepoListView - functional logic preserved (visual rewritten)
   ============================================ */
function RepoListView({ onRepoSelect }) {
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchRepos = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/github/repos', { withCredentials: true });
        if (!mounted) return;
        setRepos(res.data);
      } catch (err) {
        if (!mounted) return;
        setError('Failed to fetch repositories.');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };
    fetchRepos();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="repo-list">
      {isLoading && (
        <div className="repo-loading">
          {[...Array(6)].map((_, i) => <div key={i} className="repo-skeleton" />)}
        </div>
      )}

      {error && <div className="repo-error">{error}</div>}

      {!isLoading && !error && (
        <div className="repo-grid">
          {repos.map(repo => (
            <button
              key={repo.id}
              className="repo-card"
              onClick={() => onRepoSelect(repo.full_name)}
              title={repo.full_name}
            >
              <div className="repo-card-left">
                <div className="repo-name">{repo.name}</div>
                <div className="repo-sub">{repo.private ? 'Private' : 'Public'}</div>
              </div>
              <div className="repo-card-right">
                <div className="stars">{repo.stargazers_count || ''}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================
   FileExplorerView - your entire original logic preserved.
   I only updated markup classes and added small improvements
   so it integrates with the new layout and CSS.
   ============================================ */
function FileExplorerView({ repoFullName, onBack }) {
  const [path, setPath] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [summaries, setSummaries] = useState([]);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentSummary, setCurrentSummary] = useState('');

  const fetchFiles = useCallback(async (currentPath) => {
    setIsLoading(true);
    setError(null);
    const [owner, repo] = repoFullName.split('/');
    try {
      const response = await axios.get(
        `http://localhost:3000/api/github/repo-contents/${owner}/${repo}?path=${encodeURIComponent(currentPath)}`,
        { withCredentials: true }
      );
      const sortedFiles = response.data.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'dir' ? -1 : 1;
      });
      setFiles(sortedFiles);
    } catch (err) {
      setError('Failed to fetch files.');
    }
    setIsLoading(false);
  }, [repoFullName]);

  useEffect(() => {
    fetchFiles(path);
  }, [path, fetchFiles]);

  const handleFileClick = (file) => {
    if (file.type === 'dir') setPath(file.path);
  };

  const handleBreadcrumbClick = (index) => {
    const pathSegments = path.split('/').slice(0, index + 1);
    setPath(pathSegments.join('/'));
  };

  const handleFileSelect = (filePath) => {
    const newSelected = new Set(selectedFiles);
    newSelected.has(filePath) ? newSelected.delete(filePath) : newSelected.add(filePath);
    setSelectedFiles(newSelected);
  };

  const handleGenerateSummaries = async () => {
    setIsAiLoading(true);
    setError(null);
    setSummaries([]);
    try {
      const response = await axios.post('http://localhost:3000/api/ai/summarize', {
        repoFullName,
        filePaths: Array.from(selectedFiles)
      }, { withCredentials: true });
      setSummaries(response.data);
    } catch (err) {
      setError('Failed to generate summaries.');
    }
    setIsAiLoading(false);
  };

  const handleGenerateCode = async (filePath, summary) => {
    setIsAiLoading(true);
    setCurrentSummary(summary);
    setGeneratedCode(null);
    setError(null);
    const extension = filePath.split('.').pop();
    const language = { py: 'Python', js: 'JavaScript', jsx: 'React' }[extension] || 'code';
    try {
      const response = await axios.post('http://localhost:3000/api/ai/generate-code', {
        repoFullName, filePath, summary, language
      }, { withCredentials: true });
      setGeneratedCode(response.data.code);
    } catch (err) {
      setError('Failed to generate code.');
    }
    setIsAiLoading(false);
  };

  const Breadcrumbs = () => (
    <div className="breadcrumbs">
      <button onClick={() => setPath('')} className="crumb">root</button>
      {path.split('/').filter(Boolean).map((segment, index) => (
        <div key={index} className="crumb-seg">
          <ChevronRight size={14} />
          <button onClick={() => handleBreadcrumbClick(index)} className="crumb">{segment}</button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="explorer-root">
      <div className="explorer-header">
        <div className="explorer-left">
          <button className="icon-btn" onClick={onBack} title="Back"><ArrowLeft size={16} /></button>
          <h3 className="explorer-title">{repoFullName}</h3>
        </div>

        <div className="explorer-actions">
          <button className="btn ghost" onClick={() => fetchFiles(path)}>Refresh</button>
          <button className="btn primary" onClick={() => handleGenerateSummaries()} disabled={isAiLoading || selectedFiles.size === 0}>
            {isAiLoading ? <Spinner /> : 'Generate Summaries'}
          </button>
        </div>
      </div>

      <Breadcrumbs />

      {error && <div className="error-box">{error}</div>}

      <div className="explorer-grid">
        <div className="files-panel glass">
          <div className="panel-head">
            <h4>Files</h4>
            <div className="panel-sub">{files.length} items</div>
          </div>

          {isLoading ? (
            <div className="panel-body skeleton-list">
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
              <div className="skeleton-row" />
            </div>
          ) : (
            <div className="panel-body file-list">
              {files.map(file => (
                <label key={file.sha} className={`file-row ${file.type === 'dir' ? 'dir' : 'file'}`}>
                  <input
                    type="checkbox"
                    onChange={() => handleFileSelect(file.path)}
                    checked={selectedFiles.has(file.path)}
                    disabled={file.type !== 'file'}
                    aria-label={`Select ${file.name}`}
                  />
                  <div className="file-meta" onClick={() => handleFileClick(file)}>
                    {file.type === 'dir' ? <Folder size={16} /> : <FileText size={16} />}
                    <div className="file-name">{file.name}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="ai-panel glass">
          <div className="panel-head">
            <h4>AI Suggestions</h4>
            <div className="panel-sub">Summaries & generated code</div>
          </div>

          <div className="panel-body suggestions">
            {isAiLoading && summaries.length === 0 && (
              <div className="centered">
                <Spinner /> <div className="muted">Generating summaries…</div>
              </div>
            )}

            {!isAiLoading && summaries.length === 0 && (
              <div className="empty">
                <IconBadge><Code size={20} /></IconBadge>
                <div className="empty-title">No suggestions yet</div>
                <div className="muted">Select files and click "Generate Summaries".</div>
              </div>
            )}

            {summaries.length > 0 && (
              <div className="suggestion-list">
                {summaries.map(fileSummary => (
                  <div key={fileSummary.fileName} className="suggestion-card">
                    <div className="suggestion-header">
                      <div className="suggest-file">{fileSummary.fileName}</div>
                    </div>

                    <ul className="suggestions">
                      {fileSummary.summaries.map((summary, index) => (
                        <li key={index} className="suggestion-row">
                          <div className="suggest-text">{summary}</div>
                          <div className="suggest-actions">
                            <button
                              onClick={() => handleGenerateCode(fileSummary.fileName, summary)}
                              className="btn small"
                              disabled={isAiLoading && currentSummary !== summary}
                            >
                              {isAiLoading && currentSummary === summary ? <Spinner /> : 'Code'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {generatedCode && <CodeModal code={generatedCode} onClose={() => setGeneratedCode(null)} />}
    </div>
  );
}

/* ============================================
   CodeModal (unchanged logic, new styling)
   ============================================ */
function CodeModal({ code, onClose }) {
  // Remove triple backticks if present
  const cleaned = code.replace(/^```[a-zA-Z]*\n?|```$/gm, "");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h4>Generated Test Code</h4>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <pre className="code-block chatbot-code">
            {cleaned}
          </pre>
        </div>
      </div>
    </div>
  );
}
