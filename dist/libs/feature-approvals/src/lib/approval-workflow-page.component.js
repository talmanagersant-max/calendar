var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ChangeDetectionStrategy, Component } from '@angular/core';
let ApprovalWorkflowPageComponent = class ApprovalWorkflowPageComponent {
    constructor() {
        this.items = [
            { name: 'Calendar approval', owner: 'North Valley LEA', stage: 'Pending' },
            { name: 'Bell schedule', owner: 'Oak Street Academy', stage: 'Escalated' },
            { name: 'Holiday closure', owner: 'Harbor District', stage: 'Approved' }
        ];
    }
};
ApprovalWorkflowPageComponent = __decorate([
    Component({
        selector: 'osse-approval-workflow-page',
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-o-gray-200 bg-white p-6 shadow-soft">
        <h1 class="text-3xl font-bold text-o-gray-900">Approval Workflow</h1>
        <div class="mt-6 space-y-3">
          @for (item of items; track item.name) {
            <div class="flex items-center justify-between rounded-xl border border-o-gray-200 bg-o-gray-50 p-4">
              <div>
                <div class="font-semibold text-o-gray-900">{{ item.name }}</div>
                <div class="text-sm text-o-gray-600">{{ item.owner }}</div>
              </div>
              <span class="rounded-full bg-o-primary-50 px-2.5 py-1 text-xs font-semibold text-o-primary-700">{{ item.stage }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
    })
], ApprovalWorkflowPageComponent);
export { ApprovalWorkflowPageComponent };
//# sourceMappingURL=approval-workflow-page.component.js.map