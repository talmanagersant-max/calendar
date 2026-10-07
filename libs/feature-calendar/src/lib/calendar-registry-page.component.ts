import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { calendarLevel, CalendarRegistryStatus, CalendarVisibility, ICalendarSchedule } from '@osse/shared/data-access';
import { CalendarPermissionsService, NotificationFeedService, ShellDataService, ToastService } from '@osse/shared/ui';

const STATUS_CLASS: Record<CalendarRegistryStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  Rejected: 'border-red-200 bg-red-50 text-red-700',
  Missing: 'border-amber-200 bg-amber-50 text-amber-700'
};

const ACTION_LABEL: Partial<Record<CalendarRegistryStatus, { label: string; classes: string }>> = {
  'Under Review': { label: 'Review', classes: 'bg-o-accent-600 hover:bg-o-accent-700' },
  Draft: { label: 'Continue', classes: 'bg-o-accent-600 hover:bg-o-accent-700' },
  Missing: { label: 'Remind', classes: 'bg-amber-600 hover:bg-amber-700' }
};

function complianceCellHtml(percent: number | null): string {
  if (percent === null) return '<span class="font-mono text-slate-400">—</span>';
  const tone = percent >= 90 ? '#16a34a' : percent >= 75 ? '#d97706' : '#dc2626';
  return `
    <div class="pt-2">
      <div class="h-1.5 w-24 rounded-full bg-slate-200"><div class="h-1.5 rounded-full" style="width:${percent}%;background:${tone}"></div></div>
      <div class="mt-1 font-mono text-xs" style="color:${tone}">${percent}%</div>
    </div>`;
}

function actionsCellHtml(data: ICalendarSchedule): string {
  const extra = ACTION_LABEL[data.status];
  const viewBtn = `<button type="button" data-act="view" class="ant-btn ant-btn-default ant-btn-sm btn-secondary mr-1.5">View</button>`;
  const dupBtn = `<button type="button" data-act="duplicate" class="ant-btn ant-btn-text ant-btn-sm mr-1.5">Duplicate</button>`;
  const extraBtn = extra ? `<button type="button" data-act="extra" class="ant-btn ant-btn-primary ant-btn-sm">${extra.label}</button>` : '';
  return viewBtn + dupBtn + extraBtn;
}

