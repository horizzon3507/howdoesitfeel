import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { dirname, entryDataUrl, joinPath, normalizePath } from './fsUtils'
import type { Workspace } from './types'

marked.use({
  gfm: true,
  breaks: false,
})

function resolveRelative(source: string, currentPath: string) {
  if (/^(https?:|data:|mailto:|#|\/\/)/i.test(source)) return null
  const cleanSource = source.split('#')[0].split('?')[0]
  if (!cleanSource) return null
  return normalizePath(joinPath(dirname(currentPath), decodeURIComponent(cleanSource)))
}

export function renderMarkdown(markdown: string, currentPath: string, workspace: Workspace) {
  const raw = marked.parse(markdown, { async: false }) as string
  const doc = new DOMParser().parseFromString(raw, 'text/html')

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? ''
    const resolved = resolveRelative(src, currentPath)
    if (resolved && workspace[resolved]) {
      img.setAttribute('src', entryDataUrl(workspace[resolved]))
    }
  })

  doc.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href') ?? ''
    const resolved = resolveRelative(href, currentPath)
    if (resolved && workspace[resolved]) {
      anchor.setAttribute('data-local-path', resolved)
      anchor.setAttribute('href', `#${resolved}`)
    } else if (/^https?:/i.test(href)) {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noreferrer')
    }
  })

  return DOMPurify.sanitize(doc.body.innerHTML, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'data-local-path'],
  })
}
