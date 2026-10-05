# Data Access

Standards for everything inside `data-access/` -- data shapes, services, and naming conventions.

---

## At a Glance

| Kind              | Folder        | Suffix             | Class/Name pattern        |
| ----------------- | ------------- | ------------------ | ------------------------- |
| **Interfaces**    | `interfaces/` | `.interface.ts`    | `I{Name}`                 |
| **DTOs**          | `dtos/`       | `.dto.ts`          | `I{Name}Request/Response` |
| **Types**         | `types/`      | `.type.ts`         | `{Name}`                  |
| **Enums**         | `enums/`      | `.enum.ts`         | `{Name}`                  |
| **Constants**     | `utilities/`  | `.constants.ts`    | `UPPER_SNAKE_CASE`        |
| **Repositories**  | `repos/`      | `.repo.ts`         | `{Domain}Repository`      |
| **Grid Adapters** | `adapters/`   | `-grid.adapter.ts` | `{Domain}GridAdapter`     |
| **Guards**        | `guards/`     | `.guard.ts`        | `{domain}Guard` (fn)      |
| **Resolvers**     | `resolvers/`  | `.resolver.ts`     | `{domain}Resolver` (fn)   |
| **Pipes**         | `pipes/`      | `.pipe.ts`         | `{Domain}Pipe`            |
| **Services**      | `services/`   | `.service.ts`      | `{Domain}Service`         |
| **Stores**        | `stores/`     | `.store.ts`        | `{Domain}Store`           |

**No `.model.ts` files.** If it describes a shape, use `.interface.ts`. If it is an alias or union, use `.type.ts`.

Group files by domain feature (e.g., `team-tickets.interface.ts`), not one file per object.

---

## Data Shapes

### Interfaces -- `I` prefix

```ts
// interfaces/ticket.interface.ts
export interface ITicket { ... }
export interface ITicketSummary { ... }
export interface IGridConfig { ... }
```

### DTOs -- `I` prefix + `Request`/`Response` suffix

```ts
// dtos/team-tickets.dto.ts
export interface ITeamTicketsResponse { ... }
export interface IAddCommentRequest { ... }
export interface ITicketPermissionsResponse { ... }
```

### Type Aliases -- no `I` prefix

```ts
// types/ticket.type.ts
export type TicketStatus = 'open' | 'closed' | 'pending';
export type ViewMode = 'grid' | 'list';
```

### Enums -- no `I` prefix

```ts
// enums/ticket.enum.ts
export enum TicketStatus {
  Open = 1,
  Closed = 2,
}
```

### Constants -- UPPER_SNAKE_CASE

```ts
// utilities/ticket.constants.ts
export const TICKET_STATUS_IDS = { ... } as const;
export const DEFAULT_TICKET_FORM_DATA = { ... } as const;
```

---

## Services

### Repositories

Repositories are the HTTP layer for a feature. Each feature owns its own repos in `data-access/repos/`.

- Repos consume DTOs internally and return domain interfaces to callers
- Repos do not hold state -- use stores or component signals for that (see [State Management](#state-management) below)
- Feature repos are internal to the feature and not exported from the barrel
- Shared repos (config, reference data, cross-feature lookups) live in `ost/shared/data-access/repos/` or `shared/data-access/` and are exported

```typescript
// feature-ticket-attachment/data-access/repos/attachment.repo.ts
@Injectable({ providedIn: 'root' })
export class AttachmentRepository {
  private http = inject(HttpClient);

  getAttachments(ticketId: string): Observable<IAttachment[]> {
    // Uses IGetAttachmentsRequest DTO internally
    // Returns domain interface to callers
  }

  deleteAttachment(request: IDeleteAttachmentRequest): Observable<void> {
    // DTO stays internal
  }
}
```

### Grid Adapters

Grid adapters live in `data-access/adapters/` and bridge AG Grid with the API. See [Grid Setup](grid-setup.md#adapters) for the full guide, base class details, and code examples.

### Guards

Route guards control access to routes. They live in `data-access/guards/`.

```typescript
// ost/data-access/guards/auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => { ... };
```

### Resolvers

Route resolvers pre-fetch data before a route activates. They live in `data-access/resolvers/`.

```typescript
// ost/data-access/resolvers/ticket-data.resolver.ts
export const ticketDataResolver: ResolveFn<ITicket> = (route) => { ... };
```

### Pipes

Angular pipes for template transformations. They live in `data-access/pipes/`.

```typescript
// ost/data-access/pipes/has-ticket-permission.pipe.ts
@Pipe({ name: 'hasTicketPermission', standalone: true })
export class HasTicketPermissionPipe implements PipeTransform { ... }
```

### Services

Non-HTTP injectable services that provide helper logic, utilities, or orchestration. They live in `data-access/services/`. Use this folder when the logic doesn't fit repos (HTTP), stores (state), or adapters (grid transformation).

---

## State Management

### Component-Level State -- Signals

UI toggles, form values, loading flags. These stay as `signal()`, `computed()`, and `effect()` inside the component. No store, no sharing.

### Feature-Local Stores

If a feature has complex internal state shared across its own components, it gets a feature-local store. This store lives inside the feature and is **not** exported from the barrel.

```typescript
// feature-create-ticket/data-access/stores/create-ticket.store.ts
@Injectable({ providedIn: 'root' })
export class CreateTicketStore {
  private _draft = signal<Partial<ITicket>>({});
  private _step = signal<number>(0);

  draft = this._draft.asReadonly();
  step = this._step.asReadonly();

  updateDraft(partial: Partial<ITicket>): void {
    this._draft.update((d) => ({ ...d, ...partial }));
  }
  nextStep(): void {
    this._step.update((s) => s + 1);
  }
}
```

### Shared Domain Stores

State that multiple features need to read or update (e.g., the current ticket being viewed). These live in `ost/shared/data-access/stores/` and are exported from the barrel.

```typescript
// ost/shared/data-access/stores/ticket.store.ts
@Injectable({ providedIn: 'root' })
export class TicketStore {
  private _ticket = signal<ITicket | null>(null);
  private _loading = signal(false);

  // Read-only signals exposed publicly
  ticket = this._ticket.asReadonly();
  loading = this._loading.asReadonly();
  status = computed(() => this._ticket()?.status);

  // Controlled mutations
  setTicket(ticket: ITicket): void {
    this._ticket.set(ticket);
  }
  updateStatus(status: TicketStatus): void {
    this._ticket.update((t) => (t ? { ...t, status } : null));
  }
}
```

Features inject shared stores but use their own repos for API calls:

```typescript
// feature-view-ticket -- page feature loads ticket into the store
export class ViewTicketPageComponent {
  private store = inject(TicketStore); // shared store
  private repo = inject(ViewTicketRepository); // feature-local repo

  constructor() {
    effect(() => {
      const ticket = await this.repo.getTicket(this.ticketId());
      this.store.setTicket(ticket);
    });
  }
}

// feature-ticket-communication -- composable feature reads store
export class CommentListComponent {
  private store = inject(TicketStore); // shared store
  private repo = inject(CommentRepository); // feature-local repo

  ticket = this.store.ticket; // reactive read
}
```

### Store Rules

- Expose read-only signals publicly, mutate through methods only
- Stores do not make HTTP calls -- features inject both a store and a repo
- If only one component needs the state, use signals instead of a store
