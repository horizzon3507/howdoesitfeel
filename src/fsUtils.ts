import type { TreeNode, Workspace, WorkspaceEntry } from './types'

export const textExtensions = new Set([
  'md', 'markdown', 'txt', 'json', 'yml', 'yaml', 'toml', 'xml', 'svg', 'html', 'css', 'js', 'ts', 'tsx', 'jsx', 'gitignore', 'license', 'lock'
])

export function normalizePath(input: string) {
  const parts = input.replace(/\\/g, '/').split('/').filter(Boolean)
  const out: string[] = []
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

export function basename(path: string) {
  return path.split('/').pop() ?? path
}

export function dirname(path: string) {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

export function joinPath(base: string, child: string) {
  return normalizePath(base ? `${base}/${child}` : child)
}

export function isMarkdown(path: string) {
  return /\.(md|markdown)$/i.test(path)
}

export function isImage(path: string) {
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(path)
}

export function guessMime(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const types: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp', ico: 'image/x-icon',
    md: 'text/markdown', markdown: 'text/markdown', txt: 'text/plain', json: 'application/json', yml: 'text/yaml', yaml: 'text/yaml', css: 'text/css', html: 'text/html', js: 'text/javascript', ts: 'text/typescript', xml: 'text/xml',
  }
  return types[ext] ?? 'application/octet-stream'
}

export function isProbablyText(path: string, mime = '') {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return mime.startsWith('text/') || mime.includes('json') || textExtensions.has(ext) || !path.includes('.')
}

export function ensureDirEntries(workspace: Workspace, path: string) {
  const parts = normalizePath(path).split('/').filter(Boolean)
  let current = ''
  for (const part of parts) {
    current = current ? `${current}/${part}` : part
    if (!workspace[current]) {
      workspace[current] = { path: current, type: 'dir', updatedAt: Date.now() }
    }
  }
}

export function createFile(workspace: Workspace, path: string, content = '', mime = '') {
  const clean = normalizePath(path)
  const parent = dirname(clean)
  if (parent) ensureDirEntries(workspace, parent)
  workspace[clean] = { path: clean, type: 'file', content, mime, updatedAt: Date.now() }
}

export function createDir(workspace: Workspace, path: string) {
  const clean = normalizePath(path)
  if (clean) ensureDirEntries(workspace, clean)
}

export function deletePath(workspace: Workspace, path: string) {
  const prefix = `${path}/`
  for (const key of Object.keys(workspace)) {
    if (key === path || key.startsWith(prefix)) delete workspace[key]
  }
}

export function renamePath(workspace: Workspace, oldPath: string, newPath: string) {
  const cleanNew = normalizePath(newPath)
  if (!cleanNew || cleanNew === oldPath || workspace[cleanNew]) return false
  const moving = Object.values(workspace)
    .filter((entry) => entry.path === oldPath || entry.path.startsWith(`${oldPath}/`))
    .sort((a, b) => a.path.length - b.path.length)
  const copies: WorkspaceEntry[] = moving.map((entry) => ({
    ...entry,
    path: cleanNew + entry.path.slice(oldPath.length),
    updatedAt: Date.now(),
  }))
  deletePath(workspace, oldPath)
  const parent = dirname(cleanNew)
  if (parent) ensureDirEntries(workspace, parent)
  for (const entry of copies) workspace[entry.path] = entry
  return true
}

export function uniquePath(workspace: Workspace, desired: string) {
  const clean = normalizePath(desired)
  if (!workspace[clean]) return clean
  const dot = clean.lastIndexOf('.')
  const slash = clean.lastIndexOf('/')
  const hasExt = dot > slash
  const stem = hasExt ? clean.slice(0, dot) : clean
  const ext = hasExt ? clean.slice(dot) : ''
  let index = 2
  while (workspace[`${stem}-${index}${ext}`]) index += 1
  return `${stem}-${index}${ext}`
}

export function buildTree(workspace: Workspace): TreeNode[] {
  const roots: TreeNode[] = []
  const nodes = new Map<string, TreeNode>()
  const entries = Object.values(workspace).sort((a, b) => a.path.localeCompare(b.path))

  for (const entry of entries) {
    const node: TreeNode = {
      name: basename(entry.path),
      path: entry.path,
      type: entry.type,
      children: [],
    }
    nodes.set(entry.path, node)
    const parentPath = dirname(entry.path)
    const parent = nodes.get(parentPath)
    if (parent) parent.children.push(node)
    else if (!parentPath) roots.push(node)
  }

  const sortNodes = (items: TreeNode[]) => {
    items.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1)
    items.forEach((item) => sortNodes(item.children))
  }
  sortNodes(roots)
  return roots
}

export function fileCount(workspace: Workspace) {
  return Object.values(workspace).filter((entry) => entry.type === 'file').length
}

export function toBase64(bytes: Uint8Array) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function fromBase64(base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function entryDataUrl(entry: WorkspaceEntry) {
  const mime = entry.mime || 'application/octet-stream'
  if (entry.data) return `data:${mime};base64,${entry.data}`
  if (mime.includes('svg')) return `data:${mime};charset=utf-8,${encodeURIComponent(entry.content ?? '')}`
  return `data:${mime};charset=utf-8,${encodeURIComponent(entry.content ?? '')}`
}
