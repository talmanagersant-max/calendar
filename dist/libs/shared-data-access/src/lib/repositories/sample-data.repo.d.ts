import { ICalendarSchedule } from '../interfaces/calendar.interface';
import { ICalendarDetail, IDashboardMetric, INotificationItem } from '../interfaces/dashboard.interface';
import { IComplianceItem } from '../interfaces/compliance.interface';
import { ILea } from '../interfaces/lea.interface';
import { ISchool } from '../interfaces/school.interface';
import { INotificationSummary } from '../interfaces/notification.interface';
export declare class SampleDataRepository {
    readonly metrics: IDashboardMetric[];
    readonly notifications: INotificationItem[];
    readonly leaList: ILea[];
    readonly schoolList: ISchool[];
    readonly calendars: ICalendarSchedule[];
    readonly calendarDetails: Record<string, ICalendarDetail>;
    readonly complianceItems: IComplianceItem[];
    readonly notificationsFeed: INotificationSummary[];
}
