export interface IDashboardMetric {
    label: string;
    value: string;
    change: string;
    tone: 'positive' | 'warning' | 'neutral';
}
export interface INotificationItem {
    id: string;
    title: string;
    description: string;
    type: 'info' | 'warning' | 'success' | 'urgent';
    createdAt: string;
    read: boolean;
}
export interface ICalendarCycleDay {
    day: number;
    label: string;
    status: 'instruction' | 'holiday' | 'pd' | 'dismissal' | 'esy';
}
export interface ICalendarDetail {
    id: string;
    name: string;
    cycle: string;
    totalDays: number;
    days: ICalendarCycleDay[];
    staffNotes: string;
}
