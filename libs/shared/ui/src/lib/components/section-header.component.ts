import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'oss-section-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between gap-4 border-b border-o-gray-200 pb-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-o-primary-700">{{ label() }}</p>
        <h2 class="mt-2 text-2xl font-bold text-o-gray-900">{{ title() }}</h2>
      </div>
      <div class="flex items-center gap-2">
        <ng-content />
      </div>
    </div>
  `
})
export class SectionHeaderComponent {
  readonly label = input<string>('');
  readonly title = input<string>('');
}
