# Changelog

All notable changes to `@corefoundry-labs/forge-tokens`,
`@corefoundry-labs/forge-icons`, and `@corefoundry-labs/forge-ui` are documented
here. The three packages share one version. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-11-07

Every change is additive. Existing exports, props, roles, and appearance stay as
published in 1.1.0.

### Added

- `forge-tokens`: the `surfaceSunken` role, a surface darker than `background` in
  dark and high contrast and slightly below it in light, for work areas such as
  canvases and media viewers. `onSurface`, `outline`, and `focusRing` keep their
  contrast against it, and `validateTheme` checks it.
- `forge-tokens`: V2 geometry for `kbd`, `toolbar`, `table`, and `statistic`.
- `forge-ui`: `KbdV2`, a keyboard key for shortcut hints.
- `forge-ui`: `ToggleButtonV2`, a button with an on/off state exposed as
  `aria-pressed`, controlled or uncontrolled.
- `forge-ui`: `ToolbarV2` and `ToolbarSeparatorV2`, a group of controls that is one
  tab stop with arrow-key, Home, and End navigation, horizontal or vertical.
- `forge-ui`: `TableV2`, a semantic data table with captions, row headers,
  column widths, density, an empty state, and a current row.
- `forge-ui`: `StatisticV2`, a number with its label, unit, and optional trend, in
  `plain`, `card`, and `trend` styles.
- `forge-icons`: `Pointer`, `Hand`, `ZoomIn`, `ZoomOut`, `BoxPlus`, `Tag`, `Undo`,
  and `Maximize`.

## [1.1.0] - 2026-11-05

Every change is additive, and V1 exports, props, and appearance
stay as published in 1.0.2. Consumers can adopt V2 one component at a time.

### Added

- `forge-tokens`: Theme Engine V2, available from
  `@corefoundry-labs/forge-tokens/theme-v2`, with `createTheme`, `applyTheme`,
  `validateTheme`, and `generateThemeCss`. It generates scoped `--cf-v2-*` color
  roles for the Forge, FormiAI, AutoFund, and Neutral presets in light, dark, and
  high contrast modes, with required contrast between roles.
- `forge-tokens`: interaction roles for hover and pressed states, status roles
  `onSuccess`, `onWarning`, and `onInfo`, and V2 component geometry.
- `forge-ui`: `ThemeScope`, for a local theme with no global changes.
- `forge-ui`: V2 actions and forms: `ButtonV2`, `TextInputV2`, `SelectV2`,
  `CheckboxV2`, and `SwitchV2`.
- `forge-ui`: V2 display: `CardV2`, `BadgeV2`, `TabsV2`, `AlertV2`, and
  `FeedbackStateV2`.
- `forge-ui`: V2 overlays: `DialogV2`, `TooltipV2`, `PopoverV2`, and
  `DropdownMenuV2`. They render in place on the browser top layer, so they inherit
  their `ThemeScope`.
- `forge-ui`: V2 feedback and identity: `ProgressV2`, `SkeletonV2`, `SnackbarV2`,
  `SnackbarStackV2`, `AvatarV2`, and `AvatarGroupV2`.
- Forced colors support across V2, for Windows High Contrast.
- `forge-tokens`: `scrim` and `shadow` roles, and a stricter high contrast mode, with
  7:1 text and 4.5:1 outlines enforced by `validateTheme`.
- `forge-tokens`: V2 follows the V1 `data-theme` attribute unless
  `data-cf-theme-mode` is set.
- A public compatibility gate against the npm 1.0.2 tarballs, and a certification
  of the V2 packages from packed tarballs in an external project, in Chromium,
  Firefox, and WebKit.

### Notes

- V2 semantic roles are public API. Component tokens and the `geometry` export are
  internal and can change in a minor release.
- V2 overlays and `SnackbarStackV2` need the Popover API: Chrome and Edge 114,
  Safari 17, or Firefox 125.
- `DropdownMenuV2`, `SnackbarV2`, `SnackbarStackV2`, `AvatarV2`, and
  `AvatarGroupV2` keep the `V2` suffix of the design system, although they have no
  V1 component with the same name. `PUBLIC_COMPATIBILITY.md` records this exception.

## [1.0.2] - 2026-10-24

### Changed

- First release published to npm under the `@corefoundry-labs` scope.

[Unreleased]: https://github.com/JoseAngelValadezBarajas/forge-org-packages/compare/packages-v1.2.0...HEAD
[1.2.0]: https://github.com/JoseAngelValadezBarajas/forge-org-packages/compare/packages-v1.1.0...packages-v1.2.0
[1.1.0]: https://github.com/JoseAngelValadezBarajas/forge-org-packages/compare/packages-v1.0.2...packages-v1.1.0
[1.0.2]: https://github.com/JoseAngelValadezBarajas/forge-org-packages/releases/tag/packages-v1.0.2
