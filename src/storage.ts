import localforage from 'localforage'
import { createDir, createFile } from './fsUtils'
import { sampleWorkspaceFiles } from './templates'
import type { Workspace, WorkspaceEntry } from './types'

const store = localforage.createInstance({
  name: 'renderme',
  storeName: 'workspace_entries',
})

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('renderme-workspace')
const entryKey = (path: string) => `entry:${encodeURIComponent(path)}`

type WorkspaceDiff = {
  upserts: WorkspaceEntry[]
  removals: string[]
}

export type WorkspaceSyncMessage =
  | { type: 'diff'; diff: WorkspaceDiff }
  | { type: 'reset'; workspace: Workspace }

let lastSaved: Workspace = {}
let writeChain: Promise<void> = Promise.resolve()

function cloneWorkspace(workspace: Workspace): Workspace {
  return Object.fromEntries(Object.entries(workspace).map(([path, entry]) => [path, { ...entry }]))
}

function sameEntry(a?: WorkspaceEntry, b?: WorkspaceEntry) {
  if (!a || !b) return a === b
  return a.type === b.type && a.content === b.content && a.data === b.data && a.mime === b.mime
}

function diffWorkspace(before: Workspace, after: Workspace): WorkspaceDiff {
  const upserts: WorkspaceEntry[] = []
  const removals: string[] = []
  for (const [path, entry] of Object.entries(after)) {
    if (!sameEntry(before[path], entry)) upserts.push({ ...entry })
  }
  for (const path of Object.keys(before)) {
    if (!(path in after)) removals.push(path)
  }
  return { upserts, removals }
}

export function makeSampleWorkspace(): Workspace {
  const workspace: Workspace = {}
  createDir(workspace, '.github/assets')
  createDir(workspace, '.github/ISSUE_TEMPLATE')
  createDir(workspace, 'docs')
  for (const [path, content] of Object.entries(sampleWorkspaceFiles())) {
    const mime = path.endsWith('.svg') ? 'image/svg+xml' : 'text/plain'
    createFile(workspace, path, content, mime)
  }
  return workspace
}

export async function loadWorkspace(): Promise<Workspace> {
  const workspace: Workspace = {}
  const keys = await store.keys()
  for (const key of keys) {
    if (!key.startsWith('entry:')) continue
    const entry = await store.getItem<WorkspaceEntry>(key)
    if (entry?.path) workspace[entry.path] = entry
  }
  if (Object.keys(workspace).length) {
    lastSaved = cloneWorkspace(workspace)
    return workspace
  }

  const sample = makeSampleWorkspace()
  lastSaved = {}
  saveWorkspace(sample)
  await flushWorkspaceWrites()
  return sample
}

export function saveWorkspace(workspace: Workspace) {
  const diff = diffWorkspace(lastSaved, workspace)
  if (!diff.upserts.length && !diff.removals.length) return
  for (const entry of diff.upserts) lastSaved[entry.path] = { ...entry }
  for (const path of diff.removals) delete lastSaved[path]
  channel?.postMessage({ type: 'diff', diff } satisfies WorkspaceSyncMessage)

  writeChain = writeChain.then(async () => {
    await Promise.all(diff.upserts.map((entry) => store.setItem(entryKey(entry.path), entry)))
    await Promise.all(diff.removals.map((path) => store.removeItem(entryKey(path))))
  }).catch((error) => {
    console.error('Failed to persist workspace', error)
  })
}

export function flushWorkspaceWrites() {
  return writeChain
}

export async function resetWorkspace() {
  const sample = makeSampleWorkspace()
  await store.clear()
  lastSaved = {}
  channel?.postMessage({ type: 'reset', workspace: sample } satisfies WorkspaceSyncMessage)
  saveWorkspace(sample)
  await flushWorkspaceWrites()
  return sample
}

export function subscribeWorkspace(listener: (message: WorkspaceSyncMessage) => void) {
  if (!channel) return () => {}
  const handler = (event: MessageEvent<WorkspaceSyncMessage>) => listener(event.data)
  channel.addEventListener('message', handler)
  return () => channel.removeEventListener('message', handler)
}
