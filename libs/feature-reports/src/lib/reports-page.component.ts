import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { calendarLevel, IBellSchedule, IEarlyDismissalRow, IReportLeaRow, SampleDataRepository } from '@osse/shared/data-access';

type ReportId = 'compliance-hours' | 'bell-times' | 'exceptions' | 'sites-missing';

interface IReportDef {
  id: ReportId;
  title: string;
  tag: string;
}

interface ISiteMissingRow {
  site: string;
  leaName: string;
  gradeBand: string;
  status: string;
  reason: string;
}

@Component({
  selector: 'osse-reports-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Reports</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Report scheduled')">Schedule Report</button>
          <button pButton type="button" (click)="notify('Generate report dialog would open here')">+ Generate Report</button>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[280px_1fr]">
        <div>
          <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Available Reports</div>
          <div class="space-y-2.5">
            @for (report of reportDefinitions; track report.id) {
              <button
                type="button"
                class="block w-full rounded-lg border p-3 text-left transition"
                [class.border-o-accent-400]="selectedReportId() === report.id"
                [class.bg-o-accent-50]="selectedReportId() === report.id"
                [class.border-slate-200]="selectedReportId() !== report.id"
                [class.bg-white]="selectedReportId() !== report.id"
                (click)="selectedReportId.set(report.id)"
              >
                <div class="text-sm font-semibold text-o-accent-600">{{ report.title }}</div>
                <div class="mt-2 flex items-center gap-2">
                  <span class="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{{ report.tag }}</span>
                  <span class="font-mono text-[11px] text-slate-400">{{ rowCountFor(report.id) }} rows</span>
                </div>
              </button>
            }
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">{{ selectedReport().title }}</h2>
              <p class="text-xs text-slate-500">Generated {{ today }} · {{ rowCountFor(selectedReportId()) }} rows</p>
            </div>
            <div class="flex items-center gap-2.5">
              <button pButton type="button" [outlined]="true" severity="secondary" size="small" (click)="notify('CSV exported')">Export CSV</button>
              <button pButton type="button" [outlined]="true" severity="secondary" size="small" (click)="notify('PDF exported')">Export PDF</button>
            </div>
          </div>

          @if (selectedReportId() === 'compliance-hours') {
            <div class="mt-4 grid gap-3 sm:grid-cols-3">
              <div class="rounded-md bg-slate-50 p-4 text-center">
                <div class="font-mono text-2xl font-semibold text-slate-900">{{ complianceStats().avg }}</div>
                <div class="mt-1 text-xs text-slate-500">Avg Instructional Hours</div>
              </div>
              <div class="rounded-md bg-emerald-50 p-4 text-center">
                <div class="font-mono text-2xl font-semibold text-emerald-600">{{ complianceStats().compliant }}</div>
                <div class="mt-1 text-xs text-emerald-700">≥ 1080 Hours</div>
              </div>
              <div class="rounded-md bg-red-50 p-4 text-center">
                <div class="font-mono text-2xl font-semibold text-red-600">{{ complianceStats().nonCompliant }}</div>
                <div class="mt-1 text-xs text-red-700">Below 1080 Hours</div>
              </div>
            </div>
          }

          <div class="mt-4">
            @switch (selectedReportId()) {
              @case ('compliance-hours') {
                <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="hoursSummaryReport" [columnDefs]="hoursColumnDefs" [defaultColDef]="defaultColDef" />
              }
              @case ('bell-times') {
                <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="bellSchedules" [columnDefs]="bellColumnDefs" [defaultColDef]="defaultColDef" />
              }
              @case ('exceptions') {
                <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="earlyDismissalImpact" [columnDefs]="exceptionColumnDefs" [defaultColDef]="defaultColDef" />
              }
              @case ('sites-missing') {
                <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="sitesMissingCalendar()" [columnDefs]="sitesMissingColumnDefs" [defaultColDef]="defaultColDef" />
              }
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsPageComponent {
  private readonly repo = inject(SampleDataRepository);
  private readonly messageService = inject(MessageService);

  readonly today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  readonly reportDefinitions: IReportDef[] = [
    { id: 'compliance-hours', title: 'Compliance (Instructional Hours)', tag: 'Compliance' },
    { id: 'bell-times', title: 'Bell Times', tag: 'Bell Times' },
    { id: 'exceptions', title: "Exceptions' Report", tag: 'Exceptions' },
    { id: 'sites-missing', title: 'Sites Missing Calendar', tag: 'Completeness' }
  ];

  readonly selectedReportId = signal<ReportId>('compliance-hours');
  readonly selectedReport = computed(() => this.reportDefinitions.find((r) => r.id === this.selectedReportId()) ?? this.reportDefinitions[0]);

  readonly hoursSummaryReport = this.repo.hoursSummaryReport;
  readonly bellSchedules = this.repo.bellSchedules;
  readonly earlyDismissalImpact = this.repo.earlyDismissalImpact;

  // Real derived report: any Site with no calendar record at all for the active school year,
  // joined via the real leaId/siteId fields (not by name matching). A non-reportable satellite
  // site doesn't automatically need its own Regular calendar - it's only flagged here if it
  // carries real enrollment, matching the reportable-vs-non-reportable business rule rather than
  // treating every physical site as equally required to have one.
  readonly sitesMissingCalendar = computed<ISiteMissingRow[]>(() => {
    // A Grade Level Calendar narrows one grade band at a site - it doesn't satisfy the site's
    // own Regular/Site Level calendar requirement, so only Site Level records count here.
    const sitesWithCalendars = new Set(
      this.repo.calendars.filter((c) => calendarLevel(c) === 'Site' && c.siteId).map((c) => c.siteId as string)
    );
    return this.repo.schoolList
      .filter((school) => !sitesWithCalendars.has(school.id))
      .filter((school) => school.reportable !== false || school.studentCount > 0)
      .map((school) => ({
        site: school.name,
        leaName: this.repo.leaList.find((l) => l.id === school.leaId)?.name ?? school.leaId,
        gradeBand: school.gradeBand,
        status: 'No calendar submitted',
        reason: school.reportable === false ? `Non-reportable, but has ${school.studentCount} enrolled student(s)` : 'Reportable site - Regular calendar required'
      }));
  });

  readonly complianceStats = computed(() => {
    const rows = this.hoursSummaryReport;
    const avg = Math.round(rows.reduce((sum, r) => sum + r.avgHours, 0) / (rows.length || 1));
    const compliant = rows.filter((r) => r.compliant === 'All Compliant').length;
    return { avg, compliant, nonCompliant: rows.length - compliant };
  });

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly hoursColumnDefs: ColDef<IReportLeaRow>[] = [
    {
      field: 'lea',
      headerName: 'LEA',
      flex: 1.3,
      minWidth: 160,
      cellRenderer: (params: { value: string }) => `<span class="cursor-pointer font-semibold text-o-accent-600 hover:underline">${params.value}</span>`
    },
    { field: 'schools', headerName: 'Schools', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    {
      field: 'avgHours',
      headerName: 'Avg Hours',
      flex: 1.4,
      minWidth: 160,
      cellRenderer: (params: { value: number }) =>
        `<div class="pt-2"><div class="h-1.5 w-24 rounded-full bg-slate-200"><div class="h-1.5 rounded-full bg-o-accent-500" style="width:${Math.min(100, (params.value / 1250) * 100)}%"></div></div><div class="mt-1 font-mono text-xs text-slate-600">${params.value}</div></div>`
    },
    { field: 'minHours', headerName: 'Min Hours', flex: 0.9, minWidth: 100, cellClass: (p) => `font-mono ${p.value < 1080 ? 'text-red-600 font-semibold' : ''}` },
    { field: 'maxHours', headerName: 'Max Hours', flex: 0.9, minWidth: 100, cellClass: 'font-mono' },
    {
      field: 'compliant',
      headerName: 'Compliant',
      flex: 1,
      minWidth: 130,
      cellRenderer: (params: { value: string }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${params.value === 'All Compliant' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}">${params.value}</span>`
    }
  ];

  readonly bellColumnDefs: ColDef<IBellSchedule>[] = [
    { field: 'name', headerName: 'Schedule Name', flex: 1.2, minWidth: 160, cellClass: 'font-semibold text-slate-900' },
    { field: 'level', headerName: 'Level', flex: 1, minWidth: 120 },
    { field: 'start', headerName: 'Start', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    { field: 'end', headerName: 'End', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    { field: 'totalMinutes', headerName: 'Total Min', flex: 0.8, minWidth: 100, cellClass: 'font-mono' },
    { field: 'instrMinutes', headerName: 'Instr. Min', flex: 0.8, minWidth: 100, cellClass: 'font-mono' },
    { field: 'schoolsUsing', headerName: 'Schools Using', flex: 1, minWidth: 120, cellClass: 'font-mono' }
  ];

  readonly exceptionColumnDefs: ColDef<IEarlyDismissalRow>[] = [
    { field: 'school', headerName: 'School', flex: 1.3, minWidth: 150, cellClass: 'font-semibold text-slate-900' },
    { field: 'days', headerName: 'Early Dismissal Days', flex: 1, minWidth: 150, cellClass: (p) => `font-mono ${p.value > 20 ? 'text-red-600 font-semibold' : ''}` },
    { field: 'minutesImpact', headerName: 'Instr. Min Impact', flex: 1, minWidth: 130, cellClass: 'font-mono' },
    {
      field: 'flag',
      headerName: 'Compliant (≤20 days)',
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: { value: string }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${params.value === 'Compliant' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}">${params.value}</span>`
    }
  ];

  readonly sitesMissingColumnDefs: ColDef<ISiteMissingRow>[] = [
    { field: 'site', headerName: 'Site', flex: 1.3, minWidth: 160, cellClass: 'font-semibold text-slate-900' },
    { field: 'leaName', headerName: 'LEA', flex: 1.1, minWidth: 140 },
    { field: 'gradeBand', headerName: 'Grades', flex: 0.8, minWidth: 90, cellClass: 'font-mono' },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1.2,
      minWidth: 160,
      cellRenderer: (params: { value: string }) => `<span class="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">${params.value}</span>`
    },
    { field: 'reason', headerName: 'Why flagged', flex: 1.6, minWidth: 220, cellClass: 'text-o-ink-600' }
  ];

  rowCountFor(id: ReportId): number {
    switch (id) {
      case 'compliance-hours':
        return this.hoursSummaryReport.length;
      case 'bell-times':
        return this.bellSchedules.length;
      case 'exceptions':
        return this.earlyDismissalImpact.length;
      case 'sites-missing':
        return this.sitesMissingCalendar().length;
    }
  }

  notify(message: string): void {
    this.messageService.add({ severity: 'info', summary: message, detail: '' });
  }
}
