var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChangeDetectionStrategy, Component } from '@angular/core';
let ReportsPageComponent = class ReportsPageComponent {
    constructor() {
        this.reports = [
            { category: 'Academic', title: 'Enrollment snapshot' },
            { category: 'Operations', title: 'Bell schedule variance' },
            { category: 'Compliance', title: 'Annual audit summary' },
            { category: 'Routing', title: 'DOT performance review' }
        ];
    }
};
ReportsPageComponent = __decorate([
    Component({
        selector: 'osse-reports-page',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-o-gray-200 bg-white p-6 shadow-soft">
        <h1 class="text-3xl font-bold text-o-gray-900">Reports</h1>
        <div class="mt-6 grid gap-4 md:grid-cols-2">
          @for (report of reports; track report.title) {
            <div class="rounded-xl border border-o-gray-200 bg-o-gray-50 p-4">
              <div class="text-sm text-o-gray-600">{{ report.category }}</div>
              <div class="mt-2 text-lg font-semibold text-o-gray-900">{{ report.title }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `
    })
], ReportsPageComponent);
export { ReportsPageComponent };
//# sourceMappingURL=reports-page.component.js.map