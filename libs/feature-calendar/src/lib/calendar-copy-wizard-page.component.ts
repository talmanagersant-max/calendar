import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CalendarRegistryStatus, CalendarVisibility, ICalendarSchedule, IDirectorySchool, siteDisplayName } from '@osse/shared/data-access';
import { ShellDataService, ToastService } from '@osse/shared/ui';

type CopyStep = 'source' | 'sections' | 'destination' | 'review';

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
  imports: [NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="mx-auto max-w-4xl space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Copy from Existing Calendar</h1>
          <p class="mt-1 text-sm text-o-ink-600">Step {{ stepIndex() + 1 }} of 4 - {{ stepLabel() }}</p>
        </div>
        <button nz-button nzType="default" class="btn-secondary" type="button" (click)="cancel()">Cancel</button>
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
                placeholder="Search calendar ID or school..."
                class="form-control w-72"
              />
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
                      <span class="block text-xs text-o-ink-600">{{ cal.schoolName }} · {{ cal.type }}</span>
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
            @if (shell.school(); as school) {
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p class="text-[11px] font-bold uppercase tracking-wider text-o-ink-600">School · from top navigation</p>
                <p class="mt-0.5 font-semibold text-o-ink-900">{{ school.name }}</p>
                <p class="text-xs text-o-ink-600">{{ shell.lea()?.name }} · Campus ID <span class="font-mono">{{ school.code }}</span> · Grades {{ school.gradeBand }}</p>
              </div>
            } @else {
              <label class="block text-sm font-medium text-slate-700">
                Destination school in {{ shell.lea()?.name }}
                <select
                  [value]="destSchoolId() ?? ''"
                  (change)="onDestSchoolChange($any($event.target).value)"
                  class="form-control mt-2 w-full"
                >
                  <option value="" disabled [selected]="!destSchoolId()">Select a school...</option>
                  @for (school of shell.schoolsInScope(); track school.id) {
                    <option [value]="school.id" [selected]="school.id === destSchoolId()">{{ school.name }}</option>
                  }
                </select>
              </label>
            }

            @if (destSchool(); as school) {
              <fieldset class="rounded-lg border border-slate-200 p-0">
                <legend class="sr-only">Destination sites</legend>
                <div class="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <label class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-o-ink-900">
                    <input type="checkbox" [checked]="allDestSitesSelected()" [indeterminate]="destSiteIds().size > 0 && !allDestSitesSelected()" (change)="toggleAllDestSites($any($event.target).checked)" />
                    All sites ({{ school.sites.length }})
                  </label>
                  <span class="text-xs text-o-ink-600">{{ destSiteIds().size }} selected</span>
                </div>
                <ul class="divide-y divide-slate-100">
                  @for (site of school.sites; track site.id) {
                    <li>
                      <label class="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-slate-50">
                        <input type="checkbox" class="mt-1" [checked]="destSiteIds().has(site.id)" (change)="toggleDestSite(site.id)" />
                        <span>
                          <span class="block text-sm font-medium text-o-ink-900">{{ site.name }} <span class="ml-1 font-mono text-xs font-normal text-o-ink-600">{{ site.code }}</span></span>
                          <span class="block text-xs text-o-ink-600"><i class="fa-solid fa-location-dot mr-1" aria-hidden="true"></i>{{ site.address }}</span>
                        </span>
                      </label>
                    </li>
                  }
                </ul>
              </fieldset>
            }

            <label class="block max-w-sm text-sm font-medium text-slate-700">
              Calendar Type
              <select
                (change)="onDestTypeChange($any($event.target).value)"
                class="form-control mt-2 w-full"
              >
                @for (type of calendarTypes(); track type) {
                  <option [value]="type" [selected]="type === destType()">{{ type }}</option>
                }
              </select>
            </label>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="block text-sm font-medium text-slate-700">
                First Day
                <input type="date" [value]="destFirstDay()" (change)="destFirstDay.set($any($event.target).value)" class="form-control mt-2 w-full" />
              </label>
              <label class="block text-sm font-medium text-slate-700">
                Last Day
                <input type="date" [value]="destLastDay()" [attr.min]="destFirstDay()" (change)="destLastDay.set($any($event.target).value)" class="form-control mt-2 w-full" />
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
                <p class="font-medium text-slate-900">{{ destSchool()?.name ?? '—' }}</p>
                <p class="text-xs text-o-ink-600">Sites: {{ destSiteNames().join(', ') || '—' }}</p>
                <p class="text-xs text-o-ink-600">{{ shell.lea()?.name }} · {{ destType() }} · {{ destFirstDay() || '—' }} to {{ destLastDay() || '—' }}</p>
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
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="back()">
            <i class="fa-solid fa-arrow-left mr-1.5 text-xs" aria-hidden="true"></i>
            {{ step() === 'source' ? 'Cancel' : 'Back' }}
          </button>
          @if (step() === 'review') {
            <button nz-button nzType="primary" type="button" [disabled]="blockingIssues().length > 0" (click)="createDestination()">Create Calendar</button>
          } @else {
            <button nz-button nzType="primary" type="button" [disabled]="!canAdvance()" (click)="next()">
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
  readonly shell = inject(ShellDataService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

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
  readonly selectedSourceId = signal<string | null>(null);

  // A calendar with no generated days isn't a usable source to copy instructional data from.
  readonly eligibleSources = computed(() => {
    // Sources: any calendar in the LEA for the selected School Year (not narrowed by School, so a
    // school can copy a sibling school's calendar).
    const term = this.sourceSearch().trim().toLowerCase();
    return this.shell.leaCalendars().filter((c) => {
      if (c.days === null) return false;
      if (term && !c.id.toLowerCase().includes(term) && !c.schoolName.toLowerCase().includes(term)) return false;
      return true;
    });
  });
  readonly ineligibleSources = computed(() => this.shell.leaCalendars().filter((c) => c.days === null && c.status !== 'Missing'));
  ineligibleReason(cal: ICalendarSchedule): string {
    return `${cal.status} - no instructional days have been built yet`;
  }
  readonly selectedSource = computed(() => this.shell.calendarById(this.selectedSourceId()));

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
  readonly destSchoolId = signal<string | null>(null);
  readonly destSchool = computed<IDirectorySchool | null>(() => this.shell.school() ?? this.shell.schoolsInScope().find((s) => s.id === this.destSchoolId()) ?? null);
  readonly destSiteIds = signal<Set<string>>(new Set());
  readonly allDestSitesSelected = computed(() => {
    const sites = this.destSchool()?.sites ?? [];
    return sites.length > 0 && sites.every((site) => this.destSiteIds().has(site.id));
  });
  readonly destSiteNames = computed(() => (this.destSchool()?.sites ?? []).filter((site) => this.destSiteIds().has(site.id)).map((site) => site.name));
  readonly destType = signal('');
  readonly destFirstDay = signal('');
  readonly destLastDay = signal('');
  readonly calendarTypes = computed(() => this.shell.calendarTypeOptions().map((o) => o.label));
  private readonly destTypeOption = computed(() => this.shell.calendarTypeOptions().find((o) => o.label === this.destType()) ?? null);

  constructor() {
    // A newly chosen destination school starts with all of its sites selected.
    effect(
      () => {
        const school = this.destSchool();
        this.destSiteIds.set(new Set(school?.sites.map((site) => site.id) ?? []));
      },
      { allowSignalWrites: true }
    );
  }

  onDestSchoolChange(id: string): void {
    this.destSchoolId.set(id || null);
  }

  toggleDestSite(id: string): void {
    const next = new Set(this.destSiteIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.destSiteIds.set(next);
  }

  toggleAllDestSites(checked: boolean): void {
    this.destSiteIds.set(new Set(checked ? (this.destSchool()?.sites.map((site) => site.id) ?? []) : []));
  }

  // Changing the type pre-fills that type's default term dates (still editable).
  onDestTypeChange(type: string): void {
    this.destType.set(type);
    const option = this.shell.calendarTypeOptions().find((o) => o.label === type);
    if (option) {
      this.destFirstDay.set(option.range.start);
      this.destLastDay.set(option.range.end);
    }
  }

  // STEP 4 - review
  readonly dateRangeInvalid = computed(() => !!this.destFirstDay() && !!this.destLastDay() && this.destLastDay() < this.destFirstDay());

  readonly duplicateDestinations = computed(() => {
    const option = this.destTypeOption();
    if (!option) return [];
    return [...this.destSiteIds()].map((siteId) => this.shell.findExisting(siteId, option.label, option.yearId)).filter((c): c is ICalendarSchedule => c !== null);
  });

  readonly blockingIssues = computed(() => {
    const issues: string[] = [];
    if (!this.selectedSourceId()) issues.push('No source calendar selected.');
    if (!this.destSchool() || this.destSiteIds().size === 0) issues.push('Choose a destination school and at least one site.');
    if (!this.destTypeOption()) issues.push('Choose a calendar type.');
    if (!this.destFirstDay() || !this.destLastDay()) issues.push('Destination First Day and Last Day are required before creating.');
    if (this.dateRangeInvalid()) issues.push('Destination Last Day must be on or after the First Day.');
    const dups = this.duplicateDestinations();
    if (dups.length > 0 && dups.length === this.destSiteIds().size) {
      issues.push(`Every selected site already has a ${this.destType()} calendar (${dups.map((d) => d.id).join(', ')}). Edit those instead of creating duplicates.`);
    }
    return issues;
  });

  readonly warnings = computed(() => {
    const warnings: string[] = [];
    const source = this.selectedSource();
    const dups = this.duplicateDestinations();
    if (dups.length > 0 && dups.length < this.destSiteIds().size) {
      warnings.push(`${dups.length} selected site(s) already have a ${this.destType()} calendar and will be skipped.`);
    }
    if (source && source.type !== this.destType()) {
      warnings.push(`Copying a ${source.type} calendar into a ${this.destType()} calendar - check the term dates.`);
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
        this.onDestTypeChange(this.calendarTypes().includes(source.type) ? source.type : this.calendarTypes()[0]);
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
    const school = this.destSchool();
    const option = this.destTypeOption();
    const lea = this.shell.lea();
    if (!source || !school || !option || !lea) return;
    const includeInstructional = this.sections().instructional;
    const includeVisibility = this.sections().visibility;
    const skip = new Set(this.duplicateDestinations().map((c) => c.siteId));

    const created = school.sites
      .filter((site) => this.destSiteIds().has(site.id) && !skip.has(site.id))
      .map((site) => {
        const destination: ICalendarSchedule = {
          id: this.shell.nextCalendarId(),
          name: `${option.label} Calendar`,
          schoolName: siteDisplayName(school, site),
          leaName: lea.name,
          leaId: lea.id,
          siteId: site.id,
          schoolId: school.id,
          yearId: option.yearId,
          grade: null,
          programId: option.programId,
          parentCalendarId: null,
          copiedFromId: source.id,
          visibility: (includeVisibility ? source.visibility : 'Public') as CalendarVisibility,
          cycle: option.label,
          type: option.label,
          days: includeInstructional ? source.days : null,
          hours: includeInstructional ? source.hours : null,
          compliancePercent: includeInstructional ? source.compliancePercent : null,
          status: includeInstructional ? 'Under Review' : 'Draft',
          submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          lastUpdated: new Date().toISOString().slice(0, 10)
        };
        this.shell.upsertCalendar(destination);
        return destination;
      });
    if (created.length === 0) return;

    const first = this.shell.allCalendars().find((c) => c.siteId === created[0].siteId && c.type === created[0].type && c.yearId === created[0].yearId && c.copiedFromId === source.id);
    this.toast.add({
      severity: 'success',
      summary: created.length === 1 ? 'Calendar created from copy' : `${created.length} calendars created from copy`,
      detail: `Copied from ${source.name} (${source.id}) into ${created.length} site(s) at ${school.name} as independent calendars.`
    });
    this.router.navigate(['/calendar', first?.id ?? created[0].id], { queryParams: { from: 'calendar', tab: 'registry' } });
  }
}
