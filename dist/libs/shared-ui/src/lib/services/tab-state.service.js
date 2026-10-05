var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, signal } from '@angular/core';
let TabStateService = class TabStateService {
    constructor() {
        this.tabs = signal([]);
        this.active = signal('');
        this.activeTab = this.active.asReadonly();
        this.tabCollection = this.tabs.asReadonly();
    }
    setActiveTab(pageKey, label, tabValue) {
        const existing = this.tabs();
        const next = existing.filter((tab) => tab.key !== pageKey);
        next.push({ key: pageKey, label, value: tabValue });
        this.tabs.set(next);
        this.active.set(tabValue);
    }
};
TabStateService = __decorate([
    Injectable({ providedIn: 'root' })
], TabStateService);
export { TabStateService };
//# sourceMappingURL=tab-state.service.js.map