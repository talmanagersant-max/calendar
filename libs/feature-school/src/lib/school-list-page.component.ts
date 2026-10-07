import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CalendarRegistryStatus, bellScheduleFor } from '@osse/shared/data-access';
import { CalendarPermissionsService, CurrentContextService, ShellDataService } from '@osse/shared/ui';

const PROGRAM_CLASS: Record<string, string> = {
  ESY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  '12-Month': 'border-amber-200 bg-amber-50 text-amber-700'
};

const STATUS_CLASS: Record<CalendarRegistryStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  Rejected: 'border-red-200 bg-red-50 text-red-700',
  Missing: 'border-red-200 bg-red-50 text-red-700'
};

interface ISiteRow {
  id: string;
  code: string;
  site: string;
  schoolId: string;
  school: string;
  address: string;
  gradeBand: string;
  programs: string[];
  bellSchedule: string;
  calendarStatus: CalendarRegistryStatus;
}

@Component({
  selector: 'osse-school-list-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Sites</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }} calendar status</p>
        </div>
        <span class="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
          <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
          Synced from SLIMS · read-only
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <input
          type="text"
          placeholder="Search school, site, or address..."
          [value]="search()"
          (input)="search.set($any($event.target).value)"
          class="form-control w-72"
        />
        <span class="text-sm text-slate-500">{{ rows().length }} site(s) in {{ shell.schoolsInScope().length }} school(s)</span>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="rows()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class SchoolListPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly context = inject(CurrentContextService);
  private readonly permissions = inject(CalendarPermissionsService);
  private readonly router = inject(Router);

  readonly search = signal('');

  readonly rows = computed<ISiteRow[]>(() => {
    const term = this.search().trim().toLowerCase();
    const calendars = this.shell.siteCalendars();
    const bells = new Map(this.shell.bellSchedules().map((b) => [b.id, b.name]));
    const esySites = new Set(this.shell.esyCalendars().map((c) => c.siteId));
    return this.shell
      .sitesInScope()
      .map(({ school, site }) => {
        const siteCalendars = calendars.filter((c) => c.siteId === site.id);
        const regular = siteCalendars.find((c) => c.type !== '12-Month') ?? siteCalendars[0];
        const programs = [...(esySites.has(site.id) ? ['ESY'] : []), ...(siteCalendars.some((c) => c.type === '12-Month') ? ['12-Month'] : [])];
        return {
          id: site.id,
          code: site.code,
          site: site.name,
          schoolId: school.id,
          school: school.name,
          address: site.address,
          gradeBand: school.gradeBand,
          programs,
          bellSchedule: bells.get(bellScheduleFor(school)) ?? '—',
          calendarStatus: regular?.status ?? 'Missing'
        };
      })
      .filter((row) => !term || [row.school, row.site, row.address].some((v) => v.toLowerCase().includes(term)));
  });

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<ISiteRow>[] = [
    { field: 'code', headerName: 'Site Code', width: 110, cellClass: 'font-mono text-slate-500' },
    {
      field: 'school',
      headerName: 'School',
      flex: 1.5,
      minWidth: 200,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'site', headerName: 'Site', flex: 0.9, minWidth: 130 },
    { field: 'address', headerName: 'Address', flex: 1.4, minWidth: 220, cellClass: 'text-o-ink-600' },
    { field: 'gradeBand', headerName: 'Grades', flex: 0.6, minWidth: 80, cellClass: 'font-mono' },
    {
      field: 'programs',
      headerName: 'Programs',
      flex: 0.9,
      minWidth: 120,
      cellRenderer: (params: { value: string[] }) =>
        params.value.length
          ? params.value.map((program) => `<span class="mr-1 inline-block rounded border px-1.5 py-0.5 align-middle text-[11px] font-medium leading-4 ${PROGRAM_CLASS[program]}">${program}</span>`).join('')
          : '<span class="text-slate-400">—</span>'
    },
    { field: 'bellSchedule', headerName: 'Bell Schedule', flex: 0.9, minWidth: 120 },
    {
      field: 'calendarStatus',
      headerName: 'Calendar',
      flex: 0.8,
      minWidth: 120,
      cellRenderer: (params: { value: CalendarRegistryStatus }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'action',
      headerName: '',
      width: 120,
      minWidth: 120,
      flex: 0,
      resizable: false,
      sortable: false,
      cellRenderer: () => (this.permissions.canCreateCalendars() ? `<button type="button" class="ant-btn ant-btn-primary ant-btn-sm">+ Calendar</button>` : '')
    }
  ];

  onCellClicked(event: CellClickedEvent<ISiteRow>): void {
    if (!event.data) return;
    if (event.colDef.field === 'school') {
      this.router.navigate(['/schools', event.data.id]);
    }
    if (event.colDef.colId === 'action' && this.permissions.canCreateCalendars()) {
      // Scope the shell to this school so the wizard opens straight on its sites.
      this.context.setSchool(event.data.schoolId);
      this.router.navigate(['/calendar/wizard']);
    }
  }
}
