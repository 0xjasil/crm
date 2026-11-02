# AGENTS.md (Next.js CRM Frontend)

## Goal

Build a clean, simple, readable CRM frontend that is easy to extend with new modules.
Prefer boring and obvious code over clever code.
Make the smallest change that solves the task. Do not add features, pages, or dependencies that were not requested.

## Key facts about this project

- This app has **no database**. It never touches a DB or ORM.
- **All data comes from the Fastify API** over HTTP. Every read and write is an API call.
- The Fastify API returns errors in this shape: `{ "error": { "code": "...", "message": "..." } }`
- Fastify enforces permissions. The frontend only hides or shows UI based on role, it is never the real security.

## Stack

- Next.js (App Router), React, TypeScript (strict mode)
- UI: shadcn/ui + Tailwind CSS. Do not add another UI library.
- Validation: Zod
- Forms: react-hook-form + Zod resolver (use what the project already has)
- Tables: TanStack Table via the shared `DataTable` component
- Check the installed Next.js version before writing code. In Next.js 15+, `params` and `searchParams` are Promises and must be awaited.
- Lint and format: ESLint + Prettier. Follow the existing config.

## Architecture

Feature-based. `app/` is for routing only. Real code lives in `features/`.

```
src/
├── app/                              # ROUTING ONLY: thin files
│   ├── layout.tsx                    # root layout, fonts, providers
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/page.tsx
│   └── (dashboard)/
│       ├── layout.tsx                # sidebar + header shell
│       ├── page.tsx                  # dashboard home
│       ├── leads/
│       │   ├── page.tsx              # list
│       │   ├── new/page.tsx
│       │   ├── [id]/page.tsx         # detail
│       │   ├── loading.tsx
│       │   └── error.tsx
│       ├── contacts/
│       ├── deals/
│       └── tasks/
│
├── features/                         # ONE FOLDER PER CRM MODULE
│   ├── auth/
│   ├── dashboard/
│   │   ├── components/               # section-cards.tsx, etc.
│   │   ├── api.ts
│   │   └── constants.ts              # moved from constants/dashboard.ts
│   └── leads/
│       ├── components/
│       │   ├── lead-table.tsx
│       │   ├── lead-columns.tsx
│       │   ├── lead-form.tsx
│       │   └── lead-status-badge.tsx
│       ├── api.ts                    # ALL Fastify calls for leads (server-only)
│       ├── actions.ts                # server actions for writes ("use server")
│       ├── schemas.ts                # Zod schemas + inferred form types
│       ├── types.ts                  # API response types (Lead, LeadStatus...)
│       └── constants.ts              # status options, labels
│
├── components/
│   ├── ui/                           # shadcn/ui base components (do not hand-edit casually)
│   ├── layout/                       # app-sidebar.tsx, nav-main.tsx, nav-user.tsx, site-header.tsx
│   └── shared/                       # generic, reusable across features
│       ├── data-table.tsx
│       ├── page-header.tsx
│       ├── empty-state.tsx
│       ├── confirm-dialog.tsx
│       └── pagination.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                 # apiFetch(): the ONLY place that calls Fastify
│   │   ├── errors.ts                 # ApiError class
│   │   └── types.ts                  # Paginated<T>, ApiErrorBody
│   ├── auth/
│   │   └── session.ts                # getSession(), requireSession()
│   ├── env.ts                        # validated env vars
│   ├── format.ts                     # date, currency, phone formatters
│   └── utils.ts                      # cn() and tiny helpers
│
├── config/
│   ├── app.ts                        # app name, pagination defaults
│   └── navigation.ts                 # sidebar items (moved from constants/navigation.ts)
│
├── constants/
│   └── routes.ts                     # route path helpers, e.g. ROUTES.leads.detail(id)
│
├── types/                            # only truly global types (e.g. navigation, Role)
└── hooks/                            # shared client hooks only
    └── use-mobile.ts                 # required by the shadcn sidebar, keep it
```

### Where things go

| Thing                                   | Location                                                     |
| --------------------------------------- | ------------------------------------------------------------ |
| New CRM module (e.g. invoices)          | `features/invoices/` + routes in `app/(dashboard)/invoices/` |
| Fastify call for a module               | `features/<module>/api.ts`                                   |
| Generic call plumbing (headers, errors) | `lib/api/client.ts`                                          |
| Reusable UI used by 2+ features         | `components/shared/`                                         |
| UI used by one feature only             | `features/<module>/components/`                              |
| Sidebar, header, shell                  | `components/layout/`                                         |
| Feature-specific constants              | `features/<module>/constants.ts`                             |

## The API layer (most important rule)

- **Only** `lib/api/client.ts` talks to Fastify. It builds the URL from `env.API_URL`, attaches the auth token, parses JSON, and throws `ApiError` when the response is not OK.
- Each feature's `api.ts` wraps it with typed functions, for example:
  - `getLeads(params): Promise<Paginated<Lead>>`
  - `getLead(id): Promise<Lead>`
  - `createLead(input): Promise<Lead>`
