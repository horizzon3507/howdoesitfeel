import { useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import {
  BookIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeIcon,
  DownloadIcon,
  EyeIcon,
  FileCodeIcon,
  FileDirectoryIcon,
  FileIcon,
  GearIcon,
  GitBranchIcon,
  GraphIcon,
  HistoryIcon,
  IssueOpenedIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  ProjectIcon,
  RepoForkedIcon,
  RepoIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  UploadIcon,
  GitPullRequestIcon,
  MoonIcon,
  SunIcon,
} from '@primer/octicons-react'
import markdownDarkUrl from 'github-markdown-css/github-markdown-dark.css?url'
import markdownLightUrl from 'github-markdown-css/github-markdown-light.css?url'
import './App.css'
import {
  buildTree,
  createDir,
  createFile,
  deletePath,
  dirname,
  fileCount,
  fromBase64,
  guessMime,
  isImage,
  isMarkdown,
  isProbablyText,
  joinPath,
  normalizePath,
  renamePath,
  toBase64,
  uniquePath,
} from './fsUtils'
import { renderMarkdown } from './markdown'
import { loadWorkspace, resetWorkspace, saveWorkspace, subscribeWorkspace } from './storage'
import {
  codeOfConductTemplate,
  contributingTemplate,
  issueTemplate,
  apacheLicense,
  pullRequestTemplate,
} from './templates'
import type { TreeNode, Workspace, WorkspaceEntry } from './types'

const templateFiles = [
  ['LICENSE', apacheLicense],
  ['CONTRIBUTING.md', contributingTemplate],
  ['CODE_OF_CONDUCT.md', codeOfConductTemplate],
  ['.github/pull_request_template.md', pullRequestTemplate],
  ['.github/ISSUE_TEMPLATE/bug_report.md', issueTemplate],
] as const

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function decodeTextBytes(bytes: Uint8Array) {
  try {
    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder('utf-16le', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '')
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return new TextDecoder('utf-16be', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '')
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '')
  } catch {
    return null
  }
}

async function entryFromFile(file: File, forcedPath?: string): Promise<WorkspaceEntry> {
  const path = normalizePath(forcedPath || file.webkitRelativePath || file.name)
  const mime = file.type || guessMime(path)
  const bytes = new Uint8Array(await file.arrayBuffer())
  const content = isProbablyText(path, mime) ? decodeTextBytes(bytes) : null
  return {
    path,
    type: 'file',
    content: content ?? undefined,
    data: toBase64(bytes),
    mime,
    updatedAt: Date.now(),
  }
}

async function entryFromZipItem(path: string, item: JSZip.JSZipObject): Promise<WorkspaceEntry> {
  const mime = guessMime(path)
  const bytes = await item.async('uint8array')
  const content = isProbablyText(path, mime) ? decodeTextBytes(bytes) : null
  return {
    path,
    type: 'file',
    content: content ?? undefined,
    data: toBase64(bytes),
    mime,
    updatedAt: Date.now(),
  }
}

function entryBytes(entry: WorkspaceEntry) {
  if (entry.data) return fromBase64(entry.data)
  return new TextEncoder().encode(entry.content ?? '')
}

type ThemeName = 'light' | 'dark'

