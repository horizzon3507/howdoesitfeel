# renderme

A local-first README studio that recreates the GitHub repository preview before you push.

## Features

- GitHub-like repository chrome and markdown rendering
- File explorer with folders, uploads, rename and delete
- Relative image resolution for assets such as `.github/assets/preview.svg`
- LICENSE, CONTRIBUTING, CODE_OF_CONDUCT and `.github` templates
- ZIP import/export
- Browser-local persistence with IndexedDB
- Static Cloudflare Workers deployment

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run lint
```

## Deploy to Cloudflare Workers

```sh
npm run build
npx wrangler deploy
```

For CI, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the repository secrets.
