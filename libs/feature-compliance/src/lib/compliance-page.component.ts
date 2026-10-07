import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ComplianceFlag, IComplianceRing, IComplianceViolation, IEarlyDismissalRow, ViolationSeverity, ViolationStatus } from '@osse/shared/data-access';
import { NotificationFeedService, ShellDataService, ToastService, WaiverService } from '@osse/shared/ui';

const SEVERITY_CLASS: Record<ViolationSeverity, string> = {
  Critical: 'border-red-300 bg-red-100 text-red-800',
  High: 'border-amber-200 bg-amber-50 text-amber-700',
  Medium: 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Low: 'border-slate-200 bg-slate-50 text-slate-600'
};

const VIOLATION_STATUS_CLASS: Record<ViolationStatus, string> = {
  Open: 'border-red-200 bg-red-50 text-red-700',
  'Waiver Pending': 'border-amber-200 bg-amber-50 text-amber-700',
  Resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700'
};

const FLAG_CLASS: Record<ComplianceFlag, string> = {
  Compliant: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Violation: 'border-red-200 bg-red-50 text-red-700'
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'osse-compliance-page',
  standalone: true,
  imports: [NgClass, RouterLink, AgGridAngular, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Compliance Dashboard</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Export started')">Export Report</button>
          <button nz-button nzType="primary" type="button" (click)="notify('Compliance check running')">Run Compliance Check</button>
        </div>
      </div>

      @if (criticalCount() > 0) {
        <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          <span class="flex items-center gap-2">
            <i class="fa-solid fa-circle-minus text-red-600" aria-hidden="true"></i>
            {{ criticalCount() }} site(s) have critical violations requiring action before Oct 15, {{ shell.cycleStart() }}.
          </span>
          <a href="javascript:void(0)" class="shrink-0 font-semibold underline" (click)="notify('Schools notified')">Notify Schools →</a>
        </div>
      }

      <div class="grid gap-4 md:grid-cols-2">
        @for (ring of complianceRings(); track ring.label) {
          <div class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-slate-900">{{ ring.label }}</h2>
                <p class="text-xs text-slate-500">{{ ring.subtitle }}</p>
              </div>
              <a routerLink="/reports" class="text-xs font-medium text-o-accent-600 hover:underline">Report →</a>
            </div>

            <div class="mt-4 flex items-center gap-6">
              <svg width="120" height="120" viewBox="0 0 120 120" class="shrink-0 -rotate-90">
                <circle cx="60" cy="60" [attr.r]="radius" fill="none" class="stroke-slate-200" stroke-width="10" />
                <circle
                  cx="60"
                  cy="60"
                  [attr.r]="radius"
                  fill="none"
                  [attr.class]="ring.ringClass"
                  stroke-width="10"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="circumference"
                  [attr.stroke-dashoffset]="ringOffset(ring)"
                />
                <text x="60" y="60" text-anchor="middle" dominant-baseline="middle" style="transform-origin:60px 60px" font-family="DM Mono, monospace" font-size="20" font-weight="600" class="rotate-90 fill-slate-900">
                  {{ ring.current }}
                </text>
                <text x="60" y="78" text-anchor="middle" dominant-baseline="middle" style="transform-origin:60px 60px" font-family="DM Mono, monospace" font-size="10" class="rotate-90 fill-slate-500">
                  / {{ ring.total }}
                </text>
              </svg>

              <div class="flex-1 space-y-2 text-sm">
                @for (bucket of ring.buckets; track bucket.label) {
                  <div class="flex items-center justify-between">
                    <span class="text-slate-600">{{ bucket.label }}</span>
                    <span class="font-mono" [ngClass]="bucketClass(bucket.tone)">{{ bucket.count }}/{{ ring.total }}</span>
                  </div>
                  <div class="h-1 w-full rounded-full bg-slate-100">
                    <div class="h-1 rounded-full" [style.width.%]="ring.total ? (bucket.count / ring.total) * 100 : 0" [ngClass]="bucketBarClass(bucket.tone)"></div>
                  </div>
                }
              </div>
            </div>

            <p class="mt-3 text-xs text-slate-500">{{ ring.percentLabel }}</p>
          </div>
        }
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <h2 class="text-base font-semibold text-slate-900">Early Dismissal Impact</h2>
        <p class="text-xs text-slate-500">Effect on instructional minutes · Max 20 days allowed</p>
        <div class="mt-3">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%;"
            domLayout="autoHeight"
            [rowData]="earlyDismissalImpact()"
            [columnDefs]="dismissalColumnDefs"
            [defaultColDef]="defaultColDef"
            (cellClicked)="onDismissalCellClicked($event)"
          />
        </div>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Compliance Violations</h2>
            <p class="text-xs text-slate-500">{{ openViolationCount() }} open violation(s)</p>
          </div>
          <button nz-button nzType="default" class="btn-secondary" type="button" nzSize="small" (click)="notify('Export started')">Export</button>
        </div>
        <div class="mt-3">
          <ag-grid-angular
            class="ag-theme-alpine"
            style="width: 100%;"
            domLayout="autoHeight"
            [rowData]="complianceViolations()"
            [columnDefs]="violationColumnDefs"
            [defaultColDef]="defaultColDef"
            (cellClicked)="onViolationCellClicked($event)"
          />
        </div>
      </div>
    </div>
  `
})
export class CompliancePageComponent {
  readonly shell = inject(ShellDataService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly waiverService = inject(WaiverService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly earlyDismissalImpact = this.shell.earlyDismissalImpact;
  readonly complianceViolations = this.shell.complianceViolations;
  readonly openViolationCount = computed(() => this.complianceViolations().filter((v) => v.status === 'Open').length);
  readonly criticalCount = computed(() => this.complianceViolations().filter((v) => v.status === 'Open' && v.severity === 'Critical').length);

  // Rings cover every scoped site calendar that has days built (missing/draft calendars are
  // reported as violations instead of skewing the percentages).
  readonly complianceRings = computed<IComplianceRing[]>(() => {
    const built = this.shell.siteCalendars().filter((c) => c.days !== null && c.hours !== null && !c.type.startsWith('ESY'));
    const total = built.length;
    const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '0%');
    const days = (min: number, max: number) => built.filter((c) => (c.days ?? 0) >= min && (c.days ?? 0) <= max).length;
    const hours = (min: number, max: number) => built.filter((c) => (c.hours ?? 0) >= min && (c.hours ?? 0) <= max).length;
    const meetsDays = days(180, Infinity);
    const meetsHours = hours(1080, Infinity);
    const subtitle = `${this.shell.year().label} · ${total} site calendar(s) with days built`;
    return [
      {
        label: '180-Day Compliance',
        subtitle,
        current: meetsDays,
        total,
        percentLabel: `${pct(meetsDays)} of built calendars meet the 180-day requirement`,
        ringClass: 'stroke-emerald-600',
        buckets: [
          { label: '≥ 180 days', count: meetsDays, tone: 'success' },
          { label: '175-179 days', count: days(175, 179), tone: 'warning' },
          { label: '< 175 days', count: days(0, 174), tone: 'danger' }
        ]
      },
      {
        label: '1080-Hour Compliance',
        subtitle,
        current: meetsHours,
        total,
        percentLabel: `${pct(meetsHours)} of built calendars meet the 1080-hour requirement`,
        ringClass: 'stroke-o-accent-600',
        buckets: [
          { label: '≥ 1080 hours', count: meetsHours, tone: 'success' },
          { label: '1000-1079 hours', count: hours(1000, 1079), tone: 'warning' },
          { label: '< 1000 hours', count: hours(0, 999), tone: 'danger' }
        ]
      }
    ];
  });

  readonly radius = RADIUS;
  readonly circumference = CIRCUMFERENCE;

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly dismissalColumnDefs: ColDef<IEarlyDismissalRow>[] = [
    { field: 'school', headerName: 'School', flex: 1.3, minWidth: 150, cellClass: 'font-semibold text-slate-900' },
    { field: 'days', headerName: 'Early Dismissal Days', flex: 1, minWidth: 150, cellClass: (p) => `font-mono ${p.value > 20 ? 'text-red-600 font-semibold' : ''}` },
    {
      field: 'minutesImpact',
      headerName: 'Instr. Min Impact',
      flex: 1,
      minWidth: 130,
      cellClass: (p) => `font-mono ${p.data?.flag === 'Violation' ? 'text-red-600 font-semibold' : ''}`
    },
    {
      field: 'flag',
      headerName: 'Compliant (≤20 days)',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: { value: ComplianceFlag }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${FLAG_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      minWidth: 170,
      sortable: false,
      cellRenderer: (params: { data: IEarlyDismissalRow }) =>
        params.data.flag === 'Violation'
          ? `<button type="button" data-act="waiver" class="ant-btn ant-btn-primary ant-btn-sm btn-warning mr-1.5">Submit Waiver</button><button type="button" data-act="edit" class="ant-btn ant-btn-default ant-btn-sm btn-secondary">Edit Calendar</button>`
          : ''
    }
  ];

  readonly violationColumnDefs: ColDef<IComplianceViolation>[] = [
    {
      field: 'school',
      headerName: 'School',
      flex: 1.2,
      minWidth: 150,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'issue', headerName: 'Issue', flex: 1.8, minWidth: 220 },
    { field: 'days', headerName: 'Days', flex: 0.6, minWidth: 70, cellClass: 'font-mono' },
    {
      field: 'severity',
      headerName: 'Severity',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: { value: ViolationSeverity }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[params.value]}">${params.value}</span>`
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 110,
      cellRenderer: (params: { value: ViolationStatus }) => `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${VIOLATION_STATUS_CLASS[params.value]}">${params.value}</span>`
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      minWidth: 170,
      sortable: false,
      cellRenderer: (params: { data: IComplianceViolation }) =>
        params.data.status === 'Resolved'
          ? ''
          : params.data.status === 'Waiver Pending'
            ? `<button type="button" data-act="waiver" class="ant-btn ant-btn-default ant-btn-sm btn-secondary">Waiver</button>`
            : `<button type="button" data-act="resolve" class="ant-btn ant-btn-primary ant-btn-sm mr-1.5">Resolve</button><button type="button" data-act="waiver" class="ant-btn ant-btn-default ant-btn-sm btn-secondary">Waiver</button>`
    }
  ];

  ringOffset(ring: IComplianceRing): number {
    const percent = ring.total ? ring.current / ring.total : 0;
    return CIRCUMFERENCE * (1 - percent);
  }

  bucketClass(tone: 'success' | 'warning' | 'danger'): string {
    return tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : 'text-red-600';
  }

  bucketBarClass(tone: 'success' | 'warning' | 'danger'): string {
    return tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-red-500';
  }

  notify(message: string): void {
    this.toast.add({ severity: 'info', summary: message, detail: '' });
  }

  onDismissalCellClicked(event: CellClickedEvent<IEarlyDismissalRow>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'waiver') this.submitWaiverFor(event.data.school, event.data.schoolId ?? null, 'Early Dismissal');
    if (act === 'edit') this.editCalendarFor(event.data.schoolId ?? null);
  }

  onViolationCellClicked(event: CellClickedEvent<IComplianceViolation>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'waiver') this.submitWaiverFor(event.data.school, event.data.schoolId ?? null, event.data.issue);
    if (act === 'resolve') this.resolveViolation(event.data);
  }

  private submitWaiverFor(school: string, schoolId: string | null, type: string): void {
    const waiver = this.waiverService.submit({ school, schoolId, type });
    const ids = this.complianceViolations()
      .filter((v) => v.school === school && v.status === 'Open')
      .map((v) => v.id ?? '');
    this.shell.setViolationStatus(ids, 'Waiver Pending');
    this.toast.add({ severity: 'success', summary: 'Waiver drafted', detail: `${waiver.id} was created for ${school} and is now pending review on the Waivers page.` });
    this.notificationFeed.add({ title: 'Waiver drafted from compliance', description: `A ${type} waiver was drafted for ${school}.`, category: 'Compliance' });
  }

  private editCalendarFor(schoolId: string | null): void {
    const calendar = this.shell.siteCalendars().find((c) => c.schoolId === schoolId && c.status !== 'Missing');
    if (calendar) this.router.navigate(['/calendar', calendar.id]);
    else this.notify('No calendar has been built for this school yet.');
  }

  private resolveViolation(violation: IComplianceViolation): void {
    this.shell.setViolationStatus([violation.id ?? ''], 'Resolved');
    this.toast.add({ severity: 'success', summary: 'Violation resolved', detail: `${violation.issue} for ${violation.school} was marked resolved.` });
    this.notificationFeed.add({ title: 'Compliance violation resolved', description: `${violation.school}: ${violation.issue}`, category: 'Compliance' });
  }
}
