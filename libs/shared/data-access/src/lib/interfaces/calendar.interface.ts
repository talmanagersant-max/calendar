export type CalendarRegistryStatus = 'Approved' | 'Under Review' | 'Draft' | 'Rejected' | 'Missing';
export type CalendarVisibility = 'Public' | 'Non-public';
export type CalendarLevel = 'LEA' | 'Site' | 'Grade';

export interface ICalendarSchedule {
  id: string;
  name: string;
  schoolName: string;
  leaName: string;
  /** Real foreign keys - schoolName/leaName above stay for display, these are the join keys. */
  leaId: string;
  siteId: string | null;
  programId: string | null;
  /** Set only for a Grade Level Calendar (a site-scoped calendar that further narrows to one grade band). */
  grade?: string | null;
  /** Set when this calendar inherits holidays/marking periods from another (LEA -> Site, or Site -> Grade). */
  parentCalendarId: string | null;
  /** One-time provenance from the Copy-From wizard - for traceability display only, never live inheritance. */
  copiedFromId?: string | null;
  visibility: CalendarVisibility;
  cycle: string;
  type: string;
  days: number | null;
  hours: number | null;
  compliancePercent: number | null;
  status: CalendarRegistryStatus;
  submittedDate: string | null;
  lastUpdated: string;
}

/** LEA Level (siteId null), Site Level (siteId set, no grade), or Grade Level (siteId + grade). */
export function calendarLevel(cal: Pick<ICalendarSchedule, 'siteId' | 'grade'>): CalendarLevel {
  if (cal.siteId === null) return 'LEA';
  return cal.grade ? 'Grade' : 'Site';
}

export interface ICalendarWizardStep {
  id: string;
  title: string;
  description: string;
  complete: boolean;
}
