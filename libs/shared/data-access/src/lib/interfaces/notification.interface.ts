export interface INotificationSummary {
  id: string;
  title: string;
  body: string;
  priority: 'Low' | 'Medium' | 'High';
  receivedAt: string;
  category: 'Compliance' | 'Calendar' | 'School' | 'Approval';
}
