import { Router } from '@angular/router';
export interface IBreadcrumbItem {
    label: string;
    url: string;
}
export declare class BreadcrumbService {
    private router;
    private readonly _breadcrumbs;
    readonly breadcrumbs: import("@angular/core").Signal<IBreadcrumbItem[]>;
    private readonly pageMap;
    private readonly tabMap;
    private readonly dynamicLabel;
    constructor(router: Router);
    setDynamicLabel(label: string): void;
    private walkRoute;
    private applyOriginContext;
}
