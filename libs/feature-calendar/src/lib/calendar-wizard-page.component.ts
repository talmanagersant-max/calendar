import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CalendarVisibility, ICalendarSchedule, IDirectorySchool, ProgramType, SampleDataRepository, bellScheduleFor, siteDisplayName } from '@osse/shared/data-access';
import { CurrentContextService, ShellDataService, ToastService } from '@osse/shared/ui';

type StepKey = 'scope' | 'type' | 'dates' | 'grades' | 'bell' | 'holidays' | 'build' | 'compliance' | 'confirm';

interface IWizardStep {
  key: StepKey;
  title: string;
  heading: string;
}

type DayStatus = 'instruction' | 'nonInstructional' | 'weekend' | 'holiday';
type CreationScope = 'lea' | 'school';

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

// An early dismissal is still a full school day (not deducted from the day count) but
// shortens instructional time - modeled as a flat 2-hour reduction toward the 1080-hour check.
const EARLY_DISMISSAL_REDUCTION_MINUTES = 120;

// Short codes shown beside each Calendar Type label: regular school years are "R", the rest
// follow their ProgramType so a new Program gets a code without a code change.
const PROGRAM_TYPE_CODE: Record<ProgramType, string> = {
  ESY: 'ESY',
  '12-Month': '12M',
  Alternative: 'ALT'
};

