import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef, RowClassParams } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LEA_DIRECTORY, LeaSubmissionStatus } from '@osse/shared/data-access';
import { CurrentContextService, ShellDataService, ToastService } from '@osse/shared/ui';

const STATUS_CLASS: Record<LeaSubmissionStatus, string> = {
  Complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Partial: 'border-amber-200 bg-amber-50 text-amber-700',
  Incomplete: 'border-red-200 bg-red-50 text-red-700'
};

interface ILeaRow {
  id: string;
  code: string;
  name: string;
  schools: number;
  sites: number;
  submitted: number;
  approved: number;
  status: LeaSubmissionStatus;
  current: boolean;
}

@Component({
  selector: 'osse-lea-list-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Local Education Agencies</h1>
          <p class="mt-1 text-sm text-slate-500">
            Submission progress for {{ shell.year().label }} · selecting an LEA here switches the top navigation to it.
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
            <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            Synced from SLIMS · read-only
          </span>
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Export started')">Export</button>
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Bulk reminder queued for LEAs with missing calendars')">Send Bulk Reminder</button>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search LEA name or ID..."
          [value]="search()"
          (input)="search.set($any($event.target).value)"
          class="form-control w-72"
        />
        <span class="text-sm text-slate-500">{{ rows().length }} LEAs</span>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="rows()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          [getRowClass]="rowClass"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class LeaListPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly context = inject(CurrentContextService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly search = signal('');

  // Every LEA, with site-calendar progress for the selected School Year; the current shell LEA is pinned first.
  readonly rows = computed<ILeaRow[]>(() => {
    const yearId = this.shell.yearId();
    const currentId = this.shell.lea()?.id;
    const term = this.search().trim().toLowerCase();
    const calendars = this.shell.allCalendars().filter((c) => c.yearId === yearId && c.siteId !== null);
    return LEA_DIRECTORY.filter((lea) => !term || lea.name.toLowerCase().includes(term) || lea.code.includes(term))
      .map((lea) => {
        const leaCalendars = calendars.filter((c) => c.leaId === lea.id);
        const sites = lea.schools.reduce((sum, s) => sum + s.sites.length, 0);
        const submitted = leaCalendars.filter((c) => c.status === 'Approved' || c.status === 'Under Review').length;
        const approved = leaCalendars.filter((c) => c.status === 'Approved').length;
        const total = leaCalendars.length || sites;
        const status: LeaSubmissionStatus = approved === total ? 'Complete' : submitted > 0 ? 'Partial' : 'Incomplete';
        return { id: lea.id, code: lea.code, name: lea.name, schools: lea.schools.length, sites: total, submitted, approved, status, current: lea.id === currentId };
      })
      .sort((a, b) => Number(b.current) - Number(a.current));
  });

  readonly rowClass = (params: RowClassParams<ILeaRow>) => (params.data?.current ? 'bg-o-primary-50' : '');

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<ILeaRow>[] = [
    { field: 'code', headerName: 'LEA ID', width: 100, cellClass: 'font-mono text-slate-500' },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.6,
      minWidth: 220,
      cellRenderer: (params: { value: string; data: ILeaRow }) =>
        `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>${
          params.data.current ? ' <span class="ml-1 rounded border border-o-primary-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-o-primary-700">Current</span>' : ''
        }`
    },
    { field: 'schools', headerName: 'Schools', flex: 0.7, minWidth: 90, cellClass: 'font-mono' },
    { headerName: 'Submitted', flex: 0.9, minWidth: 110, cellClass: 'font-mono', valueGetter: (p) => (p.data ? `${p.data.submitted}/${p.data.sites}` : '') },
    { headerName: 'Approved', flex: 0.9, minWidth: 110, cellClass: 'font-mono', valueGetter: (p) => (p.data ? `${p.data.approved}/${p.data.sites}` : '') },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 110,
      cellRenderer: (params: { value: LeaSubmissionStatus }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
    }
  ];

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }

  onCellClicked(event: CellClickedEvent<ILeaRow>): void {
    if (event.colDef.field === 'name' && event.data) {
      this.context.setLea(event.data.id);
      this.router.navigate(['/lea', event.data.id]);
    }
  }
}
