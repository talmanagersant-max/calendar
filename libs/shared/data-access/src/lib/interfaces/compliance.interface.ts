export interface IComplianceItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'On Track' | 'At Risk' | 'Past Due';
}
