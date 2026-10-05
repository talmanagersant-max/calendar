var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
let StatCardComponent = class StatCardComponent {
    constructor() {
        this.label = input('');
        this.value = input('');
        this.change = input('');
        this.tone = input('neutral');
        this.toneClass = () => {
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
};
StatCardComponent = __decorate([
    Component({
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
          [ngClass]="toneClass()"
        >
          {{ change() }}
        </span>
      </div>
    </div>
  `,
        imports: []
    })
], StatCardComponent);
export { StatCardComponent };
//# sourceMappingURL=stat-card.component.js.map