export interface IDashboardV2Header {
  schoolYear: string;
  schoolYearStatus: string;
  missingCalendarsCount: number;
  routingConflictsCount: number;
  unreadNotifications: number;
  todayLabel: string;
}

export interface IDashboardV2StatTile {
  label: string;
  value: string;
  caption: string;
  icon: string;
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
}

export interface ICompliancePillar {
  label: string;
  current: number;
  total: number;
  tone: 'primary' | 'success' | 'danger' | 'warning';
}

export interface IComplianceRateSummary {
  label: string;
  value: string;
  tone: 'success' | 'primary' | 'danger';
}

export interface IQuickAction {
  label: string;
  count: number | null;
  icon: string;
  highlighted: boolean;
}

export type ComplianceAlertSeverity = 'critical' | 'warning';

export interface IComplianceAlert {
  id: string;
  severity: ComplianceAlertSeverity;
  message: string;
  actionLabel: string;
}

export type MissingCalendarStatus = 'Missing' | 'Overdue' | 'Draft';

export interface IMissingCalendarRow {
  id: string;
  lea: string;
  school: string;
  type: string;
  dueDate: string;
  status: MissingCalendarStatus;
}

export interface IPendingApprovalRow {
  id: string;
  school: string;
  type: string;
  submittedDate: string;
  reviewer: string;
}

export type DotRoutingSeverity = 'High' | 'Medium' | 'Low';

export interface IDotRoutingAlert {
  id: string;
  school: string;
  description: string;
  severity: DotRoutingSeverity;
}
