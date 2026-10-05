export interface ICalendarSchedule {
    id: string;
    name: string;
    schoolName: string;
    cycle: string;
    status: 'Draft' | 'Approved' | 'Needs Review';
    lastUpdated: string;
}
export interface ICalendarWizardStep {
    id: string;
    title: string;
    description: string;
    complete: boolean;
}
