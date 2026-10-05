# Breadcrumb Guide

How the breadcrumb system works, and exactly what to do when adding a new page, a tabbed screen, a detail page, or a navigable table row.

---

## How the system works

The breadcrumb bar is driven by three cooperating pieces:

| Piece                 | File                                                               | Responsibility                                                                                                                  |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `BreadcrumbService`   | `libs/shared/ui/src/lib/services/breadcrumbs.service.ts`           | Builds the crumb trail by walking the Angular route tree; reads `from`/`tab` query params and sessionStorage for origin context |
| `TabStateService`     | `libs/shared/ui/src/lib/services/tab-state.service.ts`             | Holds the currently active tab in a signal; inserts the tab label reactively between the page crumb and whatever follows it     |
| `BaseLayoutComponent` | `libs/ost/feature-base-layout/src/lib/ui/base-layout.component.ts` | Reads `BreadcrumbService.breadcrumbs()` and feeds it to PrimeNG `<p-breadcrumb>`                                                |

### The three crumb sources

**1. Route data — `walkRoute()`**
On every `NavigationEnd`, `BreadcrumbService` walks the `ActivatedRoute` tree and produces one crumb for every route node that has `data.breadcrumb` set. This is the foundation. No `data.breadcrumb` → that route is invisible in the breadcrumb bar.

**2. Active tab — `TabStateService.activeTab()`**
`breadcrumbs` is a `computed()` signal. Whenever `TabStateService.activeTab()` changes, the computed re-runs and inserts the tab label immediately after the matching page crumb (matched by `pageKey`). Nothing needs to re-render manually.

**3. Origin context — `from`/`tab` query params + sessionStorage**
When navigating from a tabbed page to a detail page, a `?from=pageKey&tab=tabParam` query string tells `buildCrumbs()` to prepend the origin page and tab to the trail. The query params are stripped from the URL bar immediately after being read (via `history.replaceState`) so users never see them. The context is saved to `sessionStorage` keyed by the destination path (`bc_origin:/ticket/123`) so the breadcrumb survives a page refresh.

---

## Quick-reference checklist

Use this before marking any breadcrumb-related work as done.

### Adding a simple page (no tabs)

- [ ] Add `data: { breadcrumb: 'Label' }` to the route config
- [ ] Verify there is no duplicate `breadcrumb` data on a parent route for the same segment

### Adding a tabbed page

- [ ] Add `data: { breadcrumb: 'Label', breadcrumbKey: 'my-page-key' }` to the route config
- [ ] Add `'my-page-key'` to `PAGE_MAP` in `BreadcrumbService`
- [ ] Add `'my-page-key'` to `TAB_MAP` in `BreadcrumbService` with all tab param → label entries
- [ ] Inject `TabStateService` in the page component
- [ ] Call `tabStateService.setActiveTab(pageKey, label, param)` in `ngOnInit` for the default tab
- [ ] Call `tabStateService.setActiveTab(pageKey, label, param)` whenever the user changes tabs
- [ ] Read `activatedRoute.snapshot.queryParams['tab']` in `ngOnInit` to restore tab from breadcrumb back-navigation

### Adding a link that should carry origin context (button, table row, etc.)

- [ ] Navigate using `Router.navigate(['/destination'], { queryParams: { from: 'page-key', tab: 'tab-param' } })`
- [ ] Confirm `page-key` exists in both `PAGE_MAP` and `TAB_MAP`
- [ ] Do NOT manually append params to a `routerLink` string — always pass `queryParams` separately

### Adding a detail page with a dynamic label (ticket alias, user name, etc.)

- [ ] Add `data: { breadcrumb: 'Fallback Label' }` to the route (shown until the dynamic value loads)
- [ ] Inject `BreadcrumbService` in the component
- [ ] Call `breadcrumbService.setDynamicLabel(value)` inside an `effect()` once the value is available

---

## Scenario A — Simple page, no tabs

A page like `/notifications` or `/access-denied` that has no tabs and is not a detail view.

### 1. Route config

```typescript
// feature-shell/src/lib/lib.routes.ts
{
  path: 'notifications',
  loadComponent: () => import('@ost/feature-notification').then((m) => m.NotificationComponent),
  data: { breadcrumb: 'Notifications' },
},
```

That is the only change required. `walkRoute()` picks up `data.breadcrumb` automatically on the next navigation.

### 2. Nothing else

No changes to `BreadcrumbService`, `TabStateService`, or the component itself.

