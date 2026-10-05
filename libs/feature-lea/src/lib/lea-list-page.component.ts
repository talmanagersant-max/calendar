import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { ILea, LeaSubmissionStatus, SampleDataRepository } from '@osse/shared/data-access';

const STATUS_CLASS: Record<LeaSubmissionStatus, string> = {
  Complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Partial: 'border-amber-200 bg-amber-50 text-amber-700',
  Incomplete: 'border-red-200 bg-red-50 text-red-700'
};

@Component({
  selector: 'osse-lea-list-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Local Education Agencies</h1>
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
            <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            Synced from SLIMS · read-only
          </span>
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Export started')">Export</button>
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Bulk reminder queued')">Send Bulk Reminder</button>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            placeholder="Search LEA name or ID..."
            class="w-72 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-o-accent-500"
          />
          <select class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-o-accent-500">
            <option>All Types</option>
            <option>Traditional</option>
            <option>Charter</option>
          </select>
        </div>
        <span class="text-sm text-slate-500">{{ leaList.length }} LEAs</span>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="leaList"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class LeaListPageComponent {
  private repo = inject(SampleDataRepository);
  private router = inject(Router);

  readonly leaList = this.repo.leaList;

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<ILea>[] = [
    { field: 'code', headerName: 'LEA ID', width: 100, cellClass: 'font-mono text-slate-500' },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.4,
      minWidth: 180,
      cellRenderer: (params: { value: string; data: ILea }) =>
        `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline" data-lea="${params.data.id}">${params.value}</span>`
    },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 110 },
    {
      headerName: 'Schools',
      field: 'schoolCount',
      flex: 0.8,
      minWidth: 90,
      cellClass: 'font-mono'
    },
    {
      headerName: 'Submitted',
      flex: 1,
      minWidth: 110,
      cellClass: 'font-mono',
      valueGetter: (p) => (p.data ? `${p.data.submittedCount}/${p.data.schoolCount}` : '')
    },
    {
      headerName: 'Approved',
      flex: 1,
      minWidth: 110,
      cellClass: 'font-mono',
      valueGetter: (p) => (p.data ? `${p.data.approvedCount}/${p.data.schoolCount}` : '')
    },
    { field: 'contact', headerName: 'Contact', flex: 1.1, minWidth: 130 },
    { field: 'deadline', headerName: 'Deadline', flex: 1, minWidth: 120, cellClass: 'font-mono' },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 110,
      cellRenderer: (params: { value: LeaSubmissionStatus }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
    }
  ];

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  onCellClicked(event: CellClickedEvent<ILea>): void {
    if (event.colDef.field === 'name' && event.data) {
      this.openDetail(event.data.id);
    }
  }

  openDetail(leaId: string): void {
    this.router.navigate(['/lea', leaId], { queryParams: { from: 'lea', tab: 'active' } });
  }
}
