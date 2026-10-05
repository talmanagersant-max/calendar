import { Route } from '@angular/router';

export const leaRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./lea-list-page.component').then((m) => m.LeaListPageComponent),
    data: { breadcrumb: 'LEAs', breadcrumbKey: 'lea' }
  },
  {
    path: ':leaId',
    loadComponent: () => import('./lea-detail-page.component').then((m) => m.LeaDetailPageComponent),
    data: { breadcrumb: 'LEA Detail' }
  }
];
