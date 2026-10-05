import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { ITwelveMonthCalendar, SampleDataRepository, TwelveMonthStatus } from '@osse/shared/data-access';

const STATUS_CLASS: Record<TwelveMonthStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700'
};

const ACTION_LABEL: Partial<Record<TwelveMonthStatus, string>> = {
  'Under Review': 'Review',
  Draft: 'Continue'
};

@Component({
  selector: 'osse-twelve-month-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">12-Month Calendars</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Export started')">Export</button>
          <button pButton type="button" (click)="notify('New 12-month calendar form would open here')">+ New 12-Month Calendar</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">12-Month Calendars</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">12</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Approved</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-emerald-600">8</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Avg Instructional Days</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">238</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Avg Total Hours</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">1,450</div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Year-Round Calendar Overlap</h2>
        <p class="text-xs text-slate-500">July 2025 – June 2026 · Click calendar to view detail</p>

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
              @for (row of overlapRows; track row.school) {
                <tr>
                  <td class="pr-3 text-right text-xs font-medium" [class.text-slate-400]="!row.active" [class.text-slate-700]="row.active">{{ row.school }}</td>
                  @for (month of months; track month; let first = $first) {
                    <td class="h-7 text-center align-middle" [style.background]="row.active ? row.color + '22' : '#f1f5f9'">
                      @if (first) {
                        <span class="text-[11px] font-semibold" [style.color]="row.active ? row.color : '#94a3b8'">{{ row.active ? row.school : '' }}</span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          @for (row of overlapRows; track row.school) {
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" [style.background]="row.color"></span>
              {{ row.school }}
            </span>
          }
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="twelveMonthCalendars" [columnDefs]="columnDefs" [defaultColDef]="defaultColDef" />
      </div>
    </div>
  `
})
export class TwelveMonthPageComponent {
  private repo = inject(SampleDataRepository);
  readonly twelveMonthCalendars = this.repo.twelveMonthCalendars;
  readonly overlapRows = this.repo.twelveMonthOverlapRows;
  readonly months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

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
        const view = `<button type="button" class="p-button p-button-sm p-button-outlined p-button-secondary mr-1.5">View</button>`;
        const action = extra ? `<button type="button" class="p-button p-button-sm">${extra}</button>` : '';
        return view + action;
      }
    }
  ];

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
