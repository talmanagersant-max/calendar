# Components

Patterns, naming conventions, and Angular conventions for components.

---

## Angular Conventions

- Standalone components only
- Single-file components -- inline `template` and `styles` in the `.component.ts` file, no separate `.html` or `.css` files
- Signal inputs (`input()`, `input.required()`) and `output()` -- not decorator-based `@Input()` / `@Output()`
- Signal-based state (`signal()`, `computed()`, `toSignal()`)
- New control flow: `@if`, `@for` with `track`, `@switch` -- not `*ngIf`/`*ngFor`
- Keep components focused. Extract child components when the template gets hard to scan.
- OnPush change detection with signal-driven components

---

## Page Component -- lives in `feature-{name}/ui/`

A page is a routed, full-screen view. Only page features have page components.

- Suffix the class with `Page`: `CreateTicketPageComponent`, `ViewTicketPageComponent`
- File suffix: `-page.component.ts`
- Composes child components from the same feature, composable features, and shared UI

```typescript
// feature-create-ticket/ui/create-ticket-page.component.ts
@Component({
  selector: 'ost-create-ticket-page',
  template: `
    <ost-requester-information [ticket]="ticket()" />
    <ost-category-information [categories]="categories()" />
    <ost-ticket-attachment [ticketId]="ticketId()" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTicketPageComponent {
  private repo = inject(CreateTicketRepository);
  // ...
}
```

---

## Container (Smart) Component -- lives in `feature-{name}/ui/`

Non-routed components that inject services and manage state within a feature.

- Standard `Component` suffix
- Injects repos and services from the same feature's `data-access/`

---

## Presenter (Dumb) Component -- lives in `feature-{name}/ui/` or `ost/shared/ui/`

- Accepts data via `input()`, emits events via `output()`
- No injected services (except UI-only services like animations)
- If used by only one feature, keep it in that feature's `ui/`
- If used across multiple features, move to `ost/shared/ui/`

---

## Decision Guide

| If the component...                                      | Type      | Suffix          | Lives in...          |
| -------------------------------------------------------- | --------- | --------------- | -------------------- |
| Is the target of a route definition                      | Page      | `PageComponent` | `feature-{name}/ui/` |
| Injects a repo or manages state                          | Container | `Component`     | `feature-{name}/ui/` |
| Only uses `input()` and `output()`, used by one feature  | Presenter | `Component`     | `feature-{name}/ui/` |
| Only uses `input()` and `output()`, used across features | Presenter | `Component`     | `ost/shared/ui/`     |
| Reusable across apps                                     | Presenter | `Component`     | `shared/ui/`         |