function initialTheme(): ThemeName {
  const stored = window.localStorage.getItem('renderme-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState<ThemeName>(initialTheme)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [selectedPath, setSelectedPath] = useState('README.md')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['.github', '.github/assets', '.github/ISSUE_TEMPLATE', 'docs']))
  const [mode, setMode] = useState<'preview' | 'edit'>('preview')
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const zipInput = useRef<HTMLInputElement>(null)
  const workspaceRef = useRef<Workspace | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem('renderme-theme', theme)

    let link = document.getElementById('renderme-markdown-theme') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = 'renderme-markdown-theme'
      link.rel = 'stylesheet'
      document.head.append(link)
    }
    link.href = theme === 'dark' ? markdownDarkUrl : markdownLightUrl
  }, [theme])

  useEffect(() => {
    void loadWorkspace().then((loaded) => {
      workspaceRef.current = loaded
      setWorkspace(loaded)
    })
    return subscribeWorkspace((message) => {
      if (message.type === 'reset') {
        workspaceRef.current = message.workspace
        setWorkspace(message.workspace)
        return
      }
      setWorkspace((current) => {
        if (!current) return current
        const next = { ...current }
        for (const path of message.diff.removals) delete next[path]
        for (const entry of message.diff.upserts) next[entry.path] = { ...entry }
        workspaceRef.current = next
        return next
      })
    })
  }, [])

  const fallbackPath = workspace?.['README.md']?.type === 'file'
    ? 'README.md'
    : Object.values(workspace ?? {}).find((entry) => entry.type === 'file')?.path ?? 'README.md'
  const activePath = workspace?.[selectedPath]?.type === 'file' ? selectedPath : fallbackPath
  const selected = workspace?.[activePath]
  const tree = useMemo(() => buildTree(workspace ?? {}), [workspace])
  const count = useMemo(() => fileCount(workspace ?? {}), [workspace])

  const html = useMemo(() => {
    if (!workspace || !selected || selected.type !== 'file' || !isMarkdown(selected.path)) return ''
    return renderMarkdown(selected.content ?? '', selected.path, workspace)
  }, [workspace, selected])

  function mutate(mutator: (draft: Workspace) => void) {
    setWorkspace((current) => {
      if (!current) return current
      const draft = { ...current }
      mutator(draft)
      workspaceRef.current = draft
      saveWorkspace(draft)
      return draft
    })
  }

  function selectEntry(path: string) {
    setSelectedPath(path)
    setMode('preview')
  }

  function toggleDir(path: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function promptNewFile() {
    const suggested = selected?.type === 'dir' ? joinPath(selected.path, 'untitled.md') : joinPath(dirname(selectedPath), 'untitled.md')
    const input = window.prompt('Caminho do novo arquivo', suggested)
    if (!input) return
    mutate((draft) => {
      const path = uniquePath(draft, input)
      createFile(draft, path, isMarkdown(path) ? '# Novo arquivo\n' : '', guessMime(path))
      setSelectedPath(path)
      setMode('edit')
    })
  }

  function promptNewFolder() {
    const input = window.prompt('Caminho da nova pasta', '.github/assets')
    if (!input) return
    mutate((draft) => createDir(draft, input))
    const clean = normalizePath(input)
    setExpanded((current) => new Set(current).add(clean))
  }

  function promptRename(path: string) {
    const input = window.prompt('Novo caminho', path)
    if (!input || input === path) return
    mutate((draft) => {
      if (renamePath(draft, path, input)) {
        if (selectedPath === path || selectedPath.startsWith(`${path}/`)) {
          setSelectedPath(normalizePath(input) + selectedPath.slice(path.length))
        }
      }
    })
  }

  function removePath(path: string) {
    if (!window.confirm(`Excluir ${path}?`)) return
    mutate((draft) => deletePath(draft, path))
  }

  function addTemplate(path: string, content: string) {
    mutate((draft) => {
      const finalPath = draft[path] ? uniquePath(draft, path) : path
      createFile(draft, finalPath, content, guessMime(finalPath))
      setSelectedPath(finalPath)
      setMode('preview')
    })
  }

  function addCommunityFiles() {
    mutate((draft) => {
      for (const [path, content] of templateFiles) {
        if (!draft[path]) createFile(draft, path, content, guessMime(path))
      }
    })
  }

  async function importFiles(files: FileList | null) {
    if (!files?.length || !workspaceRef.current) return
    const entries = await Promise.all(Array.from(files).map((file) => entryFromFile(file)))
    const draft = { ...workspaceRef.current }
    let firstImported = ''
    for (const entry of entries) {
      const finalPath = uniquePath(draft, entry.path)
      const parent = dirname(finalPath)
      if (parent) createDir(draft, parent)
      draft[finalPath] = { ...entry, path: finalPath }
      if (!firstImported) firstImported = finalPath
    }
    workspaceRef.current = draft
    setWorkspace(draft)
    saveWorkspace(draft)
    if (firstImported) {
      setSelectedPath(firstImported)
      setMode('preview')
    }
  }

  async function importZip(file: File | undefined) {
    if (!file) return
    const zip = await JSZip.loadAsync(file)
    const entries: WorkspaceEntry[] = []
    for (const [path, item] of Object.entries(zip.files)) {
      const clean = normalizePath(path)
      if (!clean || clean.includes('__MACOSX')) continue
      if (item.dir) entries.push({ path: clean, type: 'dir', updatedAt: Date.now() })
      else entries.push(await entryFromZipItem(clean, item))
    }
    if (!workspaceRef.current) return

    const conflicts = entries.filter((entry) => entry.type === 'file' && workspaceRef.current?.[entry.path])
    const replaceExisting = conflicts.length > 0 && window.confirm(
      `O ZIP contém ${conflicts.length} arquivo(s) que já existem. OK substitui os locais; Cancelar importa com novos nomes.`,
    )
    const draft = { ...workspaceRef.current }
    const finalPaths = new Map<string, string>()
    for (const entry of entries) {
      if (entry.type === 'dir') {
        createDir(draft, entry.path)
        continue
      }
      let finalPath = entry.path
      if (draft[finalPath] && !replaceExisting) finalPath = uniquePath(draft, finalPath)
      const parent = dirname(finalPath)
      if (parent) createDir(draft, parent)
      draft[finalPath] = { ...entry, path: finalPath }
      finalPaths.set(entry.path, finalPath)
    }
    workspaceRef.current = draft
    setWorkspace(draft)
    saveWorkspace(draft)
    const readme = entries.find((entry) => /(^|\/)readme\.md$/i.test(entry.path))
    if (readme) {
      setSelectedPath(finalPaths.get(readme.path) ?? readme.path)
      setMode('preview')
    }
  }

  async function exportZip() {
    if (!workspace) return
    const zip = new JSZip()
    for (const entry of Object.values(workspace)) {
      if (entry.type === 'dir') zip.folder(entry.path)
      else if (entry.data) zip.file(entry.path, entry.data, { base64: true })
      else zip.file(entry.path, entry.content ?? '')
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'renderme-workspace.zip')
  }

  function handlePreviewClick(event: React.MouseEvent<HTMLElement>) {
    const anchor = (event.target as HTMLElement).closest('a[data-local-path]')
    if (!anchor) return
    event.preventDefault()
    const path = anchor.getAttribute('data-local-path')
    if (path) selectEntry(path)
  }

  function renderTree(nodes: TreeNode[], depth = 0) {
    return nodes.map((node) => {
      const open = expanded.has(node.path)
      const active = activePath === node.path
      return (
        <div key={node.path}>
          <div
            className={`tree-row ${active ? 'active' : ''}`}
            style={{ paddingInlineStart: 8 + depth * 14 }}
          >
            <button
              type="button"
              className="tree-main"
              role="treeitem"
              aria-selected={active}
              onClick={() => node.type === 'dir' ? toggleDir(node.path) : selectEntry(node.path)}
              aria-expanded={node.type === 'dir' ? open : undefined}
            >
              {node.type === 'dir' ? (
                open ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />
              ) : <span className="tree-spacer" />}
              {node.type === 'dir' ? <FileDirectoryIcon size={16} /> : isMarkdown(node.path) ? <FileCodeIcon size={16} /> : <FileIcon size={16} />}
              <span className="tree-name">{node.name}</span>
            </button>
            <span className="tree-actions">
              <button type="button" aria-label={`Renomear ${node.path}`} onClick={() => promptRename(node.path)}><PencilIcon size={13} /></button>
              <button type="button" aria-label={`Excluir ${node.path}`} onClick={() => removePath(node.path)}><TrashIcon size={13} /></button>
            </span>
          </div>
          {node.type === 'dir' && open ? renderTree(node.children, depth + 1) : null}
        </div>
      )
    })
  }

  if (!workspace) {
    return <div className="loading">Carregando workspace local…</div>
  }

  const lineCount = selected?.content?.split('\n').length ?? 0
  const bytes = selected?.type === 'file' ? entryBytes(selected).length : 0

  return (
    <div className="app-shell">
      <aside className="workspace-sidebar" aria-label="Explorador de arquivos local">
        <div className="brand-row">
          <div>
            <strong><img className="brand-logo" src={theme === 'dark' ? '/logo-dark.svg' : '/logo.svg'} alt="" /> renderme</strong>
            <span>workspace local</span>
          </div>
          <div className="brand-actions">
            <button
              type="button"
              className="theme-toggle"
              aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
            </button>
          </div>
        </div>

        <div className="side-actions">
          <button type="button" onClick={promptNewFile}><PlusIcon size={14} /> Novo arquivo</button>
          <button type="button" onClick={promptNewFolder}><FileDirectoryIcon size={14} /> Nova pasta</button>
          <button type="button" onClick={() => fileInput.current?.click()}><UploadIcon size={14} /> Upload arquivo</button>
          <button type="button" onClick={() => folderInput.current?.click()}><UploadIcon size={14} /> Upload pasta</button>
          <button type="button" onClick={() => zipInput.current?.click()}><BookIcon size={14} /> Importar ZIP</button>
          <button type="button" className="primary" onClick={exportZip}><DownloadIcon size={14} /> Exportar ZIP</button>
        </div>

        <details className="template-menu">
          <summary><PlusIcon size={14} /> Templates <ChevronDownIcon size={14} /></summary>
          <div>
            <button type="button" onClick={addCommunityFiles}>GitHub community files</button>
            {templateFiles.map(([path, content]) => (
              <button type="button" key={path} onClick={() => addTemplate(path, content)}>{path}</button>
            ))}
          </div>
        </details>

        <div className="tree" role="tree">
          {renderTree(tree)}
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={() => {
            if (window.confirm('Restaurar o exemplo e apagar o workspace atual?')) {
              void resetWorkspace().then((sample) => {
                workspaceRef.current = sample
                setWorkspace(sample)
                setSelectedPath('README.md')
                setMode('preview')
              })
            }
          }}
        >
          Restaurar exemplo
        </button>
      </aside>

      <main className="stage">
        <div className="github-frame">
          <section className="repo-hero">
            <div className="repo-title-row">
              <div className="repo-title">
                <RepoIcon size={16} />
                <a href="#owner">horizzon3507</a>
                <span>/</span>
                <a href="#repo" className="repo-name">renderme</a>
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
              <span><ShieldIcon size={16} /> Security and quality</span>
              <span><GraphIcon size={16} /> Insights</span>
              <span><GearIcon size={16} /> Settings</span>
            </nav>
          </section>

          <section className="repo-browser">
            <div className="repo-content">
              <div className="repo-main">
                <div className="browser-toolbar">
                  <button type="button" className="branch-button"><GitBranchIcon size={14} /> main <ChevronDownIcon size={14} /></button>
                  <span className="branch-meta"><GitBranchIcon size={13} /> <strong>1</strong> Branch</span>
                  <span className="branch-meta"><TagIcon size={13} /> <strong>0</strong> Tags</span>
                  <div className="browser-actions">
                    <label className="go-file"><span>Go to file</span><kbd>t</kbd></label>
                    <button type="button" className="green">Add file <ChevronDownIcon size={14} /></button>
                    <button type="button" className="green strong"><CodeIcon size={14} /> Code <ChevronDownIcon size={14} /></button>
                  </div>
                </div>

                <div className="file-table">
                  <div className="file-table-header">
                    <div className="committer"><span className="mini-avatar">H</span><strong>horizzon3507</strong><span>local preview</span></div>
                    <span className="commit-count"><HistoryIcon size={13} /> <strong>{count}</strong> Commits</span>
                  </div>
                  {tree.map((node) => (
                    <div className={`file-row ${activePath === node.path ? 'active' : ''}`} key={node.path}>
                      <button
                        type="button"
                        className="file-link"
                        onClick={() => node.type === 'dir' ? toggleDir(node.path) : selectEntry(node.path)}
                      >
                        {node.type === 'dir' ? <FileDirectoryIcon size={16} /> : isMarkdown(node.path) ? <FileCodeIcon size={16} /> : <FileIcon size={16} />}
                        <span>{node.name}</span>
                      </button>
                      <span className="commit-message">{node.type === 'dir' ? 'chore: update repository assets' : `docs: update ${node.name.toLowerCase()}`}</span>
                      <span className="file-age">now</span>
                    </div>
                  ))}
                </div>

                <article className="readme-card">
                  <header className="readme-header">
                    <nav className="readme-tabs" aria-label="Arquivos do repositório">
                      {[
                        ['README.md', 'README'],
                        ['CONTRIBUTING.md', 'Contributing'],
                        ['LICENSE', 'Apache-2.0 license'],
                        ['SECURITY.md', 'Security'],
                      ].filter(([path]) => workspace?.[path]).map(([path, label]) => (
                        <button type="button" className={activePath === path ? 'active' : ''} key={path} onClick={() => selectEntry(path)}>
                          {label}
                        </button>
                      ))}
                    </nav>
                    <span className="readme-meta">{lineCount} lines · {bytes} bytes</span>
                    {selected?.type === 'file' && selected.content !== undefined ? (
                      <div className="mode-switch" role="tablist" aria-label="Modo do arquivo">
                        <button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}>Preview</button>
                        <button type="button" className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>Edit</button>
                      </div>
                    ) : null}
                  </header>

                  {selected?.type !== 'file' ? (
                    <div className="empty-state">Selecione um arquivo no explorador.</div>
                  ) : mode === 'edit' && selected.content !== undefined ? (
                    <textarea
                      className="markdown-editor"
                      value={selected.content ?? ''}
                      spellCheck={false}
                      onChange={(event) => {
                        const value = event.target.value
                        mutate((draft) => {
                          if (draft[selected.path]) draft[selected.path] = { ...draft[selected.path], content: value, updatedAt: Date.now() }
                        })
                      }}
                    />
                  ) : isMarkdown(selected.path) ? (
                    <div
                      className="markdown-body"
                      onClick={handlePreviewClick}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  ) : isImage(selected.path) ? (
                    <div className="asset-preview">
                      <img src={selected.data ? `data:${selected.mime};base64,${selected.data}` : `data:${selected.mime};charset=utf-8,${encodeURIComponent(selected.content ?? '')}`} alt={selected.path} />
                    </div>
                  ) : (
                    <pre className="plain-file">{selected.content ?? 'Arquivo binário ou sem preview textual.'}</pre>
                  )}
                </article>
              </div>

              <aside className="about-panel">
                <h2>About</h2>
                <p>A local-first README studio that recreates the GitHub repository preview.</p>
                <div className="topic-row"><span>readme</span><span>markdown</span><span>github-preview</span></div>
                <div className="about-links">
                  <span><BookIcon size={14} /> Readme</span>
                  <span><ShieldIcon size={14} /> Apache-2.0 license</span>
                  <span><GraphIcon size={14} /> Activity</span>
                  <span><StarIcon size={14} /> 128 stars</span>
                  <span><EyeIcon size={14} /> 8 watching</span>
                  <span><RepoForkedIcon size={14} /> 12 forks</span>
                </div>
                <section>
                  <h3>Releases</h3>
                  <p>No releases published</p>
                </section>
                <section>
                  <h3>Packages</h3>
                  <p>No packages published</p>
                </section>
                <section>
                  <h3>Languages</h3>
                  <div className="language-bar"><span /></div>
                  <div className="language-row"><strong>Markdown</strong><span>100%</span></div>
                </section>
              </aside>
            </div>
          </section>
        </div>
      </main>

      <input ref={fileInput} type="file" multiple hidden onChange={(event) => { void importFiles(event.target.files); event.currentTarget.value = '' }} />
      <input ref={folderInput} type="file" multiple hidden {...{ webkitdirectory: '' }} onChange={(event) => { void importFiles(event.target.files); event.currentTarget.value = '' }} />
      <input ref={zipInput} type="file" accept=".zip" hidden onChange={(event) => { void importZip(event.target.files?.[0]); event.currentTarget.value = '' }} />
    </div>
  )
}

export default App