// "instruction" reuses emerald - the same color the app already uses for Approved/Completed -
// so "instructional" reads as instantly familiar rather than introducing a new color meaning.
const DAY_STATUS_CLASS: Record<DayStatus, string> = {
  instruction: 'border-emerald-300 bg-emerald-50 text-o-ink-900 hover:border-emerald-500 hover:bg-emerald-100',
  nonInstructional: 'border-slate-400 bg-slate-200 text-o-ink-500 hover:border-slate-500 hover:bg-slate-300',
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
  imports: [NgClass, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Create New Calendar</h1>
        <button nz-button nzType="default" class="btn-secondary" type="button" (click)="saveDraft()">Save Draft</button>
      </div>

      <div class="rounded-lg border border-slate-200 bg-white p-5">
        <nav aria-label="Calendar creation progress" class="-mx-5 mb-6 overflow-x-auto px-5 pb-2">
          <ol class="flex items-center gap-1">
            @for (step of steps(); track step.key; let index = $index) {
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
            Step {{ currentIndex() + 1 }}: {{ currentStep().heading }}
          </h2>

          @switch (currentStep().key) {
            @case ('scope') {
              <div class="anim-fade-slide-in mt-5 space-y-4">
                @if (contextSchool(); as school) {
                  <!-- School is fixed by the top-nav shell context; this step only picks its sites. -->
                  <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p class="text-[11px] font-bold uppercase tracking-wider text-o-ink-600">School · from top navigation</p>
                    <p class="mt-0.5 text-base font-semibold text-o-ink-900">{{ school.name }}</p>
                    <p class="mt-0.5 text-xs text-o-ink-600">
                      {{ contextLea()?.name }} · Campus ID <span class="font-mono">{{ school.code }}</span> · Grades {{ school.gradeBand }}
                    </p>
                  </div>
                } @else {
                  <fieldset class="border-0 p-0">
                    <legend class="mb-2 text-sm font-medium text-slate-700">What level is this calendar for?</legend>
                    <div class="grid gap-3 md:grid-cols-2">
                      @for (option of levelOptions(); track option.value) {
                        <label
                          class="flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-all"
                          [class.border-o-primary-500]="option.value === creationScope()"
                          [class.bg-o-primary-50]="option.value === creationScope()"
                          [class.shadow-sm]="option.value === creationScope()"
                          [class.border-slate-300]="option.value !== creationScope()"
                          [class.hover:border-o-primary-300]="option.value !== creationScope()"
                        >
                          <input type="radio" name="creationScope" class="mt-1" [value]="option.value" [checked]="option.value === creationScope()" (change)="onScopeChange(option.value)" />
                          <span>
                            <span class="flex items-center gap-1.5 font-semibold" [class.text-o-primary-700]="option.value === creationScope()" [class.text-slate-900]="option.value !== creationScope()">
                              <i class="fa-solid {{ option.icon }}" aria-hidden="true"></i>
                              {{ option.label }}
                            </span>
                            <span class="mt-0.5 block text-xs text-o-ink-600">{{ option.hint }}</span>
                          </span>
                        </label>
                      }
                    </div>
                  </fieldset>

                  @if (creationScope() === 'school') {
                    <fieldset class="anim-fade-slide-in border-0 p-0">
                      <legend class="mb-2 text-sm font-medium text-slate-700">Choose a school in {{ contextLea()?.name }}</legend>
                      <div class="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                        <ul class="divide-y divide-slate-100">
                          @for (school of contextSchools(); track school.id) {
                            <li>
                              <label
                                class="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50"
                                [class.bg-o-primary-50]="school.id === pickedSchoolId()"
                              >
                                <input type="radio" name="pickedSchool" [value]="school.id" [checked]="school.id === pickedSchoolId()" (change)="onPickSchool(school.id)" />
                                <span class="min-w-0 flex-1">
                                  <span class="block truncate font-medium text-o-ink-900">{{ school.name }}</span>
                                  <span class="block text-xs text-o-ink-600">
                                    Campus ID <span class="font-mono">{{ school.code }}</span> · Grades {{ school.gradeBand }} · {{ school.sites.length }} site{{ school.sites.length === 1 ? '' : 's' }}
                                  </span>
                                </span>
                              </label>
                            </li>
                          }
                        </ul>
                      </div>
                    </fieldset>
                  }
                }

                @if (creationScope() === 'school' && selectedSchool(); as school) {
                  <fieldset class="anim-fade-slide-in rounded-lg border border-slate-200 p-0">
                    <legend class="sr-only">Sites at {{ school.name }}</legend>
                    <div class="flex items-center justify-between gap-3 rounded-t-lg border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                      <label class="flex cursor-pointer items-center gap-2 text-sm font-semibold text-o-ink-900">
                        <input
                          type="checkbox"
                          [checked]="allSitesSelected()"
                          [indeterminate]="someSitesSelected()"
                          (change)="toggleAllSites($any($event.target).checked)"
                        />
                        All sites ({{ school.sites.length }})
                      </label>
                      <span class="text-xs text-o-ink-600">{{ selectedSiteIds().size }} of {{ school.sites.length }} selected</span>
                    </div>
                    <ul class="divide-y divide-slate-100">
                      @for (site of school.sites; track site.id) {
                        <li>
                          <label class="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50">
                            <input type="checkbox" class="mt-1" [checked]="selectedSiteIds().has(site.id)" (change)="toggleSite(site.id)" />
                            <span class="min-w-0">
                              <span class="block text-sm font-medium text-o-ink-900">
                                {{ site.name }} <span class="ml-1 font-mono text-xs font-normal text-o-ink-600">{{ site.code }}</span>
                              </span>
                              <span class="block text-xs text-o-ink-600">
                                <i class="fa-solid fa-location-dot mr-1" aria-hidden="true"></i>{{ site.address }}
                              </span>
                            </span>
                          </label>
                        </li>
                      }
                    </ul>
                  </fieldset>
                  <p class="text-xs text-o-ink-600">One calendar is created for each selected site.</p>
                }

                @if (showScopeError() && scopeError(); as error) {
                  <p class="flex items-center gap-1.5 text-sm font-medium text-o-secondary-700" role="alert">
                    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                    {{ error }}
                  </p>
                }
              </div>
            }
            @case ('type') {
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
                    @if (calendarTypeCode(type); as code) {
                      <span class="font-mono text-lg font-bold leading-5 text-o-accent-600">{{ code }}</span>
                    }
                    @if (type === selectedCalendarType()) {
                      <i class="fa-solid fa-circle-check ml-auto text-xs text-o-primary-500" aria-hidden="true"></i>
                    }
                  </label>
                }
              </fieldset>
            }
            @case ('dates') {
              <div class="anim-fade-slide-in mt-5 grid gap-4 md:grid-cols-2">
                <label class="block text-sm font-medium text-slate-700">
                  First Day
                  <input
                    type="date"
                    [value]="firstDay()"
                    (change)="onFirstDayChange($any($event.target).value)"
                    class="form-control mt-2 w-full"
                  />
                </label>
                <label class="block text-sm font-medium text-slate-700">
                  Last Day
                  <input
                    type="date"
                    [value]="lastDay()"
                    [attr.min]="firstDay()"
                    (change)="onLastDayChange($any($event.target).value)"
                    class="form-control mt-2 w-full"
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
            @case ('grades') {
              @if (selectedSchool(); as school) {
                <p class="anim-fade-slide-in mt-5 text-sm text-o-ink-700">
                  <span class="font-semibold text-o-ink-900">{{ school.name }}</span> serves grades
                  <span class="font-semibold text-o-ink-900">{{ school.gradeBand }}</span>, so only those grades are shown. All are included by default - uncheck any grade this
                  calendar doesn't cover.
                </p>
                <fieldset aria-labelledby="wizardStepHeading" class="anim-fade-slide-in mt-4 border-0 p-0">
                  <legend class="sr-only">Grade Levels</legend>
                  <div class="mb-3 flex items-center gap-3 text-xs">
                    <button type="button" class="font-medium text-o-accent-700 hover:underline" (click)="setAllGrades(true)">Select all</button>
                    <span class="text-slate-300" aria-hidden="true">|</span>
                    <button type="button" class="font-medium text-o-accent-700 hover:underline" (click)="setAllGrades(false)">Clear</button>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    @for (grade of gradeOptions(); track grade) {
                      <label
                        class="flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-sm transition-all"
                        [class.border-o-primary-500]="selectedGradeLevels().has(grade)"
                        [class.bg-o-primary-50]="selectedGradeLevels().has(grade)"
                        [class.text-o-primary-700]="selectedGradeLevels().has(grade)"
                        [class.font-semibold]="selectedGradeLevels().has(grade)"
                        [class.border-slate-300]="!selectedGradeLevels().has(grade)"
                        [class.text-slate-700]="!selectedGradeLevels().has(grade)"
                        [class.hover:border-o-primary-300]="!selectedGradeLevels().has(grade)"
                      >
                        <input type="checkbox" [checked]="selectedGradeLevels().has(grade)" (change)="toggleGradeLevel(grade)" />
                        {{ grade }}
                        <!-- @if (selectedGradeLevels().has(grade)) {
                          <i class="fa-solid fa-circle-check text-xs text-o-primary-500" aria-hidden="true"></i>
                        } -->
                      </label>
                    }
                  </div>
                </fieldset>
                @if (showGradeError()) {
                  <p class="mt-3 flex items-center gap-1.5 text-sm font-medium text-o-secondary-700" role="alert">
                    <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                    Select at least one grade.
                  </p>
                }
              }
            }
            @case ('bell') {
              <label class="anim-fade-slide-in mt-5 block max-w-sm text-sm font-medium text-slate-700">
                Bell Schedule
                <select
                  class="form-control mt-2 w-full"
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
            @case ('holidays') {
              <fieldset aria-labelledby="wizardStepHeading" class="anim-fade-slide-in mt-5 space-y-1 border-0 p-0">
                <legend class="sr-only">Holidays and PD Days to observe</legend>
                <p class="mb-2 text-xs text-o-ink-600">Unchecked dates will be treated as regular instructional days when you build the calendar in the next step.</p>
                @for (holiday of holidays(); track holiday.id) {
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
                    </span>
                    <span class="font-mono text-xs" [class.text-o-primary-700]="selectedHolidayIds().has(holiday.id)" [class.text-o-ink-600]="!selectedHolidayIds().has(holiday.id)">{{ holiday.dates }}</span>
                  </label>
                }
              </fieldset>
            }
            @case ('build') {
              <div class="anim-fade-slide-in mt-5">
                @if (!hasGenerated()) {
                  <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <i class="fa-solid fa-wand-magic-sparkles mb-2 text-2xl text-o-primary-500" aria-hidden="true"></i>
                    <p class="text-sm text-slate-600">
                      Build the instructional calendar for {{ formattedDateRange() }}, honoring weekends and the {{ selectedHolidayIds().size }} holiday(s) selected in the previous step.
                    </p>
                    <button nz-button nzType="default" type="button" class="btn-secondary mt-4" (click)="generateCalendar()">Auto-Generate Instructional Days</button>
                  </div>
                } @else {
                  <div class="space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3" role="status">
                      <div class="text-sm text-slate-700">
                        <span class="font-mono font-semibold text-slate-900">{{ instructionalDayCount() }}</span> instructional days selected ·
                        <span class="font-mono font-semibold text-slate-900">{{ instructionalHoursLabel() }}</span> instructional hours
                      </div>
                      <button nz-button nzType="text" class="btn-secondary" type="button" nzSize="small" (click)="generateCalendar()">
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
                          Instructional / Non-Instructional Days
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
                          Click any day below to switch it between <strong>instructional</strong> and <strong>non-instructional</strong>.
                        } @else {
                          Click an instructional day to mark it as an early dismissal - a popup opens under the date to set the time &amp; reason.
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

                        @if (editingDismissalIso()) {
                          <button type="button" class="fixed inset-0 z-20 cursor-default" aria-label="Close early dismissal editor" tabindex="-1" (click)="closeDismissalEditor()"></button>
                        }
                        <div role="group" class="mt-3 max-w-xl" [attr.aria-label]="activeMonthLabel() + ' instructional calendar'">
                          <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium text-o-ink-600" aria-hidden="true">
                            @for (day of weekdayHeaders; track day) {
                              <div class="pb-1">{{ day }}</div>
                            }
                          </div>
                          <div class="grid grid-cols-7 gap-1">
                            @for (day of activeMonthGrid(); track cellIndex; let cellIndex = $index) {
                              @if (day.inMonth) {
                                @if (day.status === 'instruction' || day.status === 'nonInstructional') {
                                  <div class="group relative">
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
                                      <span class="font-mono font-semibold" [class.line-through]="day.status === 'nonInstructional'">{{ day.date }}</span>
                                      @if (day.status === 'instruction') {
                                        <i class="fa-solid fa-circle-check text-[11px] text-emerald-600" aria-hidden="true"></i>
                                      } @else {
                                        <i class="fa-solid fa-circle-xmark text-[11px] text-slate-400" aria-hidden="true"></i>
                                      }
                                    </span>
                                    @if (day.status === 'nonInstructional') {
                                      <span class="block truncate text-[9px] font-semibold uppercase text-slate-500" title="Non-Instructional" aria-hidden="true">Non-Instr.</span>
                                    }
                                    @if (isEarlyDismissal(day.iso)) {
                                      <span class="w-full text-left text-[9px] font-medium leading-tight text-o-accent-700">Early Dismissal</span>
                                    }
                                  </button>
                                  @if (earlyDismissals().get(day.iso); as hoverInfo) {
                                    @if (editingDismissalIso() !== day.iso) {
                                      <!-- Hover/focus tooltip with the dismissal details. -->
                                      <span
                                        class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded bg-o-ink-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg group-hover:block group-focus-within:block"
                                        role="tooltip"
                                      >
                                        Early Dismissal · {{ hoverInfo.time }} · {{ hoverInfo.reason }}
                                      </span>
                                    }
                                  }
                                  @if (editingDismissalIso() === day.iso && earlyDismissals().get(day.iso); as dismissal) {
                                    <!-- Popover anchored under the selected date; right-aligned for the last columns so it stays inside the grid. -->
                                    <div
                                      class="anim-fade-slide-in absolute top-full z-30 mt-1.5 w-64 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-xl"
                                      [class.left-0]="cellIndex % 7 < 4"
                                      [class.right-0]="cellIndex % 7 >= 4"
                                      role="dialog"
                                      [attr.aria-label]="'Early dismissal for ' + longDate(day.iso)"
                                      (keydown.escape)="closeDismissalEditor()"
                                    >
                                      <span
                                        class="absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white"
                                        [class.left-5]="cellIndex % 7 < 4"
                                        [class.right-5]="cellIndex % 7 >= 4"
                                        aria-hidden="true"
                                      ></span>
                                      <p class="text-xs font-semibold text-o-ink-900">
                                        <i class="fa-solid fa-clock mr-1 text-o-accent-600" aria-hidden="true"></i>Early dismissal · {{ longDate(day.iso) }}
                                      </p>
                                      <label class="mt-2.5 block text-xs font-medium text-slate-700">
                                        Dismissal time
                                        <input
                                          [id]="'ed-time-' + day.iso"
                                          type="time"
                                          [value]="toTimeInputValue(dismissal.time)"
                                          (change)="updateEarlyDismissal(day.iso, 'time', formatTimeInput($any($event.target).value))"
                                          class="form-control-sm mt-1 block w-full"
                                        />
                                      </label>
                                      <label class="mt-2 block text-xs font-medium text-slate-700">
                                        Reason
                                        <select
                                          (change)="updateEarlyDismissal(day.iso, 'reason', $any($event.target).value)"
                                          class="form-control-sm mt-1 block w-full"
                                        >
                                          @for (reason of dismissalReasons; track reason) {
                                            <option [value]="reason" [selected]="reason === dismissal.reason">{{ reason }}</option>
                                          }
                                        </select>
                                      </label>
                                      <div class="mt-3 flex items-center justify-between">
                                        <button nz-button nzType="text" nzDanger nzSize="small" type="button" (click)="removeEarlyDismissal(day.iso); closeDismissalEditor()">Remove</button>
                                        <button nz-button nzType="primary" nzSize="small" type="button" (click)="closeDismissalEditor()">Done</button>
                                      </div>
                                    </div>
                                  }
                                  </div>
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
                          <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-emerald-600" aria-hidden="true"></i>Instructional (click to make non-instructional)</span>
                          <span class="flex items-center gap-1.5"><i class="fa-solid fa-circle-xmark text-slate-400" aria-hidden="true"></i>Non-Instructional (click to make instructional)</span>
                          <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-amber-100" aria-hidden="true"></span>Weekend</span>
                          <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-o-secondary-100" aria-hidden="true"></span>Holiday / PD Day</span>
                          <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm border-2 border-o-accent-400 bg-white" aria-hidden="true"></span>Early Dismissal</span>
                        </div>
                      </div>

                      @if (dayMode() === 'earlyDismissal') {
                        <div class="anim-slide-in-right w-full shrink-0 space-y-3 rounded-lg border border-slate-200 bg-white p-3 lg:w-80" role="region" aria-label="Early dismissal settings">
                          
                          <div class="p-4 space-y-2 bg-blue-100">
                            <p class="text-xs font-semibold text-o-ink-700">Bulk Early Dismissal</p>
                            <label class="block text-xs font-medium text-slate-700">
                              Weekday
                              <select
                                [value]="recurringWeekday()"
                                (change)="recurringWeekday.set(+$any($event.target).value)"
                                class="form-control-sm mt-1 block w-full"
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
                                class="form-control-sm mt-1 block w-full"
                              />
                            </label>
                            <label class="block text-xs font-medium text-slate-700">
                              Reason
                              <select
                                [value]="recurringReason()"
                                (change)="recurringReason.set($any($event.target).value)"
                                class="form-control-sm mt-1 block w-full"
                              >
                                @for (reason of dismissalReasons; track reason) {
                                  <option [value]="reason">{{ reason }}</option>
                                }
                              </select>
                            </label>
                            <button nz-button nzType="default" type="button" nzSize="small" class="w-full justify-center" (click)="applyRecurringEarlyDismissal()">
                              + Add Recurring Early Dismissal
                            </button>
                          </div>

                          @if (earlyDismissalList().length > 0) {
                            <div class="space-y-2 border-t border-slate-100 pt-3">
                              <p class="text-xs font-medium text-o-ink-700">{{ earlyDismissalList().length }} early dismissal day(s) set</p>
                              <p class="text-xs text-o-ink-600">Click a date to edit its time and reason.</p>
                              <!-- Scrolling lives on a plain block wrapper: max-height + overflow directly on a
                                   flex-wrap container is unreliable in Safari/WebKit. -->
                              <div class="relative">
                              <div
                                #dismissalScroll
                                class="scrollbar-visible max-h-[200px] overflow-y-auto pr-1"
                                (scroll)="updateDismissalFade()"
                              >
                                <div class="flex flex-wrap gap-1.5">
                                @for (entry of earlyDismissalList(); track entry[0]) {
                                  <button
                                    type="button"
                                    class="rounded-full border border-o-accent-200 bg-o-accent-50 px-2 py-0.5 font-mono text-[11px] text-o-accent-700 hover:border-o-accent-400"
                                    [title]="entry[1].time + ' · ' + entry[1].reason"
                                    (click)="openDismissalEditor(entry[0])"
                                  >
                                    {{ shortDate(entry[0]) }} · {{ entry[1].time }}
                                  </button>
                                }
                                </div>
                              </div>
                              <!-- Bottom fade = "more below"; hidden once scrolled to the end. Stops short of the scrollbar. -->
                              @if (dismissalFadeVisible()) {
                                <div class="pointer-events-none absolute bottom-0 left-0 right-2 h-10 bg-gradient-to-t from-white to-transparent" aria-hidden="true"></div>
                              }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
            @case ('compliance') {
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
            @case ('confirm') {
              <div class="anim-fade-slide-in mt-5 space-y-2 text-sm">
                <div class="flex justify-between gap-4 border-b border-slate-100 py-1.5"><span class="text-o-ink-600">LEA</span><span class="text-right font-medium text-slate-900">{{ contextLea()?.name ?? '—' }}</span></div>
                @if (creationScope() === 'lea') {
                  <div class="flex justify-between gap-4 border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Level</span><span class="text-right font-medium text-slate-900">LEA-level calendar (all schools &amp; sites)</span></div>
                } @else {
                  <div class="flex justify-between gap-4 border-b border-slate-100 py-1.5"><span class="text-o-ink-600">School</span><span class="text-right font-medium text-slate-900">{{ selectedSchool()?.name ?? '—' }}</span></div>
                  <div class="flex justify-between gap-4 border-b border-slate-100 py-1.5">
                    <span class="text-o-ink-600">Sites</span>
                    <span class="text-right font-medium text-slate-900">{{ selectedSiteNames().join(', ') || '—' }}</span>
                  </div>
                  <div class="flex justify-between gap-4 border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Grades</span><span class="text-right font-medium text-slate-900">{{ selectedGradeList().join(', ') || '—' }}</span></div>
                }
                <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Type</span><span class="font-medium text-slate-900">{{ selectedCalendarType() }}</span></div>
                <div class="flex justify-between border-b border-slate-100 py-1.5"><span class="text-o-ink-600">Dates</span><span class="font-mono text-slate-900">{{ formattedDateRange() }}</span></div>
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
                      This creates 1 LEA-level calendar plus {{ leaFanoutSiteCount() }} auto-populated site calendar(s) - one per site across {{ contextSchools().length }} school(s) in this LEA. Each site can override inherited holidays individually afterward.
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
                }
              </div>
            }
          }
        </div>

        <div class="mt-5 flex items-center justify-between">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="previous()">
            <i class="fa-solid fa-arrow-left mr-1.5 text-xs" aria-hidden="true"></i>
            {{ currentIndex() === 0 ? 'Cancel' : 'Back' }}
          </button>
          <span class="font-mono text-xs text-o-ink-600">Step {{ currentIndex() + 1 }} / {{ steps().length }}</span>
          <button nz-button nzType="primary" type="button" (click)="next()">
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
  private readonly toast = inject(ToastService);

  private readonly stepHeading = viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');
  private readonly dismissalScroll = viewChild<ElementRef<HTMLElement>>('dismissalScroll');
  readonly dismissalFadeVisible = signal(false);

  private readonly context = inject(CurrentContextService);
  private readonly shell = inject(ShellDataService);
  private pendingCloneType: string | null = null;
  readonly bellSchedules = this.repo.bellSchedules;
  // Federal holidays and breaks for the selected School Year (stable ids across years).
  readonly holidays = this.shell.holidays;

  // SY 2025-26 and 12-Month are fixed calendar shapes; ESY and any other Program record
  // (created on the Programs page) are appended so a new Program becomes selectable here
  // without a code change.
  // Calendar types for the selected School Year: SY / ESY / 12-Month plus the LEA's alternative programs.
  readonly calendarTypeOptions = this.shell.calendarTypeOptions;
  readonly calendarTypes = computed(() => this.calendarTypeOptions().map((option) => option.label));
  private readonly selectedTypeOption = computed(() => this.calendarTypeOptions().find((o) => o.label === this.selectedCalendarType()) ?? this.calendarTypeOptions()[0]);

  calendarTypeCode(type: string): string | null {
    if (type.startsWith('SY ')) return 'R';
    if (type.startsWith('ESY')) return 'ESY';
    if (type === '12-Month') return '12M';
    const program = this.shell.programs().find((p) => p.name === type);
    return program ? PROGRAM_TYPE_CODE[program.type] : null;
  }
  readonly weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  readonly weekdayOptions = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' }
  ];
  readonly dismissalReasons = ['Professional Development', 'Weather', 'Staff Meeting', 'Parent-Teacher Conferences', 'Other'];

  // Shell context from the top nav: the LEA is always set; when a School is also set the wizard
  // is locked to it and Step 1 only picks sites, otherwise Step 1 chooses LEA-level vs a school.
  readonly contextLea = this.context.currentLea;
  readonly contextSchool = this.context.currentSchool;
  readonly contextSchools = this.context.schoolsInLea;

  // null until chosen when no School is set in the top nav; always 'school' when one is.
  readonly creationScope = signal<CreationScope | null>(null);
  readonly pickedSchoolId = signal<string | null>(null);
  readonly selectedSchool = computed<IDirectorySchool | null>(
    () => this.contextSchool() ?? this.contextSchools().find((s) => s.id === this.pickedSchoolId()) ?? null
  );
  readonly selectedSiteIds = signal<Set<string>>(new Set());
  readonly allSitesSelected = computed(() => {
    const sites = this.selectedSchool()?.sites ?? [];
    return sites.length > 0 && sites.every((site) => this.selectedSiteIds().has(site.id));
  });
  readonly someSitesSelected = computed(() => this.selectedSiteIds().size > 0 && !this.allSitesSelected());
  readonly selectedSiteNames = computed(() => (this.selectedSchool()?.sites ?? []).filter((site) => this.selectedSiteIds().has(site.id)).map((site) => site.name));
  readonly leaFanoutSiteCount = computed(() => this.contextSchools().reduce((total, school) => total + school.sites.length, 0));

  readonly levelOptions = computed(() => {
    const lea = this.contextLea();
    const schools = this.contextSchools();
    return [
      {
        value: 'lea' as CreationScope,
        icon: 'fa-landmark',
        label: 'LEA-level calendar',
        hint: `One calendar for ${lea?.name ?? 'this LEA'}, auto-populated to all ${this.leaFanoutSiteCount()} site(s).`
      },
      {
        value: 'school' as CreationScope,
        icon: 'fa-school',
        label: 'School-level calendar',
        hint: `Choose one of the ${schools.length} school(s) in ${lea?.name ?? 'this LEA'}, then its sites.`
      }
    ];
  });

  readonly scopeError = computed(() => {
    if (!this.creationScope()) return 'Choose an LEA-level calendar or a school.';
    if (this.creationScope() === 'school' && !this.selectedSchool()) return 'Choose a school.';
    if (this.creationScope() === 'school' && this.selectedSiteIds().size === 0) return 'Select at least one site.';
    return null;
  });
  readonly showScopeError = signal(false);

  // Grade Levels only offers what the selected school serves; LEA-level calendars skip the step.
  readonly gradeOptions = computed(() => this.selectedSchool()?.grades ?? []);
  readonly selectedGradeList = computed(() => this.gradeOptions().filter((g) => this.selectedGradeLevels().has(g)));
  readonly showGradeError = signal(false);

  // Holidays now sit before Build Calendar, so auto-generate can actually honor
  // the holidays chosen in the previous step instead of running ahead of them.
  private readonly allSteps: IWizardStep[] = [
    { key: 'scope', title: 'Select School', heading: 'Select School' },
    { key: 'type', title: 'Calendar Type', heading: 'Calendar Type' },
    { key: 'dates', title: 'Date Range', heading: 'Date Range' },
    { key: 'grades', title: 'Grade Levels', heading: 'Grade Levels' },
    { key: 'bell', title: 'Bell Schedule', heading: 'Bell Schedule' },
    { key: 'holidays', title: 'Holidays & PD', heading: 'Holidays & PD Days' },
    { key: 'build', title: 'Build Calendar', heading: 'Build Instructional Calendar' },
    { key: 'compliance', title: 'Compliance Review', heading: 'Compliance Review' },
    { key: 'confirm', title: 'Confirm & Submit', heading: 'Confirm & Submit' }
  ];
  readonly steps = computed<IWizardStep[]>(() =>
    this.allSteps
      .filter((step) => step.key !== 'grades' || this.creationScope() !== 'lea')
      .map((step) => (step.key === 'scope' && this.contextSchool() ? { ...step, title: 'Select Sites', heading: 'Select Sites' } : step))
  );

  private readonly index = signal(0);
  readonly currentIndex = computed(() => this.index());
  readonly currentStep = computed(() => this.steps()[this.index()] ?? this.steps()[0]);
  readonly isLastStep = computed(() => this.index() === this.steps().length - 1);

  readonly dateRangeError = computed(() => (this.lastDay() < this.firstDay() ? 'Last day of school must be on or after the first day of school.' : null));

  // Which sections get copied to fanned-out/secondary calendars - both default selected,
  // either can be deselected. Only applies to secondary targets; the primary calendar the user
  // is actually building always gets its own full data regardless of these toggles.
  readonly copySections = signal({ instructional: true, visibility: true });

  readonly visibility = signal<CalendarVisibility>('Public');

  readonly selectedCalendarType = signal(this.calendarTypeOptions()[0].label);

  readonly firstDay = signal(this.calendarTypeOptions()[0].range.start);
  readonly lastDay = signal(this.calendarTypeOptions()[0].range.end);

  readonly selectedGradeLevels = signal<Set<string>>(new Set());

  readonly selectedBellScheduleId = signal<string | null>(this.repo.bellSchedules[0]?.id ?? null);
  readonly selectedBellSchedule = computed(() => this.bellSchedules.find((b) => b.id === this.selectedBellScheduleId()) ?? null);

  readonly selectedHolidayIds = signal<Set<string>>(new Set(this.holidays().map((h) => h.id)));

  readonly hasGenerated = signal(false);
  // ISO dates flipped away from their computed default (in-term weekday -> non-instructional,
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
    const match = this.holidays().find((h) => {
      return !!h.start && !!h.end && selected.has(h.id) && iso >= h.start && iso <= h.end;
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
        status = defaultInstruction !== toggled.has(iso) ? 'instruction' : 'nonInstructional';
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
      cells.push({ iso: '', date: 0, status: 'nonInstructional', holidayName: null, inMonth: false });
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
    // The chip list grows/shrinks (and the box mounts/unmounts) - re-check the fade after render.
    effect(() => {
      this.earlyDismissalList();
      this.dismissalScroll();
      setTimeout(() => this.updateDismissalFade());
    });

    // Move to the new step's heading on step changes only - not on first load, which would
    // scroll the (non-sticky) top navigation out of view before the user has done anything.
    let firstStepRender = true;
    effect(() => {
      this.currentIndex();
      if (firstStepRender) {
        firstStepRender = false;
        return;
      }
      queueMicrotask(() => {
        const heading = this.stepHeading()?.nativeElement;
        // `html { scroll-behavior: smooth }` (styles.css) turns this into the slide-to-section
        // motion; focus still moves immediately underneath it for screen readers/keyboard nav.
        heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        heading?.focus({ preventScroll: true });
      });
    });

    // Changing the top-nav LEA/School mid-wizard restarts Step 1 against the new context.
    effect(
      () => {
        this.contextLea();
        this.shell.yearId();
        const school = this.contextSchool();
        this.creationScope.set(school ? 'school' : null);
        this.pickedSchoolId.set(null);
        this.showScopeError.set(false);
        this.index.set(0);
        // A "Duplicate" from the registry keeps its source type on the first pass; later scope changes reset it.
        const types = untracked(() => this.calendarTypes());
        const preferred = this.pendingCloneType && types.includes(this.pendingCloneType) ? this.pendingCloneType : types[0];
        this.pendingCloneType = null;
        untracked(() => this.onCalendarTypeChange(preferred));
        this.selectedHolidayIds.set(new Set(untracked(() => this.holidays()).map((h) => h.id)));
      },
      { allowSignalWrites: true }
    );

    // A newly selected school starts with all of its sites and all of the grades it serves.
    effect(
      () => {
        const school = this.selectedSchool();
        this.selectedSiteIds.set(new Set(school?.sites.map((site) => site.id) ?? []));
        this.selectedGradeLevels.set(new Set(school?.grades ?? []));
        // Default the bell schedule to the one matching the school's grade band.
        if (school) this.selectedBellScheduleId.set(bellScheduleFor(school));
      },
      { allowSignalWrites: true }
    );

    // "Duplicate" on the Calendar Registry links here with ?cloneFrom=<id>. A bare
    // ICalendarSchedule row never captured the wizard's own selections (holidays,
    // grade levels, bell schedule), so this pre-fills what the row genuinely carries -
    // LEA, Site, Type, and any inheritance link - rather than overclaiming a full clone.
    const cloneFromId = this.route.snapshot.queryParamMap.get('cloneFrom');
    const source = this.shell.calendarById(cloneFromId);
    if (source) {
      this.pendingCloneType = source.type;
      this.visibility.set(source.visibility);
      queueMicrotask(() =>
        this.toast.add({
          severity: 'info',
          summary: 'Calendar duplicated',
          detail: `Calendar type and visibility pre-filled from ${source.name}. Choose the school and sites in Step 1; holidays, grades, and bell schedule still need to be set.`
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
          : `${formatted}, instructional day. Activate to make it non-instructional.`;
      case 'nonInstructional':
        return `${formatted}, non-instructional day. Activate to make it instructional.`;
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
    this.toast.add({
      severity: 'success',
      summary: 'Recurring early dismissal applied',
      detail: `${count} matching day(s) marked as early dismissal at ${time}.`
    });
  }

  onScopeChange(scope: CreationScope): void {
    this.creationScope.set(scope);
    if (scope === 'lea') this.pickedSchoolId.set(null);
  }

  onPickSchool(id: string): void {
    this.pickedSchoolId.set(id);
  }

  toggleSite(id: string): void {
    const next = new Set(this.selectedSiteIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedSiteIds.set(next);
  }

  toggleAllSites(checked: boolean): void {
    this.selectedSiteIds.set(new Set(checked ? (this.selectedSchool()?.sites.map((site) => site.id) ?? []) : []));
  }

  setAllGrades(checked: boolean): void {
    this.selectedGradeLevels.set(new Set(checked ? this.gradeOptions() : []));
  }

  toggleCopySection(section: 'instructional' | 'visibility'): void {
    this.copySections.update((current) => ({ ...current, [section]: !current[section] }));
  }

  onCalendarTypeChange(type: string): void {
    this.selectedCalendarType.set(type);
    const range = this.calendarTypeOptions().find((o) => o.label === type)?.range;
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

  readonly editingDismissalIso = signal<string | null>(null);

  /** Shows the bottom fade only while the early-dismissal chip list has more content below. */
  updateDismissalFade(): void {
    const el = this.dismissalScroll()?.nativeElement;
    this.dismissalFadeVisible.set(!!el && el.scrollTop + el.clientHeight < el.scrollHeight - 2);
  }

  openDismissalEditor(iso: string): void {
    // Jump to the date's month (when opened from the summary chips), then focus the time field.
    const date = parseIso(iso);
    const monthIndex = this.months().findIndex((m) => m.year === date.getFullYear() && m.month === date.getMonth());
    if (monthIndex >= 0) this.activeMonthIndex.set(monthIndex);
    this.editingDismissalIso.set(iso);
    setTimeout(() => (document.getElementById('ed-time-' + iso) as HTMLInputElement | null)?.focus());
  }

  closeDismissalEditor(): void {
    this.editingDismissalIso.set(null);
  }

  longDate(iso: string): string {
    return parseIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  shortDate(iso: string): string {
    return parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  toggleDay(iso: string): void {
    const day = this.dayMap().get(iso);
    if (!day) return;

    if (this.dayMode() === 'earlyDismissal') {
      if (day.status !== 'instruction') return;
      // New dates get a default time/reason; either way the editor opens under the date.
      if (!this.earlyDismissals().has(iso)) {
        const next = new Map(this.earlyDismissals());
        next.set(iso, { time: '1:00 PM', reason: this.dismissalReasons[0] });
        this.earlyDismissals.set(next);
      }
      this.openDismissalEditor(iso);
      return;
    }

    if (day.status !== 'instruction' && day.status !== 'nonInstructional') return;
    const next = new Set(this.toggledDays());
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    this.toggledDays.set(next);

    // A day just made non-instructional can no longer carry an early-dismissal flag.
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
    this.toast.add({
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

  // Same site (or same LEA, at LEA level) + same calendar type must not coexist - two
  // calendars sharing that combination represent the same real-world calendar record.
  private findDuplicateCalendar(siteId: string | null, type: string): ICalendarSchedule | null {
    return this.shell.findExisting(siteId, type, this.selectedTypeOption().yearId);
  }

  next(): void {
    const step = this.currentStep().key;
    if (step === 'scope' && this.scopeError()) {
      this.showScopeError.set(true);
      return;
    }
    if (step === 'dates' && this.dateRangeError()) {
      this.toast.add({ severity: 'error', summary: 'Fix the date range', detail: this.dateRangeError()! });
      return;
    }
    if (step === 'grades' && this.selectedGradeList().length === 0) {
      this.showGradeError.set(true);
      return;
    }
    this.showScopeError.set(false);
    this.showGradeError.set(false);

    if (this.isLastStep()) {
      if (this.creationScope() === 'lea') this.submitLeaCalendar();
      else this.submitSiteCalendars();
      return;
    }
    this.index.update((value) => value + 1);
  }

  private submitLeaCalendar(): void {
    const type = this.selectedCalendarType();
    const existingLea = this.findDuplicateCalendar(null, type);
    if (existingLea) {
      this.toast.add({
        severity: 'error',
        summary: 'Calendar already exists',
        detail: `A ${type} calendar already exists for this LEA (${existingLea.id}). Edit that calendar instead of creating a duplicate.`
      });
      return;
    }

    const leaName = this.contextLea()?.name ?? 'LEA';
    const leaCalendar = this.buildCalendarRecord({ siteId: null, schoolId: null, schoolName: `All ${leaName} Sites`, parentCalendarId: null });
    this.shell.upsertCalendar(leaCalendar);
    let created = 0;
    let skipped = 0;
    for (const school of this.contextSchools()) {
      for (const site of school.sites) {
        if (this.findDuplicateCalendar(site.id, type)) {
          skipped++;
          continue;
        }
        this.shell.upsertCalendar(
          this.buildCalendarRecord({ siteId: site.id, schoolId: school.id, schoolName: siteDisplayName(school, site), parentCalendarId: leaCalendar.id, sections: this.copySections() })
        );
        created++;
      }
    }
    this.toast.add({
      severity: 'success',
      summary: 'LEA calendar created',
      detail:
        skipped > 0
          ? `${leaCalendar.name} was created along with ${created} auto-populated site calendar(s); ${skipped} site(s) already had a ${type} calendar and were left unchanged.`
          : `${leaCalendar.name} was created along with ${created} auto-populated site calendar(s). Each site can override inherited holidays individually.`
    });
    this.router.navigate(['/calendar', leaCalendar.id], { queryParams: { from: 'calendar', tab: 'registry' } });
  }

  // One calendar per selected site; sites that already have this calendar type are skipped.
  private submitSiteCalendars(): void {
    const school = this.selectedSchool();
    if (!school) return;
    const type = this.selectedCalendarType();
    const sites = school.sites.filter((site) => this.selectedSiteIds().has(site.id));
    const duplicates = sites.filter((site) => this.findDuplicateCalendar(site.id, type));
    const targets = sites.filter((site) => !duplicates.includes(site));

    if (targets.length === 0) {
      this.toast.add({
        severity: 'error',
        summary: 'Calendar already exists',
        detail: `Every selected site already has a ${type} calendar. Edit those calendars instead of creating duplicates.`
      });
      return;
    }

    const created = targets.map((site) => {
      const record = this.buildCalendarRecord({ siteId: site.id, schoolId: school.id, schoolName: siteDisplayName(school, site), parentCalendarId: null });
      this.shell.upsertCalendar(record);
      return this.shell.allCalendars().find((c) => c.siteId === record.siteId && c.type === record.type && c.yearId === record.yearId && c.status === record.status) ?? record;
    });

    const skipNote = duplicates.length > 0 ? ` ${duplicates.length} site(s) already had a ${type} calendar and were skipped.` : '';
    this.toast.add({
      severity: 'success',
      summary: created.length === 1 ? 'Calendar submitted' : `${created.length} calendars submitted`,
      detail:
        created.length === 1
          ? `${created[0].name} for ${created[0].schoolName} was submitted for review (${created[0].id}).${skipNote}`
          : `${type} calendars for ${created.length} sites at ${school.name} were submitted for review.${skipNote}`
    });
    this.router.navigate(['/calendar', created[0].id], { queryParams: { from: 'calendar', tab: 'registry' } });
  }

  private buildCalendarRecord(opts: {
    siteId: string | null;
    schoolId: string | null;
    schoolName: string;
    parentCalendarId: string | null;
    /** Governs secondary/fanned-out targets only - the primary calendar always gets full data. */
    sections?: { instructional: boolean; visibility: boolean };
  }): ICalendarSchedule {
    const sections = opts.sections ?? { instructional: true, visibility: true };
    const lea = this.contextLea();
    const option = this.selectedTypeOption();
    const name = opts.siteId === null ? `${lea?.name ?? 'LEA'} District Calendar (${this.selectedCalendarType()})` : `${this.selectedCalendarType()} Calendar`;
    const includeInstructional = sections.instructional && this.hasGenerated();

    return {
      id: this.shell.nextCalendarId(),
      name,
      schoolName: opts.schoolName,
      leaName: lea?.name ?? 'Unassigned LEA',
      leaId: lea?.id ?? '',
      siteId: opts.siteId,
      schoolId: opts.schoolId,
      yearId: option.yearId,
      grade: null,
      programId: option.programId,
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
    this.toast.add({ severity: 'success', summary: 'Draft saved', detail: 'Your progress on this calendar has been saved.' });
  }
}
