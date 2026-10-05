import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import {
  DotRoutingSeverity,
  ICompliancePillar,
  IDotRoutingAlert,
  IMissingCalendarRow,
  IPendingApprovalRow,
  IQuickAction,
  MissingCalendarStatus,
  SampleDataRepository
} from '@osse/shared/data-access';
import { CalendarPermissionsService, StatusBadgeComponent, StatusBadgeTone } from '@osse/shared/ui';

const STATUS_TONE: Record<MissingCalendarStatus, StatusBadgeTone> = {
  Missing: 'warning',
  Overdue: 'danger',
  Draft: 'neutral'
};

function badgeHtml(label: string, tone: StatusBadgeTone): string {
  const classes: Record<StatusBadgeTone, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-red-200 bg-red-50 text-red-700',
    neutral: 'border-slate-200 bg-slate-50 text-slate-600'
  };
  return `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${classes[tone]}">${label}</span>`;
}

@Component({
  selector: 'osse-dashboard-v2-page',
  standalone: true,
  imports: [NgClass, AgGridAngular, ButtonModule, ProgressBarModule, ToastModule, StatusBadgeComponent],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />

    <div class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Calendar Management Dashboard</h1>
          <p class="mt-1 text-sm text-slate-500">School Year 2025–2026 · Updated Sep 16, 2025 at 8:42 AM</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" label="Export Report" icon="pi pi-download" [outlined]="true" severity="secondary" (click)="onExportReport()"></button>
          <button pButton type="button" label="New Calendar" icon="pi pi-plus" [disabled]="!canCreateCalendars()" (click)="onNewCalendar()"></button>
        </div>
      </div>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        @for (tile of statTiles; track tile.label) {
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <span class="text-xs text-slate-500">{{ tile.label }}</span>
            <div class="mt-1.5 font-mono text-2xl font-semibold" [ngClass]="tile.tone === 'warning' ? 'text-amber-600' : 'text-slate-900'">
              {{ tile.value }}
            </div>
            <div class="mt-1 text-xs" [ngClass]="tile.tone === 'warning' ? 'text-amber-600' : 'text-slate-500'">
              {{ tile.caption }}
            </div>
          </div>
        }
      </section>

      <section class="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Compliance Overview</h2>
              <p class="text-xs text-slate-500">SY 2025-26 · All LEAs</p>
            </div>
            <a href="javascript:void(0)" class="text-sm font-medium text-o-accent-600 hover:underline">View Full Report →</a>
          </div>

          <div class="mt-5 space-y-4">
            @for (pillar of compliancePillars; track pillar.label) {
              <div>
                <div class="mb-1.5 flex items-center justify-between text-sm">
                  <span class="font-medium text-slate-700">{{ pillar.label }}</span>
                  <span class="font-mono text-slate-500">{{ pillar.current }}/{{ pillar.total }}</span>
                </div>
                <p-progressBar [value]="pillarPercent(pillar)" [showValue]="false" [styleClass]="'tone-' + pillar.tone" />
              </div>
            }
          </div>

          <div class="mt-6 grid grid-cols-3 divide-x divide-slate-200 text-center">
            @for (rate of complianceRateSummary; track rate.label) {
              <div class="px-2">
                <div
                  class="font-mono text-2xl font-semibold"
                  [ngClass]="{
                    'text-emerald-600': rate.tone === 'success',
                    'text-o-accent-600': rate.tone === 'primary',
                    'text-red-600': rate.tone === 'danger'
                  }"
                >
                  {{ rate.value }}
                </div>
                <div class="mt-1 text-xs text-slate-500">{{ rate.label }}</div>
              </div>
            }
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <h2 class="text-base font-semibold text-slate-900">Quick Actions</h2>
          <ul class="mt-3 space-y-1">
            @for (action of quickActions; track action.label) {
              <li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm font-medium transition"
                  [ngClass]="action.highlighted ? 'bg-o-accent-50 text-o-accent-700' : 'text-slate-700 hover:bg-slate-50'"
                  (click)="onQuickAction(action)"
                >
                  <span class="flex items-center gap-2.5">
                    <i [class]="action.icon" class="w-4 text-center text-slate-400"></i>
                    {{ action.label }}
                  </span>
                  @if (action.count !== null) {
                    <span class="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">{{ action.count }}</span>
                  }
                </button>
              </li>
            }
          </ul>
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Compliance Alerts</h2>
        <p class="text-xs text-slate-500">Requires immediate attention</p>
        <div class="mt-3 space-y-2.5">
          @for (alert of complianceAlerts; track alert.id) {
            <div
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-sm"
              [ngClass]="alert.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'"
            >
              <span class="flex items-center gap-3">
                <i class="fa-solid" [ngClass]="alert.severity === 'critical' ? 'fa-circle-minus text-red-600' : 'fa-triangle-exclamation text-amber-600'"></i>
                {{ alert.message }}
              </span>
              <a href="javascript:void(0)" class="shrink-0 font-semibold underline" (click)="onAlertAction(alert.actionLabel)">{{ alert.actionLabel }} →</a>
            </div>
          }
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Missing &amp; Overdue Calendars</h2>
            <p class="text-xs text-slate-500">{{ missingCalendars.length }} calendars require action</p>
          </div>
          <a href="javascript:void(0)" class="text-sm font-medium text-o-accent-600 hover:underline">View All →</a>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="missingCalendars"
          [columnDefs]="missingColumnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onMissingGridClick($event)"
        />
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Pending Approvals</h2>
            <p class="text-xs text-slate-500">{{ pendingApprovals.length }} awaiting review</p>
          </div>
          <a href="javascript:void(0)" class="text-sm font-medium text-o-accent-600 hover:underline">View All →</a>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="pendingApprovals"
          [columnDefs]="approvalColumnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onApprovalGridClick($event)"
        />
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">DOT Routing Alerts</h2>
            <p class="text-xs text-slate-500">Requires coordination with DDOT</p>
          </div>
          <a href="javascript:void(0)" class="text-sm font-medium text-o-accent-600 hover:underline">View All →</a>
        </div>
        <div class="mt-3 grid gap-3 md:grid-cols-3">
          @for (alert of dotRoutingAlerts; track alert.id) {
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3.5">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full" [ngClass]="dotColor(alert.severity)"></span>
                <span class="font-semibold text-slate-900">{{ alert.school }}</span>
              </div>
              <p class="mt-1.5 text-sm text-slate-600">{{ alert.description }}</p>
              <oss-status-badge class="mt-2.5 inline-block" [label]="alert.severity" [tone]="severityToTone(alert.severity)" />
            </div>
          }
        </div>
      </section>
    </div>
  `
})
export class DashboardV2PageComponent {
  private readonly repo = inject(SampleDataRepository);
  private readonly messageService = inject(MessageService);
  private readonly permissionsService = inject(CalendarPermissionsService);
  private readonly router = inject(Router);

  readonly canCreateCalendars = this.permissionsService.canCreateCalendars;

  readonly header = this.repo.dashboardV2Header;
  readonly statTiles = this.repo.dashboardV2StatTiles;
  readonly compliancePillars = this.repo.compliancePillars;
  readonly complianceRateSummary = this.repo.complianceRateSummary;
  readonly quickActions = this.repo.quickActions;
  readonly complianceAlerts = this.repo.complianceAlerts;
  readonly missingCalendars = this.repo.missingCalendars;
  readonly pendingApprovals = this.repo.pendingApprovals;
  readonly dotRoutingAlerts = this.repo.dotRoutingAlerts;

  readonly defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    suppressMovable: true
  };

  readonly missingColumnDefs: ColDef<IMissingCalendarRow>[] = [
    { field: 'lea', headerName: 'LEA', flex: 1.3, minWidth: 160 },
    {
      field: 'school',
      headerName: 'School',
      flex: 1.3,
      minWidth: 160,
      cellRenderer: (params: { value: string }) => `<span class="font-semibold text-o-accent-600">${params.value}</span>`
    },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 120, cellClass: 'font-mono' },
    { field: 'dueDate', headerName: 'Due Date', flex: 1, minWidth: 120, cellClass: 'font-mono' },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 110,
      cellRenderer: (params: { value: MissingCalendarStatus }) => badgeHtml(params.value, STATUS_TONE[params.value])
    },
    {
      colId: 'action',
      headerName: '',
      width: 120,
      minWidth: 120,
      flex: 0,
      resizable: false,
      sortable: false,
      cellRenderer: () => `<button type="button" class="p-button p-button-sm">Create</button>`
    }
  ];

  readonly approvalColumnDefs: ColDef<IPendingApprovalRow>[] = [
    {
      field: 'id',
      headerName: 'ID',
      flex: 1.1,
      minWidth: 150,
      cellClass: 'font-mono',
      cellRenderer: (params: { value: string }) => `<span class="text-slate-500">${params.value}</span>`
    },
    {
      field: 'school',
      headerName: 'School',
      flex: 1.2,
      minWidth: 150,
      cellRenderer: (params: { value: string }) => `<span class="font-semibold text-o-accent-600">${params.value}</span>`
    },
    { field: 'type', headerName: 'Type', flex: 1, minWidth: 120, cellClass: 'font-mono' },
    { field: 'submittedDate', headerName: 'Submitted', flex: 1, minWidth: 130, cellClass: 'font-mono' },
    { field: 'reviewer', headerName: 'Reviewer', flex: 1, minWidth: 110 },
    {
      colId: 'action',
      headerName: '',
      width: 120,
      minWidth: 120,
      flex: 0,
      resizable: false,
      sortable: false,
      cellRenderer: () =>
        `<button type="button" class="p-button p-button-sm p-button-outlined p-button-secondary">Review</button>`
    }
  ];

  pillarPercent(pillar: ICompliancePillar): number {
    return Math.round((pillar.current / pillar.total) * 100);
  }

  dotColor(severity: DotRoutingSeverity): string {
    switch (severity) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-amber-500';
      default:
        return 'bg-o-accent-500';
    }
  }

  severityToTone(severity: DotRoutingSeverity): StatusBadgeTone {
    switch (severity) {
      case 'High':
        return 'danger';
      case 'Medium':
        return 'warning';
      default:
        return 'info';
    }
  }

  onBellClick(): void {
    this.messageService.add({ severity: 'info', summary: 'Notifications', detail: `${this.header.unreadNotifications} unread notifications` });
  }

  onExportReport(): void {
    this.messageService.add({ severity: 'success', summary: 'Export started', detail: 'Compliance report export was queued.' });
  }

  onNewCalendar(): void {
    this.router.navigate(['/calendar/create']);
  }

  onQuickAction(action: IQuickAction): void {
    this.messageService.add({ severity: 'info', summary: action.label, detail: action.count !== null ? `${action.count} item(s) affected.` : 'Action triggered.' });
  }

  onAlertAction(actionLabel: string): void {
    this.messageService.add({ severity: 'warn', summary: actionLabel, detail: 'Opening compliance detail view.' });
  }

  onMissingGridClick(event: CellClickedEvent<IMissingCalendarRow>): void {
    if (event.column.getColId() === 'action' && event.data) {
      this.router.navigate(['/calendar/create']);
    }
  }

  onApprovalGridClick(event: CellClickedEvent<IPendingApprovalRow>): void {
    if (event.column.getColId() === 'action' && event.data) {
      this.messageService.add({ severity: 'info', summary: 'Review opened', detail: `Reviewing ${event.data.id} for ${event.data.school}.` });
    }
  }
}