**Result:** `Notifications`

---

## Scenario B — Tabbed page (e.g. Team Management)

A page that owns a tab bar and whose breadcrumb should show the active tab label.

### 1. Route config — add `breadcrumbKey`

```typescript
// _team-management/feature-team-management/src/lib/lib.routes.ts
{
  path: '',
  loadComponent: () => import('./ui/team-management-page.component').then((m) => m.TeamManagementPageComponent),
  data: {
    breadcrumb: 'Team Management',
    breadcrumbKey: 'team-management',   // ← required for tab insertion
  },
},
```

Do not also add `data: { breadcrumb: ... }` on the parent shell route for the same path segment. That creates a duplicate crumb. Keep breadcrumb data on exactly one route node per URL segment.

### 2. `BreadcrumbService` — register in `PAGE_MAP` and `TAB_MAP`

```typescript
// breadcrumbs.service.ts

const PAGE_MAP: Record<string, { label: string; url: string }> = {
  // existing entries ...
  'team-management': { label: 'Team Management', url: '/team' },
};

const TAB_MAP: Record<string, Record<string, string>> = {
  // existing entries ...
  'team-management': {
    'team-members': 'Team Members', // param value → display label
    delegations: 'Delegations',
    'all-tickets': 'All Tickets',
  },
};
```

The `param value` (left side) is what goes into the `tab` query param and into `setActiveTab()`. The display label (right side) is what appears in the breadcrumb bar.

### 3. Page component — wire `TabStateService`

```typescript
import { ActivatedRoute } from '@angular/router';
import { TabStateService } from '@shared/ui';

// map from tab param → display label, mirrors TAB_MAP
private static readonly TAB_LABELS: Record<string, string> = {
  'team-members': 'Team Members',
  delegations: 'Delegations',
  'all-tickets': 'All Tickets',
};

export class TeamManagementPageComponent implements OnInit {
  private tabStateService = inject(TabStateService);
  private activatedRoute = inject(ActivatedRoute);

  readonly activeTab = signal<string>('team-members');

  ngOnInit(): void {
    // Restore the correct tab when the user arrives via a breadcrumb link (?tab=delegations)
    const tabParam = this.activatedRoute.snapshot.queryParams['tab'] as string | undefined;
    if (tabParam && TeamManagementPageComponent.TAB_LABELS[tabParam]) {
      this.activeTab.set(tabParam);
      this.tabStateService.setActiveTab(
        'team-management',
        TeamManagementPageComponent.TAB_LABELS[tabParam],
        tabParam,
      );
    } else {
      // Register the default tab so the breadcrumb shows it immediately on first load
      this.tabStateService.setActiveTab('team-management', 'Team Members', 'team-members');
    }
  }

  onTabChange(value: string | number | undefined): void {
    if (typeof value === 'string') {
      this.activeTab.set(value);
      const label = TeamManagementPageComponent.TAB_LABELS[value];
      if (label) {
        this.tabStateService.setActiveTab('team-management', label, value);
      }
    }
  }
}
```

**Result:**

- `Team Management > Team Members` (on load, or after clicking the Team Members tab)
- `Team Management > Delegations` (after clicking Delegations)
- Clicking "Delegations" in the breadcrumb navigates to `/team?tab=delegations` and restores that tab

---

### Tabbed pages backed by `TabbedGridStateService` (e.g. Submitted Tickets, Workspace)

If your page uses `TicketsListComponent` or a similar component that wraps `TabbedGridStateService`, the tab wiring is already handled inside `TicketsListComponent` via an `effect()`:

```typescript
// tickets-list.component.ts  — already done, shown here for reference
effect(() => {
  const tabValue = this.tabService.activeTab();
  const key = this.pageKey();
  if (!tabValue || !key) return;
  const tab = untracked(() => this.tabService.tabs.find((t) => t.value === tabValue));
  if (tab) {
    this.tabStateService.setActiveTab(key, tab.label, tabValue);
  }
});
```

For pages using this pattern you only need the route config change and the `PAGE_MAP`/`TAB_MAP` entries — no component-level `ngOnInit` wiring required.

---

## Scenario C — Detail page that should inherit origin context

A page like `/ticket/123` that should show `Submitted Tickets > Open > Ticket` when arrived at from the Open tab, rather than just `Ticket`.

### 1. Route config

