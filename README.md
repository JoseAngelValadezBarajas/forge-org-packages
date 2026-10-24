# FORGE public UI packages

This repository publishes the reusable visual packages used by FORGE to the
public npm organization `corefoundry-labs`:

- `@corefoundry-labs/forge-tokens` — semantic design tokens and CSS.
- `@corefoundry-labs/forge-icons` — licensed, reusable SVG icon components.
- `@corefoundry-labs/forge-ui` — accessible, domain-independent React components.


## Local development

Requirements: Node.js 24 and npm 11.

```powershell
npm install
npm run quality
```

The packages are public on npm, so consumers do not need a registry token.

## Publishing

Publishing is explicit and allow-listed:

Publishing is performed by GitHub Actions through npm Trusted Publishing (OIDC).
The workflow has no long-lived npm token or GitHub Packages credential.

The publish script can publish only `@corefoundry-labs/forge-tokens`,
`@corefoundry-labs/forge-icons`, and `@corefoundry-labs/forge-ui`; it has no
path or manifest for an API client.
