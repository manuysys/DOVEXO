

\---

name: UI Toolchain

description: Use Rive, Storybook, Chromatic, Playwright and browser tools when designing, implementing, animating, testing or reviewing DOVEXO interfaces.

\---



\# DOVEXO UI Toolchain



You are responsible for implementing and verifying DOVEXO's web UI.



\## 1. Project rules



\- The repository is a monorepo.

\- The web application lives in `apps/web`.

\- Use pnpm 12.4.2. Never use npm or yarn for project dependencies.

\- Preserve the existing architecture, components, design tokens and conventions.

\- Never change production data or connect Storybook stories to production APIs.

\- Do not commit, push or deploy without explicit user approval.



\## 2. Rive



\- Check whether the `rive` CLI is available using `rive --version`.

\- Read the installed CLI help before using commands.

\- Use Rive CLI and Rive Markup Language (RML) to create or modify animations when appropriate.

\- Preview and verify generated assets before integrating them.

\- Keep editable Rive source files under `apps/web/rive-src/`.

\- Export application assets to `apps/web/public/rive/`.

\- Use the existing `@rive-app/react-webgl2` runtime to integrate animations into React.

\- Do not create decorative animations without a real UX purpose.

\- Never claim that an animation works without testing it.



\## 3. Storybook



\- Use the existing Storybook configuration in `apps/web/.storybook/`.

\- Stories belong under `apps/web/src/` and must match the configured stories glob.

\- Import real application components. Do not recreate their implementation just for Storybook.

\- Create stories for meaningful component states: default, loading, disabled, error, empty and interactive states as applicable.

\- Use isolated mock data and mock providers.

\- Never call production APIs from a Storybook story.

\- Run the dev server with `pnpm run storybook` from `apps/web`.

\- Use the Storybook MCP server when connected.

\- Use its documentation, development and testing tools to inspect components, preview stories and run story tests.

\- Run `pnpm run build-storybook` to verify production compilation.



\## 4. Chromatic



\- Use the Chromatic MCP server to inspect builds, snapshots, visual changes, broken stories and accessibility results.

\- The Chromatic MCP server is for querying and reviewing project data. It does not publish builds.

\- Publish through GitHub Actions by default.

\- For local publishing, use `pnpm exec chromatic` only when CHROMATIC\_PROJECT\_TOKEN is available in the environment.

\- Never print, expose, hardcode or commit project tokens.

\- Ask for approval before initiating an additional Chromatic build.

\- Review visual changes and distinguish intentional design changes from regressions.

\- Do not automatically accept or reject visual changes.



\## 5. Browser testing



\- Use Playwright to verify real browser behavior, navigation, forms, responsive layouts and interactions.

\- Use Chrome DevTools to inspect console errors, network requests and performance.

\- Use Storybook MCP for isolated component previews and story tests.

\- Fix detected problems and rerun the relevant checks.



\## 6. Standard workflow



For UI changes:



1\. Inspect the existing implementation and relevant components.

2\. Consult Context7 for current framework documentation when necessary.

3\. Implement the change using existing project conventions.

4\. Create or update relevant Storybook stories.

5\. Preview the stories and inspect the actual rendered result.

6\. Run story tests and applicable Vitest or Playwright checks.

7\. Run the Storybook production build.

8\. Inspect Chromatic results when a build is available.

9\. Summarize changes, verification results and unresolved issues.



Do not consider a visual task complete merely because the code compiles.



