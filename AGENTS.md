# Vernacular AI — Coding Conventions

## Mobile-First Tailwind Styling

- **All styles are mobile-first.** Write base styles for the smallest viewport, then scale up with `sm:`, `md:`, `lg:` breakpoints.
- **Dark mode** is permanent (`<html class="dark">`). Use `bg-zinc-950`, `text-zinc-50`, and `surface-*`/`accent-*` custom palette.
- **Use `min-h-dvh`** instead of `min-h-screen` or `100vh`. Dynamic viewport units account for mobile browser chrome.
- **Safe-area insets**: Use `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]` for notch/home-bar safety.
- **No inline styles.** All styling must use Tailwind utility classes.
- **Tap targets** must be at least 44×44px (`min-w-11 min-h-11`).
- **Disable tap highlight**: Applied globally via `-webkit-tap-highlight-color: transparent`.

## Strict TypeScript

- **All props, state, and service return types** must be defined with `interface` (not `type` for object shapes).
- **No `any` type.** Use `unknown` and narrow with type guards when the type is truly unknown.
- **`strictNullChecks: true`** — always handle `null` and `undefined` cases.
- **Prefer `interface` over `type`** for object shapes. Use `type` only for unions, intersections, and mapped types.
- **All shared interfaces** live in `types/index.ts` and are imported via `@/types`.

## Next.js App Router Conventions

- **Only `app/` directory routing.** No `pages/` directory.
- **Client Components** must be explicitly marked with `'use client'` at the top of the file.
- **Server Components** are the default. Keep them server-side unless they need browser APIs, state, or effects.
- **Viewport config** uses the exported `viewport` object in `layout.tsx`, NOT `metadata.viewport`.
- **Manifest** uses `app/manifest.ts` (Next.js auto-links it). No manual `<link rel="manifest">`.
- **Path aliases**: Use `@/` prefix for imports (e.g., `@/components/Header`, `@/types`).

## Hardware API Patterns

- **Always check availability** of `navigator.mediaDevices` before calling `getUserMedia`.
- **Always call `track.stop()`** on all media tracks during cleanup to release hardware (microphone dot, camera indicator).
- **Dynamic MIME type detection** for MediaRecorder: check `MediaRecorder.isTypeSupported()` before setting mimeType.
- **Camera**: Use `facingMode: { ideal: 'environment' }` (not `exact`) to avoid `OverconstrainedError` on desktop.
- **Video elements**: Must include `playsInline`, `autoPlay`, and `muted` attributes for iOS Safari compatibility.
- **Secure context required**: `navigator.mediaDevices` is `undefined` over plaintext HTTP (except localhost).

## Testing Requirements

- **Every custom hook** in `hooks/` must have a corresponding test in `__tests__/`.
- **Every service** in `services/` must have a corresponding test in `__tests__/`.
- **Test framework**: Jest + React Testing Library + `@testing-library/jest-dom`.
- **Mock browser APIs** (getUserMedia, MediaRecorder) in tests — never rely on real hardware.
- **Run `npm test`** before considering any feature complete.

## File Organization

```
types/         → Shared TypeScript interfaces
services/      → Business logic, AI engine (no React imports)
hooks/         → Custom React hooks (browser APIs, state management)
contexts/      → React Context providers
components/    → Reusable UI components
app/           → Routes and layouts
lib/           → Utility functions, bridge emitters
__tests__/     → Unit and integration tests
```
