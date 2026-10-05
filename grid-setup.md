# AG Grid Pagination Framework

How the grid framework simulates server-side pagination using AG Grid Community's client-side row model.

---

## The Problem

AG Grid Community only offers the client-side row model, which calculates page count from `rowData.length`. If you load 1 page of 20 rows but have 100 total records, AG Grid shows "Page 1 of 1" with no way to navigate forward.

## The Solution

Pad the `rowData` array to match the total record count with placeholder objects, then neutralize AG Grid's automatic sorting and filtering of those placeholders. The grid framework handles this transparently -- adapter authors just implement `fetchPage()`.

---

## How It Works

### Row Padding

When a page is fetched, `GridStateService.buildPaddedRows()` creates an array sized to `totalCount`. Real data occupies the current page's positions; everything else is a placeholder stamped with `__rowIndex` for position tracking.

Example with 100 total records, pageSize=20, currentPage=2:

```
positions 0-19:  placeholders (__rowIndex: 0-19)
positions 20-39: real data    (__rowIndex: 20-39)
positions 40-99: placeholders (__rowIndex: 40-99)
```

AG Grid sees 100 items and renders "Page 2 of 5."

### Preventing AG Grid from Processing Placeholders

Three mechanisms stop AG Grid from corrupting the padded data:

**postSortRows** -- After AG Grid sorts the array client-side, this callback re-sorts by `__rowIndex` to restore the original page positions. The actual sort is handled server-side via the adapter.

**isExternalFilterPresent / doesExternalFilterPass** -- Tells AG Grid an external filter is active and that all rows pass. This prevents AG Grid from hiding placeholder rows. The actual filter is handled server-side via the adapter.

**Fetching guard** -- When the service calls `gridApi.paginationGoToPage()` to sync the UI, AG Grid fires `paginationChanged` again. A `fetching` flag prevents this from triggering a recursive fetch loop.

### Event Interception

AG Grid events are intercepted and forwarded to the server:

| AG Grid Event                       | What happens                                             |
| ----------------------------------- | -------------------------------------------------------- |
| `sortChanged`                       | Extract sort model, reset to page 1, fetch from server   |
| `filterChanged`                     | Extract filter model, reset to page 1, fetch from server |
| `paginationChanged` (new page)      | Update current page, fetch from server                   |
| `paginationChanged` (new page size) | Update page size, reset to page 1, fetch from server     |

In all cases, AG Grid's built-in processing is bypassed -- the server handles sorting, filtering, and pagination.

---

## Dynamic Mode Switching

The framework automatically picks the best mode based on dataset size:

| Condition                 | Mode   | Behavior                                              |
| ------------------------- | ------ | ----------------------------------------------------- |
| `totalCount > threshold`  | Server | Padded rows, server-side sort/filter/pagination       |
| `totalCount <= threshold` | Client | All data loaded, AG Grid handles sort/filter natively |

Default threshold is 500 records (configurable per grid via `IGridConfig.threshold`).

When the initial fetch returns a small dataset, the service silently upgrades to client mode by fetching all records in the background. The user can interact with paginated data while this completes. Once done, all sort/filter/pagination operations happen locally.

---

## Integration

### Component Setup

Bind the service callbacks to AG Grid events and pass server-mode options:

```typescript
// Template
sortChanged =
  'gridState.getGridCallbacks().onSortChanged($event)'(filterChanged) =
  'gridState.getGridCallbacks().onFilterChanged($event)'(paginationChanged) =
  'gridState.getGridCallbacks().onPaginationChanged($event)'[postSortRows] =
  'serverModeOptions.postSortRows'[isExternalFilterPresent] =
  'serverModeOptions.isExternalFilterPresent'[doesExternalFilterPass] =
    'serverModeOptions.doesExternalFilterPass';
```

Register the `ExternalFilterModule`:

```typescript
import { ExternalFilterModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule, ExternalFilterModule]);
```

### Tabbed Grids

`TabbedGridStateService` manages multiple `GridStateService` instances, one per tab. Each tab maintains independent pagination, sort, and filter state.

---

## Adapters

Grid adapters bridge AG Grid and the API by extending `AbstractGridAdapter<T>` from `@shared/data-access`. The base class provides column-name mapping (camelCase AG Grid fields to snake_case DB columns) and sort/filter serialization. Concrete adapters define their `columnMap` and implement `fetchPage()`. The grid framework handles pagination, sorting, and filtering automatically.

```typescript
// feature-tickets-list/data-access/adapters/team-tickets-grid.adapter.ts
@Injectable({ providedIn: 'root' })
export class TeamTicketsGridAdapter extends AbstractGridAdapter<ITicketSummary> {
  private repo = inject(TeamTicketsRepository);

  protected columnMap: Record<string, string> = {
    aliasTicketId: 'alias_ticket_id',
    description: 'description',
    statusName: 'status_name',
    // ...
  };

  async fetchPage(request: IServerGridRequest): Promise<IPaginatedResponse<ITicketSummary>> {
    return firstValueFrom(
      this.repo.getTeamTickets(
        request.startRow,
        request.endRow,
        this.serializeSortModel(),
        this.serializeFilterModel(),
        // ...
      ),
    );
  }
}
```

Adapters are feature-internal and not exported from the barrel. They live in `feature-{name}/data-access/adapters/`.

---

## Code Locations

| File                                                                | Purpose                                            |
| ------------------------------------------------------------------- | -------------------------------------------------- |
| `libs/shared/ui/src/lib/grid/grid-state.service.ts`                 | Core state management, padding, event interception |
| `libs/shared/ui/src/lib/grid/tabbed-grid-state.service.ts`          | Multi-tab variant                                  |
| `libs/shared/data-access/src/lib/grid/abstract-grid-adapter.ts`     | Base adapter with column mapping and serialization |
| `libs/shared/data-access/src/lib/grid/interfaces/grid.interface.ts` | Type definitions                                   |
| `libs/shared/ui/src/lib/grid/grid-presets.ts`                       | Default grid configurations                        |
| `libs/shared/ui/src/lib/grid/grid-config.interface.ts`              | Grid config interface (threshold, page size)       |
| `feature-{name}/data-access/adapters/`                              | Domain-specific adapters                           |
