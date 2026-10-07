import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import {
  DotRoutingSeverity,
  IComplianceAlert,
  ICompliancePillar,
  IComplianceRateSummary,
  IDashboardV2StatTile,
  IDotRoutingAlert,
  IMissingCalendarRow,
  IPendingApprovalRow,
  IQuickAction,
  MissingCalendarStatus,
  seeded
} from '@osse/shared/data-access';
import { CalendarPermissionsService, ShellDataService, StatusBadgeComponent, StatusBadgeTone, ToastService, WaiverService } from '@osse/shared/ui';

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
  imports: [NgClass, RouterLink, AgGridAngular, NzButtonModule, NzProgressModule, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Calendar Management Dashboard</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.year().label }} · {{ shell.scopeLabel() }} · Updated {{ today }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="onExportReport()"><i class="fa-solid fa-download" aria-hidden="true"></i>Export Report</button>
          <button nz-button nzType="primary" type="button" [disabled]="!canCreateCalendars()" (click)="onNewCalendar()"><i class="fa-solid fa-plus" aria-hidden="true"></i>New Calendar</button>
        </div>
      </div>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        @for (tile of statTiles(); track tile.label) {
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
              <p class="text-xs text-slate-500">{{ shell.year().label }} · {{ shell.scopeLabel() }}</p>
            </div>
            <a routerLink="/compliance" class="text-sm font-medium text-o-accent-600 hover:underline">View Full Report →</a>
          </div>

          <div class="mt-5 space-y-4">
            @for (pillar of compliancePillars(); track pillar.label) {
              <div>
                <div class="mb-1.5 flex items-center justify-between text-sm">
                  <span class="font-medium text-slate-700">{{ pillar.label }}</span>
                  <span class="font-mono text-slate-500">{{ pillar.current }}/{{ pillar.total }}</span>
                </div>
                <nz-progress [nzPercent]="pillarPercent(pillar)" [nzShowInfo]="false" nzStatus="normal" nzSize="small" [class]="'tone-' + pillar.tone" />
              </div>
            }
          </div>

          <div class="mt-6 grid grid-cols-3 divide-x divide-slate-200 text-center">
            @for (rate of complianceRateSummary(); track rate.label) {
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
            @for (action of quickActions(); track action.label) {
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
          @for (alert of complianceAlerts(); track alert.id) {
            <div
              class="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-2.5 text-sm"
              [ngClass]="alert.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'"
            >
              <span class="flex items-center gap-3">
                <i class="fa-solid" [ngClass]="alert.severity === 'critical' ? 'fa-circle-minus text-red-600' : 'fa-triangle-exclamation text-amber-600'"></i>
                {{ alert.message }}
              </span>
              <a href="javascript:void(0)" class="shrink-0 font-semibold underline" (click)="onAlertAction(alert)">{{ alert.actionLabel }} →</a>
            </div>
          } @empty {
            <p class="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              <i class="fa-solid fa-circle-check mr-2 text-emerald-600" aria-hidden="true"></i>No compliance alerts for {{ shell.scopeLabel() }} in {{ shell.year().label }}.
            </p>
          }
        </div>
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Missing &amp; Overdue Calendars</h2>
            <p class="text-xs text-slate-500">{{ missingCalendars().length }} calendars require action</p>
          </div>
          <a routerLink="/calendar" class="text-sm font-medium text-o-accent-600 hover:underline">View All →</a>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="missingCalendars()"
          [columnDefs]="missingColumnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onMissingGridClick($event)"
        />
      </section>

      <section class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Pending Approvals</h2>
            <p class="text-xs text-slate-500">{{ pendingApprovals().length }} awaiting review</p>
          </div>
          <a routerLink="/approvals" class="text-sm font-medium text-o-accent-600 hover:underline">View All →</a>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="pendingApprovals()"
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
          <a routerLink="/dot-routing" class="text-sm font-medium text-o-accent-600 hover:underline">View All →</a>
        </div>
        <div class="mt-3 grid gap-3 md:grid-cols-3">
          @for (alert of dotRoutingAlerts(); track alert.id) {
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3.5">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full" [ngClass]="dotColor(alert.severity)"></span>
                <span class="font-semibold text-slate-900">{{ alert.school }}</span>
              </div>
              <p class="mt-1.5 text-sm text-slate-600">{{ alert.description }}</p>
              <oss-status-badge class="mt-2.5 inline-block" [label]="alert.severity" [tone]="severityToTone(alert.severity)" />
            </div>
          } @empty {
            <p class="text-sm text-slate-500 md:col-span-3">No open routing conflicts.</p>
          }
        </div>
      </section>
    </div>
  `
})
export class DashboardV2PageComponent {
  readonly shell = inject(ShellDataService);
  private readonly waiverService = inject(WaiverService);
  private readonly toast = inject(ToastService);
  private readonly permissionsService = inject(CalendarPermissionsService);
  private readonly router = inject(Router);

  readonly canCreateCalendars = this.permissionsService.canCreateCalendars;
  readonly today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  private percent(part: number, total: number): number {
    return total === 0 ? 0 : Math.round((part / total) * 100);
  }

  readonly statTiles = computed<IDashboardV2StatTile[]>(() => {
    const c = this.shell.counts();
    const year = this.shell.year().label;
    return [
      { label: 'Site Calendars', value: String(c.total - c.missing), caption: `${c.total} expected · ${year}`, icon: 'fa-solid fa-calendar-days', tone: 'neutral' },
      { label: 'Approved', value: String(c.approved), caption: `${this.percent(c.approved, c.total)}% of sites`, icon: 'fa-solid fa-circle-check', tone: 'positive' },
      { label: 'Pending Review', value: String(c.underReview), caption: 'Awaiting OSSE review', icon: 'fa-solid fa-hourglass-half', tone: 'neutral' },
      { label: 'Missing', value: String(c.missing), caption: `Due ${this.shell.dueDate()}`, icon: 'fa-solid fa-triangle-exclamation', tone: c.missing > 0 ? 'warning' : 'neutral' },
      { label: 'Schools', value: String(this.shell.schoolsInScope().length), caption: this.shell.lea()?.name ?? '', icon: 'fa-solid fa-school', tone: 'neutral' },
      { label: 'Sites', value: String(this.shell.sitesInScope().length), caption: this.shell.school() ? 'In this school' : 'Across all schools', icon: 'fa-solid fa-location-dot', tone: 'neutral' }
    ];
  });

  readonly compliancePillars = computed<ICompliancePillar[]>(() => {
    const c = this.shell.counts();
    return [
      { label: 'Calendars Submitted', current: c.submitted, total: c.total, tone: 'primary' },
      { label: 'Calendars Approved', current: c.approved, total: c.total, tone: 'success' },
      { label: 'Missing', current: c.missing, total: c.total, tone: 'danger' },
      { label: 'Below 180-Day Threshold', current: c.belowDays, total: c.total, tone: 'warning' }
    ];
  });

  readonly complianceRateSummary = computed<IComplianceRateSummary[]>(() => {
    const c = this.shell.counts();
    return [
      { label: 'Submission Rate', value: `${this.percent(c.submitted, c.total)}%`, tone: 'success' },
      { label: 'Approval Rate', value: `${this.percent(c.approved, c.total)}%`, tone: 'primary' },
      { label: 'At Risk', value: `${this.percent(c.missing + c.belowDays, c.total)}%`, tone: 'danger' }
    ];
  });

  readonly quickActions = computed<IQuickAction[]>(() => {
    const c = this.shell.counts();
    const esyPending = this.shell.esyCalendars().filter((cal) => cal.status === 'Under Review').length;
    const waivers = this.waiverService.waivers().filter((w) => w.status === 'Pending' || w.status === 'Under Review').length;
    return [
      { label: 'Review Pending Calendars', count: c.underReview, icon: 'fa-solid fa-clipboard-check', highlighted: false },
      { label: 'Send Deadline Reminders', count: c.missing, icon: 'fa-solid fa-paper-plane', highlighted: c.missing > 0 },
      { label: 'Approve ESY Calendars', count: esyPending, icon: 'fa-solid fa-sun', highlighted: false },
      { label: 'Process Waivers', count: waivers, icon: 'fa-solid fa-file-signature', highlighted: false },
      { label: 'Run Compliance Report', count: null, icon: 'fa-solid fa-chart-line', highlighted: false },
      { label: 'Upload Holiday Template', count: null, icon: 'fa-solid fa-file-arrow-up', highlighted: false }
    ];
  });

  readonly complianceAlerts = computed<IComplianceAlert[]>(() => {
    const c = this.shell.counts();
    const start = this.shell.cycleStart();
    const alerts: IComplianceAlert[] = [];
    if (c.belowDays > 0) alerts.push({ id: 'days', severity: 'critical', message: `${c.belowDays} site calendar(s) below the 180-day threshold — review required before Oct 15, ${start}.`, actionLabel: 'View' });
    if (c.belowHours > 0) alerts.push({ id: 'hours', severity: 'critical', message: `${c.belowHours} site calendar(s) below the 1080-hour requirement.`, actionLabel: 'View' });
    if (c.missing > 0 && this.shell.yearStatus() !== 'historical') {
      alerts.push({ id: 'missing', severity: 'warning', message: `${c.missing} site(s) have not submitted a ${this.shell.year().label} calendar — due ${this.shell.dueDate()}.`, actionLabel: 'Remind' });
    }
    return alerts;
  });

  readonly missingCalendars = computed<IMissingCalendarRow[]>(() => {
    const current = this.shell.yearStatus() === 'current';
    return this.shell
      .siteCalendars()
      .filter((cal) => cal.status === 'Missing' || cal.status === 'Draft')
      .map((cal) => ({
        id: cal.id,
        lea: cal.leaName,
        school: cal.schoolName,
        type: cal.type,
        dueDate: this.shell.dueDate(),
        status: cal.status === 'Draft' ? 'Draft' : current && seeded(cal.id + 'overdue') < 0.4 ? 'Overdue' : 'Missing'
      }));
  });

  readonly pendingApprovals = computed<IPendingApprovalRow[]>(() =>
    this.shell
      .siteCalendars()
      .filter((cal) => cal.status === 'Under Review')
      .map((cal) => ({ id: cal.id, school: cal.schoolName, type: cal.type, submittedDate: cal.submittedDate ?? '—', reviewer: seeded(cal.id + 'rev') < 0.5 ? 'J. Torres' : 'M. Park' }))
  );

  readonly dotRoutingAlerts = computed<IDotRoutingAlert[]>(() =>
    this.shell
      .routingConflicts()
      .filter((c) => c.status !== 'Resolved')
      .slice(0, 3)
      .map((c) => ({ id: c.id ?? c.school, school: c.school, description: c.issue, severity: c.severity }))
  );

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
      cellRenderer: () => `<button type="button" class="ant-btn ant-btn-primary ant-btn-sm">Create</button>`
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
        `<button type="button" class="ant-btn ant-btn-default ant-btn-sm btn-secondary">Review</button>`
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

  onExportReport(): void {
    this.toast.add({ severity: 'success', summary: 'Export started', detail: 'Compliance report export was queued.' });
  }

  onNewCalendar(): void {
    this.router.navigate(['/calendar/create']);
  }

  onQuickAction(action: IQuickAction): void {
    const routes: Record<string, string> = {
      'Review Pending Calendars': '/approvals',
      'Approve ESY Calendars': '/calendar/esy',
      'Process Waivers': '/waivers',
      'Run Compliance Report': '/reports',
      'Upload Holiday Template': '/calendar/holidays'
    };
    const route = routes[action.label];
    if (route) {
      this.router.navigate([route]);
      return;
    }
    this.toast.add({ severity: 'success', summary: action.label, detail: `Reminders queued for ${action.count ?? 0} site(s) in ${this.shell.scopeLabel()}.` });
  }

  onAlertAction(alert: IComplianceAlert): void {
    if (alert.id === 'missing') {
      this.toast.add({ severity: 'success', summary: 'Reminders sent', detail: `Deadline reminders sent to sites missing a ${this.shell.year().label} calendar.` });
      return;
    }
    this.router.navigate(['/compliance']);
  }

  onMissingGridClick(event: CellClickedEvent<IMissingCalendarRow>): void {
    if (event.column.getColId() === 'action' && event.data) {
      this.router.navigate(['/calendar/create']);
    }
  }

  onApprovalGridClick(event: CellClickedEvent<IPendingApprovalRow>): void {
    if (event.column.getColId() === 'action' && event.data) {
      this.router.navigate(['/calendar', event.data.id]);
    }
  }
}
