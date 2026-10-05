import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ComplianceFlag, IComplianceRing, IComplianceViolation, IEarlyDismissalRow, SampleDataRepository, ViolationSeverity, ViolationStatus } from '@osse/shared/data-access';
import { NotificationFeedService, WaiverService } from '@osse/shared/ui';

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
  imports: [NgClass, AgGridAngular, ButtonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Compliance Dashboard</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Export started')">Export Report</button>
          <button pButton type="button" (click)="notify('Compliance check running')">Run Compliance Check</button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
        <span class="flex items-center gap-2"><i class="fa-solid fa-circle-minus text-red-600"></i>3 schools have critical violations requiring action before Oct 15, 2025.</span>
        <a href="javascript:void(0)" class="shrink-0 font-semibold underline" (click)="notify('LEAs notified')">Notify LEAs →</a>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        @for (ring of complianceRings; track ring.label) {
          <div class="rounded-lg border border-slate-200 bg-white p-5">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-semibold text-slate-900">{{ ring.label }}</h2>
                <p class="text-xs text-slate-500">{{ ring.subtitle }}</p>
              </div>
              <a href="javascript:void(0)" class="text-xs font-medium text-o-accent-600 hover:underline">Report →</a>
            </div>

            <div class="mt-4 flex items-center gap-6">
              <svg width="120" height="120" viewBox="0 0 120 120" class="shrink-0 -rotate-90">
                <circle cx="60" cy="60" [attr.r]="radius" fill="none" stroke="#e2e8f0" stroke-width="10" />
                <circle
                  cx="60"
                  cy="60"
                  [attr.r]="radius"
                  fill="none"
                  [attr.stroke]="ring.ringColor"
                  stroke-width="10"
                  stroke-linecap="round"
                  [attr.stroke-dasharray]="circumference"
                  [attr.stroke-dashoffset]="ringOffset(ring)"
                />
                <text x="60" y="60" text-anchor="middle" dominant-baseline="middle" class="rotate-90" style="transform-origin:60px 60px" font-family="DM Mono, monospace" font-size="20" font-weight="600" fill="#0f172a">
                  {{ ring.current }}
                </text>
                <text x="60" y="78" text-anchor="middle" dominant-baseline="middle" class="rotate-90" style="transform-origin:60px 60px" font-family="DM Mono, monospace" font-size="10" fill="#64748b">
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
                    <div class="h-1 rounded-full" [style.width.%]="(bucket.count / ring.total) * 100" [ngClass]="bucketBarClass(bucket.tone)"></div>
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
            <p class="text-xs text-slate-500">{{ complianceViolations().length }} open violations</p>
          </div>
          <button pButton type="button" [outlined]="true" severity="secondary" size="small" (click)="notify('Export started')">Export</button>
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
  private readonly repo = inject(SampleDataRepository);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly waiverService = inject(WaiverService);
  private readonly notificationFeed = inject(NotificationFeedService);

  readonly itemList = this.repo.complianceItems;
  readonly complianceRings = this.repo.complianceRings;
  readonly earlyDismissalImpact = signal<IEarlyDismissalRow[]>(this.repo.earlyDismissalImpact);
  readonly complianceViolations = signal<IComplianceViolation[]>(this.repo.complianceViolations);

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
          ? `<button type="button" data-act="waiver" class="p-button p-button-sm p-button-warning mr-1.5">Submit Waiver</button><button type="button" data-act="edit" class="p-button p-button-sm p-button-outlined p-button-secondary">Edit Calendar</button>`
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
            ? `<button type="button" data-act="waiver" class="p-button p-button-sm p-button-outlined p-button-secondary">Waiver</button>`
            : `<button type="button" data-act="resolve" class="p-button p-button-sm mr-1.5">Resolve</button><button type="button" data-act="waiver" class="p-button p-button-sm p-button-outlined p-button-secondary">Waiver</button>`
    }
  ];

  ringOffset(ring: IComplianceRing): number {
    const percent = ring.current / ring.total;
    return CIRCUMFERENCE * (1 - percent);
  }

  bucketClass(tone: 'success' | 'warning' | 'danger'): string {
    return tone === 'success' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : 'text-red-600';
  }

  bucketBarClass(tone: 'success' | 'warning' | 'danger'): string {
    return tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-red-500';
  }

  notify(message: string): void {
    this.messageService.add({ severity: 'info', summary: message, detail: '' });
  }

  onDismissalCellClicked(event: CellClickedEvent<IEarlyDismissalRow>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'waiver') this.submitWaiverFor(event.data.school, 'Early Dismissal');
    if (act === 'edit') this.editCalendarFor(event.data.school);
  }

  onViolationCellClicked(event: CellClickedEvent<IComplianceViolation>): void {
    if (!event.data) return;
    const target = event.event?.target as HTMLElement | undefined;
    const act = target?.dataset?.['act'];
    if (act === 'waiver') this.submitWaiverFor(event.data.school, event.data.issue);
    if (act === 'resolve') this.resolveViolation(event.data);
  }

  private submitWaiverFor(school: string, type: string): void {
    const lea = this.repo.schoolList.find((s) => s.name === school)?.leaId ?? 'lea-dcps';
    const leaName = this.repo.leaList.find((l) => l.id === lea)?.name ?? 'DCPS';
    const waiver = this.waiverService.submit({ school, lea: leaName, type });
    this.complianceViolations.update((list) => list.map((v) => (v.school === school ? { ...v, status: 'Waiver Pending' as const } : v)));
    this.messageService.add({ severity: 'success', summary: 'Waiver drafted', detail: `${waiver.id} was created for ${school} and is now pending review on the Waivers page.` });
    this.notificationFeed.add({ title: 'Waiver drafted from compliance', description: `A ${type} waiver was drafted for ${school}.`, category: 'Compliance' });
  }

  private editCalendarFor(school: string): void {
    const calendar = this.repo.calendars.find((c) => c.schoolName === school);
    if (calendar) this.router.navigate(['/calendar', calendar.id]);
    else this.notify(`No calendar record found for ${school}.`);
  }

  private resolveViolation(violation: IComplianceViolation): void {
    this.complianceViolations.update((list) => list.map((v) => (v.school === violation.school ? { ...v, status: 'Resolved' as const } : v)));
    this.messageService.add({ severity: 'success', summary: 'Violation resolved', detail: `${violation.issue} for ${violation.school} was marked resolved.` });
    this.notificationFeed.add({ title: 'Compliance violation resolved', description: `${violation.school}: ${violation.issue}`, category: 'Compliance' });
  }
}
