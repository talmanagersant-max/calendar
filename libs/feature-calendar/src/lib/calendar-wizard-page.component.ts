import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CalendarVisibility, ICalendarSchedule, SampleDataRepository } from '@osse/shared/data-access';

interface IWizardStep {
  title: string;
  heading: string;
}

type DayStatus = 'instruction' | 'excluded' | 'weekend' | 'holiday';
type CreationScope = 'site' | 'lea' | 'grade';

interface IEarlyDismissal {
  time: string;
  reason: string;
}

interface IWizardDay {
  iso: string;
  date: number;
  status: DayStatus;
  holidayName: string | null;
  inMonth: boolean;
}

interface IWizardMonth {
  year: number;
  month: number;
  label: string;
}

// Real SY 2025-26 DC OSSE closure dates, matching SampleDataRepository.holidays by id.
const HOLIDAY_RANGES: Record<string, { start: string; end: string }> = {
  'hol-1': { start: '2025-09-01', end: '2025-09-01' },
  'hol-2': { start: '2025-10-13', end: '2025-10-13' },
  'hol-3': { start: '2025-11-11', end: '2025-11-11' },
  'hol-4': { start: '2025-11-27', end: '2025-11-28' },
  'hol-5': { start: '2025-12-22', end: '2026-01-02' },
  'hol-6': { start: '2026-01-19', end: '2026-01-19' },
  'hol-7': { start: '2026-02-16', end: '2026-02-16' },
  'hol-8': { start: '2026-04-13', end: '2026-04-17' },
  'hol-9': { start: '2026-05-25', end: '2026-05-25' },
  'hol-10': { start: '2026-06-19', end: '2026-06-19' }
};

// An early dismissal is still a full school day (not deducted from the day count) but
// shortens instructional time - modeled as a flat 2-hour reduction toward the 1080-hour check.
const EARLY_DISMISSAL_REDUCTION_MINUTES = 120;

const CALENDAR_TYPE_DEFAULT_RANGE: Record<string, { start: string; end: string }> = {
  'SY 2025-26': { start: '2025-09-02', end: '2026-06-19' },
  'ESY 2025': { start: '2025-07-07', end: '2025-08-15' },
  '12-Month': { start: '2025-07-01', end: '2026-06-30' }
};

