# UI readiness implementation plan

**Goal:** Make the existing UI package easier to adopt and review within a 30-minute implementation window.

**Architecture:** Add a declarative React ThemeScope adapter for the dynamic token contract. Preserve published V1 implementations and extend the independent FeedbackStateV2 contract. Use the existing Vite host and Quality pipeline.

**Constraints:** No new dependencies, release, merge, V1 redesign, or changes to unrelated repositories. Preserve existing local work. Finish before 03:34 UTC (November 4 in America/Mexico_City).

- [ ] Implement ThemeScope with SSR inline variables, nested scope isolation, native div props/ref, updates, and meaningful tests.
- [ ] Improve FeedbackStateV2 heading composition, ref forwarding, and valid ReactNode handling with focused regressions.
- [ ] Expand the UI host into a searchable component catalog with working examples and V1/V2 theme comparison.
- [ ] Document real consumption, add public TypeScript consumer checks, and connect them to existing Quality.
- [ ] Review changes, execute Quality and inspect desktop/mobile previews; report exact results and limitations.
