export declare class StatCardComponent {
    readonly label: import("@angular/core").InputSignal<string>;
    readonly value: import("@angular/core").InputSignal<string>;
    readonly change: import("@angular/core").InputSignal<string>;
    readonly tone: import("@angular/core").InputSignal<"positive" | "warning" | "neutral">;
    readonly toneClass: () => "bg-o-primary-50 text-o-primary-700" | "bg-o-secondary-50 text-o-secondary-700" | "bg-o-gray-100 text-o-gray-700";
}
