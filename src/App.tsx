import { useMemo, useState } from 'react'
import {
  BellIcon,
  BookIcon,
  ChevronDownIcon,
  CodeIcon,
  EyeIcon,
  GraphIcon,
  IssueOpenedIcon,
  MarkGithubIcon,
  PlayIcon,
  ProjectIcon,
  RepoForkedIcon,
  RepoIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  ThreeBarsIcon,
  GitPullRequestIcon,
} from '@primer/octicons-react'
import 'github-markdown-css/github-markdown-light.css'
import './App.css'
import { renderMarkdown } from './markdown'

const sampleMarkdown = `# howdoesitfeel

A local-first README studio that recreates the GitHub repository preview before you push.

## Features

- GitHub-like repository chrome and markdown rendering
- Raw markdown editing beside an accurate preview
- Local-first workflow with no backend

> [!TIP]
> The final app resolves local assets, workspace files and ZIP exports.
`

function App() {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const [markdown, setMarkdown] = useState(sampleMarkdown)
  const html = useMemo(() => renderMarkdown(markdown), [markdown])

  return (
    <main className="stage">
      <div className="github-frame">
        <header className="github-topbar">
          <button type="button" className="icon-button" aria-label="Menu"><ThreeBarsIcon size={16} /></button>
          <MarkGithubIcon size={32} />
          <span className="topbar-repo">horizzon3507 / howdoesitfeel</span>
          <label className="topbar-search">
            <SearchIcon size={14} />
            <input aria-label="Pesquisar" placeholder="Type / to search" readOnly />
            <kbd>/</kbd>
          </label>
          <nav className="topbar-nav" aria-label="GitHub">
            <span>Pull requests</span><span>Issues</span><span>Codespaces</span><span>Marketplace</span><span>Explore</span>
          </nav>
          <BellIcon size={16} />
          <span className="avatar">H</span>
        </header>

        <section className="repo-hero">
          <div className="repo-title-row">
            <div className="repo-title">
              <RepoIcon size={16} />
              <a href="#owner">horizzon3507</a>
              <span>/</span>
              <a href="#repo" className="repo-name">howdoesitfeel</a>
              <span className="visibility">Public</span>
            </div>
            <div className="repo-actions">
              <button type="button"><EyeIcon size={16} /> Watch <strong>8</strong></button>
              <button type="button"><RepoForkedIcon size={16} /> Fork <strong>12</strong></button>
              <button type="button"><StarIcon size={16} /> Star <strong>128</strong></button>
            </div>
          </div>
          <nav className="repo-tabs" aria-label="Repository">
            <span className="active"><CodeIcon size={16} /> Code</span>
            <span><IssueOpenedIcon size={16} /> Issues <em>3</em></span>
            <span><GitPullRequestIcon size={16} /> Pull requests <em>1</em></span>
            <span><PlayIcon size={16} /> Actions</span>
            <span><ProjectIcon size={16} /> Projects</span>
            <span><BookIcon size={16} /> Wiki</span>
            <span><ShieldIcon size={16} /> Security</span>
            <span><GraphIcon size={16} /> Insights</span>
          </nav>
        </section>

        <section className="repo-browser">
          <div className="browser-toolbar">
            <button type="button" className="branch-button"><CodeIcon size={14} /> main <ChevronDownIcon size={14} /></button>
            <span className="file-count"><strong>1</strong> file</span>
            <div className="browser-actions">
              <button type="button" className="green">Add file <ChevronDownIcon size={14} /></button>
              <button type="button" className="green strong"><CodeIcon size={14} /> Code <ChevronDownIcon size={14} /></button>
            </div>
          </div>

          <article className="readme-card">
            <header className="readme-header">
              <span className="readme-title"><BookIcon size={16} /> README.md</span>
              <div className="mode-switch" role="tablist" aria-label="Modo do markdown">
                <button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>Preview</button>
                <button type="button" className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>Edit</button>
              </div>
            </header>
            {mode === 'edit' ? (
              <textarea
                className="markdown-editor"
                value={markdown}
                spellCheck={false}
                onChange={(event) => setMarkdown(event.target.value)}
              />
            ) : (
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </article>
        </section>
      </div>
    </main>
  )
}

export default App
