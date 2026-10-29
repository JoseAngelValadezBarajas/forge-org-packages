# Public Compatibility Contract

This document defines the public API contract for the three CoreFoundry Design
System packages published under `@corefoundry-labs`. It applies to package
exports, declarations, peer/runtime dependencies, styles, tokens, and themes.

## Versioning

- **PATCH** releases fix defects without removing or incompatibly changing a
  public API. They may add internal fixes that preserve documented behavior.
- **MINOR** releases may add components, props, types, exports, subpaths, CSS
  variables, token keys, and themes. Existing consumers must continue to work.
- **MAJOR** releases may introduce explicitly approved breaking changes only
  when accompanied by a migration path and release notes. A new npm major by
  itself does not authorize removing, renaming, replacing, or incompatibly
  changing a V1 component or other V1 public contract. V1 retirement requires
  a separate, explicit project decision and a documented migration plan.

## V1 and V2 coexistence

Every published V1 component remains independently available and functional.
An evolved implementation that needs incompatible props, behavior, or visual
semantics is introduced as a separate `NameV2` export. V1 and V2 can be imported
and rendered by the same application. Existing V1 exports are never silently
redirected to V2.

A component with no earlier public version uses its canonical name. Do not add a
`V2` suffix merely to make the inventory look complete. This ticket establishes
the policy only; it adds no V2 components.

## Public API compatibility

- Existing runtime exports, TypeScript exports, package roots, and documented
  `package.json` subpaths remain available with compatible types and behavior.
- Removing or renaming an export, narrowing an accepted prop/type, adding a
  required prop, changing a ref/native element contract, or changing a public
  subpath is incompatible.
- Additive optional props and exports are compatible when they preserve
  existing runtime behavior and do not introduce new required peer dependencies.
- Existing public aliases are compatibility contracts. Keep their names,
  targets, and types available alongside canonical exports.
- Peer dependency requirements and package runtime dependencies are checked as
  consumer-facing installation contracts.

## CSS, tokens, and themes

Published stylesheet subpaths, public CSS custom properties, token keys, and
theme names are APIs. Keep existing names and consumer-visible meaning stable.
Add new tokens or themes additively. Removing/renaming a token or theme, or
changing an established token's semantic meaning, requires the explicit
breaking-change process described above. Internal CSS Module class names are
not public exports unless a package explicitly documents them as such.

## Deprecation and retirement

Deprecation must be explicit in API documentation and release notes. It names
the affected API, recommended replacement, migration steps, and the release in
which deprecation begins. Deprecation does not remove or disable the API.
Retirement requires a separate project decision, a documented migration path,
and an explicitly reviewed release that implements that decision. A version
number alone is not approval to retire V1.

## Independent implementations and voluntary migration

Use the canonical unsuffixed name for a new component. Use a distinct `V2`
name only when an existing component needs an independent incompatible
implementation. Consumers can migrate voluntarily by importing V2 next to V1,
moving one usage at a time, reviewing changed props and visuals, and keeping
their V1 usages until they choose to replace them. Package releases do not
rewrite consumer imports or migrate applications automatically.

## Baseline and Compatibility Gate

[`tooling/compatibility/public-api-baseline-1.0.2.json`](tooling/compatibility/public-api-baseline-1.0.2.json)
pins the three published npm 1.0.2 tarballs by registry URL and SHA-512 SRI.
The gate verifies the tarball integrity before inspecting it, then derives
runtime/type exports, aliases, package export maps, dependency contracts, CSS
variables, and token values from the actual published files. This retains the
full 1.0.2 contract without maintaining a second hand-copied CSS/token catalog.

Run `npm run check:compatibility` to:

1. Build and pack the current workspaces without publishing.
2. Compare the candidate tarballs to the published artifacts and pinned public
   contract.
3. Install baseline and candidate tarballs into isolated temporary consumer
   projects outside the monorepo.
4. Type-check a V1 consumer that imports every recorded runtime/type export,
   package subpath, CSS entry, token JSON entry, and compatibility alias.
5. Check source-level type assignability from the published declarations to the
   candidate declarations, and run browser smoke coverage against each
   installed package set.
6. Remove the V1 `Input` alias in a temporary installed candidate and require
   the external consumer check to fail, proving the gate rejects a controlled
   incompatibility. The probe changes only its disposable temp install.

`npm run quality` includes the compatibility gate through the existing test
chain. The GitHub Quality workflow remains the single CI pipeline. This gate
does not publish packages or certify human-reviewed visual parity.
