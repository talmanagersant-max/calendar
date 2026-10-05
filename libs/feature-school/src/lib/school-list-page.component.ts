import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { ISchool, SampleDataRepository } from '@osse/shared/data-access';

const PROGRAM_CLASS: Record<string, string> = {
  SPED: 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  ESY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  '12-Month': 'border-amber-200 bg-amber-50 text-amber-700'
};

@Component({
  selector: 'osse-school-list-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Sites</h1>
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
            <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            Synced from SLIMS · read-only
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          placeholder="Search school..."
          class="w-72 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-o-accent-500"
        />
        <select class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-o-accent-500">
          <option>All LEAs</option>
        </select>
        <select class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-o-accent-500">
          <option>All Programs</option>
        </select>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="schoolList"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class SchoolListPageComponent {
  private repo = inject(SampleDataRepository);
  private router = inject(Router);

  readonly schoolList = this.repo.schoolList;
  readonly leaNameById = new Map(this.repo.leaList.map((lea) => [lea.id, lea.name]));

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<ISchool>[] = [
    { field: 'code', headerName: 'ID', width: 100, cellClass: 'font-mono text-slate-500' },
    {
      field: 'name',
      headerName: 'Site',
      flex: 1.3,
      minWidth: 170,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    {
      headerName: 'LEA',
      flex: 1,
      minWidth: 130,
      valueGetter: (p) => (p.data ? (this.leaNameById.get(p.data.leaId) ?? p.data.leaId) : '')
    },
    { field: 'gradeBand', headerName: 'Grades', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    {
      field: 'programs',
      headerName: 'Programs',
      flex: 1.4,
      minWidth: 170,
      cellRenderer: (params: { value: string[] }) =>
        params.value
          .map((program) => `<span class="mr-1 inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${PROGRAM_CLASS[program] ?? 'border-slate-200 bg-slate-50 text-slate-600'}">${program}</span>`)
          .join('')
    },
    { field: 'bellSchedule', headerName: 'Bell Schedule', flex: 1.1, minWidth: 130 },
    { field: 'calendarCount', headerName: 'Calendars', flex: 0.8, minWidth: 100, cellClass: 'font-mono' },
    {
      colId: 'action',
      headerName: '',
      width: 120,
      minWidth: 120,
      flex: 0,
      resizable: false,
      sortable: false,
      cellRenderer: () => `<button type="button" class="p-button p-button-sm">+ Calendar</button>`
    }
  ];

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  onCellClicked(event: CellClickedEvent<ISchool>): void {
    if (event.colDef.field === 'name' && event.data) {
      this.openDetail(event.data.id);
    }
  }

  openDetail(schoolId: string): void {
    this.router.navigate(['/schools', schoolId], { queryParams: { from: 'schools', tab: 'all' } });
  }
}
