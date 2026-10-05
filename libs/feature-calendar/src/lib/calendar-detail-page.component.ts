import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SampleDataRepository } from '@osse/shared/data-access';

type DayStatus = 'instruction' | 'holiday' | 'weekend' | 'none';

interface ICalendarDay {
  date: number;
  status: DayStatus;
  label: string;
  cycleLetter: string | null;
  inMonth: boolean;
}

const CYCLE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  { year: 2025, month: 8, label: 'Sep' },
  { year: 2025, month: 9, label: 'Oct' },
  { year: 2025, month: 10, label: 'Nov' },
  { year: 2025, month: 11, label: 'Dec' },
  { year: 2026, month: 0, label: 'Jan' },
  { year: 2026, month: 1, label: 'Feb' },
  { year: 2026, month: 2, label: 'Mar' },
  { year: 2026, month: 3, label: 'Apr' },
  { year: 2026, month: 4, label: 'May' },
  { year: 2026, month: 5, label: 'Jun' }
];

const DAY_STATUS_CLASS: Record<DayStatus, string> = {
  instruction: 'bg-o-accent-50 border-o-accent-100 text-slate-900',
  holiday: 'bg-red-50 border-red-100 text-red-800',
  weekend: 'bg-slate-50 border-slate-100 text-slate-300',
  none: 'border-transparent'
};

