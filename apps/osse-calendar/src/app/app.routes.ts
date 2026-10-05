import { Route } from '@angular/router';
import { BaseLayoutComponent } from '@osse/ost/shared/ui';

export const appRoutes: Route[] = [
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard2' },
      {
        path: 'dashboard2',
        loadComponent: () => import('@osse/feature-dashboard').then((m) => m.DashboardV2PageComponent),
        data: { breadcrumb: 'Dashboard', breadcrumbKey: 'dashboard2' }
      },
      {
        path: 'notifications',
        loadComponent: () => import('@osse/feature-notification-center').then((m) => m.NotificationCenterPageComponent),
        data: { breadcrumb: 'Notifications', breadcrumbKey: 'notifications' }
      },
      {
        path: 'lea',
        loadChildren: () => import('@osse/feature-lea').then((m) => m.leaRoutes)
      },
      {
        path: 'schools',
        loadChildren: () => import('@osse/feature-school').then((m) => m.schoolRoutes)
      },
      {
        path: 'calendar',
        loadChildren: () => import('@osse/feature-calendar').then((m) => m.calendarRoutes)
      },
      {
        path: 'compliance',
        loadComponent: () => import('@osse/feature-compliance').then((m) => m.CompliancePageComponent),
        data: { breadcrumb: 'Compliance', breadcrumbKey: 'compliance' }
      },
      {
        path: 'waivers',
        loadComponent: () => import('@osse/feature-waiver').then((m) => m.WaiverWorkflowPageComponent),
        data: { breadcrumb: 'Waivers', breadcrumbKey: 'waivers' }
      },
      {
        path: 'dot-routing',
        loadComponent: () => import('@osse/feature-dot-routing').then((m) => m.DotRoutingDashboardPageComponent),
        data: { breadcrumb: 'DOT Routing', breadcrumbKey: 'dot-routing' }
      },
      {
        path: 'approvals',
        loadComponent: () => import('@osse/feature-approvals').then((m) => m.ApprovalWorkflowPageComponent),
        data: { breadcrumb: 'Approvals', breadcrumbKey: 'approvals' }
      },
      {
        path: 'reports',
        loadComponent: () => import('@osse/feature-reports').then((m) => m.ReportsPageComponent),
        data: { breadcrumb: 'Reports', breadcrumbKey: 'reports' }
      }
    ]
  }
];
