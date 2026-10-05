import { Route } from '@angular/router';

export const calendarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./calendar-registry-page.component').then((m) => m.CalendarRegistryPageComponent),
    data: { breadcrumb: 'All Calendars', breadcrumbKey: 'calendar' }
  },
  {
    path: 'create',
    loadComponent: () => import('./calendar-create-entry-page.component').then((m) => m.CalendarCreateEntryPageComponent),
    data: { breadcrumb: 'New Calendar', breadcrumbKey: 'calendar' }
  },
  {
    path: 'wizard',
    loadComponent: () => import('./calendar-wizard-page.component').then((m) => m.CalendarWizardPageComponent),
    data: { breadcrumb: 'New Calendar', breadcrumbKey: 'calendar' }
  },
  {
    path: 'copy-wizard',
    loadComponent: () => import('./calendar-copy-wizard-page.component').then((m) => m.CalendarCopyWizardPageComponent),
    data: { breadcrumb: 'Copy Calendar', breadcrumbKey: 'calendar' }
  },
  {
    path: 'bell-schedules',
    loadComponent: () => import('./bell-schedule-page.component').then((m) => m.BellSchedulePageComponent),
    data: { breadcrumb: 'Bell Schedules' }
  },
  {
    path: 'holidays',
    loadComponent: () => import('./holiday-page.component').then((m) => m.HolidayPageComponent),
    data: { breadcrumb: 'Holiday Management' }
  },
  {
    path: 'esy',
    loadComponent: () => import('./esy-page.component').then((m) => m.EsyPageComponent),
    data: { breadcrumb: 'ESY' }
  },
  {
    path: '12-month',
    loadComponent: () => import('./twelve-month-page.component').then((m) => m.TwelveMonthPageComponent),
    data: { breadcrumb: '12-Month' }
  },
  {
    path: 'marking-periods',
    loadComponent: () => import('./marking-period-page.component').then((m) => m.MarkingPeriodPageComponent),
    data: { breadcrumb: 'Marking Periods' }
  },
  {
    path: 'programs',
    loadComponent: () => import('./program-list-page.component').then((m) => m.ProgramListPageComponent),
    data: { breadcrumb: 'Programs' }
  },
  {
    path: ':calendarId',
    loadComponent: () => import('./calendar-detail-page.component').then((m) => m.CalendarDetailPageComponent),
    data: { breadcrumb: 'Calendar Detail' }
  }
];
