import { CalendarRegistryStatus, ICalendarSchedule } from '../interfaces/calendar.interface';
import { IDirectoryLea, IDirectorySchool, IDirectorySite } from '../interfaces/lea.interface';
import {
  ChangeRequestStatus,
  IChangeRequest,
  IEarlyDismissalSchedule,
  IHoliday,
  IMarkingPeriod,
  IProgram,
  IRoutingConflict,
  IWaiver,
  RoutingConflictStatus,
  WaiverStatus
} from '../interfaces/operations.interface';
import { LEA_DIRECTORY } from './lea-directory.data';

/**
 * Deterministic mock data for the app shell (top-nav LEA / School / School Year). Every record is
 * generated from the LEA directory with a seeded hash, so the same scope always shows the same data
 * and every page agrees with every other page. All of it is placeholder data.
 */

export type SchoolYearStatus = 'historical' | 'current' | 'future';
export type SchoolYearKind = 'SY' | 'ESY';

export interface ISchoolYearOption {
  id: string;
  label: string;
  status: SchoolYearStatus;
}

export const SCHOOL_YEARS: ISchoolYearOption[] = [
  { id: 'sy-2023-24', label: 'SY 2023-24', status: 'historical' },
  { id: 'sy-2024-25', label: 'SY 2024-25', status: 'historical' },
  { id: 'esy-2025', label: 'ESY 2025', status: 'historical' },
  { id: 'sy-2025-26', label: 'SY 2025-26', status: 'current' },
  { id: 'esy-2026', label: 'ESY 2026', status: 'future' },
  { id: 'sy-2026-27', label: 'SY 2026-27', status: 'future' },
  { id: 'esy-2027', label: 'ESY 2027', status: 'future' }
];

/** Stable pseudo-random number in [0, 1) for a key (FNV-1a). */
export function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function yearKind(yearId: string): SchoolYearKind {
  return yearId.startsWith('esy-') ? 'ESY' : 'SY';
}

/** Calendar year the cycle starts in: "sy-2025-26" -> 2025, "esy-2026" -> 2026. */
export function yearStart(yearId: string): number {
  return Number(yearId.match(/(\d{4})/)?.[1] ?? 2025);
}

export function syYearId(start: number): string {
  return `sy-${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export function syLabel(start: number): string {
  return `SY ${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export function yearStatus(yearId: string): SchoolYearStatus {
  return SCHOOL_YEARS.find((y) => y.id === yearId)?.status ?? 'future';
}

// ---------------------------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------------------------

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local-time Date from "YYYY-MM-DD" (new Date(iso) would parse as UTC and shift a day). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** nth (1-based) weekday (0=Sun) of a month; n = -1 for the last one. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n === -1) {
    const last = new Date(year, month + 1, 0);
    last.setDate(last.getDate() - ((last.getDay() - weekday + 7) % 7));
    return last;
  }
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatIso(iso: string): string {
  return formatDate(parseIsoDate(iso));
}

/** Default first/last day per calendar kind for a cycle starting in `start`. */
export function defaultRange(kind: 'SY' | 'ESY' | '12-Month', start: number): { start: string; end: string } {
  if (kind === 'ESY') {
    const firstMonday = nthWeekday(start, 6, 1, 1);
    const begin = firstMonday.getDate() <= 4 ? addDays(firstMonday, 7) : firstMonday; // after July 4th
    return { start: isoDate(begin), end: isoDate(addDays(begin, 39)) };
  }
  if (kind === '12-Month') return { start: `${start}-07-01`, end: `${start + 1}-06-30` };
  const laborDay = nthWeekday(start, 8, 1, 1);
  const juneteenth = new Date(start + 1, 5, 19);
  const lastDay = addDays(juneteenth, juneteenth.getDay() === 6 ? -1 : juneteenth.getDay() === 0 ? -2 : 0);
  return { start: isoDate(addDays(laborDay, 1)), end: isoDate(lastDay) };
}

/** Federal holidays and standard local breaks for the school year starting in `start`. */
export function holidaysForYear(start: number, appliesTo: string): IHoliday[] {
  const next = start + 1;
  const thanksgiving = nthWeekday(start, 10, 4, 4);
  const springBreakMonday = nthWeekday(next, 3, 1, 2);
  const rows: { id: string; name: string; type: 'Federal' | 'Local'; from: Date; to: Date }[] = [
    { id: 'hol-labor', name: 'Labor Day', type: 'Federal', from: nthWeekday(start, 8, 1, 1), to: nthWeekday(start, 8, 1, 1) },
    { id: 'hol-indigenous', name: 'Columbus / Indigenous Peoples Day', type: 'Federal', from: nthWeekday(start, 9, 1, 2), to: nthWeekday(start, 9, 1, 2) },
    { id: 'hol-veterans', name: 'Veterans Day', type: 'Federal', from: new Date(start, 10, 11), to: new Date(start, 10, 11) },
    { id: 'hol-thanksgiving', name: 'Thanksgiving Break', type: 'Local', from: thanksgiving, to: addDays(thanksgiving, 1) },
    { id: 'hol-winter', name: 'Winter Break', type: 'Local', from: new Date(start, 11, 22), to: new Date(next, 0, 2) },
    { id: 'hol-mlk', name: 'MLK Jr. Day', type: 'Federal', from: nthWeekday(next, 0, 1, 3), to: nthWeekday(next, 0, 1, 3) },
    { id: 'hol-presidents', name: 'Presidents Day', type: 'Federal', from: nthWeekday(next, 1, 1, 3), to: nthWeekday(next, 1, 1, 3) },
    { id: 'hol-spring', name: 'Spring Break', type: 'Local', from: springBreakMonday, to: addDays(springBreakMonday, 4) },
    { id: 'hol-memorial', name: 'Memorial Day', type: 'Federal', from: nthWeekday(next, 4, 1, -1), to: nthWeekday(next, 4, 1, -1) },
    { id: 'hol-juneteenth', name: 'Juneteenth', type: 'Federal', from: new Date(next, 5, 19), to: new Date(next, 5, 19) }
  ];
  return rows.map((row) => {
    const startIso = isoDate(row.from);
    const endIso = isoDate(row.to);
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      appliesTo,
      start: startIso,
      end: endIso,
      dates: startIso === endIso ? formatIso(startIso) : `${formatIso(startIso)} - ${formatIso(endIso)}`
    };
  });
}

