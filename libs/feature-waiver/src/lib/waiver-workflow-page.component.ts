import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IWaiver, WaiverStatus } from '@osse/shared/data-access';
import { ConfirmService, NotificationFeedService, ShellDataService, ToastService, WaiverService } from '@osse/shared/ui';

const STATUS_CLASS: Record<WaiverStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Rejected: 'border-o-secondary-200 bg-o-secondary-50 text-o-secondary-700'
};

const WAIVER_TYPES = ['Waiver to Reduce Instructional Time', 'Situational Distance Days Waiver', 'Weekly Half Day Waiver', 'ESY Hours', 'Early Dismissal', 'PD Days Limit'];

@Component({
  selector: 'osse-waiver-workflow-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Waiver Management</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }}</p>
        </div>
        <button nz-button nzType="primary" type="button" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ Submit Waiver' }}</button>
      </div>

      @if (showForm()) {
        <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-4" (submit)="submitWaiver($event, schoolSelect, typeSelect)">
          <label class="block text-sm font-medium text-slate-700 lg:col-span-2">
            School
            <select
              #schoolSelect
              required
              class="form-control mt-1 w-full"
            >
              @for (school of shell.schoolsInScope(); track school.id) {
                <option [value]="school.id">{{ school.name }}</option>
              }
            </select>
          </label>
          <label class="block text-sm font-medium text-slate-700 lg:col-span-2">
            Waiver Type
            <select
              #typeSelect
              class="form-control mt-1 w-full"
            >
              @for (type of waiverTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>
          <div class="lg:col-span-4">
            <button nz-button nzType="primary" type="submit">Submit for Review</button>
          </div>
        </form>
      }

      <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-slate-900">{{ stats().total }}</div>
          <div class="mt-1 text-xs text-slate-500">Total Waivers</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-emerald-600">{{ stats().approved }}</div>
          <div class="mt-1 text-xs text-slate-500">Approved</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-o-accent-600">{{ stats().underReview }}</div>
          <div class="mt-1 text-xs text-slate-500">Under Review</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-amber-600">{{ stats().pending }}</div>
          <div class="mt-1 text-xs text-slate-500">Pending</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-o-secondary-600">{{ stats().rejected }}</div>
          <div class="mt-1 text-xs text-slate-500">Rejected</div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="waivers()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class WaiverWorkflowPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly waiverService = inject(WaiverService);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly waiverTypes = WAIVER_TYPES;
  readonly showForm = signal(false);
  readonly waivers = this.waiverService.waivers;

  readonly stats = computed(() => {
    const all = this.waivers();
    return {
      total: all.length,
      approved: all.filter((w) => w.status === 'Approved').length,
      underReview: all.filter((w) => w.status === 'Under Review').length,
      pending: all.filter((w) => w.status === 'Pending').length,
      rejected: all.filter((w) => w.status === 'Rejected').length
    };
  });

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<IWaiver>[] = [
    { field: 'id', headerName: 'Waiver ID', flex: 1.1, minWidth: 140, cellClass: 'font-mono text-slate-500' },
    { field: 'school', headerName: 'School', flex: 1.2, minWidth: 150, cellClass: 'font-semibold text-slate-900' },
    { field: 'lea', headerName: 'LEA', flex: 0.9, minWidth: 100 },
    { field: 'type', headerName: 'Type', flex: 1.3, minWidth: 160 },
    { field: 'submitted', headerName: 'Submitted', flex: 1, minWidth: 120, cellClass: 'font-mono' },
    { field: 'reviewer', headerName: 'Reviewer', flex: 1, minWidth: 110 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { value: WaiverStatus }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    { field: 'resolved', headerName: 'Resolved', flex: 1, minWidth: 120, cellClass: 'font-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      colId: 'actions',
      headerName: '',
      flex: 1.2,
      minWidth: 170,
      sortable: false,
      cellRenderer: (params: { data: IWaiver }) =>
        params.data.status === 'Approved' || params.data.status === 'Rejected'
          ? ''
          : `<button type="button" data-act="approve" class="ant-btn ant-btn-primary ant-btn-sm btn-success mr-1.5">Approve</button><button type="button" data-act="reject" class="ant-btn ant-btn-primary ant-btn-sm ant-btn-dangerous">Reject</button>`
    }
  ];

  submitWaiver(event: SubmitEvent, schoolSelect: HTMLSelectElement, typeSelect: HTMLSelectElement): void {
    event.preventDefault();
    const target = this.shell.schoolsInScope().find((s) => s.id === schoolSelect.value);
    const type = typeSelect.value;
    if (!target) return;
    const school = target.name;

    const waiver = this.waiverService.submit({ school, schoolId: target.id, type });
    this.showForm.set(false);
    (event.target as HTMLFormElement).reset();
    this.toast.add({ severity: 'success', summary: 'Waiver submitted', detail: `${waiver.id} for ${school} is now pending review.` });
    this.notificationFeed.add({ title: 'Waiver submitted', description: `${school} submitted a ${type} waiver request.`, category: 'Compliance' });
  }

  onCellClicked(event: CellClickedEvent<IWaiver>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'approve') this.approve(event.data);
    if (act === 'reject') this.reject(event.data);
  }

  private approve(waiver: IWaiver): void {
    this.waiverService.setStatus(waiver.id, 'Approved');
    this.toast.add({ severity: 'success', summary: 'Waiver approved', detail: `${waiver.id} for ${waiver.school} was approved.` });
    this.notificationFeed.add({ title: 'Waiver approved', description: `${waiver.school}'s ${waiver.type} waiver was approved.`, category: 'Approval' });
  }

  private reject(waiver: IWaiver): void {
    this.confirmService.confirm({
      header: 'Reject this waiver?',
      message: `${waiver.school}'s "${waiver.type}" waiver will be marked rejected. This can't be undone.`,
      acceptLabel: 'Reject',
      rejectLabel: 'Cancel',
      danger: true,
      accept: () => {
        this.waiverService.setStatus(waiver.id, 'Rejected', 'J. Torres');
        this.toast.add({ severity: 'warn', summary: 'Waiver rejected', detail: `${waiver.id} for ${waiver.school} was rejected.` });
        this.notificationFeed.add({ title: 'Waiver rejected', description: `${waiver.school}'s ${waiver.type} waiver was rejected and needs revision.`, category: 'Approval', highPriority: true });
      }
    });
  }
}
