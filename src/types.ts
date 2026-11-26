export type EntryType = 'file' | 'dir'

export interface WorkspaceEntry {
  path: string
  type: EntryType
  content?: string
  data?: string
  mime?: string
  updatedAt: number
}

export type Workspace = Record<string, WorkspaceEntry>

export interface TreeNode {
  name: string
  path: string
  type: EntryType
  children: TreeNode[]
}
