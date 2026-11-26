import localforage from 'localforage'
import { createDir, createFile } from './fsUtils'
import { sampleWorkspaceFiles } from './templates'
import type { Workspace } from './types'

const store = localforage.createInstance({
  name: 'howdoesitfeel',
  storeName: 'workspace',
})

const key = 'workspace-v1'

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
  const existing = await store.getItem<Workspace>(key)
  if (existing && Object.keys(existing).length) return existing
  const sample = makeSampleWorkspace()
  await store.setItem(key, sample)
  return sample
}

let saveTimer: number | undefined
export function saveWorkspace(workspace: Workspace) {
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    void store.setItem(key, workspace)
  }, 180)
}

export async function resetWorkspace() {
  const sample = makeSampleWorkspace()
  await store.setItem(key, sample)
  return sample
}
