export interface ITabStateItem {
    key: string;
    label: string;
    value: string;
}
export declare class TabStateService {
    private readonly tabs;
    private readonly active;
    readonly activeTab: import("@angular/core").Signal<string>;
    readonly tabCollection: import("@angular/core").Signal<ITabStateItem[]>;
    setActiveTab(pageKey: string, label: string, tabValue: string): void;
}