- `client.ts` and every `api.ts` start with `import "server-only"` so the token and API calls can never leak into the browser bundle.
- Components and pages never call `fetch` directly. They call feature `api.ts` functions (reads) or server actions (writes).
- CRM data is user-specific. Use `cache: "no-store"` by default. Use tags and `revalidateTag` only when deliberately caching.
- Authentication: the Fastify JWT is stored in an **httpOnly cookie**, read on the server by `lib/auth/session.ts`. Never store tokens in `localStorage`.

## Data flow

**Read:** `page.tsx` (server) -> `features/x/api.ts` -> `apiFetch` -> Fastify -> render feature components with the data.

**Write:** form (client component) -> server action in `features/x/actions.ts` -> validate with Zod -> `features/x/api.ts` -> Fastify -> `revalidatePath` -> return `{ ok, error?, fieldErrors? }`.

Server actions return a simple result object. They do not throw for expected failures (validation errors, API errors). They catch `ApiError` and convert it to `{ ok: false, error: message }`.

## List pages (CRM standard pattern)

- Search, filters, sort, and page number live in the **URL search params**, not in client state.
- `page.tsx` reads `searchParams`, validates them with a Zod schema (with defaults), and passes them to `api.ts`.
- Filter inputs update the URL. The server component re-fetches. This gives shareable links, working back button, and no loading-state bugs.
- Every list handles three states: loading (`loading.tsx` / skeleton), empty (`EmptyState`), error (`error.tsx`).

## Server vs client components

- Components are **Server Components by default**.
- Add `"use client"` only for state, effects, event handlers, or browser APIs.
- Keep client components small and at the leaves of the tree. Never mark a whole page as client.
- Pass data from server components down as props.
- Use TanStack Query only if a feature truly needs client-driven fetching (live search, polling). Ask first, and keep it behind the same feature `api.ts` or a route handler. Do not scatter client-side fetch calls.

## Auth and permissions

- Protect routes with the project's middleware/proxy (depends on Next.js version), **and** call `requireSession()` in the dashboard layout. Do not rely on middleware alone.
- Role checks for UI go through a single helper (for example `can(session, "leads:delete")`). Do not scatter `role === "admin"` checks around components.
- If Fastify returns 401, redirect to login. If 403, show a clear forbidden state.

## Code style

- One statement per line. No clever one-liners, no nested ternaries, no deeply chained expressions.
- Components stay under about 100 lines. Split larger ones.
- Functions do one thing and stay under about 30 lines.
- Early returns instead of nested conditions.
- Explicit types for props and return values. No `any`. Use `unknown` and narrow.
- Files are kebab-case (`lead-table.tsx`). Components are PascalCase. Use named exports, except where Next.js requires default exports (`page.tsx`, `layout.tsx`, `error.tsx`, etc.).
- Use `@/` path alias imports. No deep relative paths like `../../../`.
- No magic strings. Statuses, roles, and routes come from constants.
- No custom state libraries or context providers unless asked. Start with props and server data.
- Comments explain why, not what.

## UI rules

- Use existing shadcn/ui components first. Add new ones with the shadcn CLI, do not hand-write copies.
- Use Tailwind theme tokens, not hardcoded colors.
- Semantic HTML, every input has a label, buttons are `button`, links are `Link`.
- Forms show field-level errors and a pending state. Disable submit while pending.
- Destructive actions (delete) always go through `ConfirmDialog`.
- Format dates, currency, and phone numbers only through `lib/format.ts`.

## Adding a new CRM module (checklist)

1. Create `features/<module>/` with `types.ts`, `schemas.ts`, `api.ts`, `actions.ts`, `constants.ts`, `components/`.
2. Add routes under `app/(dashboard)/<module>/` (`page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `loading.tsx`, `error.tsx`).
3. Add the sidebar entry in `config/navigation.ts` and route helpers in `constants/routes.ts`.
4. Reuse `DataTable`, `PageHeader`, `EmptyState`, and `ConfirmDialog`. Do not rebuild them.
5. Follow the existing `leads` feature as the reference for structure and style.

## Workflow

1. For anything larger than a small fix, show a short plan before writing code.
2. Match the existing `leads` feature exactly in structure and style.
3. Before finishing, run: `npm run lint && npm run typecheck && npm run build`
4. Summarize what changed and why. Mention any new dependency and justify it.

## Never do

- Never access a database or add an ORM. Data comes from the Fastify API only.
- Never call `fetch` to Fastify from components or pages. Go through `features/*/api.ts`.
- Never put API calls, business logic, or data mapping inside UI components.
- Never expose the API token or secrets to the client. Only `NEXT_PUBLIC_` variables are public.
- Never mark a component `"use client"` just to silence an error. Find out why first.
- Never use semicolon-chained or compressed code to save lines.
- Never disable lint rules or TypeScript checks to make errors go away.
- Never refactor unrelated code while working on a task.
