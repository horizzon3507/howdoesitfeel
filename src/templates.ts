export const sampleReadme = `# howdoesitfeel

A local-first README studio that recreates the GitHub repository preview before you push.

## Workspace

Use the explorer to create folders, upload files and edit markdown locally. Everything is stored in your browser.

## Markdown support

| Feature | Status |
| --- | --- |
| GFM tables | Included |
| Task lists | Included |
| Raw editing | Included |

\`\`\`ts
export function feel() {
  return 'like GitHub, before GitHub'
}
\`\`\`
`

export function sampleWorkspaceFiles() {
  return {
    'README.md': sampleReadme,
    'docs/usage.md': '# Usage\n\nCreate, upload and edit files in the local explorer.\n',
  }
}
