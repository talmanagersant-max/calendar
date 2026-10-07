export type LeaSubmissionStatus = 'Complete' | 'Partial' | 'Incomplete';

export interface ILea {
  id: string;
  code: string;
  name: string;
  region: string;
  type: 'Traditional' | 'Charter';
  schoolCount: number;
  submittedCount: number;
  approvedCount: number;
  contact: string;
  email: string;
  deadline: string;
  status: LeaSubmissionStatus;
}

/** A physical site (building) belonging to a directory school. */
export interface IDirectorySite {
  id: string;
  code: string;
  name: string;
  address: string;
}

/** A school (campus) as listed in the LEA directory used by the top-nav context switcher. */
export interface IDirectorySchool {
  id: string;
  /** Campus ID from the charter school directory. */
  code: string;
  name: string;
  /** Display label for the grades served, e.g. "PK–5", "6–8", "Adult". */
  gradeBand: string;
  /** Grades served, in order - drives the Grade Levels step of the calendar wizard. */
  grades: string[];
  sites: IDirectorySite[];
}

export interface IDirectoryLea {
  id: string;
  /** LEA ID from the charter school directory. */
  code: string;
  name: string;
  schools: IDirectorySchool[];
}
