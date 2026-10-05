export interface ISchool {
  id: string;
  code: string;
  name: string;
  leaId: string;
  /** Set when this Site belongs to a School that has more than one physical Site. */
  schoolGroupId?: string | null;
  /** Reportable (default true when unset) sites require the Regular/R calendar; non-reportable
   *  satellite sites don't, unless they carry real enrollment (studentCount > 0). */
  reportable?: boolean;
  gradeBand: string;
  programs: string[];
  bellSchedule: string;
  calendarCount: number;
  studentCount: number;
  city: string;
  status: 'Open' | 'Operational' | 'Review';
}

/** Groups multiple Sites under one School (LEA -> School -> Site). Most schools have exactly one Site. */
export interface ISchoolGroup {
  id: string;
  code: string;
  name: string;
  leaId: string;
}
