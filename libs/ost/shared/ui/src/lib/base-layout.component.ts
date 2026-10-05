import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BreadcrumbService, CalendarPermissionsService, CurrentContextService, CurrentRoleService, NotificationFeedService, SchoolYearService } from '../../../../../shared/ui/src';
import { SampleDataRepository } from '../../../../../shared/data-access/src';

interface INavItem {
  path: string;
  label: string;
  icon: string;
  badge: number | null;
  requiresCreate?: boolean;
}

interface INavSection {
  title: string;
  items: INavItem[];
}

@Component({
  selector: 'oss-base-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside
        class="fixed inset-y-0 left-0 flex flex-col border-r border-slate-800 bg-o-primary-900 transition-all"
        [class.w-60]="!collapsed()"
        [class.w-16]="collapsed()"
      >
        <div class="flex items-center justify-between border-b border-slate-800 px-4 py-4">
          @if (!collapsed()) {
            <div>
              <div class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">OSSE</div>
              <div class="mt-0.5 text-sm font-semibold text-white">Calendar Management</div>
            </div>
          }
          <button
            pButton
            type="button"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            class="!h-7 !w-7 shrink-0 !p-0 !text-slate-400 hover:!bg-slate-800 hover:!text-white"
            [icon]="collapsed() ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'"
            (click)="toggleCollapsed()"
          ></button>
        </div>

        <nav class="flex-1 overflow-y-auto px-2 py-4">
          @if (canCreateCalendars()) {
            <a
              #createLink="routerLinkActive"
              routerLink="/calendar/create"
              routerLinkActive
              [routerLinkActiveOptions]="{ exact: false }"
              [attr.aria-current]="createLink.isActive ? 'page' : null"
              [class.ring-2]="createLink.isActive"
              [class.ring-white]="createLink.isActive"
              [class.ring-offset-2]="createLink.isActive"
              [class.ring-offset-o-primary-900]="createLink.isActive"
              class="group relative mb-4 flex items-center gap-3 rounded-xl bg-o-accent-600 px-3 py-3 text-white shadow-md transition hover:bg-o-accent-500 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-o-primary-900"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-base transition group-hover:bg-white/25">
                <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>
              </span>
              @if (!collapsed()) {
                <span class="min-w-0 flex-1 text-left">
                  <span class="block truncate text-sm font-semibold leading-tight">Create Calendar</span>
                  <span class="block truncate text-[11px] text-white/70">Start a new calendar</span>
                </span>
                <i class="fa-solid fa-chevron-right shrink-0 text-xs text-white/60 transition group-hover:translate-x-0.5" aria-hidden="true"></i>
                @if (createLink.isActive) {
                  <span class="sr-only">(current page)</span>
                }
              }
            </a>
          }

          @for (section of navSections; track section.title) {
            <div class="mb-4">
              @if (!collapsed()) {
                <div class="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{{ section.title }}</div>
              }
              <div class="space-y-0.5">
                @for (item of section.items; track item.path) {
                  @if (!item.requiresCreate || canCreateCalendars()) {
                    <a
                      [routerLink]="item.path"
                      routerLinkActive="bg-o-primary-600 text-white"
                      [routerLinkActiveOptions]="{ exact: true }"
                      class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      <i class="fa-solid w-4 shrink-0 text-center" [class]="item.icon"></i>
                      @if (!collapsed()) {
                        <span class="flex-1 truncate">{{ item.label }}</span>
                        @if (badgeFor(item); as badge) {
                          <span class="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white w-5 h-5 flex items-center justify-center">{{ badge }}</span>
                        }
                      }
                    </a>
                  }
                }
              </div>
            </div>
          }
        </nav>

        <div class="border-t border-slate-800 px-3 py-3">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-o-primary-600 text-xs font-bold text-white">JT</div>
            @if (!collapsed()) {
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-semibold text-white">J. Torres</div>
                <label class="sr-only" for="roleSwitcher">Viewing as role</label>
                <select
                  id="roleSwitcher"
                  class="mt-0.5 w-full max-w-full rounded borderborder-slate-700 bg-transparent py-0.5 pl-1.5 pr-5 text-xs text-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1 focus-visible:ring-offset-o-primary-900"
                  (change)="onRoleChange($any($event.target).value)"
                >
                  @for (role of roles; track role) {
                    <option [value]="role" [selected]="role === currentRole()">{{ role }}</option>
                  }
                </select>
              </div>
            }
          </div>
        </div>
      </aside>

      <div class="flex min-h-screen flex-col transition-all" [class.ml-60]="!collapsed()" [class.ml-16]="collapsed()">
        <div class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-o-primary-900 bg-o-primary-800 px-6 py-2.5">
          <div class="flex flex-wrap items-stretch divide-x divide-white/10">
            <label class="group relative flex cursor-pointer flex-col justify-center gap-0.5 px-4 py-1 transition hover:bg-white/5 focus-within:bg-white/10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">LEA</span>
              <span class="relative flex items-center">
                <select
                  class="max-w-[11rem] cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-semibold text-white outline-none"
                  [value]="contextLeaId() ?? ''"
                  (change)="onContextLeaChange($any($event.target).value)"
                >
                  @for (lea of leaList; track lea.id) {
                    <option class="text-slate-900" [value]="lea.id">{{ lea.name }}</option>
                  }
                </select>
                <i class="fa-solid fa-chevron-down pointer-events-none absolute right-0 text-[9px] text-white/50" aria-hidden="true"></i>
              </span>
            </label>

            <label class="group relative flex cursor-pointer flex-col justify-center gap-0.5 px-4 py-1 transition hover:bg-white/5 focus-within:bg-white/10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">Site</span>
              <span class="relative flex items-center">
                <select
                  class="max-w-[11rem] cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-semibold text-white outline-none"
                  [value]="contextSiteId() ?? ''"
                  (change)="onContextSiteChange($any($event.target).value)"
                >
                  <option class="text-slate-900" value="">All Sites</option>
                  @for (site of contextSites(); track site.id) {
                    <option class="text-slate-900" [value]="site.id">{{ site.name }}</option>
                  }
                </select>
                <i class="fa-solid fa-chevron-down pointer-events-none absolute right-0 text-[9px] text-white/50" aria-hidden="true"></i>
              </span>
            </label>

            <label class="group relative flex cursor-pointer flex-col justify-center gap-0.5 px-4 py-1 transition hover:bg-white/5 focus-within:bg-white/10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">School Year</span>
              <span class="relative flex items-center">
                <select
                  id="schoolYearSwitcher"
                  class="max-w-[9rem] cursor-pointer appearance-none truncate bg-transparent pr-4 font-mono text-sm font-semibold text-white outline-none"
                  (change)="onSchoolYearChange($any($event.target).value)"
                >
                  @for (year of schoolYears; track year.id) {
                    <option class="text-slate-900" [value]="year.id" [selected]="year.id === currentSchoolYear().id">{{ year.label }}</option>
                  }
                </select>
                <i class="fa-solid fa-chevron-down pointer-events-none absolute right-0 text-[9px] text-white/50" aria-hidden="true"></i>
              </span>
            </label>

            @if (schoolYearStatusLabel(); as statusLabel) {
              <span class="flex items-center px-4 text-xs font-medium text-white/60">{{ statusLabel }}</span>
            }
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <span class="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ header.missingCalendarsCount }} missing calendars
            </span>
            <span class="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              <i class="fa-solid fa-circle-minus"></i>
              {{ header.routingConflictsCount }} routing conflicts
            </span>
            <button
              pButton
              type="button"
              [text]="true"
              [rounded]="true"
              severity="secondary"
              class="relative !h-8 !w-8 !p-0 !text-white/70 hover:!bg-white/10 hover:!text-white"
              (click)="onBellClick()"
            >
              <i class="fa-regular fa-bell"></i>
              @if (header.unreadNotifications > 0) {
                <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              }
            </button>
          </div>
        </div>

        <main class="flex-1 p-6">
          <header class="mb-4">
            <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <a routerLink="/dashboard2" class="text-o-accent-600 hover:underline">OSSE</a>
              @for (crumb of breadcrumbs(); track crumb.url) {
                <span class="text-slate-300">/</span>
                <a [routerLink]="crumb.url" class="text-o-accent-600 hover:underline" [class.pointer-events-none]="$last" [class.text-slate-400]="$last">{{ crumb.label }}</a>
              }
            </nav>
          </header>

          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class BaseLayoutComponent {
  private router = inject(Router);
  private breadcrumbsService = inject(BreadcrumbService);
  private repo = inject(SampleDataRepository);
  private roleService = inject(CurrentRoleService);
  private yearService = inject(SchoolYearService);
  private permissionsService = inject(CalendarPermissionsService);
  private notificationFeedService = inject(NotificationFeedService);
  private contextService = inject(CurrentContextService);

  readonly breadcrumbs = this.breadcrumbsService.breadcrumbs;
  readonly header = this.repo.dashboardV2Header;
  readonly collapsed = signal(false);

  readonly roles = this.roleService.roles;
  readonly currentRole = this.roleService.role;

  readonly schoolYears = this.yearService.years;
  readonly currentSchoolYear = this.yearService.current;
  readonly canCreateCalendars = this.permissionsService.canCreateCalendars;

  readonly leaList = this.repo.leaList;
  readonly contextLeaId = this.contextService.leaId;
  readonly contextSiteId = this.contextService.siteId;
  readonly contextSites = this.contextService.sitesInLea;

  onContextLeaChange(id: string): void {
    this.contextService.setLea(id);
  }

  onContextSiteChange(id: string): void {
    this.contextService.setSite(id || null);
  }

  // "Historical" is the one status with a real behavioral consequence (read-only, no
  // calendar creation) and is worth calling out. A future year has no such restriction here -
  // it's already fully creatable - so it gets no extra label instead of a misleading
  // "not yet active" that contradicts what the app actually lets you do with it.
  readonly schoolYearStatusLabel = computed(() => {
    switch (this.currentSchoolYear().status) {
      case 'historical':
        return 'Historical — read only';
      case 'current':
        return 'Active';
      default:
        return null;
    }
  });

  readonly navSections: INavSection[] = [
    {
      title: 'Overview',
      items: [
        { path: '/dashboard2', label: 'Dashboard', icon: 'fa-grip', badge: null },
        { path: '/notifications', label: 'Notifications', icon: 'fa-bell', badge: null } // live count comes from badgeFor()
      ]
    },
    {
      title: 'Organizations',
      items: [
        { path: '/lea', label: 'LEAs', icon: 'fa-landmark', badge: null },
        { path: '/schools', label: 'Sites', icon: 'fa-school', badge: null }
      ]
    },
    {
      title: 'Calendars',
      items: [{ path: '/calendar', label: 'All Calendars', icon: 'fa-calendar-days', badge: null }]
    },
    {
      title: 'Configuration',
      items: [
        { path: '/calendar/bell-schedules', label: 'Bell Schedules', icon: 'fa-clock', badge: null },
        { path: '/calendar/holidays', label: 'Holidays', icon: 'fa-thumbtack', badge: null },
        { path: '/calendar/marking-periods', label: 'Marking Periods', icon: 'fa-list-ol', badge: null }
      ]
    },
    {
      title: 'Programs',
      items: [
        { path: '/calendar/programs', label: 'Programs', icon: 'fa-layer-group', badge: null },
        { path: '/calendar/esy', label: 'ESY Program', icon: 'fa-sun', badge: null },
        { path: '/calendar/12-month', label: '12-Month', icon: 'fa-infinity', badge: null }
      ]
    },
    {
      title: 'Oversight',
      items: [
        { path: '/compliance', label: 'Compliance', icon: 'fa-circle-check', badge: 5 },
        { path: '/waivers', label: 'Waivers', icon: 'fa-file-lines', badge: null },
        { path: '/approvals', label: 'Approvals', icon: 'fa-square-check', badge: 47 },
        { path: '/dot-routing', label: 'DOT Routing', icon: 'fa-bus', badge: 3 }
      ]
    },
    {
      title: 'Analytics',
      items: [{ path: '/reports', label: 'Reports', icon: 'fa-chart-column', badge: null }]
    }
  ];

  badgeFor(item: INavItem): number | null {
    if (item.path === '/notifications') {
      const unread = this.notificationFeedService.items().filter((n) => !n.read).length;
      return unread > 0 ? unread : null;
    }
    return item.badge;
  }

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
  }

  onBellClick(): void {
    this.router.navigate(['/notifications']);
  }

  onRoleChange(role: string): void {
    this.roleService.setRole(role);
  }

  onSchoolYearChange(yearId: string): void {
    this.yearService.setYear(yearId);
  }
}
