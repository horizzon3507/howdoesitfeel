export const sampleReadme = `# renderme

A local-first README studio that recreates the GitHub repository preview you know — right down to the repo chrome, markdown body and file context.

![Interface preview](.github/assets/preview.svg)

## Why

README files are rarely just markdown. They depend on relative images, docs links, badges, license files and the surrounding GitHub interface. **renderme** makes that final rendering feel immediate before anything leaves your machine.

## Features

- GitHub-like repository preview for markdown files
- Local file explorer with folders, uploads, rename and delete
- Relative image resolution for paths like \`.github/assets/preview.svg\`
- Templates for \`LICENSE\`, \`CONTRIBUTING.md\`, \`CODE_OF_CONDUCT.md\` and GitHub metadata
- ZIP export with the complete workspace
- No server, account or tracking — everything stays in your browser

## Quick start

1. Create or upload files in the explorer.
2. Select \`README.md\`.
3. Edit in the raw markdown tab or inspect the preview.
4. Export the workspace as a ZIP when it feels right.

> [!TIP]
> Try selecting **Templates → GitHub community files** to scaffold the files people expect in an open-source repository.

## Markdown support

| Feature | Status |
| --- | --- |
| GFM tables | Included |
| Task lists | Included |
| Alerts | Styled |
| Relative images | Resolved locally |
| Relative markdown links | Open in preview |

\`\`\`ts
export function feel() {
  return 'like GitHub, before GitHub'
}
\`\`\`

## License

MIT — edit the generated \`LICENSE\` file before publishing.
`

export const mitLicense = `MIT License

Copyright (c) ${new Date().getFullYear()} Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`

export const contributingTemplate = `# Contributing

Thanks for helping improve this project.

## Ground rules

- Keep changes focused and easy to review.
- Add tests or examples when behavior changes.
- Follow the existing code style before introducing a new one.
- Be kind in reviews, issues and discussions.

## Development

1. Fork and clone the repository.
2. Install dependencies.
3. Create a branch for your change.
4. Run the checks locally.
5. Open a pull request with context, screenshots and test evidence.

## Reporting bugs

Include the expected behavior, actual behavior, reproduction steps and relevant logs or screenshots.
`

export const codeOfConductTemplate = `# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment include:

- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback
- Accepting responsibility and apologizing to those affected by our mistakes
- Focusing on what is best for the overall community

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement. All complaints will be reviewed and investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.
`

export const pullRequestTemplate = `## Summary

<!-- What changed and why? -->

## Verification

<!-- Commands run, screenshots, or manual checks. -->

## Notes

<!-- Anything reviewers should know. -->
`

export const issueTemplate = `---
name: Bug report
about: Report something that is broken
title: ''
labels: bug
---

## Expected behavior

## Actual behavior

## Reproduction steps

1.
2.
3.

## Environment

- OS:
- Browser/runtime:
- Version:
`

export const previewSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520" fill="none">
  <rect width="1200" height="520" rx="28" fill="#0d1117"/>
  <rect x="48" y="48" width="1104" height="424" rx="18" fill="#ffffff"/>
  <rect x="48" y="48" width="1104" height="58" rx="18" fill="#f6f8fa"/>
  <circle cx="88" cy="77" r="8" fill="#ff5f57"/>
  <circle cx="112" cy="77" r="8" fill="#febc2e"/>
  <circle cx="136" cy="77" r="8" fill="#28c840"/>
  <rect x="184" y="66" width="260" height="22" rx="11" fill="#d1d9e0"/>
  <rect x="88" y="148" width="280" height="28" rx="6" fill="#1f2328" opacity=".9"/>
  <rect x="88" y="198" width="520" height="14" rx="7" fill="#59636e" opacity=".45"/>
  <rect x="88" y="228" width="610" height="14" rx="7" fill="#59636e" opacity=".32"/>
  <rect x="88" y="278" width="206" height="112" rx="12" fill="#ddf4ff"/>
  <rect x="318" y="278" width="206" height="112" rx="12" fill="#fff8c5"/>
  <rect x="548" y="278" width="206" height="112" rx="12" fill="#fbefff"/>
  <path d="M825 182l96 96-96 96-96-96 96-96z" fill="#0969da" opacity=".12"/>
  <path d="M825 216l62 62-62 62-62-62 62-62z" fill="#0969da"/>
</svg>
`

export function sampleWorkspaceFiles() {
  return {
    'README.md': sampleReadme,
    'LICENSE': mitLicense,
    'CONTRIBUTING.md': contributingTemplate,
    'CODE_OF_CONDUCT.md': codeOfConductTemplate,
    '.github/assets/preview.svg': previewSvg,
    '.github/pull_request_template.md': pullRequestTemplate,
    '.github/ISSUE_TEMPLATE/bug_report.md': issueTemplate,
    'docs/usage.md': '# Usage\n\nThis secondary markdown file proves relative navigation and nested folders.\n\nReturn to [README](../README.md).\n',
  }
}
