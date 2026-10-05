import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { EsyStatus, IEsyCalendar, SampleDataRepository } from '@osse/shared/data-access';

const STATUS_CLASS: Record<EsyStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Missing: 'border-red-200 bg-red-50 text-red-700'
};

@Component({
  selector: 'osse-esy-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Extended School Year (ESY) 2025</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Export started')">Export Report</button>
          <button pButton type="button" (click)="notify('New ESY calendar form would open here')">+ New ESY Calendar</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">ESY Calendars</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">48</div>
          <div class="mt-1 text-xs text-emerald-600">32 approved</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Students Served</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">1,204</div>
          <div class="mt-1 text-xs text-slate-500">IEP-eligible</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Avg ESY Hours</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">234</div>
          <div class="mt-1 text-xs text-slate-500">Target: 1080 combined</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Missing ESY</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-red-600">6</div>
          <div class="mt-1 text-xs text-red-600">Requires action</div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">ESY Calendars</h2>
            <select class="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-o-accent-500">
              <option>All LEAs</option>
            </select>
          </div>
          <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="esyCalendars" [columnDefs]="columnDefs" [defaultColDef]="defaultColDef" />
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">1080-Hour Compliance</h2>
            <a href="javascript:void(0)" class="text-xs font-medium text-o-accent-600 hover:underline">Compliance →</a>
          </div>
          <p class="text-xs text-slate-500">SY + ESY combined</p>

          <div class="mt-4 space-y-4">
            @for (row of esyCalendars; track row.id) {
              @if (row.syHours > 0) {
                <div>
                  <div class="text-sm font-medium text-slate-900">{{ row.school }}</div>
                  <div class="mt-1.5 h-1.5 w-full rounded-full bg-slate-200">
                    <div
                      class="h-1.5 rounded-full"
                      [style.width.%]="pct(row)"
                      [style.background]="pct(row) >= 100 ? '#16a34a' : '#1447e6'"
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
          <button pButton type="button" [outlined]="true" severity="secondary" class="mt-3 w-full" (click)="notify('Opening full compliance view')">View Full Compliance →</button>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">ESY Schedule Overlap — Summer 2025</h2>
        <p class="text-xs text-slate-500">Week-by-week by LEA</p>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full min-w-[520px] text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th class="py-2 pr-4 font-medium">Week</th>
                @for (lea of leaColumns; track lea) {
                  <th class="py-2 pr-4 font-medium">{{ lea }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (week of esyOverlapWeeks; track week.week) {
                <tr class="border-b border-slate-100">
                  <td class="py-2 pr-4 font-mono text-slate-700">{{ week.week }}</td>
                  @for (lea of leaColumns; track lea) {
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
  private repo = inject(SampleDataRepository);
  readonly esyCalendars = this.repo.esyCalendars;
  readonly esyOverlapWeeks = this.repo.esyOverlapWeeks;
  readonly leaColumns = ['DCPS', 'KIPP DC', 'Achievement Prep'];

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
        const color = pct >= 100 ? '#16a34a' : '#1447e6';
        return `<div class="pt-1.5"><div class="h-1.5 w-20 rounded-full bg-slate-200"><div class="h-1.5 rounded-full" style="width:${pct}%;background:${color}"></div></div><div class="mt-1 font-mono text-[11px] text-slate-500">${total}/${params.data.targetHours}h</div></div>`;
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
          ? `<button type="button" class="p-button p-button-sm">Create</button>`
          : `<button type="button" class="p-button p-button-sm p-button-text">View</button>`
    }
  ];

  pct(row: IEsyCalendar): number {
    return Math.min(100, Math.round(((row.syHours + row.hours) / row.targetHours) * 100));
  }

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