// ---------------------------------------------------------------------------------------------
// Directory helpers
// ---------------------------------------------------------------------------------------------

export function isAdultSchool(school: IDirectorySchool): boolean {
  return school.grades.length === 1 && school.grades[0] === 'Adult';
}

/** Display name for a site: the school name, plus the site name when the school has several. */
export function siteDisplayName(school: IDirectorySchool, site: IDirectorySite): string {
  return school.sites.length > 1 ? `${school.name} · ${site.name}` : school.name;
}

/** Bell schedule id assigned to a school, from its grade band. */
export function bellScheduleFor(school: IDirectorySchool): string {
  const g = school.grades;
  if (isAdultSchool(school)) return 'BS-004';
  if (g.every((x) => ['Pre-K', 'K', '1', '2', '3', '4', '5'].includes(x))) return 'BS-001';
  if (g.every((x) => ['6', '7', '8'].includes(x))) return 'BS-002';
  if (g.every((x) => ['9', '10', '11', '12'].includes(x))) return 'BS-003';
  return 'BS-004';
}

// ---------------------------------------------------------------------------------------------
// Calendars
// ---------------------------------------------------------------------------------------------

function siteStatus(r: number, status: SchoolYearStatus): CalendarRegistryStatus {
  if (status === 'historical') return r < 0.97 ? 'Approved' : 'Rejected';
  if (status === 'future') return r < 0.12 ? 'Draft' : r < 0.17 ? 'Under Review' : 'Missing';
  if (r < 0.5) return 'Approved';
  if (r < 0.68) return 'Under Review';
  if (r < 0.78) return 'Draft';
  if (r < 0.82) return 'Rejected';
  return 'Missing';
}

