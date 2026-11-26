import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { Workspace } from './types'

marked.use({
  gfm: true,
  breaks: false,
})

export function renderMarkdown(markdown: string, currentPath?: string, workspace?: Workspace) {
  void currentPath
  void workspace
  const raw = marked.parse(markdown, { async: false }) as string
  const doc = new DOMParser().parseFromString(raw, 'text/html')

  doc.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    if (/^https?:/i.test(href)) {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noreferrer')
    }
  })

  return DOMPurify.sanitize(doc.body.innerHTML, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  })
}
