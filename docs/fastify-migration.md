# Database access through Fastify

Next.js calls the Fastify API. Only the backend imports Prisma or connects to PostgreSQL.

## Code locations

- `crm backend/src/modules/workflows`: services moved out of Next.js, with explicit routes for each operation. Services receive the Prisma client and the authenticated user.
- `crm backend/src/modules/enquiries/enquiry-assignment.service.ts`: single and bulk assignment share one transaction for the enquiry updates, job order, leads and notification.
- `crm backend/src/modules/workflows/ui.routes.ts`: sidebar counts, branch details, job-order options and installation access checks used by server-rendered pages.
- `crm.elevate.com/src/lib/api/backend-server.ts`: authenticated server-side HTTP requests. No database access.
- `crm.elevate.com/src/server/actions` and `src/lib/actions`: thin API wrappers retaining the return shapes expected by the UI.
- `crm.elevate.com/src/types/api-models.ts` and `types/api-responses`: ordinary API types without a Prisma dependency.

Existing Fastify REST routes remain available. The migrated business operations use explicit `/api/v1/workflows/<module>/<operation>` routes. These routes accept business inputs, never database queries or model names supplied by the caller.

## Configuration and deployment

Deploy the backend before the frontend, because the frontend now requires the migrated endpoints.

- Set frontend `API_URL` to the full backend API base URL, including `/api/v1`, for server-side requests. Otherwise, `BACKEND_INTERNAL_URL` supplies the backend origin and `/api/v1` is appended. If neither is set, an absolute `NEXT_PUBLIC_API_URL` is used, or a relative API path is resolved against `http://127.0.0.1:5000`.
- Keep `NEXT_PUBLIC_API_URL` for browser API requests such as invoices and enquiries.
- Login uses the same-origin Next.js login route, which calls Fastify and sets frontend cookies.
- Database URLs and Prisma generation belong to the backend. Remove unused database credentials from the frontend deployment configuration.
- Database maintenance scripts are under `crm backend/scripts`.

The backend Prisma schema now includes the service-billing and proposal models previously defined only in the frontend schema. No database migration, database push or data modification is performed by this code migration. Confirm the target database has those existing tables before deployment.

## Checks

Run `pnpm test` and `pnpm build` in the backend. In the frontend, run `pnpm exec tsc --noEmit`, `pnpm exec tsx --test tests/*.test.ts` and `pnpm build`.

The frontend boundary test checks that source files do not import Prisma, construct a database client, use database connection environment variables or run raw queries. Backend tests exercise authentication, permissions, assignment transactions, input validation and credential handling with database doubles; they do not modify a live database.
