import { Injectable, computed, inject, signal } from '@angular/core';
import {
  CalendarRegistryStatus,
  ChangeRequestStatus,
  IBellSchedule,
  ICalendarSchedule,
  IChangeRequest,
  IComplianceViolation,
  IDirectorySchool,
  IDirectorySite,
  IEarlyDismissalRow,
  IEarlyDismissalSchedule,
  IHoliday,
  IMarkingPeriod,
  INonInstructionalDay,
  IProgram,
  IRoutingConflict,
  LEA_DIRECTORY,
  RoutingConflictStatus,
  SampleDataRepository,
  ViolationStatus,
  bellScheduleFor,
  changeRequestFor,
  defaultRange,
  earlyDismissalDaysFor,
  generateShellCalendars,
  holidaysForYear,
  markingPeriodsFor,
  programsForLea,
  routingConflictsFor,
  syLabel,
  syYearId,
  upcomingDismissalsFor,
  yearKind,
  yearStart,
  yearStatus
} from '@osse/shared/data-access';
import { CurrentContextService } from './current-context.service';
import { SchoolYearService } from './school-year.service';

export interface IScopedSite {
  school: IDirectorySchool;
  site: IDirectorySite;
}

export interface ICalendarTypeOption {
  label: string;
  yearId: string;
  programId: string | null;
  range: { start: string; end: string };
}

const BELOW_DAYS = 180;
const BELOW_HOURS = 1080;

/**
 * The app shell's data layer. Every page reads its data from here, scoped to the top-nav
 * LEA / School / School Year (CurrentContextService + SchoolYearService), and every edit
 * (approve, reject, create, notify...) goes through here so all pages stay in sync.
 */
@Injectable({ providedIn: 'root' })
export class ShellDataService {
  private readonly context = inject(CurrentContextService);
  private readonly years = inject(SchoolYearService);
  private readonly repo = inject(SampleDataRepository);

  // ---- Scope -----------------------------------------------------------------------------
  readonly lea = this.context.currentLea;
  readonly school = this.context.currentSchool;
  readonly year = this.years.current;
  readonly yearId = computed(() => this.year().id);
  readonly yearKind = computed(() => yearKind(this.yearId()));
  readonly yearStatus = computed(() => yearStatus(this.yearId()));
  readonly cycleStart = computed(() => yearStart(this.yearId()));
  readonly syYearId = computed(() => syYearId(this.cycleStart()));
  readonly esyYearId = computed(() => `esy-${this.cycleStart()}`);
  /** "KIPP DC PCS" or the school name when a school is selected. */
  readonly scopeLabel = computed(() => this.school()?.name ?? this.lea()?.name ?? '');
  readonly dueDate = computed(() => `Oct 1, ${this.cycleStart()}`);

  readonly schoolsInScope = computed<IDirectorySchool[]>(() => {
    const school = this.school();
    return school ? [school] : (this.lea()?.schools ?? []);
  });
  readonly sitesInScope = computed<IScopedSite[]>(() => this.schoolsInScope().flatMap((school) => school.sites.map((site) => ({ school, site }))));

  // ---- Calendar store ----------------------------------------------------------------------
  private readonly _calendars = signal<ICalendarSchedule[]>(generateShellCalendars());
  readonly allCalendars = this._calendars.asReadonly();

  private inSchoolScope(cal: ICalendarSchedule): boolean {
    const school = this.school();
    return !school || cal.siteId === null || cal.schoolId === school.id;
  }

  /** Calendars for the LEA + year, ignoring the School filter. */
  readonly leaCalendars = computed(() => {
    const leaId = this.lea()?.id;
    const yearId = this.yearId();
    return this._calendars().filter((c) => c.leaId === leaId && c.yearId === yearId);
  });
  /** Calendars for the full shell scope (LEA-level calendars stay visible when a school is selected). */
  readonly scopedCalendars = computed(() => this.leaCalendars().filter((c) => this.inSchoolScope(c)));
  readonly siteCalendars = computed(() => this.scopedCalendars().filter((c) => c.siteId !== null));
  /** ESY calendars of the cycle linked to the selected year (ESY YYYY for SY YYYY-YY). */
  readonly esyCalendars = computed(() => {
    const leaId = this.lea()?.id;
    const esyId = this.esyYearId();
    return this._calendars().filter((c) => c.leaId === leaId && c.yearId === esyId && this.inSchoolScope(c));
  });
  readonly twelveMonthCalendars = computed(() => {
    const leaId = this.lea()?.id;
    const syId = this.syYearId();
    return this._calendars().filter((c) => c.leaId === leaId && c.yearId === syId && c.type === '12-Month' && this.inSchoolScope(c));
  });

