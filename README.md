# MPS Dashboard Platform

The MPS dashboard is a `Next.js 16` waste shipment operations platform with analytics, reports, admin management, a custom report builder, and an internal design-system showcase.

## Quick Start

```bash
pnpm install
pnpm dev
```

Useful scripts:

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`

## Current Stack

- `Next.js 16.1.6`
- `React 19.2.3`
- `TypeScript`
- `Tailwind CSS v4`
- `radix-ui`
- `motion`
- `nuqs`
- `@tanstack/react-table`
- `ag-grid-react`
- `recharts`
- `react-hook-form` + `zod`
- `xlsx`
- `@react-pdf/renderer`

## Product Areas

- `Dashboard`: KPI cards, charts, activity, and operational alerts
- `Shipments`: searchable shipment list with export, detail drawers, and delete/edit flows
- `New Shipment Entry`: AG Grid bulk-entry workflow with paste/import/validation
- `Reports`: tabbed analytics across waste, cost, operations, logistics, emissions, and more
- `Report Builder`: custom report assembly with PDF export
- `Admin`: clients, sites, vendors, facilities, reference data, users, and audit log
- `Design System`: live component and token showcase

## Architecture At A Glance

- `app/`: App Router routes, route groups, and layouts
- `components/ui/`: shared design-system primitives
- `components/layout/`: shell, sidebar, topbar, mobile navigation, route guard
- `components/charts/`: reusable Recharts wrappers
- `components/report-builder/`: widget rendering and PDF/report assembly
- `components/patterns/`: higher-order reusable feature patterns like CRUD tables
- `lib/mock-data.ts`: current in-memory data source and mutation layer
- `lib/types.ts`: shared domain model
- `lib/navigation.ts`: nav, labels, and breadcrumbs
- `app/globals.css`: design tokens and theme definitions

## Important Notes

- The app currently uses a mock in-memory data layer, not a real backend.
- Auth is client-side and persisted in `localStorage`.
- The global runtime theme is `theme-brand`.
- The full architecture and design-system foundation are documented in [`docs/dashboard-architecture-and-design-system.md`](./docs/dashboard-architecture-and-design-system.md).
- The legacy design-system writeup still exists in [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md), but the new architecture doc is the better high-level source of truth.
