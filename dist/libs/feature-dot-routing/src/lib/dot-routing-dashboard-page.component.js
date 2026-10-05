var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChangeDetectionStrategy, Component } from '@angular/core';
let DotRoutingDashboardPageComponent = class DotRoutingDashboardPageComponent {
    constructor() {
        this.items = [
            { label: 'Active routes', value: '76' },
            { label: 'On-time', value: '96%' },
            { label: 'Exceptions', value: '11' }
        ];
    }
};
DotRoutingDashboardPageComponent = __decorate([
    Component({
        selector: 'osse-dot-routing-dashboard-page',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-o-gray-200 bg-white p-6 shadow-soft">
        <h1 class="text-3xl font-bold text-o-gray-900">DOT Routing Dashboard</h1>
        <div class="mt-6 grid gap-4 md:grid-cols-3">
          @for (item of items; track item.label) {
            <div class="rounded-xl border border-o-gray-200 bg-o-gray-50 p-4">
              <div class="text-sm text-o-gray-600">{{ item.label }}</div>
              <div class="mt-2 text-2xl font-bold text-o-gray-900">{{ item.value }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `
    })
], DotRoutingDashboardPageComponent);
export { DotRoutingDashboardPageComponent };
//# sourceMappingURL=dot-routing-dashboard-page.component.js.map