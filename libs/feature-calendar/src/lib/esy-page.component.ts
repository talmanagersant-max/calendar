import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { EsyStatus, IEsyCalendar, defaultRange, parseIsoDate } from '@osse/shared/data-access';
import { CalendarPermissionsService, ShellDataService, ToastService } from '@osse/shared/ui';

const STATUS_CLASS: Record<EsyStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Missing: 'border-red-200 bg-red-50 text-red-700'
};

@Component({
  selector: 'osse-esy-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Extended School Year (ESY) {{ shell.cycleStart() }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · summer {{ shell.cycleStart() }}{{ shell.yearKind() === 'SY' ? ' (linked to ' + shell.year().label + ')' : '' }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Export started')">Export Report</button>
          <button nz-button nzType="primary" type="button" [disabled]="!canCreateCalendars()" (click)="newCalendar()">+ New ESY Calendar</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">ESY Calendars</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ stats().total }}</div>
          <div class="mt-1 text-xs text-emerald-600">{{ stats().approved }} approved</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">ESY Sites</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ stats().sites }}</div>
          <div class="mt-1 text-xs text-slate-500">Sites running ESY</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Avg ESY Hours</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ stats().avgHours }}</div>
          <div class="mt-1 text-xs text-slate-500">Target: 1080 combined</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Missing ESY</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-red-600">{{ stats().missing }}</div>
          <div class="mt-1 text-xs text-red-600">Requires action</div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">ESY Calendars</h2>

          </div>
          <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="esyCalendars()" [columnDefs]="columnDefs" [defaultColDef]="defaultColDef" />
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">1080-Hour Compliance</h2>
            <a href="javascript:void(0)" class="text-xs font-medium text-o-accent-600 hover:underline" (click)="router.navigate(['/compliance'])">Compliance →</a>
          </div>
          <p class="text-xs text-slate-500">SY + ESY combined</p>

          <div class="mt-4 space-y-4">
            @for (row of esyCalendars(); track row.id) {
              @if (row.syHours > 0) {
                <div>
                  <div class="text-sm font-medium text-slate-900">{{ row.school }}</div>
                  <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      class="h-1.5 rounded-full"
                      [style.width.%]="pct(row)"
                      [class.bg-emerald-600]="pct(row) >= 100"
                      [class.bg-o-accent-600]="pct(row) < 100"
                    ></div>
                  </div>
                  <div class="mt-1 flex justify-between font-mono text-xs text-slate-500">
                    <span>SY: {{ row.syHours }}h + ESY: {{ row.hours }}h</span>
                    <span>{{ row.syHours + row.hours }}/{{ row.targetHours }}h</span>
                  </div>
                </div>
              }
            }
          </div>

          <p class="mt-4 text-xs text-slate-500">Schools below 1080 hours may need additional ESY days to meet compliance.</p>
          <button nz-button nzType="default" type="button" class="btn-secondary mt-3 w-full" (click)="router.navigate(['/compliance'])">View Full Compliance →</button>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">ESY Schedule Overlap — Summer {{ shell.cycleStart() }}</h2>
        <p class="text-xs text-slate-500">Week-by-week by site{{ leaColumns().length < esyCalendars().length ? ' (first ' + leaColumns().length + ' shown)' : '' }}</p>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[520px] text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th class="py-2 pr-4 font-medium">Week</th>
                @for (lea of leaColumns(); track lea) {
                  <th class="py-2 pr-4 font-medium">{{ lea }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (week of esyOverlapWeeks(); track week.week) {
                <tr class="border-b border-slate-100">
                  <td class="py-2 pr-4 font-mono text-slate-700">{{ week.week }}</td>
                  @for (lea of leaColumns(); track lea) {
                    <td class="py-2 pr-4">
                      @if (week.leas[lea]) {
                        <span class="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">ESY</span>
                      } @else {
                        <span class="text-slate-300">—</span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class EsyPageComponent {
  readonly shell = inject(ShellDataService);
  readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly canCreateCalendars = inject(CalendarPermissionsService).canCreateCalendars;

  // One row per ESY site in scope for the cycle; syHours approximates the IEP student's regular-year
  // hours (mock: 78% of the site's SY calendar) toward the combined 1080-hour target.
  readonly esyCalendars = computed<IEsyCalendar[]>(() => {
    const syHours = new Map(this.shell.allCalendars().filter((c) => c.yearId === this.shell.syYearId() && c.type !== '12-Month').map((c) => [c.siteId, c.hours ?? 0]));
    const range = defaultRange('ESY', this.shell.cycleStart());
    const fmt = (iso: string) => parseIsoDate(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return this.shell.esyCalendars().map((c) => {
      const status: EsyStatus = c.status === 'Approved' ? 'Approved' : c.status === 'Missing' ? 'Missing' : 'Under Review';
      return {
        id: c.id,
        school: c.schoolName,
        lea: c.leaName,
        dates: `${fmt(range.start)} - ${fmt(range.end)}`,
        days: c.days ?? 0,
        hours: c.hours ?? 0,
        targetHours: 1080,
        syHours: status === 'Missing' ? 0 : Math.round((syHours.get(c.siteId) ?? 0) * 0.78),
        status
      };
    });
  });

  readonly stats = computed(() => {
    const rows = this.esyCalendars();
    const built = rows.filter((r) => r.hours > 0);
    return {
      total: rows.length,
      approved: rows.filter((r) => r.status === 'Approved').length,
      sites: new Set(this.shell.esyCalendars().map((c) => c.siteId)).size,
      avgHours: built.length ? Math.round(built.reduce((sum, r) => sum + r.hours, 0) / built.length) : 0,
      missing: rows.filter((r) => r.status === 'Missing').length
    };
  });

  /** Up to six sites as overlap columns. */
  readonly leaColumns = computed(() => this.esyCalendars().slice(0, 6).map((r) => r.school));

  readonly esyOverlapWeeks = computed(() => {
    const range = defaultRange('ESY', this.shell.cycleStart());
    const first = parseIsoDate(range.start);
    first.setDate(first.getDate() - 7);
    const columns = this.esyCalendars().slice(0, 6);
    return Array.from({ length: 8 }, (_, week) => {
      const from = new Date(first);
      from.setDate(first.getDate() + week * 7);
      const to = new Date(from);
      to.setDate(from.getDate() + 4);
      const label = `${from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${to.toLocaleDateString('en-US', { day: 'numeric' })}`;
      const leas: Record<string, boolean> = {};
      // Each site's session covers the standard ESY window, shifted a week earlier or later for some.
      columns.forEach((row, i) => {
        const shift = (row.id.length + i) % 3 === 0 ? -1 : (row.id.length + i) % 3 === 1 ? 0 : 1;
        leas[row.school] = row.status !== 'Missing' && week - 1 - shift >= 0 && week - 1 - shift < 6;
      });
      return { week: label, leas };
    });
  });

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<IEsyCalendar>[] = [
    { field: 'id', headerName: 'ID', flex: 1.1, minWidth: 130, cellClass: 'font-mono text-slate-500' },
    {
      field: 'school',
      headerName: 'School',
      flex: 1.2,
      minWidth: 150,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'lea', headerName: 'LEA', flex: 0.9, minWidth: 100 },
    { field: 'dates', headerName: 'Dates', flex: 1.1, minWidth: 130, cellClass: 'font-mono' },
    { field: 'days', headerName: 'Days', flex: 0.6, minWidth: 70, cellClass: 'font-mono' },
    { field: 'hours', headerName: 'ESY Hours', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    {
      headerName: '1080-Hr Progress',
      flex: 1.2,
      minWidth: 140,
      cellRenderer: (params: { data: IEsyCalendar }) => {
        const total = params.data.syHours + params.data.hours;
        if (total === 0) return '<span class="font-mono text-xs text-red-600">Not submitted</span>';
        const pct = Math.min(100, Math.round((total / params.data.targetHours) * 100));
        const tone = pct >= 100 ? 'bg-emerald-600' : 'bg-o-accent-600';
        return `<div class="pt-1.5"><div class="h-1.5 w-20 rounded-full bg-slate-200"><div class="h-1.5 rounded-full ${tone}" style="width:${pct}%"></div></div><div class="mt-1 font-mono text-[11px] text-slate-500">${total}/${params.data.targetHours}h</div></div>`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { value: EsyStatus }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'action',
      headerName: '',
      width: 100,
      minWidth: 100,
      flex: 0,
      sortable: false,
      resizable: false,
      cellRenderer: (params: { data: IEsyCalendar }) =>
        params.data.status === 'Missing'
          ? `<button type="button" class="ant-btn ant-btn-primary ant-btn-sm">Create</button>`
          : `<button type="button" class="ant-btn ant-btn-text ant-btn-sm">View</button>`
    }
  ];

  pct(row: IEsyCalendar): number {
    return Math.min(100, Math.round(((row.syHours + row.hours) / row.targetHours) * 100));
  }

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }

  newCalendar(): void {
    this.router.navigate(['/calendar/wizard']);
  }
}
