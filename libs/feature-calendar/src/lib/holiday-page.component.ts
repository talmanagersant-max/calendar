import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { ButtonModule } from 'primeng/button';
import { HolidayType, IHoliday, SampleDataRepository } from '@osse/shared/data-access';

type HolidayTab = 'district' | 'lea' | 'templates';

@Component({
  selector: 'osse-holiday-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold text-slate-900">Holiday Management</h1>
        <div class="flex items-center gap-2.5">
          <button pButton type="button" [outlined]="true" severity="secondary" (click)="notify('Export started')">Export</button>
          <button pButton type="button" (click)="notify('Add holiday form would open here')">+ Add Holiday</button>
        </div>
      </div>

      <div class="flex gap-5 border-b border-slate-200 text-sm font-medium">
        @for (tab of tabs; track tab.id) {
          <button
            type="button"
            class="-mb-px border-b-2 px-1 py-2.5 transition"
            [class.border-o-accent-600]="activeTab() === tab.id"
            [class.text-o-accent-600]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-slate-500]="activeTab() !== tab.id"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      @if (activeTab() === 'district') {
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div class="font-mono text-2xl font-semibold text-slate-900">11</div>
            <div class="mt-1 text-xs text-slate-500">Federal Holidays</div>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div class="font-mono text-2xl font-semibold text-slate-900">3</div>
            <div class="mt-1 text-xs text-slate-500">Local Closures</div>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div class="font-mono text-2xl font-semibold text-slate-900">14</div>
            <div class="mt-1 text-xs text-slate-500">Total Non-Instructional</div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <ag-grid-angular class="ag-theme-alpine" style="width: 100%;" domLayout="autoHeight" [rowData]="holidays" [columnDefs]="columnDefs" [defaultColDef]="defaultColDef" />
        </div>
      } @else if (activeTab() === 'lea') {
        <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No LEA-specific holiday overrides have been submitted for SY 2025-26.
        </div>
      } @else {
        <div class="grid gap-3 sm:grid-cols-3">
          @for (template of templates; track template) {
            <div class="rounded-lg border border-slate-200 bg-white p-4">
              <div class="font-semibold text-slate-900">{{ template }}</div>
              <button pButton type="button" [text]="true" size="small" class="mt-3" label="Apply to calendar" (click)="notify(template + ' applied')"></button>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class HolidayPageComponent {
  private repo = inject(SampleDataRepository);
  readonly holidays = this.repo.holidays;

  readonly activeTab = signal<HolidayTab>('district');
  readonly tabs: { id: HolidayTab; label: string }[] = [
    { id: 'district', label: 'District Holidays' },
    { id: 'lea', label: 'LEA-Specific Holidays' },
    { id: 'templates', label: 'Templates' }
  ];

  readonly templates = ['Federal Holiday Set', 'DC Public Schools Standard', 'Public Charter Standard'];

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<IHoliday>[] = [
    { field: 'name', headerName: 'Holiday', flex: 1.4, minWidth: 180, cellClass: 'font-medium text-slate-900' },
    { field: 'dates', headerName: 'Date(s)', flex: 1.2, minWidth: 160, cellClass: 'font-mono' },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 100,
      cellRenderer: (params: { value: HolidayType }) =>
        `<span class="inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${params.value === 'Federal' ? 'border-o-accent-200 bg-o-accent-50 text-o-accent-700' : 'border-slate-200 bg-slate-50 text-slate-600'}">${params.value}</span>`
    },
    { field: 'appliesTo', headerName: 'Applies To', flex: 1, minWidth: 110 },
    {
      colId: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 130,
      sortable: false,
      cellRenderer: () =>
        `<button type="button" class="p-button p-button-sm p-button-text mr-1.5">Edit</button><button type="button" class="p-button p-button-sm p-button-text p-button-danger">Remove</button>`
    }
  ];

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
