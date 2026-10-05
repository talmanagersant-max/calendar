# Folder Structure

Feature architecture, dependency rules, layout conventions, and the overall workspace.

---

## Feature Architecture

Each feature is a **vertical slice** that owns its full stack: data-access (repos, DTOs, interfaces) and UI (components). Features are self-contained -- they call their own APIs and manage their own state.

There are two kinds of features:

| Kind                   | Has a route? | Importable by other features? | Examples                                                    |
| ---------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| **Page feature**       | Yes          | No                            | `feature-create-ticket`, `feature-dashboard`                |
| **Composable feature** | No           | Yes (via barrel)              | `feature-ticket-attachment`, `feature-ticket-communication` |

**Page features** are top-level entry points tied to routes. They compose composable features and shared UI to build a full view.

**Composable features** are self-contained domain slices. They export UI components and interfaces through their barrel (`index.ts`) for page features to consume. They do NOT import from other composable features.

---

## Dependency Rules

### Between libraries

Each layer can only import from layers above it. Lower layers never import from higher layers.

1. `shared/*` -- foundation, no app-specific imports
2. `ost/shared/*` -- can import shared
3. Composable features -- can import ost/shared, shared. Cannot import other composable features or page features.
4. Page features -- can import composable features (via barrel), ost/shared, shared. Cannot import other page features.
5. `feature-shell` -- can import page features, composable features, ost/shared, shared
6. `apps/ost` -- can import feature-shell

### Within a library

Each library type has its own internal layer rule:

| Library type   | `ui/` can import from          | `data-access/` can import from   |
| -------------- | ------------------------------ | -------------------------------- |
| **Feature**    | Own `data-access/`             | Never from own `ui/`             |
| **ost/shared** | Own `data-access/`, `shared/*` | `shared/*` only                  |
| **shared**     | Own `data-access/`             | Other shared `data-access/` only |

`ui/` is always the consumer. `data-access/` is always the foundation. This rule applies everywhere -- features, ost/shared, and shared libs.

---

## Feature Internal Structure

Every feature follows the same internal layout:

```
feature-{name}/
  data-access/
    repos/
      {name}.repo.ts                  # HTTP services specific to this feature
    dtos/
      {name}-request.dto.ts           # API request/response shapes (internal only)
    interfaces/
      {name}.interface.ts             # Domain shapes exported via barrel
    types/
      {name}.type.ts                  # Type aliases, unions
    enums/
      {name}.enum.ts                  # Enumerations
    stores/
      {name}.store.ts                 # Feature-local state, prioritize signals if state is simple
    adapters/
      {name}-grid.adapter.ts          # Grid adapters
    guards/
      {name}.guard.ts                 # Route guards
    resolvers/
      {name}.resolver.ts              # Route data resolvers
    pipes/
      {name}.pipe.ts                  # Angular pipes
    services/
      {name}.service.ts               # Non-HTTP services -- helpers, utilities
  ui/
    {name}-page.component.ts          # Page component (page features only)
    {sub-component}.component.ts      # Feature-specific UI components
  lib.routes.ts                       # Feature's own route config (page features only)
  index.ts                            # Barrel -- exports ui/, interfaces/, and routes
```

---

## Routing

Each page feature owns its own route config in `lib.routes.ts`. Feature-shell only maps top-level paths and lazy-loads each feature.

### Page feature defines its child routes

```typescript
// feature-view-ticket/lib.routes.ts
import { Route } from '@angular/router';
import { ticketDataResolver } from './data-access/resolvers/ticket-data.resolver';

export const viewTicketRoutes: Route[] = [
  {
    path: ':ticketId',
    loadComponent: () =>
      import('./ui/view-ticket-page.component').then((m) => m.ViewTicketPageComponent),
    resolve: { ticketData: ticketDataResolver },
    data: { breadcrumb: 'Ticket' },
  },
];
```

### Feature-shell lazy-loads features

```typescript
// feature-shell/lib.routes.ts
export const ostRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@ost/ui').then((m) => m.BaseLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tickets' },
      {
        path: 'ticket',
        loadChildren: () => import('@ost/feature-view-ticket').then((m) => m.viewTicketRoutes),
      },
      {
        path: 'tickets',
        loadChildren: () => import('@ost/feature-tickets-list').then((m) => m.ticketsListRoutes),
      },
      // ...
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
```

Resolvers and guards are imported internally within the feature's `lib.routes.ts` -- they don't need to be exported from the barrel or referenced by feature-shell unless they are shared across multiple features (in which case they should live in `ost/shared/`).

---

## Barrel Export Rules

| Internal folder           | Feature `index.ts`?      | Shared lib `index.ts`? |
| ------------------------- | ------------------------ | ---------------------- |
| `lib.routes.ts`           | Yes (page features only) | N/A                    |
| `ui/` components          | Yes                      | Yes                    |
| `data-access/interfaces/` | Yes                      | Yes                    |
| `data-access/types/`      | Yes                      | Yes                    |
| `data-access/enums/`      | Yes                      | Yes                    |
| `data-access/adapters/`   | **No**                   | Yes                    |
| `data-access/guards/`     | **No**                   | Yes                    |
| `data-access/resolvers/`  | **No**                   | Yes                    |
| `data-access/pipes/`      | **No**                   | Yes                    |
| `data-access/services/`   | **No**                   | Yes                    |
| `data-access/repos/`      | **No**                   | Yes                    |
| `data-access/stores/`     | **No**                   | Yes                    |
| `data-access/dtos/`       | **No**                   | **No**                 |

Features export only UI components and domain shapes. Shared libraries additionally export service-layer code, repos, and stores. DTOs are the only thing that stays internal everywhere.
