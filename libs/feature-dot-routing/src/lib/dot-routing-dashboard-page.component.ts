import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IEarlyDismissalSchedule, INonInstructionalDay, IRoutingConflict, RoutingConflictStatus } from '@osse/shared/data-access';
import { NotificationFeedService, ShellDataService, ToastService } from '@osse/shared/ui';

const SEVERITY_CLASS: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700',
  Medium: 'border-amber-200 bg-amber-50 text-amber-700',
  Low: 'border-slate-200 bg-slate-50 text-slate-600'
};

const CONFLICT_STATUS_CLASS: Record<RoutingConflictStatus, string> = {
  Open: 'border-red-200 bg-red-50 text-red-700',
  'In Progress': 'border-amber-200 bg-amber-50 text-amber-700',
  Resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

@Component({
  selector: 'osse-dot-routing-dashboard-page',
  standalone: true,
  imports: [AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">DOT Routing Management</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Export started')">Export to DDOT</button>
          <button nz-button nzType="primary" type="button" (click)="notifyAllDdot()">Notify All DDOT</button>
        </div>
      </div>

      @if (stats().open > 0) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-600" aria-hidden="true"></i>
            {{ stats().open }} unresolved routing conflict(s) require DDOT notification.
          </span>
          <a href="javascript:void(0)" class="shrink-0 font-semibold underline" (click)="notifyAllDdot()">Notify All →</a>
        </div>
      }

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-red-600">{{ stats().open }}</div>
          <div class="mt-1 text-xs text-slate-500">Open Conflicts</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-amber-600">{{ stats().unnotified }}</div>
          <div class="mt-1 text-xs text-slate-500">Unnotified Dismissals</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-o-accent-600">{{ stats().routes }}</div>
          <div class="mt-1 text-xs text-slate-500">Active Routes</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div class="font-mono text-2xl font-semibold text-emerald-600">{{ stats().schools }}</div>
          <div class="mt-1 text-xs text-slate-500">Schools Covered</div>
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Routing Conflicts</h2>
        <p class="text-xs text-slate-500">Requires DDOT coordination</p>
        <div class="mt-3">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%;"
            domLayout="autoHeight"
            [rowData]="routingConflicts()"
            [columnDefs]="conflictColumnDefs"
            [defaultColDef]="defaultColDef"
            (cellClicked)="onConflictCellClicked($event)"
          />
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <h2 class="text-base font-semibold text-slate-900">Upcoming Early Dismissals</h2>
          <p class="text-xs text-slate-500">DDOT notification required</p>
          <div class="mt-3">
            <ag-grid-angular
              class="ag-theme-alpine"
              style="width: 100%;"
              domLayout="autoHeight"
              [rowData]="upcomingDismissals()"
              [columnDefs]="dismissalColumnDefs"
              [defaultColDef]="defaultColDef"
              (cellClicked)="onDismissalCellClicked($event)"
            />
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <h2 class="text-base font-semibold text-slate-900">Non-Instructional Days</h2>
          <p class="text-xs text-slate-500">Routing cancellations required</p>
          <div class="mt-3">
            <ag-grid-angular
              class="ag-theme-alpine"
              style="width: 100%;"
              domLayout="autoHeight"
              [rowData]="nonInstructionalDays()"
              [columnDefs]="nonInstructionalColumnDefs"
              [defaultColDef]="defaultColDef"
              (cellClicked)="onNonInstructionalCellClicked($event)"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class DotRoutingDashboardPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly toast = inject(ToastService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly routingConflicts = this.shell.routingConflicts;
  readonly upcomingDismissals = this.shell.upcomingDismissals;
  readonly nonInstructionalDays = this.shell.nonInstructionalDays;

  readonly stats = computed(() => {
    const schools = this.shell.schoolsInScope().filter((s) => s.grades[0] !== 'Adult');
    return {
      open: this.routingConflicts().filter((c) => c.status !== 'Resolved').length,
      unnotified: this.upcomingDismissals().filter((d) => !d.notified).length,
      // Mock estimate: a couple of DDOT routes per school plus two per site.
      routes: schools.reduce((sum, s) => sum + 2 + s.sites.length * 2, 0),
      schools: schools.length
    };
  });

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly conflictColumnDefs: ColDef<IRoutingConflict>[] = [
    {
      field: 'school',
      headerName: 'School',
      flex: 1.1,
      minWidth: 130,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'issue', headerName: 'Issue', flex: 2.2, minWidth: 260 },
    { field: 'routes', headerName: 'Affected Routes', flex: 1, minWidth: 130, cellClass: 'font-mono' },
    {
      field: 'severity',
      headerName: 'Severity',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: { value: string }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[params.value]}">${params.value}</span>`
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 110,
      cellRenderer: (params: { value: RoutingConflictStatus }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${CONFLICT_STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1.3,
      minWidth: 190,
      sortable: false,
      cellRenderer: (params: { data: IRoutingConflict }) => {
        if (params.data.status === 'Resolved') return '';
        const notify = `<button type="button" data-act="notify" class="ant-btn ant-btn-primary ant-btn-sm mr-1.5">Notify DDOT</button>`;
        const resolve = `<button type="button" data-act="resolve" class="ant-btn ant-btn-default ant-btn-sm btn-secondary">Resolve</button>`;
        return notify + resolve;
      }
    }
  ];

  readonly dismissalColumnDefs: ColDef<IEarlyDismissalSchedule>[] = [
    { field: 'school', headerName: 'School', flex: 1.2, minWidth: 130, cellClass: 'font-semibold text-slate-900' },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, cellClass: 'font-mono' },
    { field: 'dismissTime', headerName: 'Dismiss Time', flex: 0.9, minWidth: 100, cellClass: 'font-mono' },
    { field: 'routes', headerName: 'Routes', flex: 0.6, minWidth: 70, cellClass: 'font-mono' },
    {
      field: 'notified',
      headerName: 'DDOT Notified',
      flex: 0.9,
      minWidth: 110,
      cellRenderer: (p: { value: boolean }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${p.value ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}">${p.value ? 'Yes' : 'No'}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 130,
      sortable: false,
      cellRenderer: (p: { data?: IEarlyDismissalSchedule }) =>
        p.data?.notified ? '' : `<button type="button" data-act="notify" class="ant-btn ant-btn-primary ant-btn-sm">Notify DDOT</button>`
    }
  ];

  readonly nonInstructionalColumnDefs: ColDef<INonInstructionalDay>[] = [
    { field: 'schools', headerName: 'Schools', flex: 1.1, minWidth: 120, cellClass: 'font-semibold text-slate-900' },
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 110, cellClass: 'font-mono' },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 100 },
    { field: 'routes', headerName: 'Routes', flex: 1, minWidth: 110, cellClass: 'font-mono' },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1.1,
      minWidth: 140,
      cellRenderer: (p: { value: 'Notified' | 'Pending' }) =>
        p.value === 'Notified'
          ? `<span class="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Notified</span>`
          : `<span class="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span><button type="button" data-act="notify" class="ant-btn ant-btn-primary ant-btn-sm ml-1.5">Notify</button>`
    }
  ];

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }

  notifyAllDdot(): void {
    const openConflicts = this.routingConflicts().filter((c) => c.status !== 'Resolved');
    this.shell.setConflictStatus(
      this.routingConflicts().filter((c) => c.status === 'Open').map((c) => c.id ?? ''),
      'In Progress'
    );
    this.shell.markNotified([...this.upcomingDismissals().map((d) => d.id ?? ''), ...this.nonInstructionalDays().map((d) => d.id ?? '')]);
    this.toast.add({ severity: 'success', summary: 'All DDOT contacts notified', detail: `${openConflicts.length} conflict(s) and all pending dismissals/closures were flagged for DDOT.` });
    this.notificationFeed.add({ title: 'DDOT notified', description: `All open routing conflicts and pending schedules were flagged for DDOT.`, category: 'DOT Routing' });
  }

  onConflictCellClicked(event: CellClickedEvent<IRoutingConflict>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'notify') {
      if (event.data.status === 'Open') this.shell.setConflictStatus([event.data.id ?? ''], 'In Progress');
      this.toast.add({ severity: 'info', summary: 'DDOT notified', detail: `${event.data.school}'s routing conflict was flagged for DDOT.` });
      this.notificationFeed.add({ title: 'DDOT notified', description: `${event.data.school}: ${event.data.issue}`, category: 'DOT Routing' });
    }
    if (act === 'resolve') {
      this.shell.setConflictStatus([event.data.id ?? ''], 'Resolved');
      this.toast.add({ severity: 'success', summary: 'Conflict resolved', detail: `${event.data.school}'s routing conflict was marked resolved.` });
      this.notificationFeed.add({ title: 'Routing conflict resolved', description: `${event.data.school}: ${event.data.issue}`, category: 'DOT Routing' });
    }
  }

  onDismissalCellClicked(event: CellClickedEvent<IEarlyDismissalSchedule>): void {
    if (!event.data || event.event?.target === undefined) return;
    const act = (event.event.target as HTMLElement).dataset?.['act'];
    if (act === 'notify') {
      this.shell.markNotified([event.data.id ?? '']);
      this.toast.add({ severity: 'success', summary: 'DDOT notified', detail: `${event.data.school}'s early dismissal on ${event.data.date} was flagged for DDOT.` });
      this.notificationFeed.add({ title: 'DDOT notified of early dismissal', description: `${event.data.school}, ${event.data.date}`, category: 'DOT Routing' });
    }
  }

  onNonInstructionalCellClicked(event: CellClickedEvent<INonInstructionalDay>): void {
    if (!event.data || event.event?.target === undefined) return;
    const act = (event.event.target as HTMLElement).dataset?.['act'];
    if (act === 'notify') {
      this.shell.markNotified([event.data.id ?? '']);
      this.toast.add({ severity: 'success', summary: 'DDOT notified', detail: `${event.data.schools} closure on ${event.data.date} was flagged for DDOT.` });
      this.notificationFeed.add({ title: 'DDOT notified of closure', description: `${event.data.schools}, ${event.data.date}`, category: 'DOT Routing' });
    }
  }
}
