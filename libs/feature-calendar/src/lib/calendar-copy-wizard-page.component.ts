import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { calendarLevel, CalendarRegistryStatus, CalendarVisibility, ICalendarSchedule, SampleDataRepository } from '@osse/shared/data-access';

type CopyStep = 'source' | 'sections' | 'destination' | 'review';
type DestScope = 'site' | 'grade';

// Matches the status styling used on the Calendar Registry grid, so a status reads the same way
// everywhere in the app instead of always showing green regardless of its actual value.
const STATUS_BADGE_CLASS: Record<CalendarRegistryStatus, string> = {
  Approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Under Review': 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  Draft: 'border-amber-200 bg-amber-50 text-amber-700',
  Rejected: 'border-red-200 bg-red-50 text-red-700',
  Missing: 'border-amber-200 bg-amber-50 text-amber-700'
};

interface ICopySections {
  instructional: boolean;
  visibility: boolean;
}

@Component({
  selector: 'osse-calendar-copy-wizard-page',
  standalone: true,
  imports: [ButtonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />

    <div class="mx-auto max-w-4xl space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Copy from Existing Calendar</h1>
          <p class="mt-1 text-sm text-o-ink-600">Step {{ stepIndex() + 1 }} of 4 - {{ stepLabel() }}</p>
        </div>
        <button pButton type="button" [outlined]="true" severity="secondary" (click)="cancel()">Cancel</button>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <!-- STEP 1: SOURCE -->
        @if (step() === 'source') {
          <div class="anim-fade-slide-in space-y-3">
            <div class="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                [value]="sourceSearch()"
                (input)="sourceSearch.set($any($event.target).value)"
                placeholder="Search calendar ID, LEA, or site..."
                class="w-72 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
              />
              <select
                [value]="sourceLeaFilter()"
                (change)="sourceLeaFilter.set($any($event.target).value)"
                class="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
              >
                <option value="">All LEAs</option>
                @for (lea of leaList; track lea.id) {
                  <option [value]="lea.id">{{ lea.name }}</option>
                }
              </select>
              <span class="ml-auto text-xs text-o-ink-600">{{ eligibleSources().length }} eligible, {{ ineligibleSources().length }} not eligible</span>
            </div>

            <div class="max-h-96 space-y-1.5 overflow-y-auto">
              @for (cal of eligibleSources(); track cal.id) {
                <label
                  class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 px-3 py-2.5 text-sm transition-all"
                  [class.border-o-primary-500]="selectedSourceId() === cal.id"
                  [class.bg-o-primary-50]="selectedSourceId() === cal.id"
                  [class.border-slate-200]="selectedSourceId() !== cal.id"
                  [class.hover:border-o-primary-300]="selectedSourceId() !== cal.id"
                >
                  <span class="flex items-center gap-3">
                    <input type="radio" name="sourceCalendar" [checked]="selectedSourceId() === cal.id" (change)="selectedSourceId.set(cal.id)" />
                    <span>
                      <span class="block font-medium text-slate-900">{{ cal.name }} <span class="font-mono text-xs text-o-ink-600">({{ cal.id }})</span></span>
                      <span class="block text-xs text-o-ink-600">{{ cal.leaName }} · {{ cal.schoolName }}{{ cal.grade ? ' · Grade ' + cal.grade : '' }} · {{ cal.type }}</span>
                    </span>
                  </span>
                  <span class="shrink-0 rounded border px-2 py-0.5 text-xs font-medium" [class]="statusBadgeClass(cal.status)">{{ cal.status }}</span>
                </label>
              } @empty {
                <p class="text-sm text-o-ink-600">No eligible source calendars match this search.</p>
              }
            </div>

            @if (ineligibleSources().length > 0) {
              <details class="text-xs text-o-ink-600">
                <summary class="cursor-pointer font-medium">{{ ineligibleSources().length }} calendar(s) not eligible as a source</summary>
                <ul class="mt-1.5 space-y-1 pl-4">
                  @for (cal of ineligibleSources(); track cal.id) {
                    <li>{{ cal.name }} ({{ cal.id }}) - {{ ineligibleReason(cal) }}</li>
                  }
                </ul>
              </details>
            }
          </div>
        }

        <!-- STEP 2: SECTIONS -->
        @if (step() === 'sections') {
          <div class="anim-fade-slide-in space-y-3">
            <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-o-ink-700">
              Copying from <span class="font-semibold">{{ selectedSource()?.name }}</span> ({{ selectedSource()?.id }})
            </div>

            <label class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-900">
              <input type="checkbox" [checked]="allSectionsSelected()" (change)="toggleAllSections($any($event.target).checked)" />
              Copy all eligible sections
            </label>

            <div class="space-y-2 border-t border-slate-100 pt-3">
              <label class="flex items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all" [class.border-o-primary-500]="sections().instructional" [class.bg-o-primary-50]="sections().instructional" [class.border-slate-200]="!sections().instructional">
                <input type="checkbox" class="mt-0.5" [checked]="sections().instructional" (change)="toggleSection('instructional')" />
                <span>
                  <span class="block font-medium text-slate-900">Instructional Calendar</span>
                  <span class="block text-xs text-o-ink-600">Instructional days, hours, and the holidays/non-instructional days built into the source calendar.</span>
                </span>
              </label>
              <label class="flex items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all" [class.border-o-primary-500]="sections().visibility" [class.bg-o-primary-50]="sections().visibility" [class.border-slate-200]="!sections().visibility">
                <input type="checkbox" class="mt-0.5" [checked]="sections().visibility" (change)="toggleSection('visibility')" />
                <span>
                  <span class="block font-medium text-slate-900">Visibility</span>
                  <span class="block text-xs text-o-ink-600">Public / Non-public setting ({{ selectedSource()?.visibility }}).</span>
                </span>
              </label>
            </div>

            <p class="text-xs text-o-ink-600">
              Bell schedule and grade-level selections aren't stored per calendar in this system today, so they aren't offered as copy sections here.
            </p>
          </div>
        }

        <!-- STEP 3: DESTINATION -->
        @if (step() === 'destination') {
          <div class="anim-fade-slide-in space-y-4">
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-md border-2 px-3 py-1.5 text-xs font-medium transition-all"
                [class.border-o-primary-500]="destScope() === 'site'"
                [class.bg-o-primary-50]="destScope() === 'site'"
                [class.text-o-primary-700]="destScope() === 'site'"
                [class.border-slate-300]="destScope() !== 'site'"
                (click)="destScope.set('site')"
              >
                Site Level
              </button>
              <button
                type="button"
                class="rounded-md border-2 px-3 py-1.5 text-xs font-medium transition-all"
                [class.border-o-primary-500]="destScope() === 'grade'"
                [class.bg-o-primary-50]="destScope() === 'grade'"
                [class.text-o-primary-700]="destScope() === 'grade'"
                [class.border-slate-300]="destScope() !== 'grade'"
                (click)="destScope.set('grade')"
              >
                Grade Level
              </button>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block text-sm font-medium text-slate-700">
                LEA
                <select [value]="destLeaId() ?? ''" (change)="onDestLeaChange($any($event.target).value)" class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1">
                  <option value="" disabled>Select LEA...</option>
                  @for (lea of leaList; track lea.id) {
                    <option [value]="lea.id">{{ lea.name }}</option>
                  }
                </select>
              </label>
              <label class="block text-sm font-medium text-slate-700">
                School / Site
                <select [value]="destSiteId() ?? ''" (change)="destSiteId.set($any($event.target).value)" class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1">
                  <option value="" disabled>Select School / Site...</option>
                  @for (site of destSiteOptions(); track site.id) {
                    <option [value]="site.id">{{ site.name }}</option>
                  }
                </select>
              </label>
              @if (destScope() === 'grade') {
                <label class="block text-sm font-medium text-slate-700">
                  Grade
                  <select [value]="destGrade()" (change)="destGrade.set($any($event.target).value)" class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1">
                    @for (grade of gradeLevels; track grade) {
                      <option [value]="grade">{{ grade }}</option>
                    }
                  </select>
                </label>
              }
              <label class="block text-sm font-medium text-slate-700">
                Calendar Type
                <select [value]="destType()" (change)="destType.set($any($event.target).value)" class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1">
                  @for (type of calendarTypes(); track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block text-sm font-medium text-slate-700">
                First Day
                <input type="date" [value]="destFirstDay()" (change)="destFirstDay.set($any($event.target).value)" class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1" />
              </label>
              <label class="block text-sm font-medium text-slate-700">
                Last Day
                <input type="date" [value]="destLastDay()" [attr.min]="destFirstDay()" (change)="destLastDay.set($any($event.target).value)" class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1" />
              </label>
            </div>
            <p class="rounded-md border border-o-accent-200 bg-o-accent-50 px-2.5 py-1.5 text-xs text-o-accent-800">
              <i class="fa-solid fa-circle-info mr-1" aria-hidden="true"></i>
              The destination keeps its own First/Last day - copying never overwrites these from the source, even when the Instructional Calendar section is selected.
            </p>
          </div>
        }

        <!-- STEP 4: REVIEW -->
        @if (step() === 'review') {
          <div class="anim-fade-slide-in space-y-3 text-sm">
            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-lg border border-slate-200 p-3">
                <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-o-ink-600">Source</p>
                <p class="font-medium text-slate-900">{{ selectedSource()?.name }}</p>
                <p class="text-xs text-o-ink-600">{{ selectedSource()?.id }} · {{ selectedSource()?.leaName }} · {{ selectedSource()?.schoolName }}</p>
              </div>
              <div class="rounded-lg border border-slate-200 p-3">
                <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-o-ink-600">Destination</p>
                <p class="font-medium text-slate-900">{{ destSiteName() }}{{ destScope() === 'grade' ? ' · Grade ' + destGrade() : '' }}</p>
                <p class="text-xs text-o-ink-600">{{ destLeaName() }} · {{ destType() }} · {{ destFirstDay() || '—' }} to {{ destLastDay() || '—' }}</p>
              </div>
            </div>

            <div class="rounded-lg border border-slate-200 p-3">
              <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-o-ink-600">Sections</p>
              <p class="text-emerald-700"><i class="fa-solid fa-circle-check mr-1" aria-hidden="true"></i>Included: {{ includedSectionLabels().join(', ') || 'None' }}</p>
              @if (excludedSectionLabels().length > 0) {
                <p class="mt-1 text-o-ink-600"><i class="fa-solid fa-circle-minus mr-1" aria-hidden="true"></i>Excluded: {{ excludedSectionLabels().join(', ') }}</p>
              }
            </div>

            @for (issue of blockingIssues(); track issue) {
              <p class="flex items-center gap-1.5 rounded-md border border-o-secondary-200 bg-o-secondary-50 px-2.5 py-1.5 text-xs text-o-secondary-700" role="alert">
                <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>{{ issue }}
              </p>
            }
            @for (warning of warnings(); track warning) {
              <p class="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>{{ warning }}
              </p>
            }
          </div>
        }

        <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="back()">
            <i class="fa-solid fa-arrow-left mr-1.5 text-xs" aria-hidden="true"></i>
            {{ step() === 'source' ? 'Cancel' : 'Back' }}
          </button>
          @if (step() === 'review') {
            <button pButton type="button" [disabled]="blockingIssues().length > 0" (click)="createDestination()">Create Calendar</button>
          } @else {
            <button pButton type="button" [disabled]="!canAdvance()" (click)="next()">
              Next
              <i class="fa-solid fa-arrow-right ml-1.5 text-xs" aria-hidden="true"></i>
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class CalendarCopyWizardPageComponent {
  private readonly repo = inject(SampleDataRepository);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly leaList = this.repo.leaList;
  readonly schoolList = this.repo.schoolList;
  readonly gradeLevels = ['PK-5', '6-8', '9-12'];

  private readonly steps: CopyStep[] = ['source', 'sections', 'destination', 'review'];
  private readonly index = signal(0);
  readonly step = computed(() => this.steps[this.index()]);
  readonly stepIndex = computed(() => this.index());
  readonly stepLabel = computed(() => {
    switch (this.step()) {
      case 'source':
        return 'Select the source calendar';
      case 'sections':
        return 'Choose sections to copy';
      case 'destination':
        return 'Configure the destination';
      case 'review':
        return 'Review and create';
    }
  });

  // STEP 1 - source
  readonly sourceSearch = signal('');
  readonly sourceLeaFilter = signal('');
  readonly selectedSourceId = signal<string | null>(null);

  // A calendar with no generated days isn't a usable source to copy instructional data from.
  readonly eligibleSources = computed(() => {
    const term = this.sourceSearch().trim().toLowerCase();
    const lea = this.sourceLeaFilter();
    return this.repo.calendars.filter((c) => {
      if (c.days === null) return false;
      if (lea && c.leaId !== lea) return false;
      if (term && !c.id.toLowerCase().includes(term) && !c.leaName.toLowerCase().includes(term) && !c.schoolName.toLowerCase().includes(term)) return false;
      return true;
    });
  });
  readonly ineligibleSources = computed(() => this.repo.calendars.filter((c) => c.days === null));
  ineligibleReason(cal: ICalendarSchedule): string {
    return `${cal.status} - no instructional days have been built yet`;
  }
  readonly selectedSource = computed(() => this.repo.calendars.find((c) => c.id === this.selectedSourceId()) ?? null);

  statusBadgeClass(status: CalendarRegistryStatus): string {
    return STATUS_BADGE_CLASS[status];
  }

  // STEP 2 - sections
  readonly sections = signal<ICopySections>({ instructional: true, visibility: true });
  readonly allSectionsSelected = computed(() => this.sections().instructional && this.sections().visibility);
  readonly includedSectionLabels = computed(() => {
    const labels: string[] = [];
    if (this.sections().instructional) labels.push('Instructional Calendar');
    if (this.sections().visibility) labels.push('Visibility');
    return labels;
  });
  readonly excludedSectionLabels = computed(() => {
    const labels: string[] = [];
    if (!this.sections().instructional) labels.push('Instructional Calendar');
    if (!this.sections().visibility) labels.push('Visibility');
    return labels;
  });

  toggleSection(key: keyof ICopySections): void {
    this.sections.update((current) => ({ ...current, [key]: !current[key] }));
  }
  toggleAllSections(checked: boolean): void {
    this.sections.set({ instructional: checked, visibility: checked });
  }

  // STEP 3 - destination (always independent of the source's own dates, per copy-safety rules)
  readonly destScope = signal<DestScope>('site');
  readonly destLeaId = signal<string | null>(null);
  readonly destSiteId = signal<string | null>(null);
  readonly destGrade = signal(this.gradeLevels[0]);
  readonly destType = signal('');
  readonly destFirstDay = signal('');
  readonly destLastDay = signal('');
  readonly destSiteOptions = computed(() => this.schoolList.filter((s) => s.leaId === this.destLeaId()));
  readonly destSiteName = computed(() => this.schoolList.find((s) => s.id === this.destSiteId())?.name ?? '—');
  readonly destLeaName = computed(() => this.leaList.find((l) => l.id === this.destLeaId())?.name ?? '—');

  readonly calendarTypes = computed(() => {
    const base = ['SY 2025-26', 'ESY 2025', '12-Month'];
    const extraPrograms = this.repo.programs.filter((p) => p.id !== 'prog-esy-2025' && p.id !== 'prog-12month-2025').map((p) => p.name);
    return [...base, ...extraPrograms];
  });

  onDestLeaChange(id: string): void {
    this.destLeaId.set(id || null);
    this.destSiteId.set(null);
  }

  // STEP 4 - review
  readonly dateRangeInvalid = computed(() => !!this.destFirstDay() && !!this.destLastDay() && this.destLastDay() < this.destFirstDay());

  readonly duplicateDestination = computed(() => {
    if (!this.destSiteId() || !this.destType()) return null;
    const grade = this.destScope() === 'grade' ? this.destGrade() : null;
    return this.repo.calendars.find((c) => c.siteId === this.destSiteId() && c.type === this.destType() && (c.grade ?? null) === grade) ?? null;
  });

  readonly blockingIssues = computed(() => {
    const issues: string[] = [];
    if (!this.selectedSourceId()) issues.push('No source calendar selected.');
    if (!this.destLeaId() || !this.destSiteId()) issues.push('Destination LEA and School/Site are required.');
    if (!this.destFirstDay() || !this.destLastDay()) issues.push('Destination First Day and Last Day are required before creating.');
    if (this.dateRangeInvalid()) issues.push('Destination Last Day must be on or after the First Day.');
    const dup = this.duplicateDestination();
    if (dup) issues.push(`A ${this.destType()} calendar already exists for this destination (${dup.id}). Edit that calendar instead of creating a duplicate.`);
    return issues;
  });

  readonly warnings = computed(() => {
    const warnings: string[] = [];
    const source = this.selectedSource();
    if (source && this.destLeaId() && source.leaId !== this.destLeaId()) {
      warnings.push('Source and destination are in different LEAs - double-check the copied holidays still apply.');
    }
    if (!this.sections().instructional) {
      warnings.push('Instructional Calendar section excluded - the destination will be created as a Draft with no instructional days yet.');
    }
    return warnings;
  });

  canAdvance(): boolean {
    if (this.step() === 'source') return !!this.selectedSourceId();
    return true;
  }

  back(): void {
    if (this.index() === 0) {
      this.router.navigate(['/calendar/create']);
      return;
    }
    this.index.update((v) => v - 1);
  }

  next(): void {
    if (this.step() === 'source') {
      // Pre-fill the destination with the source's own identity as a starting point -
      // still fully editable, and dates are deliberately left blank (never copied).
      const source = this.selectedSource();
      if (source) {
        this.destLeaId.set(source.leaId);
        this.destType.set(source.type);
        this.destScope.set(source.grade ? 'grade' : 'site');
        if (source.grade) this.destGrade.set(source.grade);
      }
    }
    this.index.update((v) => Math.min(v + 1, this.steps.length - 1));
  }

  cancel(): void {
    this.router.navigate(['/calendar/create']);
  }

  createDestination(): void {
    if (this.blockingIssues().length > 0) return;
    const source = this.selectedSource();
    if (!source) return;

    const lea = this.leaList.find((l) => l.id === this.destLeaId());
    const site = this.schoolList.find((s) => s.id === this.destSiteId());
    const grade = this.destScope() === 'grade' ? this.destGrade() : null;
    const existingNumbers = this.repo.calendars.map((c) => Number(c.id.match(/(\d+)$/)?.[1] ?? 0));
    const nextNumber = Math.max(0, ...existingNumbers) + 1;

    const includeInstructional = this.sections().instructional;
    const includeVisibility = this.sections().visibility;

    const destination: ICalendarSchedule = {
      id: `CAL-2026-${String(nextNumber).padStart(4, '0')}`,
      name: grade ? `${grade} ${this.destType()}` : `${this.destType()} Calendar`,
      schoolName: site?.name ?? 'Unassigned Site',
      leaName: lea?.name ?? 'Unassigned LEA',
      leaId: this.destLeaId() ?? '',
      siteId: this.destSiteId(),
      grade,
      programId: source.programId,
      parentCalendarId: null,
      copiedFromId: source.id,
      visibility: (includeVisibility ? source.visibility : 'Public') as CalendarVisibility,
      cycle: this.destType(),
      type: this.destType(),
      days: includeInstructional ? source.days : null,
      hours: includeInstructional ? source.hours : null,
      compliancePercent: includeInstructional ? source.compliancePercent : null,
      status: includeInstructional ? 'Under Review' : 'Draft',
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lastUpdated: new Date().toISOString().slice(0, 10)
    };

    this.repo.calendars.push(destination);
    this.messageService.add({
      severity: 'success',
      summary: 'Calendar created from copy',
      detail: `${destination.name} was created from ${source.name} (${source.id}) as an independent calendar.`
    });
    this.router.navigate(['/calendar', destination.id], { queryParams: { from: 'calendar', tab: 'registry' } });
  }
}
