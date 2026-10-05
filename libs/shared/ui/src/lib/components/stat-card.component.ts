import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'oss-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-o-gray-200 bg-white p-5 shadow-soft">
      <div class="text-xs font-medium uppercase tracking-[0.18em] text-o-primary-700">{{ label() }}</div>
      <div class="mt-3 flex items-end justify-between gap-3">
        <span class="text-3xl font-bold text-o-gray-900">{{ value() }}</span>
        <span
          class="rounded-full px-2.5 py-1 text-xs font-semibold"
          [class]="toneClass()"
        >
          {{ change() }}
        </span>
      </div>
    </div>
  `,
  imports: []
})
export class StatCardComponent {
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly change = input<string>('');
  readonly tone = input<'positive' | 'warning' | 'neutral'>('neutral');

  readonly toneClass = () => {
    switch (this.tone()) {
      case 'positive':
        return 'bg-o-primary-50 text-o-primary-700';
      case 'warning':
        return 'bg-o-secondary-50 text-o-secondary-700';
      default:
        return 'bg-o-gray-100 text-o-gray-700';
    }
  };
}
