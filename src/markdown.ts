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
  note: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="currentColor"/></svg>',
  tip: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" fill="currentColor"/></svg>',
  important: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor"/></svg>',
  warning: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor"/></svg>',
  caution: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="currentColor"/></svg>',
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
