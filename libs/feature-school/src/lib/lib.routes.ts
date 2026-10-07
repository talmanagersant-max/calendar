import { Route } from '@angular/router';

export const schoolRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./school-list-page.component').then((m) => m.SchoolListPageComponent)
  },
  {
    path: ':schoolId',
    loadComponent: () => import('./school-detail-page.component').then((m) => m.SchoolDetailPageComponent)
  }
];