function submittedLabel(start: number, key: string): string {
  const d = new Date(start, 7, 18 + Math.floor(seeded(key + 'sub') * 30));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildMetrics(key: string, kind: 'SY' | 'ESY' | '12-Month'): { days: number; hours: number; compliancePercent: number } {
  if (kind === 'ESY') {
    const days = 26 + Math.floor(seeded(key + 'd') * 5);
    return { days, hours: Math.round(days * 7.8), compliancePercent: 100 };
  }
  if (kind === '12-Month') {
    const days = 228 + Math.floor(seeded(key + 'd') * 14);
    return { days, hours: Math.round(days * 6.1), compliancePercent: 100 };
  }
  const shortDays = seeded(key + 'short') < 0.12;
  const days = shortDays ? 176 + Math.floor(seeded(key + 'd') * 4) : 180 + Math.floor(seeded(key + 'd') * 6);
  const shortHours = seeded(key + 'hrs') < 0.1;
  const perDay = shortHours ? 5.7 + seeded(key + 'h') * 0.2 : 6.05 + seeded(key + 'h') * 0.45;
  const hours = Math.round(days * perDay);
  const compliancePercent = Math.min(100, Math.round(Math.min(days / 180, hours / 1080) * 100));
  return { days, hours, compliancePercent };
}

function calendarRecord(params: {
  lea: IDirectoryLea;
  school: IDirectorySchool | null;
  site: IDirectorySite | null;
  yearId: string;
  type: string;
  kind: 'SY' | 'ESY' | '12-Month';
  status: CalendarRegistryStatus;
  programId: string | null;
  parentCalendarId: string | null;
}): ICalendarSchedule {
  const { lea, school, site, yearId, type, kind, status } = params;
  const start = yearStart(yearId);
  const suffix = site ? site.code : `L${lea.code}`;
  const kindCode = kind === 'SY' ? 'R' : kind === 'ESY' ? 'E' : 'T';
  const key = `${suffix}-${yearId}-${kind}`;
  const built = status === 'Approved' || status === 'Under Review' || status === 'Rejected';
  const metrics = built ? buildMetrics(key, kind) : null;
  return {
    id: `CAL-${start}-${kindCode}-${suffix}`,
    name: site ? `${type} Calendar` : `${lea.name} LEA Calendar (${type})`,
    schoolName: school && site ? siteDisplayName(school, site) : `All ${lea.name} Sites`,
    leaName: lea.name,
    leaId: lea.id,
    siteId: site?.id ?? null,
    schoolId: school?.id ?? null,
    yearId,
    grade: null,
    programId: params.programId,
    parentCalendarId: params.parentCalendarId,
    visibility: seeded(key + 'vis') < 0.1 ? 'Non-public' : 'Public',
    cycle: type,
    type,
    days: metrics?.days ?? null,
    hours: metrics?.hours ?? null,
    compliancePercent: metrics?.compliancePercent ?? null,
    status,
    submittedDate: status === 'Missing' || status === 'Draft' ? null : submittedLabel(start, key),
    lastUpdated: `${start}-09-${pad(1 + Math.floor(seeded(key + 'upd') * 28))}`
  };
}

export function programIdFor(lea: IDirectoryLea, kind: 'ESY' | '12-Month'): string {
  return `prog-${lea.code}-${kind === 'ESY' ? 'esy' : '12m'}`;
}

/** Sites that run ESY / 12-Month calendars - stable across years so programs look consistent. */
export function runsEsy(school: IDirectorySchool, site: IDirectorySite): boolean {
  return !isAdultSchool(school) && seeded(site.id + 'esy') < 0.3;
}

export function runsTwelveMonth(school: IDirectorySchool, site: IDirectorySite): boolean {
  return !isAdultSchool(school) && seeded(site.id + '12m') < 0.07;
}

export function generateShellCalendars(): ICalendarSchedule[] {
  const calendars: ICalendarSchedule[] = [];
  for (const lea of LEA_DIRECTORY) {
    for (const year of SCHOOL_YEARS) {
      const start = yearStart(year.id);
      if (yearKind(year.id) === 'SY') {
        const type = syLabel(start);
        const leaStatus: CalendarRegistryStatus = year.status === 'future' ? (seeded(lea.id + year.id) < 0.4 ? 'Draft' : 'Missing') : 'Approved';
        const leaCalendar = calendarRecord({ lea, school: null, site: null, yearId: year.id, type, kind: 'SY', status: leaStatus, programId: null, parentCalendarId: null });
        calendars.push(leaCalendar);
        for (const school of lea.schools) {
          for (const site of school.sites) {
            const status = siteStatus(seeded(site.id + year.id), year.status);
            calendars.push(calendarRecord({ lea, school, site, yearId: year.id, type, kind: 'SY', status, programId: null, parentCalendarId: leaCalendar.id }));
            if (runsTwelveMonth(school, site)) {
              const twelveStatus = siteStatus(seeded(site.id + year.id + '12m'), year.status);
              calendars.push(
                calendarRecord({ lea, school, site, yearId: year.id, type: '12-Month', kind: '12-Month', status: twelveStatus, programId: programIdFor(lea, '12-Month'), parentCalendarId: null })
              );
            }
          }
        }
      } else {
        for (const school of lea.schools) {
          for (const site of school.sites) {
            if (!runsEsy(school, site)) continue;
            const status = siteStatus(seeded(site.id + year.id), year.status);
            calendars.push(calendarRecord({ lea, school, site, yearId: year.id, type: `ESY ${start}`, kind: 'ESY', status, programId: programIdFor(lea, 'ESY'), parentCalendarId: null }));
          }
        }
      }
    }
  }
  return calendars;
}

// ---------------------------------------------------------------------------------------------
// Programs, marking periods, waivers, change requests, routing, early dismissals
// ---------------------------------------------------------------------------------------------

export function programsForLea(lea: IDirectoryLea): IProgram[] {
  const sites = lea.schools.flatMap((school) => school.sites.map((site) => ({ school, site })));
  const programs: IProgram[] = [];
  if (sites.some(({ school, site }) => runsEsy(school, site))) {
    programs.push({ id: programIdFor(lea, 'ESY'), leaId: lea.id, name: 'Extended School Year', type: 'ESY', eligibility: 'IEP-eligible students, per individual determination' });
  }
  if (sites.some(({ school, site }) => runsTwelveMonth(school, site))) {
    programs.push({ id: programIdFor(lea, '12-Month'), leaId: lea.id, name: '12-Month Calendar', type: '12-Month', eligibility: 'Sites electing a year-round instructional calendar' });
  }
  if (seeded(lea.id + 'alt') < 0.3) {
    programs.push({ id: `prog-${lea.code}-alt`, leaId: lea.id, name: 'Credit Recovery', type: 'Alternative', eligibility: 'Students referred by a site counselor for credit recovery' });
  }
  return programs;
}

export function markingPeriodsFor(calendar: ICalendarSchedule): IMarkingPeriod[] {
  if (!calendar.yearId || yearKind(calendar.yearId) !== 'SY' || calendar.type === '12-Month' || calendar.status === 'Missing') return [];
  const range = defaultRange('SY', yearStart(calendar.yearId));
  const start = parseIsoDate(range.start);
  const mid = new Date(yearStart(calendar.yearId) + 1, 0, 23);
  const mk = (suffix: string, name: string, type: IMarkingPeriod['type'], from: string, to: string): IMarkingPeriod => ({
    id: `mp-${calendar.id}-${suffix}`,
    calendarId: calendar.id,
    name,
    type,
    startDate: from,
    endDate: to
  });
  const semesters = [mk('s1', 'Semester 1', 'Semester', range.start, isoDate(mid)), mk('s2', 'Semester 2', 'Semester', isoDate(addDays(mid, 3)), range.end)];
  if (calendar.siteId !== null) return seeded(calendar.id + 'mp') < 0.35 ? semesters : [];
  const quarterEnds = [addDays(start, 66), mid, addDays(mid, 63), parseIsoDate(range.end)];
  const quarters = quarterEnds.map((end, i) => {
    const from = i === 0 ? range.start : isoDate(addDays(quarterEnds[i - 1], 3));
    return mk(`q${i + 1}`, `Quarter ${i + 1}`, 'Quarter', from, isoDate(end));
  });
  return [...semesters, ...quarters];
}

const WAIVER_TYPES = ['Waiver to Reduce Instructional Time', 'Situational Distance Days Waiver', 'Weekly Half Day Waiver', 'Early Dismissal', 'PD Days Limit'];
const REVIEWERS = ['J. Torres', 'M. Park', 'A. Okafor'];

export function generateWaivers(calendars: ICalendarSchedule[]): IWaiver[] {
  const waivers: IWaiver[] = [];
  for (const cal of calendars) {
    if (!cal.yearId || cal.siteId === null || cal.days === null || cal.hours === null) continue;
    const short = cal.days < 180 || cal.hours < 1080;
    const r = seeded(cal.id + 'waiver');
    if (!short && r > 0.04) continue;
    const status = yearStatus(cal.yearId);
    const waiverStatus: WaiverStatus = status === 'historical' ? (r < 0.8 ? 'Approved' : 'Rejected') : r < 0.35 ? 'Pending' : r < 0.7 ? 'Under Review' : 'Approved';
    const start = yearStart(cal.yearId);
    const submitted = formatDate(new Date(start, 8, 5 + Math.floor(r * 20)));
    waivers.push({
      id: `WV-${start}-${cal.siteId.replace('site-', '')}`,
      school: cal.schoolName,
      lea: cal.leaName,
      leaId: cal.leaId,
      schoolId: cal.schoolId ?? null,
      yearId: cal.yearId,
      type: short ? (cal.days < 180 ? 'Waiver to Reduce Instructional Time' : 'Weekly Half Day Waiver') : WAIVER_TYPES[Math.floor(r * 100) % WAIVER_TYPES.length],
      submitted,
      reviewer: waiverStatus === 'Pending' ? 'Unassigned' : REVIEWERS[Math.floor(r * 10) % REVIEWERS.length],
      status: waiverStatus,
      resolved: waiverStatus === 'Approved' || waiverStatus === 'Rejected' ? formatDate(new Date(start, 9, 2 + Math.floor(r * 20))) : null
    });
  }
  return waivers;
}

const CHANGE_TYPES = ['Add PD Day', 'Update Bell Schedule', 'Remove Holiday', 'Add Make-up Day', 'Shift Early Dismissal'];

export function changeRequestFor(cal: ICalendarSchedule): IChangeRequest | null {
  if (cal.status !== 'Approved' || cal.siteId === null || !cal.yearId) return null;
  const r = seeded(cal.id + 'cr');
  if (r > 0.12) return null;
  const historical = yearStatus(cal.yearId) === 'historical';
  const status: ChangeRequestStatus = historical ? 'Approved' : r < 0.05 ? 'Pending' : r < 0.09 ? 'Under Review' : 'Approved';
  return {
    id: `CR-${cal.id.replace('CAL-', '')}`,
    calendarId: cal.id,
    school: cal.schoolName,
    changeType: CHANGE_TYPES[Math.floor(r * 1000) % CHANGE_TYPES.length],
    requested: new Date(yearStart(cal.yearId), 8, 8 + Math.floor(r * 100) % 20).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status
  };
}

const CONFLICT_ISSUES = [
  'Early dismissal Fridays (1:00 PM) conflict with the DDOT route plan',
  'Non-instructional PD day not reflected in the DDOT routing plan',
  'Bell schedule change requires a routing update',
  'Early release before winter break conflicts with route timing'
];

export function routingConflictsFor(school: IDirectorySchool, yearId: string): IRoutingConflict[] {
  if (yearKind(yearId) === 'ESY' || yearStatus(yearId) === 'future') return [];
  const r = seeded(school.id + yearId + 'dot');
  if (r > 0.3) return [];
  const historical = yearStatus(yearId) === 'historical';
  const status: RoutingConflictStatus = historical ? 'Resolved' : r < 0.14 ? 'Open' : r < 0.22 ? 'In Progress' : 'Resolved';
  const route = 10 + Math.floor(seeded(school.id + 'route') * 80);
  return [
    {
      id: `rc-${school.id}-${yearId}`,
      schoolId: school.id,
      school: school.name,
      issue: CONFLICT_ISSUES[Math.floor(r * 1000) % CONFLICT_ISSUES.length],
      routes: `R-${pad(route)}${r < 0.1 ? `, R-${pad(route + 1)}` : ''}`,
      severity: r < 0.1 ? 'High' : r < 0.2 ? 'Medium' : 'Low',
      status
    }
  ];
}

export function upcomingDismissalsFor(school: IDirectorySchool, yearId: string): IEarlyDismissalSchedule[] {
  if (yearKind(yearId) === 'ESY') return [];
  const r = seeded(school.id + yearId + 'ed');
  if (r > 0.35) return [];
  const start = yearStart(yearId);
  const date = new Date(start, 9 + Math.floor(r * 6), 3 + Math.floor(r * 100) % 24);
  return [
    {
      id: `ed-${school.id}-${yearId}`,
      schoolId: school.id,
      school: school.name,
      date: r < 0.06 ? 'Every Friday' : formatDate(date),
      dismissTime: r < 0.15 ? '12:00 PM' : '1:00 PM',
      routes: 1 + Math.floor(r * 20),
      notified: yearStatus(yearId) === 'historical' || r > 0.18
    }
  ];
}

/** Scheduled early-dismissal days for a school in a year (20 is the compliance maximum). */
export function earlyDismissalDaysFor(schoolId: string, yearId: string): number {
  const r = seeded(schoolId + yearId + 'edd');
  return r < 0.08 ? 21 + Math.floor(r * 40) : 3 + Math.floor(r * 17);
}
