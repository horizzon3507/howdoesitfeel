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
  try {
    const decoded = decodeURIComponent(cleanSource)
    if (decoded.startsWith('/')) return normalizePath(decoded)
    return normalizePath(joinPath(dirname(currentPath), decoded))
  } catch {
    return null
  }
}

function githubSlug(text: string, seen: Map<string, number>) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\-\s]/gu, '')
    .replace(/\s+/g, '-')
  const count = seen.get(base) ?? 0
  seen.set(base, count + 1)
  return count ? `${base}-${count}` : base
}

function addHeadingIds(doc: Document) {
  const seen = new Map<string, number>()
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    heading.id = githubSlug(heading.textContent ?? '', seen)
  })
}

const alertIcons: Record<string, string> = {
  note: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="4.8" r="1" fill="currentColor"/></svg>',
  tip: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 9.8 6 14.5 8 9.8 10 8 14.5 6.2 10 1.5 8 6.2 6Z" fill="currentColor"/></svg>',
  important: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="8" cy="11.5" r="1" fill="currentColor"/></svg>',
  warning: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="12" r=".9" fill="currentColor"/></svg>',
  caution: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.8 15 14H1Z" fill="currentColor"/><path d="M8 6v4" stroke="var(--bgColor-default,#0d1117)" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="12" r=".9" fill="var(--bgColor-default,#0d1117)"/></svg>',
}

function renderAlerts(doc: Document) {
  doc.querySelectorAll('blockquote').forEach((blockquote) => {
    const first = blockquote.querySelector('p')
    if (!first) return
    const marker = first.innerHTML.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i)
    if (!marker) return
    const type = marker[1].toLowerCase()
    first.innerHTML = first.innerHTML.replace(marker[0], '')
    blockquote.classList.add('markdown-alert', `markdown-alert-${type}`)
    const title = doc.createElement('div')
    title.className = 'markdown-alert-title'
    title.innerHTML = `${alertIcons[type] ?? alertIcons.note}<span>${type[0].toUpperCase() + type.slice(1)}</span>`
    blockquote.prepend(title)
  })
}

export function renderMarkdown(markdown: string, currentPath: string, workspace: Workspace) {
  const raw = marked.parse(markdown, { async: false }) as string
  const doc = new DOMParser().parseFromString(raw, 'text/html')

  addHeadingIds(doc)
  renderAlerts(doc)

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
    } else if (/^(https?:|\/\/)/i.test(href)) {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noreferrer')
    }
  })

  return DOMPurify.sanitize(doc.body.innerHTML, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ['svg', 'circle', 'path', 'rect'],
    ADD_ATTR: ['target', 'data-local-path', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'cx', 'cy', 'r', 'd', 'x', 'y', 'width', 'height', 'rx', 'aria-hidden'],
  })
}
