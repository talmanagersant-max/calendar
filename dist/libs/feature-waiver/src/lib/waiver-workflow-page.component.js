var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChangeDetectionStrategy, Component } from '@angular/core';
let WaiverWorkflowPageComponent = class WaiverWorkflowPageComponent {
    constructor() {
        this.items = [
            { title: 'Attendance extension', owner: 'A. Morris', status: 'Awaiting review' },
            { title: 'Late start waiver', owner: 'L. Chen', status: 'Pending approval' },
            { title: 'Intervention override', owner: 'S. Patel', status: 'Completed' }
        ];
    }
};
WaiverWorkflowPageComponent = __decorate([
    Component({
        selector: 'osse-waiver-workflow-page',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-o-gray-200 bg-white p-6 shadow-soft">
        <h1 class="text-3xl font-bold text-o-gray-900">Waiver Workflow</h1>
        <div class="mt-6 grid gap-4 md:grid-cols-3">
          @for (item of items; track item.title) {
            <div class="rounded-xl border border-o-gray-200 bg-o-gray-50 p-4">
              <div class="text-sm text-o-gray-600">{{ item.title }}</div>
              <div class="mt-2 text-xl font-bold text-o-gray-900">{{ item.owner }}</div>
              <div class="mt-2 text-sm text-o-gray-500">{{ item.status }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `
    })
], WaiverWorkflowPageComponent);
export { WaiverWorkflowPageComponent };
//# sourceMappingURL=waiver-workflow-page.component.js.map