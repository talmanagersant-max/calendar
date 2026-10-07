import { Injectable, computed, signal } from '@angular/core';
import { SCHOOL_YEARS } from '@osse/shared/data-access';

export type { ISchoolYearOption, SchoolYearStatus } from '@osse/shared/data-access';

const STORAGE_KEY = 'osse-current-school-year';
const DEFAULT_YEAR_ID = 'sy-2025-26';

function loadStoredYearId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && SCHOOL_YEARS.some((year) => year.id === stored) ? stored : DEFAULT_YEAR_ID;
  } catch {
    return DEFAULT_YEAR_ID;
  }
}

@Injectable({ providedIn: 'root' })
export class SchoolYearService {
  readonly years = SCHOOL_YEARS;

  private readonly _yearId = signal<string>(loadStoredYearId());
  readonly yearId = this._yearId.asReadonly();

  readonly current = computed(() => this.years.find((year) => year.id === this._yearId()) ?? this.years[0]);
  readonly isHistorical = computed(() => this.current().status === 'historical');

  setYear(id: string): void {
    this._yearId.set(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Persistence is a nice-to-have; the switcher still works within the session if storage is blocked.
    }
  }
}
