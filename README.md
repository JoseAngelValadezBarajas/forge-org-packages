# FORGE public packages

Reusable, domain-independent UI packages for FORGE and other React products.
The source lives in this personal GitHub repository and the published packages
live under the public `corefoundry-labs` npm organization.

Repository: <https://github.com/JoseAngelValadezBarajas/forge-org-packages>

## Packages

| Package | Purpose | Latest |
| --- | --- | --- |
| [`@corefoundry-labs/forge-tokens`](https://www.npmjs.com/package/@corefoundry-labs/forge-tokens) | Semantic design tokens, themes, and CSS variables. | `1.1.0` |
| [`@corefoundry-labs/forge-icons`](https://www.npmjs.com/package/@corefoundry-labs/forge-icons) | Typed, tree-shakeable React SVG icons. | `1.1.0` |
| [`@corefoundry-labs/forge-ui`](https://www.npmjs.com/package/@corefoundry-labs/forge-ui) | Accessible React controls and reusable surfaces. | `1.1.0` |



## Installation

```bash
npm install @corefoundry-labs/forge-tokens \
  @corefoundry-labs/forge-icons \
  @corefoundry-labs/forge-ui
```

Load the token and component styles once at the application entry point:

```ts
import '@corefoundry-labs/forge-tokens/tokens.css';
import '@corefoundry-labs/forge-ui/styles.css';
import { Button, Card } from '@corefoundry-labs/forge-ui';
import { Search } from '@corefoundry-labs/forge-icons';
```

`forge-ui` and `forge-icons` require React 19 as a peer dependency. The UI
package depends on matching versions of `forge-tokens` and `forge-icons`.

## Local development

Requirements: Node.js 24 and npm 11.

```bash
npm install
npm run quality
```

Useful commands:

```bash
npm run build          # build all package artifacts
npm test               # run package, type, and browser contract tests
npm run pack:check     # inspect publishable tarballs without publishing
```

Only compiled `dist` artifacts are included in the published packages.

The public V1 contract and compatibility gate are documented in
[`PUBLIC_COMPATIBILITY.md`](PUBLIC_COMPATIBILITY.md). Run
`npm run check:compatibility` to compare freshly packed candidate artifacts
with the integrity-pinned npm 1.0.2 tarballs and compile/run external consumers
against both.

The [dynamic theme engine V2](docs/design-system/theme-engine-v2.md) generates
scoped color tokens without changing the existing V1 theme. Run
`npm run playground:theme-v2` after building to explore the engine.

[`ButtonV2`](docs/design-system/button-v2.md), the
[V2 form controls](docs/design-system/form-controls-v2.md), the
[V2 display components](docs/design-system/display-components-v2.md), the
[V2 overlays](docs/design-system/overlays-v2.md), and the
[V2 feedback and identity components](docs/design-system/feedback-identity-v2.md)
are built on it.
Run `npm run playground:ui` to review components against the engine, and
`npm run check:v2-consumer` to certify the V2 packages from their packed
tarballs in an external React project. Set `V2_BROWSER` to `firefox` or `webkit`
to use another engine.

## Releases and publishing

Releases are driven from GitHub Actions using npm Trusted Publishing (OIDC);
no long-lived npm token is stored in the repository.

To publish a new version:

1. Update the three package versions and the UI package dependency versions.
2. Move the `Unreleased` notes in [`CHANGELOG.md`](CHANGELOG.md) under the new version.
3. Run `npm install`, `npm run quality`, and review the packed artifacts.
4. Commit the version change.
5. Create and push a matching tag, for example:

   ```bash
   git tag packages-v1.0.3
   git push origin packages-v1.0.3
   ```

The `packages-v*` workflow runs quality checks, publishes the three packages
to npm, and creates a GitHub Release with generated notes. The tag version
must match the package versions being released.

Previous releases are listed at:

<https://github.com/JoseAngelValadezBarajas/forge-org-packages/releases>

## License

Apache-2.0. See the package manifests for package-level metadata.
