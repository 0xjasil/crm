# Zee One CRM

CRM frontend built with Next.js 15, React 19, TypeScript, Tailwind CSS, and shadcn/ui. All CRM data comes from the Fastify API over HTTP. This application has no database or ORM.

## Current structure

- `src/app/`: App Router pages, layouts, and local API handlers. The authenticated shell lives in `(sidebar)/layout.tsx`.
- `src/components/`: CRM components; `ui/` contains the shared shadcn components.
- `src/config/app.ts`: Application name, theme, and navigation settings.
- `src/constants/`: Shared permission and enquiry constants.
- `src/types/`: API models and response types.
- `src/schema/`: Form validation schemas.
- `src/server/actions/` and `src/lib/actions/`: Existing server actions.
- `src/lib/api/client.ts`: Shared server-only HTTP client. `backend-server.ts` keeps existing server callers compatible.
- `src/lib/api/enquiry-api.ts` and `invoice-api.ts`: Existing browser API clients awaiting migration.
- `src/hooks/use-mobile.ts`: Active mobile detection hook used by the sidebar and CRM pages.
- `tests/`: Node test runner tests executed through `tsx`.

Follow `agent.md` for the target feature-based architecture and coding rules. The current structure is being migrated incrementally.

## Development

Install dependencies and start the frontend:

```sh
pnpm install
pnpm dev
```

The frontend runs at `http://localhost:3000`. Run the Fastify backend separately. Configure `API_URL` for the server API base URL, including `/api/v1`. `BACKEND_INTERNAL_URL` configures the backend origin used by Next.js rewrites. The local backend default is port 5000. Keep secrets out of `NEXT_PUBLIC_` variables and never commit `.env` files.

Development output lives in `.next-dev`; production builds and `pnpm start` use `.next`. This keeps a production build from overwriting chunks used by a running development server.

## Validation

```sh
pnpm lint
pnpm typecheck
node --import tsx --test tests/*.test.ts
pnpm build
```

The current Next.js configuration skips lint and type validation during builds, so run both checks separately. Existing lint failures must be resolved without disabling rules or TypeScript checks.

To serve the production build:

```sh
pnpm start
```

## Customization

- Edit `src/config/app.ts` for application settings.
- Sidebar navigation currently lives in `src/components/app-sidebar.tsx`.
- Dashboard data comes through `src/lib/actions/dashboard.ts` and is rendered in `src/app/(sidebar)/dashboard/page.tsx`.
- Theme tokens and global styles live in `src/app/globals.css`.
- Active PDF generation uses jsPDF, including `src/lib/invoice-zoho-pdf.ts` and the service billing PDF helpers.

This project is private and proprietary.
