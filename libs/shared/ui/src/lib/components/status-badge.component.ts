import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type StatusBadgeTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

const TONE_CLASSES: Record<StatusBadgeTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-o-accent-200 bg-o-accent-50 text-o-accent-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  danger: 'border-red-200 bg-red-50 text-red-700',
  neutral: 'border-slate-200 bg-slate-50 text-slate-600'
};

@Component({
  selector: 'oss-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium" [class]="toneClass()">
      {{ label() }}
    </span>
  `
})
export class StatusBadgeComponent {
  readonly label = input<string>('');
  readonly tone = input<StatusBadgeTone>('neutral');

  readonly toneClass = computed(() => TONE_CLASSES[this.tone()]);
}