  calendarById(id: string | null): ICalendarSchedule | null {
    return id ? (this._calendars().find((c) => c.id === id) ?? null) : null;
  }

  addCalendars(calendars: ICalendarSchedule[]): void {
    this._calendars.update((list) => [...list, ...calendars]);
  }

  updateCalendars(ids: Iterable<string>, patch: Partial<ICalendarSchedule>): void {
    const idSet = new Set(ids);
    const lastUpdated = new Date().toISOString().slice(0, 10);
    this._calendars.update((list) => list.map((c) => (idSet.has(c.id) ? { ...c, ...patch, lastUpdated } : c)));
  }

  /** Replaces a "Missing" placeholder for the same site/type/year if there is one. */
  upsertCalendar(calendar: ICalendarSchedule): void {
    this._calendars.update((list) => {
      const index = list.findIndex((c) => c.siteId === calendar.siteId && c.leaId === calendar.leaId && c.type === calendar.type && c.yearId === calendar.yearId && c.status === 'Missing');
      if (index === -1) return [...list, calendar];
      const next = list.slice();
      next[index] = { ...calendar, id: list[index].id };
      return next;
    });
  }

  /** Existing, non-placeholder calendar for a site (or the LEA when siteId is null). */
  findExisting(siteId: string | null, type: string, yearId: string): ICalendarSchedule | null {
    const leaId = this.lea()?.id;
    return this._calendars().find((c) => c.leaId === leaId && c.siteId === siteId && c.type === type && c.yearId === yearId && c.status !== 'Missing') ?? null;
  }

  private customCalendarCount = 0;
  nextCalendarId(): string {
    this.customCalendarCount++;
    return `CAL-${this.cycleStart()}-N-${String(this.customCalendarCount).padStart(4, '0')}`;
  }

  // ---- Calendar type options for the wizards ------------------------------------------------
  readonly programs = computed<IProgram[]>(() => {
    const lea = this.lea();
    if (!lea) return [];
    return [...programsForLea(lea), ...this._customPrograms().filter((p) => p.leaId === lea.id)];
  });
  private readonly _customPrograms = signal<IProgram[]>([]);
  addProgram(program: Omit<IProgram, 'id' | 'leaId'>): IProgram {
    const created: IProgram = { ...program, id: `prog-custom-${this._customPrograms().length + 1}`, leaId: this.lea()?.id ?? '' };
    this._customPrograms.update((list) => [...list, created]);
    return created;
  }

  readonly calendarTypeOptions = computed<ICalendarTypeOption[]>(() => {
    const start = this.cycleStart();
    const esy: ICalendarTypeOption = { label: `ESY ${start}`, yearId: this.esyYearId(), programId: this.programs().find((p) => p.type === 'ESY')?.id ?? null, range: defaultRange('ESY', start) };
    if (this.yearKind() === 'ESY') return [esy];
    const sy = defaultRange('SY', start);
    return [
      { label: syLabel(start), yearId: this.syYearId(), programId: null, range: sy },
      esy,
      { label: '12-Month', yearId: this.syYearId(), programId: this.programs().find((p) => p.type === '12-Month')?.id ?? null, range: defaultRange('12-Month', start) },
      ...this.programs()
        .filter((p) => p.type === 'Alternative')
        .map((p) => ({ label: p.name, yearId: this.syYearId(), programId: p.id, range: sy }))
    ];
  });

