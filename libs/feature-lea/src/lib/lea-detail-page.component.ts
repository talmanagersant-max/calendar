import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SampleDataRepository } from '../../../shared/data-access/src';

@Component({
  selector: 'osse-lea-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-lg border border-slate-200 bg-white p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-o-accent-600">LEA</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-900">{{ lea()?.name }}</h1>
        </div>
        <span class="rounded border border-o-accent-200 bg-o-accent-50 px-3 py-1 text-sm font-medium text-o-accent-700">{{ lea()?.status }}</span>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-md bg-slate-50 p-4">
          <div class="text-sm text-slate-500">Region</div>
          <div class="mt-1 text-lg font-semibold text-slate-900">{{ lea()?.region }}</div>
        </div>
        <div class="rounded-md bg-slate-50 p-4">
          <div class="text-sm text-slate-500">Contact</div>
          <div class="mt-1 text-lg font-semibold text-slate-900">{{ lea()?.contact }}</div>
        </div>
        <div class="rounded-md bg-slate-50 p-4">
          <div class="text-sm text-slate-500">Email</div>
          <div class="mt-1 text-lg font-semibold text-slate-900">{{ lea()?.email }}</div>
        </div>
      </div>
    </div>
  `
})
export class LeaDetailPageComponent {
  private route = inject(ActivatedRoute);
  private repo = inject(SampleDataRepository);

  readonly lea = () => this.repo.leaList.find((item) => item.id === this.route.snapshot.paramMap.get('leaId'));
}
