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

---

## Form Controls

All text inputs, selects and textareas share **one** style, defined once in
`apps/osse-calendar/src/styles.css` (the `Form controls` block). It mirrors the selectable
radio cards (e.g. the Calendar Type options in the create wizard), so fields and choice
cards line up in a form.

| Class             | Use for                                      | Height |
| ----------------- | -------------------------------------------- | ------ |
| `form-control`    | Default for every input / select / textarea  | 44px   |
| `form-control-sm` | Dense side panels and popovers only          | 36px   |

What the class provides: 2px `slate-300` border, `rounded-lg`, white background, `text-sm`,
`px-3`, `o-primary-300` border on hover, `o-primary-500` border + `o-primary-50` tint +
soft ring on focus (same look as a selected radio card), a muted disabled state, and an
identical select chevron in every browser.

### Rules

- **Do** add only layout utilities in templates: width (`w-full`, `w-72`, `max-w-sm`) and
  margin (`mt-1`, `mt-2`).
- **Don't** add borders, padding, height, `rounded`, text color, `outline`, `focus:` or
  `ring` classes to a field - change the shared CSS instead so every form stays consistent.
- **Don't** create page-level CSS for fields; there is one source of truth.
- Checkboxes and radios are not covered (they use the app-wide `accent-color`); the dark
  top-navigation selects are header chrome and intentionally styled separately.

```html
<label class="block text-sm font-medium text-slate-700">
  First Day
  <input type="date" class="form-control mt-2 w-full" />
</label>

<select class="form-control w-72">...</select>

<!-- compact, e.g. inside a popover -->
<input type="time" class="form-control-sm mt-1 w-full" />
```

### Selectable (radio / checkbox) cards

Choice cards use the matching spec so they sit flush next to fields:
`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm` (44px for one line of text).
Selected: `border-o-primary-500 bg-o-primary-50 text-o-primary-700`; unselected:
`border-slate-300 hover:border-o-primary-300`. Keep extra inline content (badges, codes) at
`leading-5` so a single-line card stays 44px.

All colors come from `tailwind.config.js` tokens - never hardcode colors (see styles.css).
