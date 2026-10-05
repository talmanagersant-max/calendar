import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { IProgram, ProgramType, SampleDataRepository } from '@osse/shared/data-access';

interface IProgramRow extends IProgram {
  leaName: string;
  calendarCount: number;
}

let nextId = 1;

@Component({
  selector: 'osse-program-list-page',
  standalone: true,
  imports: [ButtonModule, ToastModule],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toast position="top-right" />

    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Programs</h1>
          <p class="mt-1 text-sm text-slate-500">
            One reusable Program calendar type per row - includes ESY and 12-Month today, plus anything created here. A new Program becomes selectable as a Calendar Type in
            the wizard.
          </p>
        </div>
        <button pButton type="button" (click)="showForm.set(!showForm())">{{ showForm() ? 'Cancel' : '+ New Program' }}</button>
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
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            />
          </label>
          <label class="block text-sm font-medium text-slate-700">
            Type
            <select
              #typeSelect
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
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
              class="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none focus-visible:border-o-primary-500 focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-1"
            />
          </label>
          <div class="lg:col-span-4">
            <button pButton type="submit">Save Program</button>
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
  private readonly repo = inject(SampleDataRepository);
  private readonly messageService = inject(MessageService);

  readonly showForm = signal(false);
  private readonly programs = signal<IProgram[]>(this.repo.programs);

  readonly rows = computed<IProgramRow[]>(() =>
    this.programs().map((program) => ({
      ...program,
      leaName: this.repo.leaList.find((lea) => lea.id === program.leaId)?.name ?? program.leaId,
      calendarCount: this.repo.calendars.filter((cal) => cal.programId === program.id).length
    }))
  );

  addProgram(event: SubmitEvent, nameInput: HTMLInputElement, typeSelect: HTMLSelectElement, eligibilityInput: HTMLInputElement): void {
    event.preventDefault();
    const name = nameInput.value.trim();
    const type = typeSelect.value as ProgramType;
    const eligibility = eligibilityInput.value.trim();
    if (!name || !eligibility) return;

    const program: IProgram = { id: `prog-custom-${nextId++}`, leaId: 'lea-dcps', name, type, eligibility };
    // Push into the shared repo (not just this page's local signal) so the calendar
    // wizard's Calendar Type step - which reads `repo.programs` directly - sees it too.
    this.repo.programs.push(program);
    this.programs.set(this.repo.programs.slice());
    this.showForm.set(false);
    (event.target as HTMLFormElement).reset();
    this.messageService.add({ severity: 'success', summary: 'Program created', detail: `${name} is now selectable as a Calendar Type in the wizard.` });
  }
}
