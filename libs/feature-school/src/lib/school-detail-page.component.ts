import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SampleDataRepository } from '../../../shared/data-access/src';

@Component({
  selector: 'osse-school-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-o-accent-600">Site</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-900">{{ school()?.name }}</h1>
        </div>
        <span class="rounded border border-o-accent-200 bg-o-accent-50 px-3 py-1 text-sm font-medium text-o-accent-700">{{ school()?.status }}</span>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-md bg-slate-50 p-4">
          <div class="text-sm text-slate-500">LEA</div>
          <div class="mt-1 text-lg font-semibold text-slate-900">{{ leaName() }}</div>
        </div>
        <div class="rounded-md bg-slate-50 p-4">
          <div class="text-sm text-slate-500">Grade Band</div>
          <div class="mt-1 text-lg font-semibold text-slate-900">{{ school()?.gradeBand }}</div>
        </div>
        <div class="rounded-md bg-slate-50 p-4">
          <div class="text-sm text-slate-500">Students</div>
          <div class="mt-1 text-lg font-semibold text-slate-900">{{ school()?.studentCount }}</div>
        </div>
      </div>
    </div>
  `
})
export class SchoolDetailPageComponent {
  private route = inject(ActivatedRoute);
  private repo = inject(SampleDataRepository);

  readonly school = () => this.repo.schoolList.find((item) => item.id === this.route.snapshot.paramMap.get('schoolId'));
  readonly leaName = () => this.repo.leaList.find((lea) => lea.id === this.school()?.leaId)?.name ?? this.school()?.leaId ?? '—';
}
