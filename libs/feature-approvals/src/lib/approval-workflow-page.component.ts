import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ApprovalPriority, ChangeRequestStatus, IApprovalQueueRow, IChangeRequest, SampleDataRepository } from '@osse/shared/data-access';
import { NotificationFeedService } from '@osse/shared/ui';

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
  imports: [AgGridAngular, ButtonModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />
    <p-confirmDialog />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Approval Workflow</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Assign reviewer dialog would open here')">Assign Reviewer</button>
          <button pButton type="button" [disabled]="approvalQueue().length === 0" (click)="bulkApproveAll()">Bulk Approve All</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-slate-900">{{ approvalQueue().length }}</div>
          <div class="mt-1 text-xs text-slate-500">Pending Review</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-o-accent-600">{{ inReviewCount() }}</div>
          <div class="mt-1 text-xs text-slate-500">In Review</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-emerald-600">{{ approvedTodayCount() }}</div>
          <div class="mt-1 text-xs text-slate-500">Approved Today</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-slate-900">3.2d</div>
          <div class="mt-1 text-xs text-slate-500">Avg Review Time</div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">Pending Approvals ({{ approvalQueue().length }})</h2>
          <select class="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-o-accent-500">
            <option>All Reviewers</option>
          </select>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="approvalQueue()"
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
  private readonly repo = inject(SampleDataRepository);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly approvalQueue = signal<IApprovalQueueRow[]>(this.repo.approvalQueue);
  readonly changeRequests = signal<IChangeRequest[]>(this.repo.changeRequests);

  readonly inReviewCount = computed(() => this.approvalQueue().length + 8);
  readonly approvedTodayCount = signal(6);

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
        `<button type="button" data-act="approve" class="p-button p-button-sm p-button-success mr-1.5"><i class="fa-solid fa-check mr-1"></i>Approve</button><button type="button" data-act="reject" class="p-button p-button-sm p-button-danger"><i class="fa-solid fa-xmark mr-1"></i>Reject</button>`
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
          ? `<button type="button" data-act="view" class="p-button p-button-sm p-button-text">View</button>`
          : `<button type="button" data-act="approve" class="p-button p-button-sm p-button-success mr-1.5">Approve</button><button type="button" data-act="view" class="p-button p-button-sm p-button-text">View</button>`
    }
  ];

  notify(message: string): void {
    this.messageService.add({ severity: 'info', summary: message, detail: '' });
  }

  private syncCalendarStatus(calendarId: string, status: 'Approved' | 'Rejected'): void {
    const match = this.repo.calendars.find((c) => c.id === calendarId);
    if (match) match.status = status;
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
    this.approvalQueue.update((list) => list.filter((r) => r.id !== row.id));
    this.syncCalendarStatus(row.id, 'Approved');
    this.approvedTodayCount.update((v) => v + 1);
    this.messageService.add({ severity: 'success', summary: 'Calendar approved', detail: `${row.school}'s ${row.type} calendar (${row.id}) was approved.` });
    this.notificationFeed.add({ title: 'Calendar approved', description: `${row.school}'s ${row.type} calendar was approved.`, category: 'Approval' });
  }

  private rejectOne(row: IApprovalQueueRow): void {
    this.confirmationService.confirm({
      header: 'Reject this calendar?',
      message: `${row.school}'s ${row.type} calendar (${row.id}) will be sent back to the site as rejected.`,
      acceptLabel: 'Reject',
      rejectLabel: 'Cancel',
      acceptIcon: 'pi pi-ban',
      rejectIcon: 'pi pi-times',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.approvalQueue.update((list) => list.filter((r) => r.id !== row.id));
        this.syncCalendarStatus(row.id, 'Rejected');
        this.messageService.add({ severity: 'warn', summary: 'Calendar rejected', detail: `${row.school}'s ${row.type} calendar (${row.id}) was rejected.` });
        this.notificationFeed.add({ title: 'Calendar rejected', description: `${row.school}'s ${row.type} calendar was rejected and needs revision.`, category: 'Approval', highPriority: true });
      }
    });
  }

  bulkApproveAll(): void {
    const rows = this.approvalQueue();
    const count = rows.length;
    rows.forEach((row) => this.syncCalendarStatus(row.id, 'Approved'));
    this.approvalQueue.set([]);
    this.approvedTodayCount.update((v) => v + count);
    this.messageService.add({ severity: 'success', summary: 'Bulk approve complete', detail: `${count} calendar(s) approved.` });
    this.notificationFeed.add({ title: 'Bulk approval complete', description: `${count} pending calendar(s) were approved in bulk.`, category: 'Approval' });
  }

  onChangeRequestCellClicked(event: CellClickedEvent<IChangeRequest>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'approve') {
      this.changeRequests.update((list) => list.map((cr) => (cr.id === event.data!.id ? { ...cr, status: 'Approved' as const } : cr)));
      this.messageService.add({ severity: 'success', summary: 'Change request approved', detail: `${event.data.changeType} for ${event.data.school} was approved.` });
      this.notificationFeed.add({ title: 'Change request approved', description: `${event.data.changeType} for ${event.data.school} was approved.`, category: 'Approval' });
    }
    if (act === 'view') {
      const hasCalendar = this.repo.calendars.some((c) => c.id === event.data!.calendarId);
      if (hasCalendar) this.router.navigate(['/calendar', event.data.calendarId]);
      else this.notify(`${event.data.calendarId} has no calendar record to view.`);
    }
  }
}
