import { Route } from '@angular/router';

export const calendarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./calendar-registry-page.component').then((m) => m.CalendarRegistryPageComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./calendar-create-entry-page.component').then((m) => m.CalendarCreateEntryPageComponent)
  },
  {
    path: 'wizard',
    loadComponent: () => import('./calendar-wizard-page.component').then((m) => m.CalendarWizardPageComponent)
  },
  {
    path: 'copy-wizard',
    loadComponent: () => import('./calendar-copy-wizard-page.component').then((m) => m.CalendarCopyWizardPageComponent)
  },
  {
    path: 'bell-schedules',
    loadComponent: () => import('./bell-schedule-page.component').then((m) => m.BellSchedulePageComponent)
  },
  {
    path: 'holidays',
    loadComponent: () => import('./holiday-page.component').then((m) => m.HolidayPageComponent)
  },
  {
    path: 'esy',
    loadComponent: () => import('./esy-page.component').then((m) => m.EsyPageComponent)
  },
  {
    path: '12-month',
    loadComponent: () => import('./twelve-month-page.component').then((m) => m.TwelveMonthPageComponent)
  },
  {
    path: 'marking-periods',
    loadComponent: () => import('./marking-period-page.component').then((m) => m.MarkingPeriodPageComponent)
  },
  {
    path: 'programs',
    loadComponent: () => import('./program-list-page.component').then((m) => m.ProgramListPageComponent)
  },
  {
    path: ':calendarId',
    loadComponent: () => import('./calendar-detail-page.component').then((m) => m.CalendarDetailPageComponent)
  }
];