  // ---- Status counts ---------------------------------------------------------------------
  readonly counts = computed(() => {
    const cals = this.siteCalendars();
    const count = (status: CalendarRegistryStatus) => cals.filter((c) => c.status === status).length;
    const built = cals.filter((c) => c.days !== null);
    return {
      total: cals.length,
      approved: count('Approved'),
      underReview: count('Under Review'),
      draft: count('Draft'),
      rejected: count('Rejected'),
      missing: count('Missing'),
      submitted: cals.filter((c) => c.status === 'Approved' || c.status === 'Under Review' || c.status === 'Rejected').length,
      belowDays: built.filter((c) => (c.days ?? 0) < BELOW_DAYS && c.type !== `ESY ${this.cycleStart()}`).length,
      belowHours: built.filter((c) => (c.hours ?? 0) < BELOW_HOURS && !c.type.startsWith('ESY')).length
    };
  });

  // ---- Holidays & bell schedules ---------------------------------------------------------
  // A regular year gets the full federal/local list; an ESY summer only crosses Independence Day.
  readonly holidays = computed<IHoliday[]>(() => {
    const appliesTo = `All ${this.scopeLabel()} schools`;
    if (this.yearKind() === 'ESY') {
      const start = this.cycleStart();
      const july4 = new Date(start, 6, 4);
      const iso = `${start}-07-04`;
      return [{ id: 'hol-independence', name: 'Independence Day', type: 'Federal', appliesTo, start: iso, end: iso, dates: july4.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }];
    }
    return holidaysForYear(this.cycleStart(), appliesTo);
  });

  readonly bellSchedules = computed<IBellSchedule[]>(() => {
    const schools = this.schoolsInScope();
    return this.repo.bellSchedules.map((bell) => ({ ...bell, schoolsUsing: schools.filter((s) => bellScheduleFor(s) === bell.id).length }));
  });

  // ---- Marking periods -------------------------------------------------------------------
  private readonly _addedPeriods = signal<IMarkingPeriod[]>([]);
  private readonly _removedPeriodIds = signal<Set<string>>(new Set());
  readonly markingPeriods = computed<IMarkingPeriod[]>(() => {
    const calendars = this.scopedCalendars();
    const ids = new Set(calendars.map((c) => c.id));
    const removed = this._removedPeriodIds();
    return [...calendars.flatMap((c) => markingPeriodsFor(c)), ...this._addedPeriods().filter((p) => ids.has(p.calendarId))].filter((p) => !removed.has(p.id));
  });
  addMarkingPeriod(period: IMarkingPeriod): void {
    this._addedPeriods.update((list) => [...list, period]);
  }
  removeMarkingPeriod(id: string): void {
    this._removedPeriodIds.update((set) => new Set(set).add(id));
  }

  // ---- Approvals -------------------------------------------------------------------------
  private readonly _changeRequestStatus = signal<Map<string, ChangeRequestStatus>>(new Map());
  readonly changeRequests = computed<IChangeRequest[]>(() => {
    const overrides = this._changeRequestStatus();
    return this.siteCalendars()
      .map((c) => changeRequestFor(c))
      .filter((cr): cr is IChangeRequest => cr !== null)
      .map((cr) => ({ ...cr, status: overrides.get(cr.id) ?? cr.status }));
  });
  setChangeRequestStatus(id: string, status: ChangeRequestStatus): void {
    this._changeRequestStatus.update((map) => new Map(map).set(id, status));
  }

  // ---- Compliance ------------------------------------------------------------------------
  readonly earlyDismissalImpact = computed<IEarlyDismissalRow[]>(() => {
    if (this.yearKind() === 'ESY') return [];
    const yearId = this.yearId();
    return this.schoolsInScope()
      .filter((s) => s.grades[0] !== 'Adult')
      .map((s) => {
        const days = earlyDismissalDaysFor(s.id, yearId);
        return { schoolId: s.id, school: s.name, days, minutesImpact: -Math.round(days * 6.6), flag: days > 20 ? ('Violation' as const) : ('Compliant' as const) };
      });
  });

