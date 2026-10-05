import { Injectable, signal } from '@angular/core';

export interface ITabStateItem {
  key: string;
  label: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class TabStateService {
  private readonly tabs = signal<ITabStateItem[]>([]);
  private readonly active = signal<string>('');

  readonly activeTab = this.active.asReadonly();
  readonly tabCollection = this.tabs.asReadonly();

  setActiveTab(pageKey: string, label: string, tabValue: string): void {
    const existing = this.tabs();
    const next = existing.filter((tab) => tab.key !== pageKey);
    next.push({ key: pageKey, label, value: tabValue });
    this.tabs.set(next);
    this.active.set(tabValue);
  }
}
