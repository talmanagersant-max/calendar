import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IOverlapMonthRow, ITwelveMonthCalendar, TwelveMonthStatus, defaultRange, parseIsoDate } from '@osse/shared/data-access';
import { CalendarPermissionsService, ShellDataService, ToastService } from '@osse/shared/ui';

const STATUS_CLASS: Record<TwelveMonthStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700'
};

// Tailwind tone palette for the overlap chart (one tone per row).
const TONES = [
  { dot: 'bg-o-accent-600', cell: 'bg-o-accent-100', text: 'text-o-accent-700' },
  { dot: 'bg-emerald-600', cell: 'bg-emerald-100', text: 'text-emerald-700' },
  { dot: 'bg-violet-600', cell: 'bg-violet-100', text: 'text-violet-700' },
  { dot: 'bg-amber-600', cell: 'bg-amber-100', text: 'text-amber-700' },
  { dot: 'bg-o-secondary-600', cell: 'bg-o-secondary-100', text: 'text-o-secondary-700' },
  { dot: 'bg-o-primary-600', cell: 'bg-o-primary-100', text: 'text-o-primary-700' }
];

const ACTION_LABEL: Partial<Record<TwelveMonthStatus, string>> = {
  'Under Review': 'Review',
  Draft: 'Continue'
};

@Component({
  selector: 'osse-twelve-month-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">12-Month Calendars</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ syLabel() }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Export started')">Export</button>
          <button nz-button nzType="primary" type="button" [disabled]="!canCreateCalendars()" (click)="router.navigate(['/calendar/wizard'])">+ New 12-Month Calendar</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">12-Month Calendars</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ stats().total }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Approved</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-emerald-600">{{ stats().approved }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Avg Instructional Days</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ stats().avgDays }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Avg Total Hours</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ stats().avgHours }}</div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Year-Round Calendar Overlap</h2>
        <p class="text-xs text-slate-500">July {{ shell.cycleStart() }} – June {{ shell.cycleStart() + 1 }}</p>

        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[720px] border-separate border-spacing-y-1.5 text-xs">
            <thead>
              <tr class="text-slate-500">
                <th class="w-24"></th>
                @for (month of months; track month) {
                  <th class="pb-1 text-center font-medium">{{ month }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of overlapRows(); track row.school) {
                <tr>
                  <td class="max-w-[10rem] truncate pr-3 text-right text-xs font-medium text-slate-700" [title]="row.school">{{ row.school }}</td>
                  @for (month of monthNumbers; track month) {
                    <td class="h-7 align-middle" [class]="row.activeMonths.includes(month) ? tones[row.tone].cell : 'bg-slate-100'"></td>
                  }
                </tr>
              } @empty {
                <tr><td class="py-3 text-sm text-slate-500" [attr.colspan]="13">No 12-month calendars in this scope.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          @for (row of overlapRows(); track row.school) {
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" [class]="tones[row.tone].dot"></span>
              {{ row.school }}
            </span>
          }
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="twelveMonthCalendars()" [columnDefs]="columnDefs" [defaultColDef]="defaultColDef" />
      </div>
    </div>
  `
})
export class TwelveMonthPageComponent {
  readonly shell = inject(ShellDataService);
  readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly canCreateCalendars = inject(CalendarPermissionsService).canCreateCalendars;
  readonly tones = TONES;

  readonly syLabel = computed(() => `SY ${this.shell.cycleStart()}-${String((this.shell.cycleStart() + 1) % 100).padStart(2, '0')}`);

  readonly twelveMonthCalendars = computed<ITwelveMonthCalendar[]>(() => {
    const range = defaultRange('12-Month', this.shell.cycleStart());
    const fmt = (iso: string) => parseIsoDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return this.shell
      .twelveMonthCalendars()
      .filter((c) => c.status !== 'Missing')
      .map((c) => ({
        id: c.id,
        school: c.schoolName,
        lea: c.leaName,
        start: fmt(range.start),
        end: fmt(range.end),
        days: c.days ?? 0,
        totalHours: c.hours ?? 0,
        status: c.status === 'Approved' ? 'Approved' : c.status === 'Under Review' ? 'Under Review' : 'Draft'
      }));
  });

  readonly stats = computed(() => {
    const rows = this.twelveMonthCalendars();
    const built = rows.filter((r) => r.days > 0);
    const avg = (pick: (r: ITwelveMonthCalendar) => number) => (built.length ? Math.round(built.reduce((sum, r) => sum + pick(r), 0) / built.length) : 0);
    return { total: rows.length, approved: rows.filter((r) => r.status === 'Approved').length, avgDays: avg((r) => r.days), avgHours: avg((r) => r.totalHours).toLocaleString('en-US') };
  });

  readonly months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  /** Calendar months in July-June order, for the overlap columns. */
  readonly monthNumbers = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
  readonly overlapRows = computed<IOverlapMonthRow[]>(() =>
    this.twelveMonthCalendars()
      .slice(0, 6)
      .map((row, i) => ({ school: row.school, tone: i % TONES.length, activeMonths: row.status === 'Draft' ? [] : this.monthNumbers }))
  );

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<ITwelveMonthCalendar>[] = [
    { field: 'id', headerName: 'ID', flex: 1.1, minWidth: 130, cellClass: 'font-mono text-slate-500' },
    {
      field: 'school',
      headerName: 'School',
      flex: 1.3,
      minWidth: 160,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'lea', headerName: 'LEA', flex: 1, minWidth: 110 },
    { field: 'start', headerName: 'Start', flex: 1, minWidth: 110, cellClass: 'font-mono' },
    { field: 'end', headerName: 'End', flex: 1, minWidth: 110, cellClass: 'font-mono' },
    { field: 'days', headerName: 'Days', flex: 0.7, minWidth: 80, cellClass: 'font-mono' },
    { field: 'totalHours', headerName: 'Total Hours', flex: 0.9, minWidth: 100, cellClass: 'font-mono' },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { value: TwelveMonthStatus }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1.1,
      minWidth: 150,
      sortable: false,
      cellRenderer: (params: { data: ITwelveMonthCalendar }) => {
        const extra = ACTION_LABEL[params.data.status];
        const view = `<button type="button" class="ant-btn ant-btn-default ant-btn-sm btn-secondary mr-1.5">View</button>`;
        const action = extra ? `<button type="button" class="ant-btn ant-btn-primary ant-btn-sm">${extra}</button>` : '';
        return view + action;
      }
    }
  ];

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }
}
