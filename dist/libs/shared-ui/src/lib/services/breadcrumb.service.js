var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, signal } from '@angular/core';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
let BreadcrumbService = class BreadcrumbService {
    constructor(router) {
        this.router = router;
        this._breadcrumbs = signal([]);
        this.breadcrumbs = this._breadcrumbs.asReadonly();
        this.pageMap = {
            dashboard: { label: 'Dashboard', url: '/dashboard' },
            notifications: { label: 'Notifications', url: '/notifications' },
            lea: { label: 'LEA List', url: '/lea' },
            schools: { label: 'School List', url: '/schools' },
            calendar: { label: 'Calendar Registry', url: '/calendar' },
            compliance: { label: 'Compliance', url: '/compliance' },
            reports: { label: 'Reports', url: '/reports' },
            waivers: { label: 'Waivers', url: '/waivers' },
            approvals: { label: 'Approvals', url: '/approvals' },
            'dot-routing': { label: 'DOT Routing', url: '/dot-routing' },
            'calendar-detail': { label: 'Calendar Detail', url: '/calendar/detail' }
        };
        this.tabMap = {
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
        this.dynamicLabel = signal(null);
        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this._breadcrumbs.set(this.walkRoute(this.router.routerState.root));
            this.applyOriginContext();
        });
    }
    setDynamicLabel(label) {
        this.dynamicLabel.set(label);
    }
    walkRoute(route, url = '') {
        if (!route)
            return [];
        const routeUrl = route.snapshot.url.map((segment) => segment.path).join('/');
        const nextUrl = routeUrl ? `${url}/${routeUrl}` : url;
        const items = [];
        if (route.snapshot.data['breadcrumb']) {
            const label = this.dynamicLabel() ?? route.snapshot.data['breadcrumb'];
            items.push({ label, url: nextUrl || '/' });
        }
        if (route.firstChild) {
            items.push(...this.walkRoute(route.firstChild, nextUrl));
        }
        return items;
    }
    applyOriginContext() {
        const currentUrl = this.router.url;
        const urlObj = new URL(currentUrl, 'http://localhost');
        const from = urlObj.searchParams.get('from');
        const tab = urlObj.searchParams.get('tab');
        if (!from || !this.pageMap[from]) {
            return;
        }
        const origin = this.pageMap[from];
        const tabLabel = this.tabMap[from]?.[tab ?? ''] ?? undefined;
        const originCrumb = { label: tabLabel ? `${origin.label} > ${tabLabel}` : origin.label, url: origin.url };
        const finalCrumbs = [originCrumb, ...this._breadcrumbs()];
        this._breadcrumbs.set(finalCrumbs);
        history.replaceState(null, '', currentUrl.split('?')[0]);
    }
};
BreadcrumbService = __decorate([
    Injectable({ providedIn: 'root' })
], BreadcrumbService);
export { BreadcrumbService };
//# sourceMappingURL=breadcrumb.service.js.map