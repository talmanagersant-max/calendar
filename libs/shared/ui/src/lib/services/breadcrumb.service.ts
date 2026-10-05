import { Injectable, computed, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface IBreadcrumbItem {
  label: string;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly _breadcrumbs = signal<IBreadcrumbItem[]>([]);
  readonly breadcrumbs = this._breadcrumbs.asReadonly();

  private readonly pageMap: Record<string, { label: string; url: string }> = {
    dashboard: { label: 'Dashboard', url: '/dashboard' },
    dashboard2: { label: 'Dashboard', url: '/dashboard2' },
    notifications: { label: 'Notifications', url: '/notifications' },
    lea: { label: 'LEAs', url: '/lea' },
    schools: { label: 'Schools', url: '/schools' },
    calendar: { label: 'All Calendars', url: '/calendar' },
    compliance: { label: 'Compliance', url: '/compliance' },
    reports: { label: 'Reports', url: '/reports' },
    waivers: { label: 'Waivers', url: '/waivers' },
    approvals: { label: 'Approvals', url: '/approvals' },
    'dot-routing': { label: 'DOT Routing', url: '/dot-routing' },
    'calendar-detail': { label: 'Calendar Detail', url: '/calendar/detail' }
  };

  private readonly tabMap: Record<string, Record<string, string>> = {
    dashboard: { overview: 'Overview', metrics: 'Metrics', alerts: 'Alerts' },
    notifications: { inbox: 'Inbox', action: 'Action Needed', archived: 'Archived' },
    lea: { all: 'All LEAs', active: 'Active', review: 'Review' },
    schools: { all: 'All Schools', elementary: 'Elementary', secondary: 'Secondary' },
    calendar: { registry: 'Registry', wizard: 'Wizard', detail: 'Detail' },
    compliance: { summary: 'Summary', audit: 'Audit', remediations: 'Remediations' },
    reports: { live: 'Live', archived: 'Archived', exports: 'Exports' },
    waivers: { submitted: 'Submitted', awaiting: 'Awaiting Review', approved: 'Approved' },
    approvals: { pending: 'Pending', delegated: 'Delegated', closed: 'Closed' },
    'dot-routing': { fleet: 'Fleet', review: 'Review', history: 'History' }
  };

  private readonly dynamicLabel = signal<string | null>(null);

  constructor(private router: Router) {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this._breadcrumbs.set(this.walkRoute(this.router.routerState.root));
      this.applyOriginContext();
    });
  }

  setDynamicLabel(label: string): void {
    this.dynamicLabel.set(label);
  }

  private walkRoute(route: ActivatedRoute | null, url = ''): IBreadcrumbItem[] {
    if (!route) return [];

    const routeUrl = route.snapshot.url.map((segment) => segment.path).join('/');
    const nextUrl = routeUrl ? `${url}/${routeUrl}` : url;
    const items: IBreadcrumbItem[] = [];

    if (route.snapshot.data['breadcrumb']) {
      const label = this.dynamicLabel() ?? route.snapshot.data['breadcrumb'];
      items.push({ label, url: nextUrl || '/' });
    }

    if (route.firstChild) {
      items.push(...this.walkRoute(route.firstChild, nextUrl));
    }

    return items;
  }

  private applyOriginContext(): void {
    const currentUrl = this.router.url;
    const urlObj = new URL(currentUrl, 'http://localhost');
    const from = urlObj.searchParams.get('from');
    const tab = urlObj.searchParams.get('tab');
    if (!from || !this.pageMap[from]) {
      return;
    }

    const origin = this.pageMap[from];
    const tabLabel = this.tabMap[from]?.[tab ?? ''] ?? undefined;
    const originCrumb: IBreadcrumbItem = { label: tabLabel ? `${origin.label} > ${tabLabel}` : origin.label, url: origin.url };

    const finalCrumbs = [originCrumb, ...this._breadcrumbs()];
    this._breadcrumbs.set(finalCrumbs);
    history.replaceState(null, '', currentUrl.split('?')[0]);
  }
}
