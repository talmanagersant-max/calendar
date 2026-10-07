export interface IBellSchedule {
  id: string;
  name: string;
  level: string;
  start: string;
  end: string;
  totalMinutes: number;
  instrMinutes: number;
  schoolsUsing: number;
}

export type HolidayType = 'Federal' | 'Local';

export interface IHoliday {
  id: string;
  name: string;
  dates: string;
  type: HolidayType;
  appliesTo: string;
  /** ISO start/end (inclusive) - drives the calendar wizard's holiday days. */
  start?: string;
  end?: string;
}

export type EsyStatus = 'Approved' | 'Under Review' | 'Missing';

export interface IEsyCalendar {
  id: string;
  school: string;
  lea: string;
  dates: string;
  days: number;
  hours: number;
  targetHours: number;
  syHours: number;
  status: EsyStatus;
}

export interface IEsyOverlapWeek {
  week: string;
  leas: Record<string, boolean>;
}

export type TwelveMonthStatus = 'Approved' | 'Under Review' | 'Draft';

export interface ITwelveMonthCalendar {
  id: string;
  school: string;
  lea: string;
  start: string;
  end: string;
  days: number;
  totalHours: number;
  status: TwelveMonthStatus;
}

export interface IOverlapMonthRow {
  school: string;
  /** Months (0-11, calendar months) the calendar is in session. */
  activeMonths: number[];
  /** Index into the page's Tailwind tone palette. */
  tone: number;
}

export interface IComplianceRingBucket {
  label: string;
  count: number;
  tone: 'success' | 'warning' | 'danger';
}

export interface IComplianceRing {
  label: string;
  subtitle: string;
  current: number;
  total: number;
  percentLabel: string;
  /** Tailwind stroke class for the ring, e.g. "stroke-emerald-600". */
  ringClass: string;
  buckets: IComplianceRingBucket[];
}

export type ComplianceFlag = 'Compliant' | 'Violation';

export interface IEarlyDismissalRow {
  schoolId?: string;
  school: string;
  days: number;
  minutesImpact: number;
  flag: ComplianceFlag;
}

export type ViolationSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type ViolationStatus = 'Open' | 'Waiver Pending' | 'Resolved';

export interface IComplianceViolation {
  id?: string;
  schoolId?: string;
  school: string;
  issue: string;
  days: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
}

export type WaiverStatus = 'Approved' | 'Under Review' | 'Pending' | 'Rejected';

export interface IWaiver {
  leaId?: string;
  schoolId?: string | null;
  yearId?: string;
  id: string;
  school: string;
  lea: string;
  type: string;
  submitted: string;
  reviewer: string;
  status: WaiverStatus;
  resolved: string | null;
}

export type ApprovalPriority = 'High' | 'Normal' | 'Low';

export interface IApprovalQueueRow {
  id: string;
  school: string;
  lea: string;
  type: string;
  days: number;
  hours: number;
  compliancePercent: number;
  submitted: string;
  assigned: string;
  priority: ApprovalPriority;
}

export type ChangeRequestStatus = 'Pending' | 'Under Review' | 'Approved';

export interface IChangeRequest {
  id: string;
  calendarId: string;
  school: string;
  changeType: string;
  requested: string;
  status: ChangeRequestStatus;
}

export type RoutingConflictStatus = 'Open' | 'In Progress' | 'Resolved';

export interface IRoutingConflict {
  id?: string;
  schoolId?: string;
  school: string;
  issue: string;
  routes: string;
  severity: 'High' | 'Medium' | 'Low';
  status: RoutingConflictStatus;
}

export interface IEarlyDismissalSchedule {
  id?: string;
  schoolId?: string;
  school: string;
  date: string;
  dismissTime: string;
  routes: number;
  notified: boolean;
}

export interface INonInstructionalDay {
  id?: string;
  schools: string;
  date: string;
  type: string;
  routes: string;
  status: 'Notified' | 'Pending';
}

export interface IReportDefinition {
  id: string;
  code: string;
  title: string;
  tag: string;
  rowCount: number;
}

export type NotificationCategory = 'Deadline' | 'Approval' | 'Compliance' | 'DOT Routing';

export interface INotificationFeedItem {
  /** Scope the item belongs to; items without one show in every scope. */
  leaId?: string;
  yearId?: string;
  id: string;
  icon: string;
  iconTone: string;
  title: string;
  description: string;
  category: NotificationCategory;
  highPriority: boolean;
  time: string;
  read: boolean;
}

export type ProgramType = 'ESY' | '12-Month' | 'Alternative';

export interface IProgram {
  id: string;
  leaId: string;
  name: string;
  type: ProgramType;
  eligibility: string;
}

export type MarkingPeriodType = 'Semester' | 'Quarter' | 'Trimester';

export interface IMarkingPeriod {
  id: string;
  calendarId: string;
  name: string;
  type: MarkingPeriodType;
  startDate: string;
  endDate: string;
}

export interface IReportLeaRow {
  lea: string;
  schools: number;
  avgHours: number;
  minHours: number;
  maxHours: number;
  compliant: 'All Compliant' | 'Partial';
}
