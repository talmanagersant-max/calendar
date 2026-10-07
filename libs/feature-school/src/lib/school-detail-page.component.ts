import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LEA_DIRECTORY } from '@osse/shared/data-access';
import { ShellDataService } from '@osse/shared/ui';

@Component({
  selector: 'osse-school-detail-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (match(); as match) {
      <div class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-o-accent-600">Site · {{ match.site.code }}</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-900">{{ match.school.name }}</h1>
          <p class="mt-1 text-sm text-slate-500">{{ match.site.name }} · {{ match.site.address }}</p>
          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="rounded-md bg-slate-50 p-4">
              <div class="text-sm text-slate-500">LEA</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">{{ leaName() }}</div>
            </div>
            <div class="rounded-md bg-slate-50 p-4">
              <div class="text-sm text-slate-500">Grades Served</div>
              <div class="mt-1 text-lg font-semibold text-slate-900">{{ match.school.gradeBand }}</div>
            </div>
            <div class="rounded-md bg-slate-50 p-4">
              <div class="text-sm text-slate-500">Campus ID</div>
              <div class="mt-1 font-mono text-lg font-semibold text-slate-900">{{ match.school.code }}</div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <h2 class="text-base font-semibold text-slate-900">Calendars · {{ shell.year().label }}</h2>
          <ul class="mt-3 divide-y divide-slate-100">
            @for (cal of calendars(); track cal.id) {
              <li class="flex items-center justify-between gap-3 py-2.5 text-sm">
                <a [routerLink]="['/calendar', cal.id]" class="font-medium text-o-accent-700 hover:underline">{{ cal.type }} <span class="font-mono text-xs text-slate-500">{{ cal.id }}</span></a>
                <span class="text-xs text-slate-600">{{ cal.status }}</span>
              </li>
            } @empty {
              <li class="py-2.5 text-sm text-slate-500">No calendars for this site in {{ shell.year().label }}.</li>
            }
          </ul>
        </div>
      </div>
    } @else {
      <p class="text-sm text-slate-500">Site not found. <a routerLink="/schools" class="text-o-accent-700 underline">Back to Sites</a></p>
    }
  `
})
export class SchoolDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly shell = inject(ShellDataService);

  readonly match = computed(() => this.shell.findSite(this.route.snapshot.paramMap.get('schoolId')));
  readonly calendars = computed(() => {
    const siteId = this.match()?.site.id;
    return this.shell.allCalendars().filter((c) => c.siteId === siteId && c.yearId === this.shell.yearId());
  });
  readonly leaName = computed(() => LEA_DIRECTORY.find((lea) => lea.schools.some((s) => s.id === this.match()?.school.id))?.name ?? '—');
}