  private readonly _violationStatus = signal<Map<string, ViolationStatus>>(new Map());
  readonly complianceViolations = computed<IComplianceViolation[]>(() => {
    const historical = this.yearStatus() === 'historical';
    const current = this.yearStatus() === 'current';
    const overrides = this._violationStatus();
    const rows: IComplianceViolation[] = [];
    for (const cal of this.siteCalendars()) {
      const base = { schoolId: cal.schoolId ?? undefined, school: cal.schoolName };
      // A missing calendar only becomes a violation once its year is underway.
      if (cal.status === 'Missing' && current) {
        rows.push({ ...base, id: `v-${cal.id}-missing`, issue: `Missing ${cal.type} calendar — 0 days submitted`, days: '—', severity: 'Critical', status: 'Open' });
      }
      if (cal.days !== null && cal.days < BELOW_DAYS && !cal.type.startsWith('ESY')) {
        rows.push({ ...base, id: `v-${cal.id}-days`, issue: 'Below 180-day threshold', days: String(cal.days), severity: 'High', status: historical ? 'Resolved' : 'Open' });
      }
      if (cal.hours !== null && cal.hours < BELOW_HOURS && !cal.type.startsWith('ESY')) {
        rows.push({ ...base, id: `v-${cal.id}-hours`, issue: `Below 1080-hour requirement (${cal.hours} hours)`, days: String(cal.days ?? '—'), severity: 'Medium', status: historical ? 'Resolved' : 'Open' });
      }
    }
    for (const row of this.earlyDismissalImpact()) {
      if (row.flag === 'Violation') {
        rows.push({ id: `v-${row.schoolId}-${this.yearId()}-ed`, schoolId: row.schoolId, school: row.school, issue: `Excessive early dismissals: ${row.days} days (max 20)`, days: '—', severity: 'High', status: historical ? 'Resolved' : 'Open' });
      }
    }
    return rows.map((row) => ({ ...row, status: overrides.get(row.id ?? '') ?? row.status }));
  });
  setViolationStatus(ids: string[], status: ViolationStatus): void {
    this._violationStatus.update((map) => {
      const next = new Map(map);
      ids.forEach((id) => next.set(id, status));
      return next;
    });
  }

  // ---- DOT routing -----------------------------------------------------------------------
  private readonly _conflictStatus = signal<Map<string, RoutingConflictStatus>>(new Map());
  private readonly _notifiedIds = signal<Set<string>>(new Set());

  readonly routingConflicts = computed<IRoutingConflict[]>(() => {
    const overrides = this._conflictStatus();
    return this.schoolsInScope()
      .flatMap((s) => routingConflictsFor(s, this.yearId()))
      .map((c) => ({ ...c, status: overrides.get(c.id ?? '') ?? c.status }));
  });
  readonly openConflictCount = computed(() => this.routingConflicts().filter((c) => c.status !== 'Resolved').length);
  setConflictStatus(ids: string[], status: RoutingConflictStatus): void {
    this._conflictStatus.update((map) => {
      const next = new Map(map);
      ids.forEach((id) => next.set(id, status));
      return next;
    });
  }

  readonly upcomingDismissals = computed<IEarlyDismissalSchedule[]>(() => {
    const notified = this._notifiedIds();
    return this.schoolsInScope()
      .flatMap((s) => upcomingDismissalsFor(s, this.yearId()))
      .map((d) => ({ ...d, notified: d.notified || notified.has(d.id ?? '') }));
  });

  readonly nonInstructionalDays = computed<INonInstructionalDay[]>(() => {
    if (this.yearKind() === 'ESY') return [];
    const notified = this._notifiedIds();
    const historical = this.yearStatus() === 'historical';
    const label = this.school()?.name ?? `All ${this.lea()?.name ?? ''}`;
    return this.holidays()
      .slice(0, 6)
      .map((h, i) => {
        const id = `ni-${this.lea()?.id}-${this.school()?.id ?? 'all'}-${this.yearId()}-${h.id}`;
        return {
          id,
          schools: label,
          date: h.dates,
          type: h.type === 'Federal' ? 'Holiday' : 'Break',
          routes: 'All',
          status: historical || i < 2 || notified.has(id) ? ('Notified' as const) : ('Pending' as const)
        };
      });
  });

  markNotified(ids: string[]): void {
    this._notifiedIds.update((set) => {
      const next = new Set(set);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  // ---- Helpers ---------------------------------------------------------------------------
  /** Directory lookup across all LEAs (calendar detail links can point outside the scope). */
  findSite(siteId: string | null): IScopedSite | null {
    if (!siteId) return null;
    for (const lea of LEA_DIRECTORY) {
      for (const school of lea.schools) {
        const site = school.sites.find((s) => s.id === siteId);
        if (site) return { school, site };
      }
    }
    return null;
  }
}
