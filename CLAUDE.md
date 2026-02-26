# Superguide App

Web application for the Superguide project.

**Package**: `@sudobility/superguide_app` (private, BUSL-1.1)

## Tech Stack

- **Language**: TypeScript (strict mode, JSX)
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Framework**: React 19
- **Routing**: React Router v7
- **Build**: Vite 6
- **Styling**: Tailwind CSS 3
- **i18n**: i18next (16 languages, RTL support)
- **Auth**: Firebase Auth

## Project Structure

```
src/
├── main.tsx                              # App entry point
├── App.tsx                               # Router setup, lazy-loaded routes
├── i18n.ts                               # i18next configuration
├── config/
│   ├── constants.ts                      # App constants, supported languages
│   ├── auth-config.ts                    # Firebase auth configuration
│   └── initialize.ts                     # App initialization
├── context/
│   └── ThemeContext.tsx                   # Theme provider
├── components/
│   ├── ErrorBoundary.tsx                 # Error boundary with retry support
│   ├── layout/
│   │   ├── TopBar.tsx                    # Navigation bar
│   │   ├── Footer.tsx                    # Page footer
│   │   ├── ScreenContainer.tsx           # Page wrapper
│   │   ├── ProtectedRoute.tsx            # Auth guard
│   │   ├── LocalizedLink.tsx             # Language-aware links
│   │   └── LanguageRedirect.tsx          # Auto-redirect to lang prefix
│   └── providers/
│       └── AuthProviderWrapper.tsx       # Firebase auth provider
├── hooks/
│   ├── useLocalizedNavigate.ts           # Navigate with lang prefix
│   └── useDocumentLanguage.ts            # Set HTML lang attribute
├── utils/
│   └── formatDateTime.ts                 # Locale-aware date/time formatting
└── pages/
    ├── HomePage.tsx
    ├── LoginPage.tsx
    ├── HistoriesPage.tsx
    ├── HistoryDetailPage.tsx
    ├── SettingsPage.tsx
    ├── DocsPage.tsx
    └── SitemapPage.tsx
```

## Commands

```bash
bun run dev            # Vite dev server
bun run build          # TypeScript check + Vite build
bun run preview        # Preview production build
bun run typecheck      # TypeScript check
bun run lint           # Run ESLint
bun run format         # Format with Prettier
bun run verify         # Run typecheck + lint + format:check
```

## Routing

Language-prefixed routes: `/:lang/*` (e.g., `/en/histories`, `/ja/settings`).

16 supported languages: en, ar, de, es, fr, it, ja, ko, pt, ru, sv, th, uk, vi, zh, zh-hant.

Pages are lazy-loaded with React Suspense.

## Shared Components

Uses `@sudobility/building_blocks` for:
- TopBar, LoginPage, SettingsPage, SudobilityAppWithFirebaseAuth

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8022` |
| `VITE_FIREBASE_API_KEY` | Firebase API key | required |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | required |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | required |
| `VITE_APP_NAME` | Application name | `Superguide` |
| `VITE_APP_DOMAIN` | Application domain | `localhost` |

**Note**: The default API URL in constants is `http://localhost:8022`, matching the API server's default port.

## Related Projects

- **superguide_types** — Shared type definitions; imported transitively via superguide_client
- **superguide_client** — API client SDK with TanStack Query hooks; provides data fetching layer
- **superguide_lib** — Business logic library with `useHistoriesManager` hook; primary integration point for this app
- **superguide_api** — Backend server that this app communicates with (watch the port mismatch!)
- **superguide_app_rn** — React Native counterpart of this web app; shares superguide_client, superguide_lib, and superguide_types

Uses `@sudobility/building_blocks` for shared shell components (TopBar, LoginPage, SettingsPage, SudobilityAppWithFirebaseAuth).

## Coding Patterns

- All routes are language-prefixed: `/:lang/*` (e.g., `/en/histories`, `/ja/settings`) -- never create routes without the language prefix
- Pages are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` for code splitting
- 16 languages are supported with RTL support (Arabic) -- use `LocalizedLink` and `useLocalizedNavigate` for navigation
- `ThemeContext` provides light/dark theme switching throughout the app
- `ProtectedRoute` component guards authenticated pages -- wrap any page requiring auth with it
- Vite config deduplicates React and shared dependencies to prevent multiple React instances
- i18next is configured in `src/i18n.ts` with language detection and fallback to English

## Gotchas

- API URL: `.env` defaults to `localhost:8022` to match the API server (`superguide_api`) -- verify `VITE_API_URL` matches your running API if using a different port
- Vite deduplicates React and shared deps in its config -- if you add new shared dependencies, check if they need deduplication
- All routes MUST be under the `/:lang/` prefix -- routes without the language prefix will not work correctly
- Firebase configuration requires all `VITE_FIREBASE_*` environment variables to be set; missing any will break authentication
- `@sudobility/building_blocks` provides shared UI components -- check there before creating duplicate components

## Testing

- Run type checking: `bun run typecheck`
- There is no test suite currently -- the project relies on TypeScript type checking and manual testing
- Linting: `bun run lint`
- Format checking: `bun run format`
- Full verification: `bun run verify` (runs typecheck + lint + format:check)
