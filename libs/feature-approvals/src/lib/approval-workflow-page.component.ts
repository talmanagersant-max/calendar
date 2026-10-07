import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ApprovalPriority, ChangeRequestStatus, IApprovalQueueRow, IChangeRequest, seeded } from '@osse/shared/data-access';
import { ConfirmService, NotificationFeedService, ShellDataService, ToastService } from '@osse/shared/ui';

const PRIORITY_CLASS: Record<ApprovalPriority, string> = {
  High: 'border-red-200 bg-red-50 text-red-700',
  Normal: 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Low: 'border-slate-200 bg-slate-50 text-slate-600'
};

const CR_STATUS_CLASS: Record<ChangeRequestStatus, string> = {
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

function complianceCellHtml(percent: number): string {
  const tone = percent >= 90 ? '#16a34a' : percent >= 75 ? '#d97706' : '#dc2626';
  return `<span class="font-mono text-sm font-semibold" style="color:${tone}">${percent}%</span>`;
}

@Component({
  selector: 'osse-approval-workflow-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Approval Workflow</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Assign reviewer dialog would open here')">Assign Reviewer</button>
          <button nz-button nzType="primary" type="button" [disabled]="approvalQueue().length === 0" (click)="bulkApproveAll()">Bulk Approve All</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-slate-900">{{ approvalQueue().length }}</div>
          <div class="mt-1 text-xs text-slate-500">Pending Review</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-o-accent-600">{{ openChangeRequests() }}</div>
          <div class="mt-1 text-xs text-slate-500">Open Change Requests</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-emerald-600">{{ approvedTodayCount() }}</div>
          <div class="mt-1 text-xs text-slate-500">Approved Today</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-slate-900">{{ approvedCount() }}</div>
          <div class="mt-1 text-xs text-slate-500">Approved ({{ shell.year().label }})</div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">Pending Approvals ({{ approvalQueue().length }})</h2>
          <select
            class="form-control-sm"
            [value]="reviewerFilter()"
            (change)="reviewerFilter.set($any($event.target).value)"
          >
            <option value="">All Reviewers</option>
            @for (reviewer of reviewers; track reviewer) {
              <option [value]="reviewer">{{ reviewer }}</option>
            }
          </select>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="visibleQueue()"
          [columnDefs]="approvalColumnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onApprovalCellClicked($event)"
        />
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Change Requests</h2>
        <p class="text-xs text-slate-500">Post-approval modifications</p>
        <div class="mt-3">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%;"
            domLayout="autoHeight"
            [rowData]="changeRequests()"
            [columnDefs]="changeRequestColumnDefs"
            [defaultColDef]="defaultColDef"
            (cellClicked)="onChangeRequestCellClicked($event)"
          />
        </div>
      </div>
    </div>
  `
})
export class ApprovalWorkflowPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmService = inject(ConfirmService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly reviewers = ['J. Torres', 'M. Park', 'Unassigned'];
  readonly reviewerFilter = signal('');

  // The queue is every scoped site calendar still Under Review; approving/rejecting updates the
  // shared calendar store, so the Dashboard, Registry and nav badges change with it.
  readonly approvalQueue = computed<IApprovalQueueRow[]>(() =>
    this.shell
      .siteCalendars()
      .filter((c) => c.status === 'Under Review')
      .map((c) => {
        const r = seeded(c.id + 'rev');
        const priority: ApprovalPriority = (c.compliancePercent ?? 100) < 100 ? 'High' : r < 0.6 ? 'Normal' : 'Low';
        return {
          id: c.id,
          school: c.schoolName,
          lea: c.leaName,
          type: c.type,
          days: c.days ?? 0,
          hours: c.hours ?? 0,
          compliancePercent: c.compliancePercent ?? 0,
          submitted: c.submittedDate ?? '—',
          assigned: this.reviewers[Math.floor(r * 3)],
          priority
        };
      })
  );
  readonly visibleQueue = computed(() => this.approvalQueue().filter((row) => !this.reviewerFilter() || row.assigned === this.reviewerFilter()));
  readonly changeRequests = this.shell.changeRequests;
  readonly openChangeRequests = computed(() => this.changeRequests().filter((cr) => cr.status !== 'Approved').length);
  readonly approvedCount = computed(() => this.shell.counts().approved);
  readonly approvedTodayCount = signal(0);

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly approvalColumnDefs: ColDef<IApprovalQueueRow>[] = [
    { field: 'id', headerName: 'Calendar ID', flex: 1.1, minWidth: 140, cellClass: 'font-mono text-slate-500' },
    {
      field: 'school',
      headerName: 'School',
      flex: 1.2,
      minWidth: 150,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'lea', headerName: 'LEA', flex: 0.9, minWidth: 100 },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 110 },
    { field: 'days', headerName: 'Days', flex: 0.6, minWidth: 70, cellClass: 'font-mono' },
    { field: 'hours', headerName: 'Hours', flex: 0.7, minWidth: 80, cellClass: 'font-mono' },
    { field: 'compliancePercent', headerName: 'Compliance', flex: 0.8, minWidth: 100, cellRenderer: (p: { value: number }) => complianceCellHtml(p.value) },
    { field: 'submitted', headerName: 'Submitted', flex: 0.8, minWidth: 100, cellClass: 'font-mono' },
    { field: 'assigned', headerName: 'Assigned', flex: 0.9, minWidth: 110 },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: { value: ApprovalPriority }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1.3,
      minWidth: 190,
      sortable: false,
      cellRenderer: () =>
        `<button type="button" data-act="approve" class="ant-btn ant-btn-primary ant-btn-sm btn-success mr-1.5"><i class="fa-solid fa-check mr-1"></i>Approve</button><button type="button" data-act="reject" class="ant-btn ant-btn-primary ant-btn-sm ant-btn-dangerous"><i class="fa-solid fa-xmark mr-1"></i>Reject</button>`
    }
  ];

  readonly changeRequestColumnDefs: ColDef<IChangeRequest>[] = [
    { field: 'id', headerName: 'Request ID', flex: 1, minWidth: 130, cellClass: 'font-mono text-slate-500' },
    { field: 'calendarId', headerName: 'Calendar', flex: 1, minWidth: 130, cellClass: 'font-mono' },
    { field: 'school', headerName: 'School', flex: 1.1, minWidth: 140, cellClass: 'font-semibold text-slate-900' },
    { field: 'changeType', headerName: 'Change Type', flex: 1.2, minWidth: 150 },
    { field: 'requested', headerName: 'Requested', flex: 0.9, minWidth: 100, cellClass: 'font-mono' },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      cellRenderer: (params: { value: ChangeRequestStatus }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${CR_STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 140,
      sortable: false,
      cellRenderer: (params: { data: IChangeRequest }) =>
        params.data.status === 'Approved'
          ? `<button type="button" data-act="view" class="ant-btn ant-btn-text ant-btn-sm">View</button>`
          : `<button type="button" data-act="approve" class="ant-btn ant-btn-primary ant-btn-sm btn-success mr-1.5">Approve</button><button type="button" data-act="view" class="ant-btn ant-btn-text ant-btn-sm">View</button>`
    }
  ];

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }

  private syncCalendarStatus(calendarId: string, status: 'Approved' | 'Rejected'): void {
    this.shell.updateCalendars([calendarId], { status });
  }

  onApprovalCellClicked(event: CellClickedEvent<IApprovalQueueRow>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'approve') this.approveOne(event.data);
    if (act === 'reject') this.rejectOne(event.data);
    if (event.colDef.field === 'school') this.router.navigate(['/calendar', event.data.id]);
  }

  private approveOne(row: IApprovalQueueRow): void {
    this.syncCalendarStatus(row.id, 'Approved');
    this.approvedTodayCount.update((v) => v + 1);
    this.toast.add({ severity: 'success', summary: 'Calendar approved', detail: `${row.school}'s ${row.type} calendar (${row.id}) was approved.` });
    this.notificationFeed.add({ title: 'Calendar approved', description: `${row.school}'s ${row.type} calendar was approved.`, category: 'Approval' });
  }

  private rejectOne(row: IApprovalQueueRow): void {
    this.confirmService.confirm({
      header: 'Reject this calendar?',
      message: `${row.school}'s ${row.type} calendar (${row.id}) will be sent back to the site as rejected.`,
      acceptLabel: 'Reject',
      rejectLabel: 'Cancel',
      danger: true,
      accept: () => {
        this.syncCalendarStatus(row.id, 'Rejected');
        this.toast.add({ severity: 'warn', summary: 'Calendar rejected', detail: `${row.school}'s ${row.type} calendar (${row.id}) was rejected.` });
        this.notificationFeed.add({ title: 'Calendar rejected', description: `${row.school}'s ${row.type} calendar was rejected and needs revision.`, category: 'Approval', highPriority: true });
      }
    });
  }

  bulkApproveAll(): void {
    const rows = this.visibleQueue();
    const count = rows.length;
    this.shell.updateCalendars(rows.map((row) => row.id), { status: 'Approved' });
    this.approvedTodayCount.update((v) => v + count);
    this.toast.add({ severity: 'success', summary: 'Bulk approve complete', detail: `${count} calendar(s) approved.` });
    this.notificationFeed.add({ title: 'Bulk approval complete', description: `${count} pending calendar(s) were approved in bulk.`, category: 'Approval' });
  }

  onChangeRequestCellClicked(event: CellClickedEvent<IChangeRequest>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'approve') {
      this.shell.setChangeRequestStatus(event.data.id, 'Approved');
      this.toast.add({ severity: 'success', summary: 'Change request approved', detail: `${event.data.changeType} for ${event.data.school} was approved.` });
      this.notificationFeed.add({ title: 'Change request approved', description: `${event.data.changeType} for ${event.data.school} was approved.`, category: 'Approval' });
    }
    if (act === 'view') {
      const hasCalendar = this.shell.calendarById(event.data.calendarId) !== null;
      if (hasCalendar) this.router.navigate(['/calendar', event.data.calendarId]);
      else this.notify(`${event.data.calendarId} has no calendar record to view.`);
    }
  }
}