// "instruction" reuses emerald - the same color the app already uses for Approved/Completed -
// so "included" reads as instantly familiar rather than introducing a new color meaning.
const DAY_STATUS_CLASS: Record<DayStatus, string> = {
  instruction: 'border-emerald-300 bg-emerald-50 text-o-ink-900 hover:border-emerald-500 hover:bg-emerald-100',
  excluded: 'border-slate-400 bg-slate-200 text-o-ink-500 hover:border-slate-500 hover:bg-slate-300',
  weekend: 'border-amber-200 bg-amber-50 text-o-ink-700',
  holiday: 'border-o-secondary-200 bg-o-secondary-50 text-o-ink-800'
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(year: number, month: number, date: number): string {
  return `${year}-${pad(month + 1)}-${pad(date)}`;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function enumerateMonths(startIso: string, endIso: string): { year: number; month: number }[] {
  const start = parseIso(startIso);
  const end = parseIso(endIso);
  const months: { year: number; month: number }[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  while (y < end.getFullYear() || (y === end.getFullYear() && m <= end.getMonth())) {
    months.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return months;
}

@Component({
  selector: 'osse-calendar-wizard-page',
  standalone: true,
  imports: [NgClass, ButtonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Create New Calendar</h1>
        <button pButton type="button" [outlined]="true" severity="secondary" (click)="saveDraft()">Save Draft</button>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <nav aria-label="Calendar creation progress" class="-mx-5 mb-6 overflow-x-auto px-5 pb-2">
          <ol class="flex items-center gap-1">
            @for (step of steps; track step.title; let index = $index) {
              <li class="flex flex-1 items-center gap-1" [attr.aria-current]="index === currentIndex() ? 'step' : null">
                <div class="flex w-[76px] shrink-0 flex-col items-center gap-1.5">
                  <div
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    [class.bg-o-primary-600]="index === currentIndex()"
                    [class.text-white]="index === currentIndex()"
                    [class.bg-emerald-100]="index < currentIndex()"
                    [class.text-emerald-700]="index < currentIndex()"
                    [class.bg-slate-100]="index > currentIndex()"
                    [class.text-o-ink-600]="index > currentIndex()"
                  >
                    @if (index < currentIndex()) {
                      <span class="sr-only">Completed</span>
                      <i class="fa-solid fa-check text-[10px]" aria-hidden="true"></i>
                    } @else {
                      <span aria-hidden="true">{{ index + 1 }}</span>
                    }
                  </div>
                  <span
                    class="block w-full break-words text-center text-[11px] leading-tight"
                    [class.font-semibold]="index === currentIndex()"
                    [class.text-slate-900]="index === currentIndex()"
                    [class.text-o-ink-600]="index !== currentIndex()"
                  >
                    {{ step.title }}
                  </span>
                </div>
                @if (!$last) {
                  <div class="h-px w-6 shrink-0 xl:w-auto xl:flex-1" [class.bg-o-primary-300]="index < currentIndex()" [class.bg-slate-200]="index >= currentIndex()" aria-hidden="true"></div>
                }
              </li>
            }
          </ol>
        </nav>

        <div class="rounded-lg border border-slate-200 p-6">
          <h2 #stepHeading id="wizardStepHeading" tabindex="-1" class="text-lg font-semibold text-slate-900 outline-none">
            Step {{ currentIndex() + 1 }}: {{ steps[currentIndex()].heading }}
          </h2>

          @switch (currentIndex()) {
            @case (0) {
              <fieldset aria-labelledby="wizardStepHeading" class="anim-fade-slide-in mt-5 border-0 p-0">
                <legend class="sr-only">Calendar Scope</legend>
                <div class="mb-4 grid gap-3 lg:grid-cols-3">
                  @for (scope of scopeOptions; track scope.value) {
                    <label
                      class="flex cursor-pointer items-start gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all"
                      [class.border-o-primary-500]="scope.value === creationScope()"
                      [class.bg-o-primary-50]="scope.value === creationScope()"
                      [class.shadow-sm]="scope.value === creationScope()"
                      [class.border-slate-300]="scope.value !== creationScope()"
                      [class.hover:border-o-primary-300]="scope.value !== creationScope()"
                    >
                      <input type="radio" name="creationScope" class="mt-0.5" [value]="scope.value" [checked]="scope.value === creationScope()" (change)="onScopeChange(scope.value)" />
                      <span>
                        <span class="flex items-center gap-1.5 font-medium" [class.text-o-primary-700]="scope.value === creationScope()" [class.text-slate-900]="scope.value !== creationScope()">
                          {{ scope.label }}
                          @if (scope.value === creationScope()) {
                            <i class="fa-solid fa-circle-check text-xs text-o-primary-500" aria-hidden="true"></i>
                          }
                        </span>
                        <span class="block text-xs text-o-ink-600">{{ scope.hint }}</span>
                      </span>
                    </label>
                  }
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <label class="block text-sm font-medium text-slate-700">
                    LEA
                    <select
                      class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                      [value]="selectedLeaId() ?? ''"
                      (change)="onLeaChange($any($event.target).value)"
                    >
                      <option value="" disabled>Select LEA...</option>
                      @for (lea of leaList; track lea.id) {
                        <option [value]="lea.id">{{ lea.name }}</option>
                      }
                    </select>
                  </label>

                  @if (creationScope() !== 'lea') {
                    <label class="block text-sm font-medium text-slate-700">
                      School / Site
                      <select
                        class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                        [value]="selectedSchoolId() ?? ''"
                        (change)="onSchoolChange($any($event.target).value)"
                      >
                        <option value="" disabled>Select School / Site...</option>
                        @for (school of schoolList; track school.id) {
                          <option [value]="school.id">{{ school.name }}</option>
                        }
                      </select>
                    </label>
                  } @else {
                    <p class="self-end pb-2 text-xs text-o-ink-600">
                      Every site in this LEA will get its own auto-populated calendar - see {{ leaFanoutSiteCount() }} site(s) listed at Confirm &amp; Submit.
                    </p>
                  }

                  @if (creationScope() === 'grade') {
                    <label class="anim-fade-slide-in block text-sm font-medium text-slate-700">
                      Grade
                      <select
                        class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                        [value]="selectedGrade()"
                        (change)="selectedGrade.set($any($event.target).value)"
                      >
                        @for (grade of gradeLevels; track grade) {
                          <option [value]="grade">{{ grade }}</option>
                        }
                      </select>
                    </label>
                  }

                  @if (creationScope() !== 'lea') {
                    <label class="block text-sm font-medium text-slate-700 md:col-span-2">
                      Inherit holidays &amp; marking periods from (optional)
                      <select
                        class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                        [value]="selectedParentCalendarId() ?? ''"
                        (change)="onParentCalendarChange($any($event.target).value)"
                      >
                        <option value="">None - build from scratch</option>
                        @for (parent of availableParentCalendars(); track parent.id) {
                          <option [value]="parent.id">{{ parent.name }}</option>
                        }
                      </select>
                      <span class="mt-1 block text-xs font-normal text-o-ink-600">Only district/LEA-level calendars for the selected LEA are shown. Site calendars can override individual inherited holidays later.</span>
                    </label>
                  }
                </div>

                @if (creationScope() !== 'lea' && selectedSchool(); as site) {
                  <div class="anim-fade-slide-in mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3" role="group" aria-label="Selected site details (read-only)">
                    <p class="mb-2 text-xs font-semibold text-o-ink-700">
                      <i class="fa-solid fa-circle-check mr-1 text-emerald-600" aria-hidden="true"></i>
                      Confirm this is the correct site — synced from SLIMS, read-only
                    </p>
                    <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                      <div><dt class="text-o-ink-600">Site Code</dt><dd class="font-mono font-medium text-slate-900">{{ site.code }}</dd></div>
                      @if (siteSchoolGroupName(); as groupName) {
                        <div><dt class="text-o-ink-600">School</dt><dd class="font-medium text-slate-900">{{ groupName }}</dd></div>
                      }
                      <div><dt class="text-o-ink-600">Grades Served</dt><dd class="font-medium text-slate-900">{{ site.gradeBand }}</dd></div>
                      <div><dt class="text-o-ink-600">City</dt><dd class="font-medium text-slate-900">{{ site.city }}</dd></div>
                      <div><dt class="text-o-ink-600">Enrollment</dt><dd class="font-mono font-medium text-slate-900">{{ site.studentCount }}</dd></div>
                      <div><dt class="text-o-ink-600">Status</dt><dd class="font-medium text-slate-900">{{ site.status }}</dd></div>
                    </dl>
                  </div>
                }
              </fieldset>
            }
            @case (1) {
              <fieldset aria-labelledby="wizardStepHeading" class="anim-fade-slide-in mt-5 grid gap-3 border-0 p-0 md:grid-cols-3">
                <legend class="sr-only">Calendar Type</legend>
                @for (type of calendarTypes(); track type) {
                  <label
                    class="flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition-all"
                    [class.border-o-primary-500]="type === selectedCalendarType()"
                    [class.bg-o-primary-50]="type === selectedCalendarType()"
                    [class.shadow-sm]="type === selectedCalendarType()"
                    [class.font-semibold]="type === selectedCalendarType()"
                    [class.text-o-primary-700]="type === selectedCalendarType()"
                    [class.border-slate-300]="type !== selectedCalendarType()"
                    [class.text-slate-700]="type !== selectedCalendarType()"
                    [class.hover:border-o-primary-300]="type !== selectedCalendarType()"
                  >
                    <input type="radio" name="calType" [value]="type" [checked]="type === selectedCalendarType()" (change)="onCalendarTypeChange(type)" />
                    {{ type }}
                    @if (type === selectedCalendarType()) {
                      <i class="fa-solid fa-circle-check ml-auto text-xs text-o-primary-500" aria-hidden="true"></i>
                    }
                  </label>
                }
              </fieldset>
            }
            @case (2) {
              <div class="anim-fade-slide-in mt-5 grid gap-4 md:grid-cols-2">
                <label class="block text-sm font-medium text-slate-700">
                  First Day
                  <input
                    type="date"
                    [value]="firstDay()"
                    (change)="onFirstDayChange($any($event.target).value)"
                    class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                  />
                </label>
                <label class="block text-sm font-medium text-slate-700">
                  Last Day
                  <input
                    type="date"
                    [value]="lastDay()"
                    [attr.min]="firstDay()"
                    (change)="onLastDayChange($any($event.target).value)"
                    class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                  />
                </label>
                <p class="text-xs text-o-ink-600 md:col-span-2">
                  Defaults come from the calendar type selected in Step 2 (<span class="font-medium">{{ selectedCalendarType() }}</span>) — adjust them for this school's actual term dates if needed.
                </p>
                @if (dateRangeError(); as error) {
                  <p class="flex items-center gap-1.5 rounded-md border border-o-secondary-200 bg-o-secondary-50 px-2.5 py-1.5 text-xs text-o-secondary-700 md:col-span-2" role="alert">
                    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                    {{ error }}
                  </p>
                }
              </div>
            }
            @case (3) {
              <fieldset aria-labelledby="wizardStepHeading" class="anim-fade-slide-in mt-5 flex flex-wrap gap-3 border-0 p-0">
                <legend class="sr-only">Grade Levels</legend>
                @for (grade of gradeLevels; track grade) {
                  <label
                    class="flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm transition-all"
                    [class.border-o-primary-500]="selectedGradeLevels().has(grade)"
                    [class.bg-o-primary-50]="selectedGradeLevels().has(grade)"
                    [class.text-o-primary-700]="selectedGradeLevels().has(grade)"
                    [class.font-semibold]="selectedGradeLevels().has(grade)"
                    [class.border-slate-300]="!selectedGradeLevels().has(grade)"
                    [class.text-slate-700]="!selectedGradeLevels().has(grade)"
                    [class.hover:border-o-primary-300]="!selectedGradeLevels().has(grade)"
                    [class.opacity-60]="creationScope() === 'grade'"
                  >
                    <input type="checkbox" [checked]="selectedGradeLevels().has(grade)" [disabled]="creationScope() === 'grade'" (change)="toggleGradeLevel(grade)" />
                    {{ grade }}
                    @if (selectedGradeLevels().has(grade)) {
                      <i class="fa-solid fa-circle-check text-xs text-o-primary-500" aria-hidden="true"></i>
                    }
                  </label>
                }
              </fieldset>
              @if (creationScope() === 'grade') {
                <p class="mt-2 text-xs text-o-ink-600">Locked to the grade selected in Step 1 ({{ selectedGrade() }}).</p>
              }
            }
            @case (4) {
              <label class="anim-fade-slide-in mt-5 block max-w-sm text-sm font-medium text-slate-700">
                Bell Schedule
                <select
                  class="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm text-o-ink-800 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                  [value]="selectedBellScheduleId() ?? ''"
                  (change)="onBellScheduleChange($any($event.target).value)"
                >
                  @for (bell of bellSchedules; track bell.id) {
                    <option [value]="bell.id">{{ bell.name }} ({{ bell.start }}–{{ bell.end }})</option>
                  }
                </select>
              </label>
              @if (selectedBellSchedule(); as bell) {
                <p class="mt-3 max-w-sm text-xs text-o-ink-600">{{ bell.instrMinutes }} instructional minutes/day — used to calculate instructional hours in the Compliance Review step.</p>
              }
            }
            @case (5) {
              <fieldset aria-labelledby="wizardStepHeading" class="anim-fade-slide-in mt-5 space-y-1 border-0 p-0">
                <legend class="sr-only">Holidays and PD Days to observe</legend>
                @if (parentCalendarName(); as parentName) {
                  <p class="mb-2 rounded-md border border-o-accent-200 bg-o-accent-50 px-2.5 py-1.5 text-xs text-o-accent-800">
                    <i class="fa-solid fa-code-branch mr-1" aria-hidden="true"></i>
                    Inherited from <span class="font-semibold">{{ parentName }}</span> - every holiday is checked by default; unchecking one records a site-level override.
                  </p>
                } @else {
                  <p class="mb-2 text-xs text-o-ink-600">Unchecked dates will be treated as regular instructional days when you build the calendar in the next step.</p>
                }
                @for (holiday of holidays; track holiday.id) {
                  <label
                    class="flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-o-primary-500 focus-within:ring-offset-1"
                    [class.border-o-primary-300]="selectedHolidayIds().has(holiday.id)"
                    [class.bg-o-primary-50]="selectedHolidayIds().has(holiday.id)"
                    [class.text-o-primary-800]="selectedHolidayIds().has(holiday.id)"
                    [class.border-transparent]="!selectedHolidayIds().has(holiday.id)"
                    [class.text-slate-700]="!selectedHolidayIds().has(holiday.id)"
                    [class.hover:border-slate-200]="!selectedHolidayIds().has(holiday.id)"
                  >
                    <span class="flex items-center gap-2">
                      <input type="checkbox" [checked]="selectedHolidayIds().has(holiday.id)" (change)="toggleHoliday(holiday.id)" />
                      {{ holiday.name }}
                      @if (parentCalendarName() && !selectedHolidayIds().has(holiday.id)) {
                        <span class="rounded border border-o-secondary-200 bg-o-secondary-50 px-1.5 py-0.5 text-[10px] font-medium text-o-secondary-700">Overridden</span>
                      }
                    </span>
                    <span class="font-mono text-xs" [class.text-o-primary-700]="selectedHolidayIds().has(holiday.id)" [class.text-o-ink-600]="!selectedHolidayIds().has(holiday.id)">{{ holiday.dates }}</span>
                  </label>
                }
              </fieldset>
            }
            @case (6) {
              <div class="anim-fade-slide-in mt-5">
                @if (!hasGenerated()) {
                  <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <i class="fa-solid fa-wand-magic-sparkles mb-2 text-2xl text-o-primary-500" aria-hidden="true"></i>
                    <p class="text-sm text-slate-600">
                      Build the instructional calendar for {{ formattedDateRange() }}, honoring weekends and the {{ selectedHolidayIds().size }} holiday(s) selected in the previous step.
                    </p>
                    <button pButton type="button" [outlined]="true" severity="secondary" class="mt-4" (click)="generateCalendar()">Auto-Generate Instructional Days</button>
                  </div>
                } @else {
                  <div class="space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" role="status">
                      <div class="text-sm text-slate-700">
                        <span class="font-mono font-semibold text-slate-900">{{ instructionalDayCount() }}</span> instructional days selected ·
                        <span class="font-mono font-semibold text-slate-900">{{ instructionalHoursLabel() }}</span> instructional hours
                      </div>
                      <button pButton type="button" [text]="true" severity="secondary" size="small" (click)="generateCalendar()">
                        <i class="fa-solid fa-arrows-rotate mr-1.5 text-xs" aria-hidden="true"></i>
                        Reset to Defaults
                      </button>
                    </div>

                    <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p class="mb-2 text-xs font-semibold text-o-ink-700">Click mode — choose what clicking a day below does:</p>
                      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Day edit mode">
                        <button
                          type="button"
                          role="radio"
                          [attr.aria-checked]="dayMode() === 'toggle'"
                          class="flex items-center gap-2 rounded-md border-2 px-3 py-2 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                          [class.border-o-primary-600]="dayMode() === 'toggle'"
                          [class.bg-o-primary-600]="dayMode() === 'toggle'"
                          [class.text-white]="dayMode() === 'toggle'"
                          [class.border-slate-300]="dayMode() !== 'toggle'"
                          [class.bg-white]="dayMode() !== 'toggle'"
                          [class.text-o-ink-700]="dayMode() !== 'toggle'"
                          (click)="dayMode.set('toggle')"
                        >
                          <i class="fa-solid fa-calendar-day" aria-hidden="true"></i>
                          Include / Exclude Days
                        </button>
                        <button
                          type="button"
                          role="radio"
                          [attr.aria-checked]="dayMode() === 'earlyDismissal'"
                          class="flex items-center gap-2 rounded-md border-2 px-3 py-2 text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                          [class.border-o-accent-600]="dayMode() === 'earlyDismissal'"
                          [class.bg-o-accent-600]="dayMode() === 'earlyDismissal'"
                          [class.text-white]="dayMode() === 'earlyDismissal'"
                          [class.border-slate-300]="dayMode() !== 'earlyDismissal'"
                          [class.bg-white]="dayMode() !== 'earlyDismissal'"
                          [class.text-o-ink-700]="dayMode() !== 'earlyDismissal'"
                          (click)="dayMode.set('earlyDismissal')"
                        >
                          <i class="fa-solid fa-clock" aria-hidden="true"></i>
                          Mark Early Dismissal
                        </button>
                      </div>
                      <p class="mt-2 text-xs text-o-ink-600">
                        @if (dayMode() === 'toggle') {
                          Click any day below to switch it between <strong>included</strong> and <strong>excluded</strong>.
                        } @else {
                          Click an instructional day below to flag it as an early dismissal (set a time &amp; reason).
                        }
                      </p>
                    </div>

                    <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Month">
                          @for (month of months(); track month.label; let mIndex = $index) {
                            <button
                              type="button"
                              role="tab"
                              [attr.aria-selected]="activeMonthIndex() === mIndex"
                              class="rounded px-2.5 py-1.5 text-xs font-medium focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                              [class.bg-o-primary-600]="activeMonthIndex() === mIndex"
                              [class.text-white]="activeMonthIndex() === mIndex"
                              [class.text-o-ink-700]="activeMonthIndex() !== mIndex"
                              [class.hover:bg-slate-100]="activeMonthIndex() !== mIndex"
                              (click)="activeMonthIndex.set(mIndex)"
                            >
                              {{ month.label }}
                            </button>
                          }
                        </div>

                        <div role="group" class="mt-3 max-w-xl" [attr.aria-label]="activeMonthLabel() + ' instructional calendar'">
                          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-o-ink-600" aria-hidden="true">
                            @for (day of weekdayHeaders; track day) {
                              <div class="pb-1">{{ day }}</div>
                            }
                          </div>
                          <div class="grid grid-cols-7 gap-1">
                            @for (day of activeMonthGrid(); track $index) {
                              @if (day.inMonth) {
                                @if (day.status === 'instruction' || day.status === 'excluded') {
                                  <button
                                    type="button"
                                    class="flex h-14 w-full flex-col items-start justify-start gap-0.5 rounded border-2 p-1.5 text-xs transition focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
                                    [ngClass]="dayClass(day.status)"
                                    [class.ring-2]="isEarlyDismissal(day.iso)"
                                    [class.ring-o-accent-400]="isEarlyDismissal(day.iso)"
                                    [attr.aria-pressed]="day.status === 'instruction'"
                                    [attr.aria-label]="dayLabel(day)"
                                    (click)="toggleDay(day.iso)"
                                  >
                                    <span class="flex w-full items-center justify-between">
                                      <span class="font-mono font-semibold" [class.line-through]="day.status === 'excluded'">{{ day.date }}</span>
                                      @if (day.status === 'instruction') {
                                        <i class="fa-solid fa-circle-check text-[11px] text-emerald-600" aria-hidden="true"></i>
                                      } @else {
                                        <i class="fa-solid fa-circle-xmark text-[11px] text-slate-400" aria-hidden="true"></i>
                                      }
                                    </span>
                                    @if (day.status === 'excluded') {
                                      <span class="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Excluded</span>
                                    }
                                    @if (isEarlyDismissal(day.iso)) {
                                      <span class="truncate text-[9px] leading-tight text-o-accent-700">Early Dismissal</span>
                                    }
                                  </button>
                                } @else {
                                  <div class="h-14 w-full rounded border p-1.5 text-left text-xs" [ngClass]="dayClass(day.status)" [attr.aria-label]="dayLabel(day)">
                                    <span class="font-mono font-semibold">{{ day.date }}</span>
                                    @if (day.holidayName) {
                                      <div class="truncate text-[9px] leading-tight">{{ day.holidayName }}</div>
                                    }
                                  </div>
                                }
                              } @else {
                                <div></div>
                              }
                            }
                          </div>
                        </div>

                        <div class="mt-3 flex flex-wrap gap-4 text-xs text-o-ink-700">
                          <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i>Included (click to exclude)</span>
                          <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark text-slate-400" aria-hidden="true"></i>Excluded (click to include)</span>
                          <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-amber-100" aria-hidden="true"></span>Weekend</span>
                          <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-o-secondary-100" aria-hidden="true"></span>Holiday / PD Day</span>
                          <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm border-2 border-o-accent-400 bg-white" aria-hidden="true"></span>Early Dismissal</span>
                        </div>
                      </div>

                      @if (dayMode() === 'earlyDismissal') {
                        <div class="anim-slide-in-right w-full shrink-0 space-y-3 rounded-lg border border-slate-200 bg-white p-3 lg:w-80" role="region" aria-label="Early dismissal settings">
                          <p class="text-xs font-semibold text-o-ink-700">Early Dismissal Settings</p>
                          <div class="space-y-2">
                            <label class="block text-xs font-medium text-slate-700">
                              Weekday
                              <select
                                [value]="recurringWeekday()"
                                (change)="recurringWeekday.set(+$any($event.target).value)"
                                class="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-o-ink-800"
                              >
                                @for (day of weekdayOptions; track day.value) {
                                  <option [value]="day.value">{{ day.label }}</option>
                                }
                              </select>
                            </label>
                            <label class="block text-xs font-medium text-slate-700">
                              Dismissal Time
                              <input
                                type="time"
                                [value]="recurringTime()"
                                (change)="recurringTime.set($any($event.target).value)"
                                class="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-o-ink-800"
                              />
                            </label>
                            <label class="block text-xs font-medium text-slate-700">
                              Reason
                              <select
                                [value]="recurringReason()"
                                (change)="recurringReason.set($any($event.target).value)"
                                class="mt-1 block w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-o-ink-800"
                              >
                                @for (reason of dismissalReasons; track reason) {
                                  <option [value]="reason">{{ reason }}</option>
                                }
                              </select>
                            </label>
                            <button pButton type="button" size="small" [outlined]="true" class="w-full justify-center" (click)="applyRecurringEarlyDismissal()">
                              + Add Recurring Early Dismissal
                            </button>
                          </div>

                          @if (earlyDismissalList().length > 0) {
                            <div class="space-y-1.5 border-t border-slate-100 pt-3">
                              <p class="text-xs font-medium text-o-ink-700">{{ earlyDismissalList().length }} early dismissal day(s) set</p>
                              @for (entry of earlyDismissalList(); track entry[0]) {
                                <div class="rounded border border-slate-200 p-2 text-xs">
                                  <div class="mb-1.5 flex items-center justify-between">
                                    <span class="font-mono font-medium text-slate-900">{{ entry[0] }}</span>
                                    <button type="button" class="text-o-secondary-700 hover:underline" (click)="removeEarlyDismissal(entry[0])">Remove</button>
                                  </div>
                                  <div class="flex gap-1.5">
                                    <input
                                      type="time"
                                      [value]="toTimeInputValue(entry[1].time)"
                                      (change)="updateEarlyDismissal(entry[0], 'time', formatTimeInput($any($event.target).value))"
                                      class="w-1/2 rounded border border-slate-300 px-1.5 py-1"
                                    />
                                    <select [value]="entry[1].reason" (change)="updateEarlyDismissal(entry[0], 'reason', $any($event.target).value)" class="w-1/2 rounded border border-slate-300 px-1.5 py-1">
                                      @for (reason of dismissalReasons; track reason) {
                                        <option [value]="reason">{{ reason }}</option>
                                      }
                                    </select>
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
            @case (7) {
              @if (!hasGenerated()) {
                <div class="anim-fade-slide-in mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-o-ink-700">
                  Go back to <span class="font-medium">Build Calendar</span> and auto-generate instructional days before reviewing compliance.
                </div>
              } @else {
                <div class="anim-fade-slide-in mt-5 grid gap-3 md:grid-cols-3">
                  <div class="rounded-md bg-slate-50 p-4 text-center">
                    <div class="font-mono text-2xl font-semibold text-slate-900">{{ instructionalDayCount() }}</div>
                    <div class="mt-1 text-xs text-o-ink-600">Instructional Days</div>
                  </div>
                  <div class="rounded-md bg-slate-50 p-4 text-center">
                    <div class="font-mono text-2xl font-semibold" [class.text-emerald-600]="meetsHourRequirement()" [class.text-o-secondary-600]="!meetsHourRequirement()">
                      {{ instructionalHoursLabel() }}
                    </div>
                    <div class="mt-1 text-xs text-o-ink-600">Total Hours</div>
                  </div>
                  <div class="rounded-md p-4 text-center" [class.bg-emerald-50]="meetsCompliance()" [class.bg-o-secondary-50]="!meetsCompliance()">
                    <div class="font-mono text-2xl font-semibold" [class.text-emerald-600]="meetsCompliance()" [class.text-o-secondary-700]="!meetsCompliance()">
                      {{ meetsCompliance() ? 'Pass' : 'Needs Attention' }}
                    </div>
                    <div class="mt-1 text-xs text-o-ink-600">180-Day / 1080-Hour Check</div>
                  </div>
                  @if (earlyDismissalCount() > 0) {
                    <p class="text-center text-xs text-o-ink-600 md:col-span-3">
                      Includes {{ earlyDismissalCount() }} early dismissal day(s), reducing total instructional hours by {{ earlyDismissalHoursReduction() }}h.
                    </p>
                  }
                </div>
              }
            }
            @case (8) {
              <div class="anim-fade-slide-in mt-5 space-y-2 text-sm">
                @if (creationScope() === 'lea') {
                  <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Scope</span><span class="font-medium text-slate-900">Entire LEA (all sites)</span></div>
                } @else {
                  <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">School / Site</span><span class="font-medium text-slate-900">{{ selectedSchool()?.name ?? '—' }}</span></div>
                }
                @if (creationScope() === 'grade') {
                  <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Grade</span><span class="font-medium text-slate-900">{{ selectedGrade() }}</span></div>
                }
                <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Type</span><span class="font-medium text-slate-900">{{ selectedCalendarType() }}</span></div>
                <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Dates</span><span class="font-mono text-slate-900">{{ formattedDateRange() }}</span></div>
                @if (parentCalendarName(); as parentName) {
                  <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Inherits From</span><span class="font-medium text-slate-900">{{ parentName }}</span></div>
                }
                <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Instructional Days</span><span class="font-mono text-slate-900">{{ hasGenerated() ? instructionalDayCount() : '—' }}</span></div>
                @if (earlyDismissalCount() > 0) {
                  <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Early Dismissals</span><span class="font-mono text-slate-900">{{ earlyDismissalCount() }}</span></div>
                }
                <div class="border-b border-slate-100 py-1.5">
                  <span class="mb-1.5 block text-o-ink-600">Visibility</span>
                  <div class="flex flex-wrap gap-2">
                    <label
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 font-medium transition-all"
                      [class.border-o-primary-500]="visibility() === 'Public'"
                      [class.bg-o-primary-50]="visibility() === 'Public'"
                      [class.text-o-primary-700]="visibility() === 'Public'"
                      [class.border-slate-300]="visibility() !== 'Public'"
                      [class.text-slate-700]="visibility() !== 'Public'"
                    >
                      <input type="radio" name="visibility" value="Public" [checked]="visibility() === 'Public'" (change)="visibility.set('Public')" />
                      Public
                      @if (visibility() === 'Public') {
                        <i class="fa-solid fa-circle-check text-xs text-o-primary-500" aria-hidden="true"></i>
                      }
                    </label>
                    <label
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 font-medium transition-all"
                      [class.border-o-primary-500]="visibility() === 'Non-public'"
                      [class.bg-o-primary-50]="visibility() === 'Non-public'"
                      [class.text-o-primary-700]="visibility() === 'Non-public'"
                      [class.border-slate-300]="visibility() !== 'Non-public'"
                      [class.text-slate-700]="visibility() !== 'Non-public'"
                    >
                      <input type="radio" name="visibility" value="Non-public" [checked]="visibility() === 'Non-public'" (change)="visibility.set('Non-public')" />
                      Non-public (internal only)
                      @if (visibility() === 'Non-public') {
                        <i class="fa-solid fa-circle-check text-xs text-o-primary-500" aria-hidden="true"></i>
                      }
                    </label>
                  </div>
                </div>

                @if (creationScope() === 'lea') {
                  <div class="space-y-2 rounded-md border border-o-accent-200 bg-o-accent-50 px-3 py-2 text-xs text-o-accent-800">
                    <p>
                      <i class="fa-solid fa-code-branch mr-1" aria-hidden="true"></i>
                      This creates 1 LEA-level calendar plus {{ leaFanoutSiteCount() }} auto-populated site calendar(s) - one per site in this LEA. Each site can override inherited holidays individually afterward.
                    </p>
                    <div class="space-y-1 border-t border-o-accent-200 pt-2">
                      <p class="font-medium">Sections to copy to each site:</p>
                      <label class="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" [checked]="copySections().instructional" (change)="toggleCopySection('instructional')" />
                        Instructional Calendar (days, hours, holidays)
                      </label>
                      <label class="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" [checked]="copySections().visibility" (change)="toggleCopySection('visibility')" />
                        Visibility (Public / Non-public)
                      </label>
                    </div>
                  </div>
                } @else if (creationScope() === 'site') {
                  <div class="pt-2">
                    <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-900">
                      <input type="checkbox" [checked]="copyToOtherSites()" (change)="copyToOtherSites.set($any($event.target).checked)" />
                      Also create this calendar for other sites
                    </label>
                    @if (copyToOtherSites()) {
                      <div class="anim-fade-slide-in mt-2 space-y-3 rounded border border-slate-200 p-3">
                        <div class="space-y-1">
                          <p class="text-xs font-medium text-o-ink-700">Sections to copy to selected sites:</p>
                          <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                            <input type="checkbox" [checked]="copySections().instructional" (change)="toggleCopySection('instructional')" />
                            Instructional Calendar (days, hours, holidays)
                          </label>
                          <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                            <input type="checkbox" [checked]="copySections().visibility" (change)="toggleCopySection('visibility')" />
                            Visibility (Public / Non-public)
                          </label>
                        </div>
                        <div class="space-y-1.5 border-t border-slate-100 pt-2">
                          @if (selectedSiteSchoolGroupId()) {
                            <button type="button" class="text-xs font-medium text-o-accent-700 hover:underline" (click)="selectAllSameSchoolGroup()">
                              Select all other sites in the same school
                            </button>
                          }
                          @for (site of copyCandidateSites(); track site.id) {
                            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                              <input type="checkbox" [checked]="copyTargetSiteIds().has(site.id)" (change)="toggleCopyTarget(site.id)" />
                              {{ site.name }} ({{ site.code }})
                            </label>
                          } @empty {
                            <p class="text-xs text-o-ink-600">No other sites in this LEA.</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>

        <div class="mt-5 flex items-center justify-between">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="previous()">
            <i class="fa-solid fa-arrow-left mr-1.5 text-xs" aria-hidden="true"></i>
            {{ currentIndex() === 0 ? 'Cancel' : 'Back' }}
          </button>
          <span class="font-mono text-xs text-o-ink-600">Step {{ currentIndex() + 1 }} / {{ steps.length }}</span>
          <button pButton type="button" (click)="next()">
            {{ isLastStep() ? 'Submit for Review' : 'Next' }}
            @if (!isLastStep()) {
              <i class="fa-solid fa-arrow-right ml-1.5 text-xs" aria-hidden="true"></i>
            }
          </button>
        </div>
      </div>
    </div>
  `
})
export class CalendarWizardPageComponent {
  private readonly repo = inject(SampleDataRepository);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  readonly leaList = this.repo.leaList;
  readonly schoolList = this.repo.schoolList;
  readonly bellSchedules = this.repo.bellSchedules;
  readonly holidays = this.repo.holidays;

  // SY 2025-26 and 12-Month are fixed calendar shapes; ESY and any other Program record
  // (created on the Programs page) are appended so a new Program becomes selectable here
  // without a code change.
  readonly calendarTypes = computed(() => {
    const base = ['SY 2025-26', 'ESY 2025', '12-Month'];
    const extraPrograms = this.repo.programs.filter((p) => p.id !== 'prog-esy-2025' && p.id !== 'prog-12month-2025').map((p) => p.name);
    return [...base, ...extraPrograms];
  });
  readonly gradeLevels = ['PK-5', '6-8', '9-12'];
  readonly weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly scopeOptions: { value: CreationScope; label: string; hint: string }[] = [
    { value: 'site', label: 'Single Site', hint: 'One calendar for one site.' },
    { value: 'lea', label: 'Entire LEA (all sites)', hint: 'One district calendar, auto-populated to every site.' },
    { value: 'grade', label: 'Single Grade at a Site', hint: 'A calendar that overrides one grade band at a site.' }
  ];
  readonly weekdayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' }
  ];
  readonly dismissalReasons = ['Professional Development', 'Weather', 'Staff Meeting', 'Parent-Teacher Conferences', 'Other'];

  // Holidays now sit before Build Calendar, so auto-generate can actually honor
  // the holidays chosen in the previous step instead of running ahead of them.
  readonly steps: IWizardStep[] = [
    { title: 'Select School', heading: 'Select School' },
    { title: 'Calendar Type', heading: 'Calendar Type' },
    { title: 'Date Range', heading: 'Date Range' },
    { title: 'Grade Levels', heading: 'Grade Levels' },
    { title: 'Bell Schedule', heading: 'Bell Schedule' },
    { title: 'Holidays & PD', heading: 'Holidays & PD Days' },
    { title: 'Build Calendar', heading: 'Build Instructional Calendar' },
    { title: 'Compliance Review', heading: 'Compliance Review' },
    { title: 'Confirm & Submit', heading: 'Confirm & Submit' }
  ];

  private readonly index = signal(0);
  readonly currentIndex = computed(() => this.index());
  readonly isLastStep = computed(() => this.index() === this.steps.length - 1);

  readonly selectedLeaId = signal<string | null>(this.repo.leaList[0]?.id ?? null);
  readonly selectedSchoolId = signal<string | null>(this.repo.schoolList[0]?.id ?? null);
  readonly selectedSchool = computed(() => this.schoolList.find((s) => s.id === this.selectedSchoolId()) ?? null);
  // Read-only confirmation only - a Site's School grouping (when it has one) is SLIMS-sourced
  // metadata, never something this form edits.
  readonly siteSchoolGroupName = computed(() => {
    const groupId = this.selectedSchool()?.schoolGroupId;
    if (!groupId) return null;
    const group = this.repo.schoolGroups.find((g) => g.id === groupId);
    return group ? `${group.name} (${group.code})` : null;
  });

  readonly dateRangeError = computed(() => (this.lastDay() < this.firstDay() ? 'Last day of school must be on or after the first day of school.' : null));

  // Three ways to reach this wizard, per the ECMS process flow: build one calendar for one
  // site, fan a district calendar out to every site in the LEA, or narrow one site down to a
  // single grade band.
  readonly creationScope = signal<CreationScope>('site');
  readonly selectedGrade = signal(this.gradeLevels[0]);
  readonly leaFanoutSiteCount = computed(() => this.schoolList.filter((s) => s.leaId === this.selectedLeaId()).length);

  // A site calendar can optionally inherit from a district/LEA-level calendar
  // (siteId === null). Holidays default to the full district list either way;
  // unchecking one while a parent is set is treated as a per-site override.
  readonly selectedParentCalendarId = signal<string | null>(null);
  readonly availableParentCalendars = computed(() => this.repo.calendars.filter((c) => c.siteId === null && c.leaId === this.selectedLeaId()));
  readonly parentCalendarName = computed(() => this.availableParentCalendars().find((c) => c.id === this.selectedParentCalendarId())?.name ?? null);

  // "Copy this calendar to other sites" at Confirm & Submit - the flowchart's inline
  // copy-on-save step, scoped to sites in the same LEA (pre-selectable in one click when the
  // chosen site belongs to a multi-site School group).
  readonly copyToOtherSites = signal(false);
  readonly copyTargetSiteIds = signal<Set<string>>(new Set());
  readonly copyCandidateSites = computed(() => this.schoolList.filter((s) => s.leaId === this.selectedLeaId() && s.id !== this.selectedSchoolId()));
  readonly selectedSiteSchoolGroupId = computed(() => this.selectedSchool()?.schoolGroupId ?? null);

  // Which sections get copied to fanned-out/secondary calendars - both default selected,
  // either can be deselected. Only applies to secondary targets; the primary calendar the user
  // is actually building always gets its own full data regardless of these toggles.
  readonly copySections = signal({ instructional: true, visibility: true });

  readonly visibility = signal<CalendarVisibility>('Public');

  readonly selectedCalendarType = signal(this.calendarTypes()[0]);

  readonly firstDay = signal(CALENDAR_TYPE_DEFAULT_RANGE[this.calendarTypes()[0]].start);
  readonly lastDay = signal(CALENDAR_TYPE_DEFAULT_RANGE[this.calendarTypes()[0]].end);

  readonly selectedGradeLevels = signal<Set<string>>(new Set(['PK-5']));

  readonly selectedBellScheduleId = signal<string | null>(this.repo.bellSchedules[0]?.id ?? null);
  readonly selectedBellSchedule = computed(() => this.bellSchedules.find((b) => b.id === this.selectedBellScheduleId()) ?? null);

  readonly selectedHolidayIds = signal<Set<string>>(new Set(this.holidays.map((h) => h.id)));

  readonly hasGenerated = signal(false);
  // ISO dates flipped away from their computed default (in-term weekday -> excluded,
  // or an out-of-term/padding weekday -> added in as an extra instructional day).
  readonly toggledDays = signal<Set<string>>(new Set());
  readonly activeMonthIndex = signal(0);

  // Early Dismissal is a modifier on an instructional day (still a full school day, just
  // shortened) rather than a fifth DayStatus, so it layers on top of dayMap instead of
  // replacing any of its four statuses.
  readonly dayMode = signal<'toggle' | 'earlyDismissal'>('toggle');
  readonly earlyDismissals = signal<Map<string, IEarlyDismissal>>(new Map());
  readonly earlyDismissalList = computed(() => Array.from(this.earlyDismissals().entries()).sort(([a], [b]) => a.localeCompare(b)));
  readonly earlyDismissalCount = computed(() => this.earlyDismissals().size);
  readonly earlyDismissalHoursReduction = computed(() => Math.round((this.earlyDismissalCount() * EARLY_DISMISSAL_REDUCTION_MINUTES) / 60));
  readonly recurringWeekday = signal(5);
  readonly recurringTime = signal('13:00');
  readonly recurringReason = signal(this.dismissalReasons[0]);

  readonly months = computed<IWizardMonth[]>(() =>
    enumerateMonths(this.firstDay(), this.lastDay()).map(({ year, month }) => ({
      year,
      month,
      label: new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
    }))
  );

  private isHoliday(iso: string): string | null {
    const selected = this.selectedHolidayIds();
    const match = this.holidays.find((h) => {
      const range = HOLIDAY_RANGES[h.id];
      return range && selected.has(h.id) && iso >= range.start && iso <= range.end;
    });
    return match ? match.name : null;
  }

  // Spans the full visible month grid (not just firstDay..lastDay) so a weekday
  // just outside the chosen term - e.g. a make-up day - can still be clicked in.
  readonly dayMap = computed<Map<string, IWizardDay>>(() => {
    const map = new Map<string, IWizardDay>();
    if (!this.hasGenerated()) return map;

    const monthList = this.months();
    if (!monthList.length) return map;

    const rangeStart = this.firstDay();
    const rangeEnd = this.lastDay();
    const toggled = this.toggledDays();

    const gridStart = new Date(monthList[0].year, monthList[0].month, 1);
    const lastMonth = monthList[monthList.length - 1];
    const gridEnd = new Date(lastMonth.year, lastMonth.month + 1, 0);

    for (const d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      const iso = toIso(d.getFullYear(), d.getMonth(), d.getDate());
      const dow = d.getDay();
      const holidayName = this.isHoliday(iso);

      let status: DayStatus;
      if (dow === 0 || dow === 6) status = 'weekend';
      else if (holidayName) status = 'holiday';
      else {
        const defaultInstruction = iso >= rangeStart && iso <= rangeEnd;
        status = defaultInstruction !== toggled.has(iso) ? 'instruction' : 'excluded';
      }

      map.set(iso, { iso, date: d.getDate(), status, holidayName, inMonth: true });
    }
    return map;
  });

  readonly instructionalDayCount = computed(() => {
    let count = 0;
    for (const day of this.dayMap().values()) if (day.status === 'instruction') count++;
    return count;
  });

  readonly instructionalHours = computed(() => {
    const minutes = this.selectedBellSchedule()?.instrMinutes ?? 0;
    const fullMinutes = this.instructionalDayCount() * minutes;
    const reduction = this.earlyDismissalCount() * EARLY_DISMISSAL_REDUCTION_MINUTES;
    return Math.round(Math.max(0, fullMinutes - reduction) / 60);
  });

  readonly instructionalHoursLabel = computed(() => this.instructionalHours().toLocaleString('en-US'));

  readonly meetsHourRequirement = computed(() => this.instructionalHours() >= 1080);
  readonly meetsCompliance = computed(() => this.instructionalDayCount() >= 180 && this.meetsHourRequirement());

  readonly activeMonth = computed(() => this.months()[this.activeMonthIndex()] ?? null);
  readonly activeMonthLabel = computed(() => this.activeMonth()?.label ?? '');

  readonly activeMonthGrid = computed<IWizardDay[]>(() => {
    const month = this.activeMonth();
    if (!month) return [];
    const { year, month: m } = month;
    const firstOfMonth = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startOffset = firstOfMonth.getDay();

    const cells: IWizardDay[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ iso: '', date: 0, status: 'excluded', holidayName: null, inMonth: false });
    }

    const map = this.dayMap();
    for (let date = 1; date <= daysInMonth; date++) {
      const iso = toIso(year, m, date);
      const day = map.get(iso);
      if (day) cells.push(day);
    }
    return cells;
  });

  constructor() {
    effect(() => {
      this.currentIndex();
      queueMicrotask(() => {
        const heading = this.stepHeading()?.nativeElement;
        // `html { scroll-behavior: smooth }` (styles.css) turns this into the slide-to-section
        // motion; focus still moves immediately underneath it for screen readers/keyboard nav.
        heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        heading?.focus({ preventScroll: true });
      });
    });

    // A Grade Level Calendar is fixed to exactly the grade chosen in Step 1 - keep the
    // Grade Levels step's checkboxes (disabled there) in sync rather than letting them
    // silently disagree with the choice that actually drives calendarLevel().
    effect(
      () => {
        if (this.creationScope() === 'grade') {
          this.selectedGradeLevels.set(new Set([this.selectedGrade()]));
        }
      },
      { allowSignalWrites: true }
    );

    // "Duplicate" on the Calendar Registry links here with ?cloneFrom=<id>. A bare
    // ICalendarSchedule row never captured the wizard's own selections (holidays,
    // grade levels, bell schedule), so this pre-fills what the row genuinely carries -
    // LEA, Site, Type, and any inheritance link - rather than overclaiming a full clone.
    const cloneFromId = this.route.snapshot.queryParamMap.get('cloneFrom');
    const source = cloneFromId ? this.repo.calendars.find((c) => c.id === cloneFromId) : null;
    if (source) {
      this.selectedLeaId.set(source.leaId);
      if (source.siteId) this.selectedSchoolId.set(source.siteId);
      if (source.parentCalendarId) this.selectedParentCalendarId.set(source.parentCalendarId);
      if (this.calendarTypes().includes(source.type)) this.onCalendarTypeChange(source.type);
      this.visibility.set(source.visibility);
      queueMicrotask(() =>
        this.messageService.add({
          severity: 'info',
          summary: 'Calendar duplicated',
          detail: `Pre-filled from ${source.name}. Holidays, grade levels, and bell schedule still need to be set for the new calendar.`
        })
      );
    }
  }

  formattedDateRange(): string {
    const format = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${format(this.firstDay())} – ${format(this.lastDay())}`;
  }

  dayClass(status: DayStatus): string {
    return DAY_STATUS_CLASS[status];
  }

  dayLabel(day: IWizardDay): string {
    const formatted = parseIso(day.iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const dismissal = this.earlyDismissals().get(day.iso);
    switch (day.status) {
      case 'instruction':
        return dismissal
          ? `${formatted}, instructional day with early dismissal at ${dismissal.time} (${dismissal.reason}). Activate to toggle.`
          : `${formatted}, instructional day, selected. Activate to exclude.`;
      case 'excluded':
        return `${formatted}, excluded from instructional days. Activate to include.`;
      case 'weekend':
        return `${formatted}, weekend, not instructional.`;
      case 'holiday':
        return `${formatted}, ${day.holidayName}, holiday, not instructional.`;
    }
  }

  isEarlyDismissal(iso: string): boolean {
    return this.earlyDismissals().has(iso);
  }

  toTimeInputValue(label: string): string {
    const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '13:00';
    const [, h, m, period] = match;
    let hour = Number(h) % 12;
    if (period.toUpperCase() === 'PM') hour += 12;
    return `${pad(hour)}:${m}`;
  }

  formatTimeInput(value: string): string {
    const [hStr, mStr] = value.split(':');
    let hour = Number(hStr);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${mStr} ${period}`;
  }

  updateEarlyDismissal(iso: string, field: 'time' | 'reason', value: string): void {
    const current = this.earlyDismissals().get(iso);
    if (!current) return;
    const next = new Map(this.earlyDismissals());
    next.set(iso, { ...current, [field]: value });
    this.earlyDismissals.set(next);
  }

  removeEarlyDismissal(iso: string): void {
    const next = new Map(this.earlyDismissals());
    next.delete(iso);
    this.earlyDismissals.set(next);
  }

  applyRecurringEarlyDismissal(): void {
    const weekday = this.recurringWeekday();
    const time = this.formatTimeInput(this.recurringTime());
    const reason = this.recurringReason();
    const next = new Map(this.earlyDismissals());
    let count = 0;
    for (const day of this.dayMap().values()) {
      if (day.status !== 'instruction') continue;
      if (parseIso(day.iso).getDay() !== weekday) continue;
      next.set(day.iso, { time, reason });
      count++;
    }
    this.earlyDismissals.set(next);
    this.messageService.add({
      severity: 'success',
      summary: 'Recurring early dismissal applied',
      detail: `${count} matching day(s) marked as early dismissal at ${time}.`
    });
  }

  onScopeChange(scope: CreationScope): void {
    this.creationScope.set(scope);
  }

  toggleCopyTarget(id: string): void {
    const next = new Set(this.copyTargetSiteIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.copyTargetSiteIds.set(next);
  }

  toggleCopySection(section: 'instructional' | 'visibility'): void {
    this.copySections.update((current) => ({ ...current, [section]: !current[section] }));
  }

  selectAllSameSchoolGroup(): void {
    const groupId = this.selectedSiteSchoolGroupId();
    if (!groupId) return;
    const matches = this.copyCandidateSites().filter((s) => s.schoolGroupId === groupId);
    this.copyTargetSiteIds.set(new Set(matches.map((s) => s.id)));
  }

  onLeaChange(id: string): void {
    this.selectedLeaId.set(id || null);
    // The parent-calendar list is scoped to the selected LEA - clear a now-invalid choice.
    if (!this.availableParentCalendars().some((c) => c.id === this.selectedParentCalendarId())) {
      this.selectedParentCalendarId.set(null);
    }
    this.copyTargetSiteIds.set(new Set());
  }

  onParentCalendarChange(id: string): void {
    this.selectedParentCalendarId.set(id || null);
  }

  onSchoolChange(id: string): void {
    this.selectedSchoolId.set(id || null);
    this.copyTargetSiteIds.set(new Set());
  }

  onCalendarTypeChange(type: string): void {
    this.selectedCalendarType.set(type);
    const range = CALENDAR_TYPE_DEFAULT_RANGE[type];
    if (range) {
      this.firstDay.set(range.start);
      this.lastDay.set(range.end);
    }
    this.hasGenerated.set(false);
    this.toggledDays.set(new Set());
    this.earlyDismissals.set(new Map());
  }

  onFirstDayChange(value: string): void {
    this.firstDay.set(value);
    this.hasGenerated.set(false);
    this.toggledDays.set(new Set());
    this.earlyDismissals.set(new Map());
  }

  onLastDayChange(value: string): void {
    this.lastDay.set(value);
    this.hasGenerated.set(false);
    this.toggledDays.set(new Set());
    this.earlyDismissals.set(new Map());
  }

  toggleGradeLevel(grade: string): void {
    const next = new Set(this.selectedGradeLevels());
    if (next.has(grade)) next.delete(grade);
    else next.add(grade);
    this.selectedGradeLevels.set(next);
  }

  onBellScheduleChange(id: string): void {
    this.selectedBellScheduleId.set(id || null);
  }

  toggleHoliday(id: string): void {
    const next = new Set(this.selectedHolidayIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedHolidayIds.set(next);
    this.hasGenerated.set(false);
  }

  toggleDay(iso: string): void {
    const day = this.dayMap().get(iso);
    if (!day) return;

    if (this.dayMode() === 'earlyDismissal') {
      if (day.status !== 'instruction') return;
      const next = new Map(this.earlyDismissals());
      if (next.has(iso)) next.delete(iso);
      else next.set(iso, { time: '1:00 PM', reason: this.dismissalReasons[0] });
      this.earlyDismissals.set(next);
      return;
    }

    if (day.status !== 'instruction' && day.status !== 'excluded') return;
    const next = new Set(this.toggledDays());
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    this.toggledDays.set(next);

    // A day just excluded can no longer carry an early-dismissal flag.
    if (this.earlyDismissals().has(iso)) {
      const nextDismissals = new Map(this.earlyDismissals());
      nextDismissals.delete(iso);
      this.earlyDismissals.set(nextDismissals);
    }
  }

  generateCalendar(): void {
    this.toggledDays.set(new Set());
    this.earlyDismissals.set(new Map());
    this.hasGenerated.set(true);
    this.activeMonthIndex.set(0);
    this.messageService.add({
      severity: 'success',
      summary: 'Instructional calendar generated',
      detail: `${this.instructionalDayCount()} instructional days scheduled across ${this.months().length} month(s).`
    });
  }

  previous(): void {
    if (this.index() === 0) {
      this.router.navigate(['/calendar']);
      return;
    }
    this.index.update((value) => value - 1);
  }

  // Same site (or same LEA, at LEA level) + same calendar type + same grade must not coexist -
  // two calendars sharing that combination represent the same real-world calendar record.
  private findDuplicateCalendar(siteId: string | null, type: string, grade: string | null): ICalendarSchedule | null {
    return (
      this.repo.calendars.find((c) => {
        if (c.type !== type) return false;
        if (siteId === null) return c.siteId === null && c.leaId === this.selectedLeaId();
        return c.siteId === siteId && (c.grade ?? null) === grade;
      }) ?? null
    );
  }

  next(): void {
    if (this.index() === 2 && this.dateRangeError()) {
      this.messageService.add({ severity: 'error', summary: 'Fix the date range', detail: this.dateRangeError()! });
      return;
    }

    if (this.isLastStep()) {
      const scope = this.creationScope();
      const type = this.selectedCalendarType();

      if (scope === 'lea') {
        const existingLea = this.findDuplicateCalendar(null, type, null);
        if (existingLea) {
          this.messageService.add({
            severity: 'error',
            summary: 'Calendar already exists',
            detail: `A ${type} calendar already exists for this LEA (${existingLea.id}). Edit that calendar instead of creating a duplicate.`
          });
          return;
        }

        const leaCalendar = this.buildCalendarRecord({ siteId: null, grade: null, parentCalendarId: null });
        this.repo.calendars.push(leaCalendar);
        const sites = this.schoolList.filter((s) => s.leaId === this.selectedLeaId());
        let skipped = 0;
        for (const site of sites) {
          if (this.findDuplicateCalendar(site.id, type, null)) {
            skipped++;
            continue;
          }
          this.repo.calendars.push(this.buildCalendarRecord({ siteId: site.id, grade: null, parentCalendarId: leaCalendar.id, sections: this.copySections() }));
        }
        this.messageService.add({
          severity: 'success',
          summary: 'LEA calendar created',
          detail:
            skipped > 0
              ? `${leaCalendar.name} was created along with ${sites.length - skipped} auto-populated site calendar(s); ${skipped} site(s) already had a ${type} calendar and were left unchanged.`
              : `${leaCalendar.name} was created along with ${sites.length} auto-populated site calendar(s). Each site can override inherited holidays individually.`
        });
        this.router.navigate(['/calendar', leaCalendar.id], { queryParams: { from: 'calendar', tab: 'registry' } });
        return;
      }

      const targetSiteId = this.selectedSchoolId();
      const targetGrade = scope === 'grade' ? this.selectedGrade() : null;
      const existingPrimary = this.findDuplicateCalendar(targetSiteId, type, targetGrade);
      if (existingPrimary) {
        this.messageService.add({
          severity: 'error',
          summary: 'Calendar already exists',
          detail: `A ${type} calendar already exists for ${this.selectedSchool()?.name ?? 'this site'} (${existingPrimary.id}). Edit that calendar instead of creating a duplicate.`
        });
        return;
      }

      const primary = this.buildCalendarRecord({
        siteId: targetSiteId,
        grade: targetGrade,
        parentCalendarId: this.selectedParentCalendarId()
      });
      this.repo.calendars.push(primary);

      let copiedCount = 0;
      let copySkipped = 0;
      if (scope === 'site' && this.copyToOtherSites()) {
        for (const siteId of this.copyTargetSiteIds()) {
          if (this.findDuplicateCalendar(siteId, type, null)) {
            copySkipped++;
            continue;
          }
          this.repo.calendars.push(this.buildCalendarRecord({ siteId, grade: null, parentCalendarId: primary.id, sections: this.copySections() }));
          copiedCount++;
        }
      }

      const copyNote = copiedCount > 0 ? ` and copied to ${copiedCount} additional site(s)` : '';
      const skipNote = copySkipped > 0 ? ` (${copySkipped} site(s) already had a ${type} calendar and were skipped)` : '';
      this.messageService.add({
        severity: 'success',
        summary: 'Calendar submitted',
        detail: `${primary.name} was submitted for review (${primary.id})${copyNote}${skipNote}.`
      });
      this.router.navigate(['/calendar', primary.id], { queryParams: { from: 'calendar', tab: 'registry' } });
      return;
    }
    this.index.update((value) => value + 1);
  }

  private buildCalendarRecord(opts: {
    siteId: string | null;
    grade: string | null;
    parentCalendarId: string | null;
    /** Governs secondary/fanned-out targets only - the primary calendar always gets full data. */
    sections?: { instructional: boolean; visibility: boolean };
  }): ICalendarSchedule {
    const sections = opts.sections ?? { instructional: true, visibility: true };
    const site = opts.siteId ? this.schoolList.find((s) => s.id === opts.siteId) ?? null : null;
    const lea = this.leaList.find((l) => l.id === this.selectedLeaId());
    const program = this.repo.programs.find((p) => p.name === this.selectedCalendarType());
    const existingNumbers = this.repo.calendars.map((c) => Number(c.id.match(/(\d+)$/)?.[1] ?? 0));
    const nextNumber = Math.max(0, ...existingNumbers) + 1;

    const name =
      opts.siteId === null
        ? `${lea?.name ?? 'LEA'} District Calendar (${this.selectedCalendarType()})`
        : opts.grade
          ? `${opts.grade} ${this.selectedCalendarType()}`
          : `${this.selectedCalendarType()} Calendar`;

    const includeInstructional = sections.instructional && this.hasGenerated();

    return {
      id: `CAL-2026-${String(nextNumber).padStart(4, '0')}`,
      name,
      schoolName: site?.name ?? (opts.siteId === null ? `All ${lea?.name ?? 'LEA'} Sites` : 'Unassigned Site'),
      leaName: lea?.name ?? 'Unassigned LEA',
      leaId: this.selectedLeaId() ?? '',
      siteId: opts.siteId,
      grade: opts.grade,
      programId: program?.id ?? null,
      parentCalendarId: opts.parentCalendarId,
      visibility: sections.visibility ? this.visibility() : 'Public',
      cycle: this.selectedCalendarType(),
      type: this.selectedCalendarType(),
      days: includeInstructional ? this.instructionalDayCount() : null,
      hours: includeInstructional ? this.instructionalHours() : null,
      compliancePercent: includeInstructional ? Math.min(100, Math.round((this.instructionalHours() / 1080) * 100)) : null,
      status: sections.instructional ? 'Under Review' : 'Draft',
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
  }

  saveDraft(): void {
    this.messageService.add({ severity: 'success', summary: 'Draft saved', detail: 'Your progress on this calendar has been saved.' });
  }
}
