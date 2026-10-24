# FORGE public UI packages

This repository publishes the reusable visual packages used by FORGE:

- `@forge-org/tokens` — semantic design tokens and CSS.
- `@forge-org/icons` — licensed, reusable SVG icon components.
- `@forge-org/ui` — accessible, domain-independent React components.

`@forge-org/api-client` is intentionally not present here. It remains a local,
private workspace in the FORGE application repository.

## Local development

Requirements: Node.js 24 and npm 11.

```powershell
Copy-Item .npmrc.example .npmrc.local
$env:NODE_AUTH_TOKEN = '<classic-token-with-read:packages>'
npm install
npm run quality
```

The checked-in `.npmrc` routes the `@forge-org` scope to GitHub Packages. The
token is supplied through the environment and must never be committed.

## Publishing

Publishing is explicit and allow-listed:

```powershell
$env:NODE_AUTH_TOKEN = '<classic-token-with-write:packages>'
npm run publish:packages
```

The publish script can publish only `@forge-org/tokens`, `@forge-org/icons`,
and `@forge-org/ui`; it has no path or manifest for an API client.