@Component({
  selector: 'osse-calendar-registry-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">All Calendars</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('CSV export started')">Export CSV</button>
          <label
            class="ant-btn ant-btn-default ant-btn-sm btn-secondary cursor-pointer"
            style="display:inline-flex;align-items:center"
          >
            Mass Upload
            <input type="file" accept=".csv,text/csv" class="sr-only" (change)="onMassUpload($any($event.target).files)" />
          </label>
          <button nz-button nzType="primary" type="button" [disabled]="!canCreateCalendars()" (click)="createCalendar()">+ Add Calendar</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        @for (tile of statTiles(); track tile.label) {
          <div class="rounded-lg border bg-white p-3 text-center" [class]="tile.borderClass">
            <div class="font-mono text-2xl font-semibold" [class]="tile.colorClass">{{ tile.value }}</div>
            <div class="mt-1 text-xs text-slate-500">{{ tile.label }}</div>
          </div>
        }
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            placeholder="Search calendar ID, school, or site..."
            class="form-control w-72"
          />
          <select
            [value]="termFilter()"
            (change)="termFilter.set($any($event.target).value)"
            class="form-control"
          >
            <option value="">All Terms</option>
            @for (term of termOptions(); track term) {
              <option [value]="term">{{ term }}</option>
            }
          </select>
          <select
            [value]="visibilityFilter()"
            (change)="visibilityFilter.set($any($event.target).value)"
            class="form-control"
          >
            <option value="">All Visibility</option>
            <option value="Public">Public</option>
            <option value="Non-public">Non-public</option>
          </select>
          <span class="ml-auto text-sm text-slate-500">{{ filteredCalendars().length }} total result(s)</span>
        </div>
      </div>

      @if (selectedIds().size > 0) {
        <div class="flex flex-wrap items-center gap-2.5 rounded-lg border border-o-primary-200 bg-o-primary-50 px-4 py-2.5">
          <span class="text-sm font-medium text-o-primary-800">{{ selectedIds().size }} selected</span>
          <button nz-button nzType="primary" type="button" nzSize="small" (click)="bulkApprove()">Approve Selected</button>
          <button nz-button nzType="default" type="button" nzSize="small" (click)="bulkMarkNonPublic()">Mark Non-Public</button>
          <button nz-button nzType="default" class="btn-secondary" type="button" nzSize="small" (click)="clearSelection()">Clear Selection</button>
        </div>
      }

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">LEA Level Calendars</h2>
          <span class="text-xs text-slate-500">{{ leaLevelCalendars().length }} result(s)</span>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="leaLevelCalendars()"
          [columnDefs]="leaColumnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="'multiple'"
          [suppressRowClickSelection]="true"
          (gridReady)="onLeaGridReady($event)"
          (selectionChanged)="onLeaSelectionChanged($event)"
          (cellClicked)="onCellClicked($event)"
        />
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Site Level Calendars</h2>
          <span class="text-xs text-slate-500">{{ siteLevelCalendars().length }} result(s)</span>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="siteLevelCalendars()"
          [columnDefs]="siteColumnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="'multiple'"
          [suppressRowClickSelection]="true"
          (gridReady)="onSiteGridReady($event)"
          (selectionChanged)="onSiteSelectionChanged($event)"
          (cellClicked)="onCellClicked($event)"
        />
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-900">Grade Level Calendars</h2>
          <span class="text-xs text-slate-500">{{ gradeLevelCalendars().length }} result(s)</span>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="gradeLevelCalendars()"
          [columnDefs]="gradeColumnDefs"
          [defaultColDef]="defaultColDef"
          [rowSelection]="'multiple'"
          [suppressRowClickSelection]="true"
          (gridReady)="onGradeGridReady($event)"
          (selectionChanged)="onGradeSelectionChanged($event)"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class CalendarRegistryPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly router = inject(Router);
  private readonly permissionsService = inject(CalendarPermissionsService);
  private readonly toast = inject(ToastService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly canCreateCalendars = this.permissionsService.canCreateCalendars;

  // LEA / School / School Year come from the top-nav shell; this page only adds search, term and visibility.
  private readonly calendarsSignal = this.shell.scopedCalendars;

  private readonly selectedLeaIds = signal<Set<string>>(new Set());
  private readonly selectedSiteIds = signal<Set<string>>(new Set());
  private readonly selectedGradeIds = signal<Set<string>>(new Set());
  readonly selectedIds = computed(() => new Set([...this.selectedLeaIds(), ...this.selectedSiteIds(), ...this.selectedGradeIds()]));

  private leaGridApi?: GridApi<ICalendarSchedule>;
  private siteGridApi?: GridApi<ICalendarSchedule>;
  private gradeGridApi?: GridApi<ICalendarSchedule>;

  readonly searchTerm = signal('');
  readonly termFilter = signal('');
  readonly visibilityFilter = signal('');

  readonly termOptions = computed(() => Array.from(new Set(this.calendarsSignal().map((c) => c.type))));

  readonly filteredCalendars = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.termFilter();
    const visibility = this.visibilityFilter();
    return this.calendarsSignal().filter((cal) => {
      if (term && !cal.id.toLowerCase().includes(term) && !cal.schoolName.toLowerCase().includes(term) && !cal.leaName.toLowerCase().includes(term)) return false;
      if (type && cal.type !== type) return false;
      if (visibility && cal.visibility !== visibility) return false;
      return true;
    });
  });

  readonly leaLevelCalendars = computed(() => this.filteredCalendars().filter((c) => calendarLevel(c) === 'LEA'));
  readonly siteLevelCalendars = computed(() => this.filteredCalendars().filter((c) => calendarLevel(c) === 'Site'));
  readonly gradeLevelCalendars = computed(() => this.filteredCalendars().filter((c) => calendarLevel(c) === 'Grade'));

  readonly statTiles = computed(() => {
    const all = this.calendarsSignal();
    const count = (status: CalendarRegistryStatus) => all.filter((c) => c.status === status).length;
    return [
      { label: 'Total', value: String(all.length), colorClass: 'text-slate-900', borderClass: 'border-o-accent-300' },
      { label: 'Approved', value: String(count('Approved')), colorClass: 'text-emerald-600', borderClass: 'border-slate-200' },
      { label: 'Under Review', value: String(count('Under Review')), colorClass: 'text-o-accent-600', borderClass: 'border-slate-200' },
      { label: 'Draft', value: String(count('Draft')), colorClass: 'text-amber-600', borderClass: 'border-slate-200' },
      { label: 'Rejected', value: String(count('Rejected')), colorClass: 'text-red-600', borderClass: 'border-slate-200' },
      { label: 'Missing', value: String(count('Missing')), colorClass: 'text-red-600', borderClass: 'border-slate-200' }
    ];
  });

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  private leaLabel(cal: ICalendarSchedule): string {
    const lea = this.shell.lea();
    return lea && lea.id === cal.leaId ? `${lea.name} (${lea.code})` : cal.leaName;
  }

  // LEA -> School -> Site: School is the directory campus, Site its physical building.
  private schoolLabel(siteId: string | null): string {
    const match = this.shell.findSite(siteId);
    return match ? `${match.school.name} (${match.school.code})` : '—';
  }

  private siteLabel(siteId: string | null): string {
    const match = this.shell.findSite(siteId);
    return match ? `${match.site.name} (${match.site.code})` : '—';
  }

  private readonly selectColumn: ColDef<ICalendarSchedule> = {
    colId: 'select',
    headerCheckboxSelection: true,
    checkboxSelection: true,
    width: 44,
    minWidth: 44,
    flex: 0,
    resizable: false,
    sortable: false
  };
  private readonly idColumn: ColDef<ICalendarSchedule> = {
    field: 'id',
    headerName: 'Calendar ID',
    flex: 1,
    minWidth: 150,
    cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-mono text-o-accent-600 hover:underline">${params.value}</span>`
  };
  private readonly leaColumn: ColDef<ICalendarSchedule> = {
    headerName: 'LEA Name (Code)',
    flex: 1.2,
    minWidth: 170,
    valueGetter: (p) => (p.data ? this.leaLabel(p.data) : '')
  };
  private readonly schoolColumn: ColDef<ICalendarSchedule> = {
    headerName: 'School Name (Code)',
    flex: 1.2,
    minWidth: 180,
    valueGetter: (p) => (p.data ? this.schoolLabel(p.data.siteId) : '')
  };
  private readonly siteColumn: ColDef<ICalendarSchedule> = {
    headerName: 'Site Name (Code)',
    flex: 1.2,
    minWidth: 180,
    valueGetter: (p) => (p.data ? this.siteLabel(p.data.siteId) : '')
  };
  private readonly gradeColumn: ColDef<ICalendarSchedule> = {
    field: 'grade',
    headerName: 'Grade',
    flex: 0.7,
    minWidth: 90,
    valueFormatter: (p) => p.value ?? '—'
  };
  private readonly termColumn: ColDef<ICalendarSchedule> = { field: 'type', headerName: 'Calendar Code', flex: 1, minWidth: 130 };
  private readonly visibilityColumn: ColDef<ICalendarSchedule> = {
    field: 'visibility',
    headerName: 'Visibility',
    flex: 0.9,
    minWidth: 110,
    cellRenderer: (params: { value: CalendarVisibility }) =>
      `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
        params.value === 'Public' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-o-secondary-200 bg-o-secondary-50 text-o-secondary-700'
      }">${params.value}</span>`
  };
  private readonly daysColumn: ColDef<ICalendarSchedule> = {
    field: 'days',
    headerName: 'Days',
    flex: 0.7,
    minWidth: 80,
    cellClass: (p) => `font-mono ${p.value !== null && p.value < 180 ? 'text-red-600 font-semibold' : ''}`,
    valueFormatter: (p) => (p.value === null ? '—' : String(p.value))
  };
  private readonly hoursColumn: ColDef<ICalendarSchedule> = {
    field: 'hours',
    headerName: 'Hours',
    flex: 0.8,
    minWidth: 90,
    cellClass: 'font-mono',
    valueFormatter: (p) => (p.value === null ? '—' : String(p.value))
  };
  private readonly complianceColumn: ColDef<ICalendarSchedule> = {
    field: 'compliancePercent',
    headerName: 'Compliance',
    flex: 1.1,
    minWidth: 130,
    cellRenderer: (params: { value: number | null }) => complianceCellHtml(params.value)
  };
  private readonly statusColumn: ColDef<ICalendarSchedule> = {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    minWidth: 120,
    cellRenderer: (params: { value: CalendarRegistryStatus }) =>
      `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
  };
  private readonly submittedColumn: ColDef<ICalendarSchedule> = {
    field: 'submittedDate',
    headerName: 'Submitted',
    flex: 0.9,
    minWidth: 100,
    cellClass: 'font-mono',
    valueFormatter: (p) => p.value ?? '—'
  };
  private readonly actionsColumn: ColDef<ICalendarSchedule> = {
    colId: 'actions',
    headerName: 'Actions',
    flex: 1.3,
    minWidth: 190,
    sortable: false,
    cellRenderer: (params: { data: ICalendarSchedule }) => actionsCellHtml(params.data)
  };

  readonly leaColumnDefs: ColDef<ICalendarSchedule>[] = [
    { ...this.selectColumn },
    { ...this.idColumn },
    { ...this.leaColumn },
    { ...this.termColumn },
    { ...this.visibilityColumn },
    { ...this.daysColumn },
    { ...this.hoursColumn },
    { ...this.complianceColumn },
    { ...this.statusColumn },
    { ...this.submittedColumn },
    { ...this.actionsColumn }
  ];

  readonly siteColumnDefs: ColDef<ICalendarSchedule>[] = [
    { ...this.selectColumn },
    { ...this.idColumn },
    { ...this.leaColumn },
    { ...this.schoolColumn },
    { ...this.siteColumn },
    { ...this.termColumn },
    { ...this.visibilityColumn },
    { ...this.daysColumn },
    { ...this.hoursColumn },
    { ...this.complianceColumn },
    { ...this.statusColumn },
    { ...this.submittedColumn },
    { ...this.actionsColumn }
  ];

  readonly gradeColumnDefs: ColDef<ICalendarSchedule>[] = [
    { ...this.selectColumn },
    { ...this.idColumn },
    { ...this.leaColumn },
    { ...this.schoolColumn },
    { ...this.siteColumn },
    { ...this.gradeColumn },
    { ...this.termColumn },
    { ...this.visibilityColumn },
    { ...this.daysColumn },
    { ...this.hoursColumn },
    { ...this.complianceColumn },
    { ...this.statusColumn },
    { ...this.submittedColumn },
    { ...this.actionsColumn }
  ];

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }

  createCalendar(): void {
    this.router.navigate(['/calendar/create']);
  }

  onCellClicked(event: CellClickedEvent<ICalendarSchedule>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];

    if (act === 'duplicate') {
      this.duplicateCalendar(event.data);
      return;
    }
    if (act === 'extra' && event.data.status === 'Missing') {
      this.toast.add({ severity: 'success', summary: 'Reminder sent', detail: `${event.data.schoolName} was reminded that its ${event.data.type} calendar is due ${this.shell.dueDate()}.` });
      return;
    }
    if (event.colDef.field === 'id' || (event.colDef.colId === 'actions' && (act === 'view' || act === 'extra'))) {
      this.openDetail(event.data.id);
    }
  }

  duplicateCalendar(calendar: ICalendarSchedule): void {
    this.router.navigate(['/calendar/wizard'], { queryParams: { cloneFrom: calendar.id } });
  }

  openDetail(calendarId: string): void {
    this.router.navigate(['/calendar', calendarId], { queryParams: { from: 'calendar', tab: 'registry' } });
  }

  onLeaGridReady(event: GridReadyEvent<ICalendarSchedule>): void {
    this.leaGridApi = event.api;
  }

  onSiteGridReady(event: GridReadyEvent<ICalendarSchedule>): void {
    this.siteGridApi = event.api;
  }

  onGradeGridReady(event: GridReadyEvent<ICalendarSchedule>): void {
    this.gradeGridApi = event.api;
  }

  onLeaSelectionChanged(event: SelectionChangedEvent<ICalendarSchedule>): void {
    this.selectedLeaIds.set(new Set(event.api.getSelectedRows().map((r) => r.id)));
  }

  onSiteSelectionChanged(event: SelectionChangedEvent<ICalendarSchedule>): void {
    this.selectedSiteIds.set(new Set(event.api.getSelectedRows().map((r) => r.id)));
  }

  onGradeSelectionChanged(event: SelectionChangedEvent<ICalendarSchedule>): void {
    this.selectedGradeIds.set(new Set(event.api.getSelectedRows().map((r) => r.id)));
  }

  clearSelection(): void {
    this.selectedLeaIds.set(new Set());
    this.selectedSiteIds.set(new Set());
    this.selectedGradeIds.set(new Set());
    this.leaGridApi?.deselectAll();
    this.siteGridApi?.deselectAll();
    this.gradeGridApi?.deselectAll();
  }

  bulkApprove(): void {
    const ids = this.selectedIds();
    this.shell.updateCalendars(ids, { status: 'Approved' });
    this.toast.add({ severity: 'success', summary: 'Bulk approve complete', detail: `${ids.size} calendar(s) marked Approved.` });
    this.clearSelection();
  }

  bulkMarkNonPublic(): void {
    const ids = this.selectedIds();
    this.shell.updateCalendars(ids, { visibility: 'Non-public' });
    this.toast.add({ severity: 'success', summary: 'Visibility updated', detail: `${ids.size} calendar(s) marked Non-public.` });
    this.clearSelection();
  }

  // Mass Uploads: a client-side CSV of `calendarId,date,dayType` rows. There's no
  // persisted per-day store to write into yet, so a valid row re-submits that
  // calendar for review (status -> Under Review, lastUpdated -> today) rather than
  // silently pretending to rewrite day-level data that doesn't exist as a table.
  onMassUpload(files: FileList | null): void {
    const file = files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const dataLines = lines[0]?.toLowerCase().startsWith('calendarid') ? lines.slice(1) : lines;
      const touchedIds = new Set<string>();
      let skipped = 0;

      for (const line of dataLines) {
        const [calendarId, date, dayType] = line.split(',').map((cell) => cell.trim());
        const exists = this.calendarsSignal().some((cal) => cal.id === calendarId);
        if (calendarId && date && dayType && exists) {
          touchedIds.add(calendarId);
        } else {
          skipped++;
        }
      }

      if (touchedIds.size > 0) {
        this.shell.updateCalendars(touchedIds, { status: 'Under Review' });
        this.notificationFeed.add({
          title: 'Mass upload processed',
          description: `${touchedIds.size} calendar(s) resubmitted for review from a bulk day-level upload.`,
          category: 'Compliance'
        });
      }

      this.toast.add({
        severity: touchedIds.size > 0 ? 'success' : 'error',
        summary: 'Mass upload processed',
        detail: `${touchedIds.size} calendar(s) updated, ${skipped} row(s) skipped (unknown calendar ID or malformed row).`
      });
    };
    reader.readAsText(file);
  }
}
