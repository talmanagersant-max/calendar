import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { CellClickedEvent, ColDef } from 'ag-grid-community';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { IMarkingPeriod, MarkingPeriodType, SampleDataRepository } from '@osse/shared/data-access';

interface IMarkingPeriodRow extends IMarkingPeriod {
  calendarName: string;
}

let nextId = 1;

@Component({
  selector: 'osse-marking-period-page',
  standalone: true,
  imports: [AgGridAngular, ButtonModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />
    <p-confirmDialog />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Marking Periods</h1>
          <p class="mt-1 text-sm text-slate-500">Semesters, quarters, and trimesters attached to a calendar.</p>
        </div>
        <button pButton type="button" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ Add Marking Period' }}</button>
      </div>

      @if (showForm()) {
        <form
          class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-5"
          (submit)="addPeriod($event, nameInput, typeSelect, calendarSelect, startInput, endInput)"
        >
          <label class="block text-sm font-medium text-slate-700 lg:col-span-2">
            Name
            <input
              #nameInput
              type="text"
              required
              placeholder="e.g. Semester 1"
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Type
            <select
              #typeSelect
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            >
              <option value="Semester">Semester</option>
              <option value="Quarter">Quarter</option>
              <option value="Trimester">Trimester</option>
            </select>
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Calendar
            <select
              #calendarSelect
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            >
              @for (calendar of calendars; track calendar.id) {
                <option [value]="calendar.id">{{ calendar.name }}</option>
              }
            </select>
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Start Date
            <input
              #startInput
              type="date"
              required
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700">
            End Date
            <input
              #endInput
              type="date"
              required
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            />
          </label>
          <div class="lg:col-span-5">
            <button pButton type="submit">Save Marking Period</button>
          </div>
        </form>
      }

      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <ag-grid-angular
          class="ag-theme-alpine"
          style="width: 100%;"
          domLayout="autoHeight"
          [rowData]="rows()"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef"
          (cellClicked)="onCellClicked($event)"
        />
      </div>
    </div>
  `
})
export class MarkingPeriodPageComponent {
  private readonly repo = inject(SampleDataRepository);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly calendars = this.repo.calendars;
  readonly showForm = signal(false);

  private readonly periods = signal<IMarkingPeriod[]>(this.repo.markingPeriods);

  readonly rows = computed<IMarkingPeriodRow[]>(() =>
    this.periods().map((period) => ({
      ...period,
      calendarName: this.calendars.find((c) => c.id === period.calendarId)?.name ?? period.calendarId
    }))
  );

  readonly defaultColDef: ColDef = { resizable: true, sortable: true, suppressMovable: true };

  readonly columnDefs: ColDef<IMarkingPeriodRow>[] = [
    { field: 'name', headerName: 'Marking Period', flex: 1.1, minWidth: 150, cellClass: 'font-medium text-slate-900' },
    { field: 'type', headerName: 'Type', flex: 0.8, minWidth: 100 },
    { field: 'calendarName', headerName: 'Calendar', flex: 1.4, minWidth: 200 },
    { field: 'startDate', headerName: 'Start', flex: 0.9, minWidth: 110, cellClass: 'font-mono' },
    { field: 'endDate', headerName: 'End', flex: 0.9, minWidth: 110, cellClass: 'font-mono' },
    {
      colId: 'actions',
      headerName: '',
      width: 100,
      minWidth: 100,
      flex: 0,
      resizable: false,
      sortable: false,
      cellRenderer: () => `<button type="button" class="p-button p-button-sm p-button-text p-button-danger" data-act="remove">Remove</button>`
    }
  ];

  addPeriod(
    event: SubmitEvent,
    nameInput: HTMLInputElement,
    typeSelect: HTMLSelectElement,
    calendarSelect: HTMLSelectElement,
    startInput: HTMLInputElement,
    endInput: HTMLInputElement
  ): void {
    event.preventDefault();
    const name = nameInput.value.trim();
    const type = typeSelect.value as MarkingPeriodType;
    const calendarId = calendarSelect.value;
    const startDate = startInput.value;
    const endDate = endInput.value;

    if (!name || !calendarId || !startDate || !endDate) return;
    if (startDate > endDate) {
      this.messageService.add({ severity: 'error', summary: 'Invalid dates', detail: 'Start date must be before the end date.' });
      return;
    }

    const period: IMarkingPeriod = { id: `mp-custom-${nextId++}`, calendarId, name, type, startDate, endDate };
    this.periods.update((list) => [...list, period]);
    this.showForm.set(false);
    (event.target as HTMLFormElement).reset();
    this.messageService.add({ severity: 'success', summary: 'Marking period added', detail: `${name} was added to the calendar.` });
  }

  onCellClicked(event: CellClickedEvent<IMarkingPeriodRow>): void {
    const target = event.event?.target as HTMLElement | undefined;
    if (target?.dataset['act'] === 'remove' && event.data) {
      const row = event.data;
      this.confirmationService.confirm({
        header: 'Remove marking period?',
        message: `This removes "${row.name}" from ${row.calendarName}. This can't be undone.`,
        acceptLabel: 'Remove',
        rejectLabel: 'Cancel',
        acceptIcon: 'pi pi-trash',
        rejectIcon: 'pi pi-times',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.periods.update((list) => list.filter((p) => p.id !== row.id));
          this.messageService.add({ severity: 'success', summary: 'Marking period removed', detail: `${row.name} was removed.` });
        }
      });
    }
  }
}
