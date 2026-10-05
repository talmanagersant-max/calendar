import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { IBellSchedule, SampleDataRepository } from '@osse/shared/data-access';

@Component({
  selector: 'osse-bell-schedule-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Bell Schedules</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Template imported')">Import Template</button>
          <button pButton type="button" (click)="notify('New schedule form would open here')">+ New Schedule</button>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="bellSchedules" [columnDefs]="columnDefs" [defaultColDef]="defaultColDef" />
      </div>
    </div>
  `
})
export class BellSchedulePageComponent {
  private repo = inject(SampleDataRepository);
  readonly bellSchedules = this.repo.bellSchedules;

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<IBellSchedule>[] = [
    { field: 'id', headerName: 'ID', width: 90, cellClass: 'font-mono text-slate-500' },
    {
      field: 'name',
      headerName: 'Schedule Name',
      flex: 1.3,
      minWidth: 160,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'level', headerName: 'Level', flex: 1, minWidth: 120 },
    { field: 'start', headerName: 'Start', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    { field: 'end', headerName: 'End', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    { field: 'totalMinutes', headerName: 'Total Min', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    {
      field: 'instrMinutes',
      headerName: 'Instr. Min',
      flex: 0.8,
      minWidth: 90,
      cellClass: (p) => `font-mono font-semibold ${p.value >= 300 ? 'text-emerald-600' : 'text-amber-600'}`
    },
    { field: 'schoolsUsing', headerName: 'Schools Using', flex: 1, minWidth: 110, cellClass: 'font-mono' },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 140,
      sortable: false,
      cellRenderer: () =>
        `<button type="button" class="p-button p-button-sm p-button-outlined p-button-secondary mr-1.5">Edit</button><button type="button" class="p-button p-button-sm p-button-text">Duplicate</button>`
    }
  ];

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
