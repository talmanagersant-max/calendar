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