```typescript
{
  path: 'ticket/:ticketId',
  loadComponent: () => import('@ost/feature-view-submitted-ticket').then((m) => m.ViewSubmittedTicketComponent),
  data: { breadcrumb: 'Ticket' },   // shown as fallback, or replaced by setDynamicLabel
},
```

No `breadcrumbKey` needed here. Detail pages are leaves — they do not own tabs.

### 2. The navigation link must pass origin context

See [Scenario D](#scenario-d--navigating-from-a-table-row-or-button-to-a-detail-page) below for exactly how to do this.

### 3. No other changes required

`buildCrumbs()` automatically reads the `from`/`tab` params (or sessionStorage on refresh) and prepends the origin trail. The detail page component itself does not need to know anything about where the user came from.

**Result:**

- Arrived from Submitted Tickets > Open: `Submitted Tickets > Open > Ticket`
- Arrived from Workspace > Pending: `Workspace > Pending Info > Ticket`
- Arrived via direct URL / bookmark: `Ticket`
- After refresh: same as the first visit (context stored in sessionStorage under `bc_origin:/ticket/123`)

---

## Scenario D — Navigating from a table row or button to a detail page

Any link that should give the destination page its origin-context breadcrumb must pass `?from=pageKey&tab=tabParam`. The query params are stripped from the URL bar immediately on arrival — users never see them.

### Button navigation (the standard pattern)

Do not use a static `routerLink` string when origin context is needed. Use `Router.navigate()` so you can read the current tab at click time:

```typescript
export class TicketsHomePageComponent {
  private router = inject(Router);
  private tabStateService = inject(TabStateService);

  goToCreateTicket(): void {
    const tab = this.tabStateService.activeTab();
    const tabParam = tab?.pageKey === 'submitted-tickets' ? tab.tabParam : 'open';
    this.router.navigate(['/ticket'], {
      queryParams: { from: 'submitted-tickets', tab: tabParam },
    });
  }
}
```

```html
<p-button label="Create New Ticket" icon="pi pi-plus" (onClick)="goToCreateTicket()" />
```

### Table row / cell renderer navigation

The same principle applies inside a cell renderer or row-click handler. Read `TabStateService.activeTab()` at click time and include it in the navigation:

```typescript
// ticket-id-link-cell-renderer.component.ts (example)
export class TicketIdLinkCellRendererComponent {
  private router = inject(Router);
  private tabStateService = inject(TabStateService);

  navigate(): void {
    const tab = this.tabStateService.activeTab();
    const queryParams: Record<string, string> = {};
    if (tab?.pageKey && tab?.tabParam) {
      queryParams['from'] = tab.pageKey;
      queryParams['tab'] = tab.tabParam;
    }
    this.router.navigate(['/ticket', this.ticketId], { queryParams });
  }
}
```

If the active tab has no `pageKey` (e.g. the user is on a page with no registered tabs), no query params are added and the detail page shows its fallback breadcrumb.

### What `buildCrumbs()` requires to build the origin trail

For the trail to be inserted, all three of these must be true:

1. `from` param value exists as a key in `PAGE_MAP`
2. `tab` param value exists under that key in `TAB_MAP`
3. The destination route has at least one `data.breadcrumb` entry (i.e. `crumbs.length > 0`)

If any condition fails, `buildCrumbs()` falls through to returning the plain route crumbs — no error, no crash.

---

## Scenario E — Detail page with a dynamic label

A detail page where the breadcrumb label should change once the entity loads (e.g. "Ticket" → "OST-4821").

### Route config

```typescript
{
  path: 'ticket/:ticketId',
  data: { breadcrumb: 'Ticket' },   // static fallback shown while data loads
},
```

### Component

```typescript
import { BreadcrumbService } from '@shared/ui';

export class ViewSubmittedTicketComponent {
  private breadcrumbService = inject(BreadcrumbService);

  constructor() {
    effect(() => {
      const alias = this.ticket()?.aliasTicketId;
      if (alias) {
        this.breadcrumbService.setDynamicLabel(alias);
      }
    });
  }
}
```

`setDynamicLabel()` replaces the last crumb's label in-place. It is cleared automatically on the next `NavigationEnd` — you do not need to call `clearDynamicLabel()` yourself.

**Result:** `Submitted Tickets > Open > OST-4821` (once ticket data resolves)

---

## Scenario F — New page inside a lazy-loaded feature with its own routes file

When a feature has its own `lib.routes.ts` that is lazy-loaded via `loadChildren`, breadcrumb data belongs in the **feature routes file**, not in the shell.

**Correct:**

```typescript
// feature-shell/lib.routes.ts
{
  path: 'my-feature',
  loadChildren: () => import('@ost/feature-my-feature').then((m) => m.myFeatureRoutes),
  canActivate: [someGuard],
  // ← no data.breadcrumb here
},

// feature-my-feature/lib.routes.ts
export const myFeatureRoutes: Route[] = [
  {
    path: '',
    component: MyFeaturePageComponent,
    data: { breadcrumb: 'My Feature', breadcrumbKey: 'my-feature' },
  },
];
```

**Wrong — causes a duplicate crumb:**

```typescript
// feature-shell/lib.routes.ts
{
  path: 'my-feature',
  loadChildren: () => ...,
  data: { breadcrumb: 'My Feature' },   // ← also on the shell parent
},

// feature-my-feature/lib.routes.ts
{
  path: '',
  data: { breadcrumb: 'My Feature' },   // ← AND on the feature child
},
```

`walkRoute()` visits both route nodes and produces `My Feature > My Feature`. Keep `data.breadcrumb` on exactly one node per URL segment.

---

## Reference — key files and their roles

| File                           | What to edit                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| `breadcrumbs.service.ts`       | `PAGE_MAP` (new main-level page) and `TAB_MAP` (new tabbed page or new tabs)              |
| `feature-shell/lib.routes.ts`  | Add route with `data.breadcrumb`; do not duplicate if feature has its own `lib.routes.ts` |
| `feature-{name}/lib.routes.ts` | Preferred location for `data.breadcrumb` and `data.breadcrumbKey`                         |
| Page component                 | Call `tabStateService.setActiveTab()` in `ngOnInit` and in the tab-change handler         |
| Navigation call site           | Pass `queryParams: { from, tab }` via `Router.navigate()` — never append to a string URL  |
| Detail page component          | Call `breadcrumbService.setDynamicLabel()` in an `effect()` once entity data resolves     |

---

## Reference — `PAGE_MAP` and `TAB_MAP` entries

```
PAGE_MAP key        Display label           URL
──────────────────────────────────────────────────────────
submitted-tickets   Submitted Tickets       /tickets/submitted-tickets
workspace           Workspace               /tickets/workspace
team-management     Team Management         /team

TAB_MAP key         Tab param               Display label
──────────────────────────────────────────────────────────
submitted-tickets   open                    Open
                    pending                 Pending Info
                    draft                   Draft
                    closed                  Closed
workspace           open                    Open
                    pending                 Pending Info
                    closed                  Closed
team-management     team-members            Team Members
                    delegations             Delegations
                    all-tickets             All Tickets
```

When you add a new tabbed page, add a row to both tables.

---

## Troubleshooting

**Breadcrumb does not appear at all**
→ The route is missing `data: { breadcrumb: 'Label' }`. Add it to the correct `lib.routes.ts`.

**Breadcrumb shows the page name twice (e.g. `Team Management > Team Management`)**
→ `data: { breadcrumb: ... }` exists on both the shell parent route and the feature child route for the same path segment. Remove it from the shell route, keep it only in the feature routes file.

**Tab label does not appear in the breadcrumb**
→ Check all three: (1) the route has `breadcrumbKey`, (2) that key is in `PAGE_MAP` and `TAB_MAP`, (3) the component calls `tabStateService.setActiveTab()` in `ngOnInit` and `onTabChange`.

**Breadcrumb loses origin context after refresh**
→ This is handled automatically via sessionStorage (`bc_origin:{path}`). If it is broken, confirm that the navigation passed both `from` and `tab` as query params, and that both values exist in `PAGE_MAP` and `TAB_MAP`.

**Origin context breadcrumb does not appear (just shows plain `Create New Ticket`)**
→ The button/link is not passing `from`/`tab` params. Replace the static `routerLink` with a `(onClick)` handler that calls `Router.navigate()` with `queryParams: { from, tab }`.

**Dynamic label never appears (always shows the static fallback)**
→ `breadcrumbService.setDynamicLabel()` is not being called, or is called before the entity data resolves. Wrap it in an `effect()` that guards on the value being truthy.

**Clicking a tab breadcrumb link does not restore the correct tab**
→ The page component is not reading `activatedRoute.snapshot.queryParams['tab']` in `ngOnInit`. Add the restoration block shown in Scenario B.
