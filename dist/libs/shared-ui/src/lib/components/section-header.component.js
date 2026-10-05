var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
let SectionHeaderComponent = class SectionHeaderComponent {
    constructor() {
        this.label = input('');
        this.title = input('');
    }
};
SectionHeaderComponent = __decorate([
    Component({
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
], SectionHeaderComponent);
export { SectionHeaderComponent };
//# sourceMappingURL=section-header.component.js.map