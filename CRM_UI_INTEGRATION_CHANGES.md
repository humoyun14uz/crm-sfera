# Sfera Academy CRM — UI/backend integration changes

## Implemented

- **Manager dashboard API:** added `GET /manager/dashboard/revenue-trend` with academy-scoped Drizzle aggregation for the last 30 days; the existing Recharts manager chart consumes it when `VITE_API_ENABLED=true` and falls back to seeded data otherwise.
- **Finance backend:** `GET /api/v1/finance/payments` now validates and supports `q`, `status`, `paymentMethod`, `from`, `to`, `page`, and `pageSize`; response includes `items`, `total`, `page`, `pageSize`, and `totalPages`.
- **Finance frontend:** payment journal now uses server-side search/filter/pagination when the backend is enabled and keeps demo data fallback for local demo mode.
- **Lead Kanban:** the existing LeadsPanel Kanban view now supports native drag-and-drop between stages, with status updates and a visual dragging state.
- **Permission contract fix:** corrected the existing debtor permission reference to `finance.payments.view_debt` so the API build type-checks against the shared contracts.

## Validation

- `pnpm run build:all` — passed.
- `pnpm lint` — passed with 15 existing warnings and 0 errors.
