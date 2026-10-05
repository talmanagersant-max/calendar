import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'osse-calendar-create-entry-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Create New Calendar</h1>
        <p class="mt-1 text-sm text-o-ink-600">Choose how you'd like to start.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          class="group flex flex-col items-start gap-3 rounded-lg border-2 border-slate-200 bg-white p-5 text-left transition-all hover:border-o-primary-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-2"
          (click)="startFromScratch()"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-o-primary-50 text-o-primary-600 group-hover:bg-o-primary-100">
            <i class="fa-solid fa-calendar-plus text-lg" aria-hidden="true"></i>
          </div>
          <div>
            <div class="font-semibold text-slate-900">Start from Scratch</div>
            <p class="mt-1 text-sm text-o-ink-600">Build a new calendar step by step - select scope, dates, holidays, and bell schedule.</p>
          </div>
        </button>

        <button
          type="button"
          class="group flex flex-col items-start gap-3 rounded-lg border-2 border-slate-200 bg-white p-5 text-left transition-all hover:border-o-primary-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-o-primary-500 focus-visible:ring-offset-2"
          (click)="copyFromExisting()"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-o-accent-50 text-o-accent-600 group-hover:bg-o-accent-100">
            <i class="fa-solid fa-copy text-lg" aria-hidden="true"></i>
          </div>
          <div>
            <div class="font-semibold text-slate-900">Copy from Existing Calendar</div>
            <p class="mt-1 text-sm text-o-ink-600">Pick a source calendar, choose which sections to bring over, and configure a new independent destination.</p>
          </div>
        </button>
      </div>
    </div>
  `
})
export class CalendarCreateEntryPageComponent {
  private readonly router = inject(Router);

  startFromScratch(): void {
    this.router.navigate(['/calendar/wizard']);
  }

  copyFromExisting(): void {
    this.router.navigate(['/calendar/copy-wizard']);
  }
}
