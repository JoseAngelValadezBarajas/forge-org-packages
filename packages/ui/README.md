# @corefoundry-labs/forge-ui

Reusable React components for Forge-compatible products. The package exposes compiled ESM and TypeScript declarations from `dist`, with `@corefoundry-labs/forge-tokens` as an explicit runtime style dependency and React as a peer dependency.

```tsx
import { Button, FormField, Input } from '@corefoundry-labs/forge-ui';

<FormField label="Workspace name" hint="Shown to collaborators">
  <Input />
</FormField>;
<Button>Save</Button>;
```

Build and test this package independently from the repository root with `npm run build --workspace=@corefoundry-labs/forge-ui` and `npm test --workspace=@corefoundry-labs/forge-ui`.

Consumers can import the safe aggregate stylesheet from `@corefoundry-labs/forge-ui/styles.css`. It contains
only package-global CSS and a layer declaration; component styles remain CSS Modules emitted
beside each compiled component, so selectors such as `.button` do not leak into the consumer's
global stylesheet. Bundlers must support CSS imports and CSS Modules (for example Vite, webpack,
or Next.js). The package's ESM entry is suitable for client bundlers; SSR applications should
use their bundler's CSS extraction/manifest mechanism and must not execute the ESM entry directly
in a CSS-unaware Node runtime.
