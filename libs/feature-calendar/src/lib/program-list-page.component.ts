import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IProgram, ProgramType } from '@osse/shared/data-access';
import { ShellDataService, ToastService } from '@osse/shared/ui';

interface IProgramRow extends IProgram {
  leaName: string;
  calendarCount: number;
}


@Component({
  selector: 'osse-program-list-page',
  standalone: true,
  imports: [NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Programs</h1>
          <p class="mt-1 text-sm text-slate-500">
            Programs run by {{ shell.lea()?.name }}. Linked calendars are counted for {{ shell.scopeLabel() }} in {{ shell.year().label }}. A new Program becomes selectable
            as a Calendar Type in the wizard.
          </p>
        </div>
        <button nz-button nzType="primary" type="button" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ New Program' }}</button>
      </div>

      @if (showForm()) {
        <form class="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-4" (submit)="addProgram($event, nameInput, typeSelect, eligibilityInput)">
          <label class="block text-sm font-medium text-slate-700 lg:col-span-2">
            Program Name
            <input
              #nameInput
              type="text"
              required
              placeholder="e.g. Saturday Academy"
              class="form-control mt-1 w-full"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Type
            <select
              #typeSelect
              class="form-control mt-1 w-full"
            >
              <option value="Alternative">Alternative</option>
              <option value="ESY">ESY</option>
              <option value="12-Month">12-Month</option>
            </select>
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Eligibility
            <input
              #eligibilityInput
              type="text"
              required
              placeholder="Who qualifies"
              class="form-control mt-1 w-full"
            />
          </label>
          <div class="lg:col-span-4">
            <button nz-button nzType="primary" type="submit">Save Program</button>
          </div>
        </form>
      }

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        @for (program of rows(); track program.id) {
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between gap-2">
              <span class="font-semibold text-slate-900">{{ program.name }}</span>
              <span class="inline-flex items-center rounded border border-o-accent-200 bg-o-accent-50 px-2 py-0.5 text-xs font-medium text-o-accent-700">{{ program.type }}</span>
            </div>
            <p class="mt-1.5 text-xs text-o-ink-600">{{ program.leaName }}</p>
            <p class="mt-2 text-sm text-slate-600">{{ program.eligibility }}</p>
            <p class="mt-3 font-mono text-xs text-o-ink-600">{{ program.calendarCount }} linked calendar(s)</p>
          </div>
        }
      </div>
    </div>
  `
})
export class ProgramListPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly toast = inject(ToastService);

  readonly showForm = signal(false);

  readonly rows = computed<IProgramRow[]>(() => {
    const calendars = [...this.shell.scopedCalendars(), ...this.shell.esyCalendars()];
    return this.shell.programs().map((program) => ({
      ...program,
      leaName: this.shell.lea()?.name ?? '',
      calendarCount: new Set(calendars.filter((cal) => cal.programId === program.id && cal.status !== 'Missing').map((c) => c.id)).size
    }));
  });

  addProgram(event: SubmitEvent, nameInput: HTMLInputElement, typeSelect: HTMLSelectElement, eligibilityInput: HTMLInputElement): void {
    event.preventDefault();
    const name = nameInput.value.trim();
    const type = typeSelect.value as ProgramType;
    const eligibility = eligibilityInput.value.trim();
    if (!name || !eligibility) return;

    // Added to the shell store for the current LEA, so the wizard's Calendar Type step sees it too.
    this.shell.addProgram({ name, type, eligibility });
    this.showForm.set(false);
    (event.target as HTMLFormElement).reset();
    this.toast.add({ severity: 'success', summary: 'Program created', detail: `${name} is now selectable as a Calendar Type in the wizard.` });
  }
}
