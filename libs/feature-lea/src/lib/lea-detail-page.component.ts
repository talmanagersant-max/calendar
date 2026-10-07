import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LEA_DIRECTORY } from '@osse/shared/data-access';
import { CurrentContextService, ShellDataService } from '@osse/shared/ui';

@Component({
  selector: 'osse-lea-detail-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (lea(); as lea) {
      <div class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-white p-6">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-o-accent-600">LEA · ID {{ lea.code }}</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-900">{{ lea.name }}</h1>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            @for (stat of stats(); track stat.label) {
              <div class="rounded-md bg-slate-50 p-4">
                <div class="text-sm text-slate-500">{{ stat.label }}</div>
                <div class="mt-1 font-mono text-2xl font-semibold text-slate-900">{{ stat.value }}</div>
              </div>
            }
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5">
          <h2 class="text-base font-semibold text-slate-900">Schools</h2>
          <p class="text-xs text-slate-500">{{ shell.year().label }} site-calendar progress · choose a school to switch the top navigation to it</p>
          <ul class="mt-3 divide-y divide-slate-100">
            @for (row of schoolRows(); track row.id) {
              <li class="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <button type="button" class="text-left" (click)="openSchool(row.id)">
                  <span class="block font-medium text-o-accent-700 hover:underline">{{ row.name }}</span>
                  <span class="block text-xs text-slate-500">Campus ID <span class="font-mono">{{ row.code }}</span> · Grades {{ row.gradeBand }} · {{ row.sites }} site(s)</span>
                </button>
                <span class="font-mono text-xs text-slate-600">{{ row.approved }}/{{ row.sites }} approved</span>
              </li>
            }
          </ul>
        </div>
      </div>
    } @else {
      <p class="text-sm text-slate-500">LEA not found. <a routerLink="/lea" class="text-o-accent-700 underline">Back to LEAs</a></p>
    }
  `
})
export class LeaDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly context = inject(CurrentContextService);
  readonly shell = inject(ShellDataService);

  readonly lea = computed(() => LEA_DIRECTORY.find((item) => item.id === this.route.snapshot.paramMap.get('leaId')) ?? null);

  private readonly calendars = computed(() => {
    const leaId = this.lea()?.id;
    const yearId = this.shell.yearId();
    return this.shell.allCalendars().filter((c) => c.leaId === leaId && c.yearId === yearId && c.siteId !== null);
  });

  readonly stats = computed(() => {
    const lea = this.lea();
    const cals = this.calendars();
    return [
      { label: 'Schools', value: lea?.schools.length ?? 0 },
      { label: 'Sites', value: lea?.schools.reduce((sum, s) => sum + s.sites.length, 0) ?? 0 },
      { label: `Approved (${this.shell.year().label})`, value: cals.filter((c) => c.status === 'Approved').length },
      { label: 'Missing', value: cals.filter((c) => c.status === 'Missing').length }
    ];
  });

  readonly schoolRows = computed(() =>
    (this.lea()?.schools ?? []).map((school) => ({
      id: school.id,
      name: school.name,
      code: school.code,
      gradeBand: school.gradeBand,
      sites: school.sites.length,
      approved: this.calendars().filter((c) => c.schoolId === school.id && c.status === 'Approved').length
    }))
  );

  openSchool(schoolId: string): void {
    const lea = this.lea();
    if (lea) this.context.setLea(lea.id);
    this.context.setSchool(schoolId);
    this.router.navigate(['/schools']);
  }
}
