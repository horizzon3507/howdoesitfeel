# Changelog

## v0.2.0 · 26/11/2026

Adds the ui-sdk foundation for the next component pass, project branding assets, editable repository identity, closer GitHub chrome parity, social previews and the Apache-2.0 license. This version was made for Web with a stable release channel on 26/11/2026 (v0.2.0).

We follow [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/). renderme is a single Web surface.

<details>
<summary>To see more about versioning, expand this.</summary>

Every version string starts with `v` (required), e.g. `v0.1.0-alpha`, `v0.1.0-stable`.

Here the installable surface is **Web** — the static app deployed to Cloudflare Workers. Other apps swap in their own names the same way — e.g. **CLI**, **Desktop**, **GNOME** — whatever they actually ship.

| Part | What you install | Example |
| --- | --- | --- |
| **Web** | the Cloudflare Workers site | `v0.1.0-alpha` |

With one surface there is no `m` in the tag and no per-surface sections — just the version notes.

Each release heading is the version and date (`## v0.1.0-alpha · 26/11/2026`); under it, a short summary ends with a plain sentence like: “This version was made for Web with an alpha release channel on 26/11/2026 (v0.1.0-alpha).”

### What the channel suffix means

| Suffix | In plain words |
| --- | --- |
| **-alpha** | Very early. Expect missing pieces and lots of bugs. |
| **-beta** | Mostly there, but still rough. Fine to try; not the “official” install. |
| **-stable** | Ready for daily use. This is what we put on GitHub Releases. |

We only call something **stable** when we mean it.

</details>

## v0.1.0-alpha · 26/11/2026

First browser-local cut of the GitHub README preview studio. This version was made for Web with an alpha release channel on 26/11/2026 (v0.1.0-alpha).

- GitHub-like repository chrome with topbar, repository tabs, file metadata and README card.
- GitHub-flavored markdown rendering with sanitized HTML and GitHub markdown typography.
- Local workspace explorer with folders, uploads, rename, delete and automatic IndexedDB persistence.
- Raw markdown editing with immediate preview for the selected file.
- Templates for `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and common `.github` files.
- ZIP import/export preserving nested folders, text files and binary image assets.
- Relative image resolution and local markdown-to-markdown navigation inside the preview.
- Static Cloudflare Workers deployment configuration and GitHub Actions workflow.
