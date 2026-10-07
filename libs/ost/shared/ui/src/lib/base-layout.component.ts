import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CalendarPermissionsService, CurrentContextService, CurrentRoleService, NotificationFeedService, SchoolYearService, ShellDataService } from '../../../../../shared/ui/src';

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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <!-- Not sticky: the header scrolls away so content gets the full viewport; the sidebar stays pinned for navigation.
           Both rows share the sidebar navy so the chrome reads as one continuous frame. -->
      <header class="bg-o-primary-900">
        <div class="flex items-center gap-4 px-5 py-2">
          <a routerLink="/dashboard2" class="group flex min-w-0 items-center gap-4 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-o-primary-900">
            <!-- Rounded clip trims the JPG's white corners so the magenta mark sits directly on navy -->
            <img src="assets/osse-logo.jpg" alt="OSSE - Office of the State Superintendent of Education" class="h-10 w-auto shrink-0 rounded-md" />
            <span class="hidden h-10 w-px shrink-0 bg-white/15 sm:block" aria-hidden="true"></span>
            <span class="flex min-w-0 flex-col leading-tight">
              <span class="hidden truncate text-[10px] font-bold uppercase tracking-[0.22em] text-o-secondary-300 md:block">Office of the State Superintendent of Education</span>
              <span class="truncate text-base font-extrabold tracking-tight text-white sm:text-xl">
                Entity Calendar Management System
              </span>
            </span>
          </a>

          <div class="ml-auto flex shrink-0 items-center gap-3">
            <button
              nz-button
              nzType="text"
              nzShape="round"
              type="button"
              aria-label="Notifications"
              class="btn-secondary relative !h-9 !w-9 !p-0 !text-white/80 hover:!bg-white/10 hover:!text-white"
              (click)="onBellClick()"
            >
              <i class="fa-regular fa-bell text-lg"></i>
              @if (unreadNotifications() > 0) {
                <span class="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-o-primary-900 bg-o-secondary-400"></span>
              }
            </button>
            <span class="hidden h-8 w-px bg-white/15 sm:block" aria-hidden="true"></span>
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-o-secondary-600 text-xs font-bold text-white ring-2 ring-white/20">JT</div>
              <div class="hidden min-w-0 sm:block">
                <div class="truncate text-sm font-semibold text-white">J. Torres</div>
                <label class="sr-only" for="roleSwitcher">Viewing as role</label>
                <select
                  id="roleSwitcher"
                  class="-ml-1 max-w-[12rem] cursor-pointer rounded bg-transparent py-0.5 pl-1 pr-1 text-xs text-white/60 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/60"
                  (change)="onRoleChange($any($event.target).value)"
                >
                  @for (role of roles; track role) {
                    <option class="text-slate-900" [value]="role" [selected]="role === currentRole()">{{ role }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-1 py-1">
          <div class="flex flex-wrap items-stretch divide-x divide-white/10">
            <label class="group relative flex cursor-pointer flex-col justify-center gap-0.5 px-4 py-1 transition hover:bg-white/5 focus-within:bg-white/10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">LEA</span>
              <span class="relative flex items-center">
                <select
                  aria-label="LEA"
                  class="max-w-[14rem] cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-semibold text-white outline-none"
                  [title]="contextLea()?.name ?? ''"
                  (change)="onContextLeaChange($any($event.target).value)"
                >
                  @for (lea of leaOptions; track lea.id) {
                    <option class="text-slate-900" [value]="lea.id" [selected]="lea.id === contextLeaId()">{{ lea.name }}</option>
                  }
                </select>
                <i class="fa-solid fa-chevron-down pointer-events-none absolute right-0 text-[9px] text-white/50" aria-hidden="true"></i>
              </span>
            </label>

            <label class="group relative flex cursor-pointer flex-col justify-center gap-0.5 px-4 py-1 transition hover:bg-white/5 focus-within:bg-white/10">
              <span class="text-[10px] font-bold uppercase tracking-wider text-white/50">School</span>
              <span class="relative flex items-center">
                <select
                  aria-label="School"
                  class="max-w-[16rem] cursor-pointer appearance-none truncate bg-transparent pr-4 text-sm font-semibold text-white outline-none"
                  [title]="contextSchool()?.name ?? 'All Schools'"
                  (change)="onContextSchoolChange($any($event.target).value)"
                >
                  <option class="text-slate-900" value="" [selected]="!contextSchoolId()">All Schools ({{ contextSchools().length }})</option>
                  @for (school of contextSchools(); track school.id) {
                    <option class="text-slate-900" [value]="school.id" [selected]="school.id === contextSchoolId()">{{ school.name }}</option>
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
            @if (missingCalendarsCount() > 0) {
              <a routerLink="/calendar" class="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100">
                <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
                {{ missingCalendarsCount() }} missing calendar{{ missingCalendarsCount() === 1 ? '' : 's' }}
              </a>
            }
            @if (routingConflictsCount() > 0) {
              <a routerLink="/dot-routing" class="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
                <i class="fa-solid fa-circle-minus" aria-hidden="true"></i>
                {{ routingConflictsCount() }} routing conflict{{ routingConflictsCount() === 1 ? '' : 's' }}
              </a>
            }
            @if (canCreateCalendars()) {
              <span class="mx-1 hidden h-7 w-px bg-white/15 sm:block" aria-hidden="true"></span>
              <!-- o-orange-500: white text 4.59:1 (WCAG AA), button vs. navy bar 3.17:1 (non-text 3:1).
                   Keep all text solid white - translucent white drops below 4.5:1 on this orange. -->
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
                class="group inline-flex items-center gap-2 rounded-lg bg-o-orange-500 px-3.5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-o-orange-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-o-primary-900"
              >
                <i class="fa-solid fa-calendar-plus" aria-hidden="true"></i>
                Create Calendar
                @if (createLink.isActive) {
                  <span class="sr-only">(current page)</span>
                }
              </a>
            }
          </div>
        </div>

      </header>

      <!-- flex-1 fills the rest of the viewport, so short pages end at the screen bottom (no extra
           scroll). The aside's height comes only from the page content (its nav sits in an
           absolutely positioned layer, so it never stretches the page); inside that layer the nav
           column is sticky, capped at one screen, and scrolls on its own when taller. -->
      <div class="flex flex-1">
      <aside
        class="relative shrink-0 bg-o-primary-900 transition-all"
        [class.w-60]="!collapsed()"
        [class.w-16]="collapsed()"
      >
        <div class="absolute inset-0">
        <div class="sticky top-0 flex h-full max-h-screen flex-col">
        <div class="flex justify-end px-3 pt-3">
          <button
            nz-button
            nzType="text"
            nzShape="circle"
            type="button"
            [attr.aria-label]="collapsed() ? 'Expand navigation' : 'Collapse navigation'"
            class="btn-secondary btn-icon-only !h-7 !w-7 shrink-0 !p-0 !text-slate-400 hover:!bg-slate-800 hover:!text-white"
            (click)="toggleCollapsed()"
          ><i [class]="collapsed() ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left'" aria-hidden="true"></i></button>
        </div>

        <nav class="flex-1 overflow-y-auto px-2 py-4">
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
        </div>
        </div>
      </aside>

      <div class="min-w-0 flex-1">
        <main class="flex-1 p-6">
          <router-outlet />
        </main>
      </div>
      </div>
    </div>
  `
})
export class BaseLayoutComponent {
  private router = inject(Router);
  private shell = inject(ShellDataService);
  private feed = inject(NotificationFeedService);
  private roleService = inject(CurrentRoleService);
  private yearService = inject(SchoolYearService);
  private permissionsService = inject(CalendarPermissionsService);
  private contextService = inject(CurrentContextService);

  readonly unreadNotifications = this.feed.unreadCount;
  readonly missingCalendarsCount = computed(() => this.shell.counts().missing);
  readonly routingConflictsCount = this.shell.openConflictCount;
  readonly collapsed = signal(false);

  readonly roles = this.roleService.roles;
  readonly currentRole = this.roleService.role;

  readonly schoolYears = this.yearService.years;
  readonly currentSchoolYear = this.yearService.current;
  readonly canCreateCalendars = this.permissionsService.canCreateCalendars;

  readonly leaOptions = this.contextService.leaOptions;
  readonly contextLeaId = this.contextService.leaId;
  readonly contextLea = this.contextService.currentLea;
  readonly contextSchoolId = this.contextService.schoolId;
  readonly contextSchool = this.contextService.currentSchool;
  readonly contextSchools = this.contextService.schoolsInLea;

  onContextLeaChange(id: string): void {
    this.contextService.setLea(id);
  }

  onContextSchoolChange(id: string): void {
    this.contextService.setSchool(id || null);
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
        { path: '/dashboard2', label: 'Dashboard', icon: 'fa-grip', badge: null }
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
        { path: '/compliance', label: 'Compliance', icon: 'fa-circle-check', badge: null },
        { path: '/waivers', label: 'Waivers', icon: 'fa-file-lines', badge: null },
        { path: '/approvals', label: 'Approvals', icon: 'fa-square-check', badge: null },
        { path: '/dot-routing', label: 'DOT Routing', icon: 'fa-bus', badge: null }
      ]
    },
    {
      title: 'Analytics',
      items: [{ path: '/reports', label: 'Reports', icon: 'fa-chart-column', badge: null }]
    }
  ];

  // Oversight badges are live counts for the current shell scope (LEA / School / School Year).
  private readonly liveBadges = computed<Record<string, number>>(() => ({
    '/compliance': this.shell.complianceViolations().filter((v) => v.status === 'Open').length,
    '/approvals': this.shell.counts().underReview,
    '/dot-routing': this.shell.openConflictCount()
  }));

  badgeFor(item: INavItem): number | null {
    const live = this.liveBadges()[item.path];
    if (live !== undefined) return live > 0 ? live : null;
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