@Component({
  selector: 'osse-calendar-detail-page',
  standalone: true,
  imports: [NgClass, ButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">{{ calendar()?.schoolName }} — {{ calendar()?.type }}</h1>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{{ calendar()?.status }}</span>
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('PDF downloaded')">Download PDF</button>
          <button pButton type="button" (click)="notify('Change request submitted')">Request Change</button>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Instructional Days</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ calendar()?.days ?? '—' }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Instructional Hours</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">{{ calendar()?.hours ?? '—' }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">Early Dismissals</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">8</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="text-xs text-slate-500">PD Days</div>
          <div class="mt-1.5 font-mono text-2xl font-semibold text-slate-900">6</div>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap gap-1.5">
              @for (month of months; track month.label; let index = $index) {
                <button
                  type="button"
                  class="rounded px-2.5 py-1.5 text-xs font-medium"
                  [class.bg-o-accent-600]="monthIndex() === index"
                  [class.text-white]="monthIndex() === index"
                  [class.text-slate-600]="monthIndex() !== index"
                  [class.hover:bg-slate-100]="monthIndex() !== index"
                  (click)="monthIndex.set(index)"
                >
                  {{ month.label }}
                </button>
              }
            </div>
            <div class="flex items-center gap-3 font-mono text-sm text-slate-700">
              <button pButton type="button" [text]="true" [rounded]="true" severity="secondary" size="small" icon="fa-solid fa-chevron-left" class="!h-6 !w-6 !p-0" (click)="shiftMonth(-1)"></button>
              {{ monthLabel() }}
              <button pButton type="button" [text]="true" [rounded]="true" severity="secondary" size="small" icon="fa-solid fa-chevron-right" class="!h-6 !w-6 !p-0" (click)="shiftMonth(1)"></button>
            </div>
          </div>

          <div class="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-500">
            @for (day of weekdayHeaders; track day) {
              <div class="pb-1">{{ day }}</div>
            }
          </div>
          <div class="grid grid-cols-7 gap-1.5">
            @for (day of monthGrid(); track $index) {
              @if (day.inMonth) {
                <button
                  type="button"
                  class="relative aspect-square rounded border p-1.5 text-left text-xs transition hover:border-o-accent-300"
                  [ngClass]="dayClass(day.status)"
                  (click)="selectDay(day)"
                >
                  <span class="font-mono font-semibold">{{ day.date }}</span>
                  @if (day.label) {
                    <div class="mt-0.5 truncate text-[10px]">{{ day.label }}</div>
                  }
                </button>
              } @else {
                <div></div>
              }
            }
          </div>

          <div class="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-o-accent-100"></span>Instructional</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-red-100"></span>Holiday</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-amber-100"></span>PD Day</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-purple-100"></span>Early Dismissal</span>
            <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-emerald-100"></span>ESY</span>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <h2 class="text-sm font-semibold text-slate-900">Day Detail</h2>
            @if (selectedDay()) {
              <p class="mt-2 text-sm text-slate-600">
                {{ monthLabel() }} {{ selectedDay()!.date }} — <span class="font-medium text-slate-900">{{ selectedDay()!.label || 'Instructional day' }}</span>
              </p>
            } @else {
              <p class="mt-2 text-sm text-slate-400">Click any day on the calendar to view details.</p>
            }
          </div>

          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <h2 class="text-sm font-semibold text-slate-900">Calendar Info</h2>
            <dl class="mt-3 space-y-2 text-sm">
              <div class="flex justify-between"><dt class="text-slate-500">ID</dt><dd class="font-mono text-slate-900">{{ calendar()?.id }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">School</dt><dd class="font-mono text-slate-900">{{ calendar()?.schoolName }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">LEA</dt><dd class="font-mono text-slate-900">{{ calendar()?.leaName }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Type</dt><dd class="font-mono text-slate-900">{{ calendar()?.type }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Visibility</dt><dd class="font-mono text-slate-900">{{ calendar()?.visibility }}</dd></div>
              <div class="flex justify-between"><dt class="text-slate-500">Submitted</dt><dd class="font-mono text-slate-900">{{ calendar()?.submittedDate ?? '—' }}</dd></div>
            </dl>
            @if (parentCalendar(); as parent) {
              <div class="mt-3 rounded-md border border-o-accent-200 bg-o-accent-50 px-3 py-2 text-xs text-o-accent-800">
                <i class="fa-solid fa-code-branch mr-1" aria-hidden="true"></i>
                Inherited from <a [routerLink]="['/calendar', parent.id]" class="font-semibold underline">{{ parent.name }}</a> - holidays and marking periods default to
                the parent unless overridden here.
              </div>
            }
            @if (copiedFromCalendar(); as source) {
              <div class="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-o-ink-700">
                <i class="fa-solid fa-copy mr-1" aria-hidden="true"></i>
                Created by copying <a [routerLink]="['/calendar', source.id]" class="font-semibold underline">{{ source.name }}</a> - a one-time snapshot for
                traceability only, not a live link. Editing either calendar does not affect the other.
              </div>
            }
          </div>

          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <h2 class="text-sm font-semibold text-slate-900">Actions</h2>
            <div class="mt-3 flex flex-col gap-2">
              <button pButton type="button" [outlined]="true" severity="secondary" size="small" (click)="notify('Change request submitted')">Request Change</button>
              <button pButton type="button" [outlined]="true" severity="secondary" size="small" (click)="notify('PDF downloaded')">Download PDF</button>
              <button pButton type="button" [text]="true" size="small" class="!justify-start" label="View Audit Log" (click)="notify('Opening audit log')"></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CalendarDetailPageComponent {
  private route = inject(ActivatedRoute);
  private repo = inject(SampleDataRepository);

  readonly calendar = computed(() => {
    const id = this.route.snapshot.paramMap.get('calendarId');
    return this.repo.calendars.find((c) => c.id === id) ?? this.repo.calendars[0];
  });

  readonly parentCalendar = computed(() => {
    const parentId = this.calendar()?.parentCalendarId;
    return parentId ? (this.repo.calendars.find((c) => c.id === parentId) ?? null) : null;
  });

  readonly copiedFromCalendar = computed(() => {
    const sourceId = this.calendar()?.copiedFromId;
    return sourceId ? (this.repo.calendars.find((c) => c.id === sourceId) ?? null) : null;
  });

  readonly months = MONTHS;
  readonly weekdayHeaders = WEEKDAY_HEADERS;
  readonly monthIndex = signal(0);
  readonly selectedDay = signal<ICalendarDay | null>(null);

  readonly monthLabel = computed(() => {
    const m = this.months[this.monthIndex()];
    return `${new Date(m.year, m.month, 1).toLocaleString('en-US', { month: 'long' })} ${m.year}`;
  });

  readonly monthGrid = computed<ICalendarDay[]>(() => {
    const { year, month } = this.months[this.monthIndex()];
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = firstDay.getDay();

    const cells: ICalendarDay[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: 0, status: 'none', label: '', cycleLetter: null, inMonth: false });
    }

    let cycleIndex = 0;
    for (let date = 1; date <= daysInMonth; date++) {
      const dow = new Date(year, month, date).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isLaborDay = year === 2025 && month === 8 && date === 1;

      if (isWeekend) {
        cells.push({ date, status: 'weekend', label: '', cycleLetter: null, inMonth: true });
      } else if (isLaborDay) {
        cells.push({ date, status: 'holiday', label: 'Labor Day', cycleLetter: null, inMonth: true });
      } else {
        cells.push({ date, status: 'instruction', label: '', cycleLetter: CYCLE_LETTERS[cycleIndex % 6], inMonth: true });
        cycleIndex++;
      }
    }

    return cells;
  });

  dayClass(status: DayStatus): string {
    return DAY_STATUS_CLASS[status];
  }

  shiftMonth(delta: number): void {
    const next = this.monthIndex() + delta;
    if (next >= 0 && next < this.months.length) {
      this.monthIndex.set(next);
      this.selectedDay.set(null);
    }
  }

  selectDay(day: ICalendarDay): void {
    this.selectedDay.set(day);
  }

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
