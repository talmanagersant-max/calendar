import { Injectable, computed, signal } from '@angular/core';

export type SchoolYearStatus = 'historical' | 'current' | 'future';

export interface ISchoolYearOption {
  id: string;
  label: string;
  status: SchoolYearStatus;
}

const STORAGE_KEY = 'osse-current-school-year';
const DEFAULT_YEAR_ID = 'sy-2025-26';

export const SCHOOL_YEARS: ISchoolYearOption[] = [
  { id: 'sy-2023-24', label: 'SY 2023-24', status: 'historical' },
  { id: 'sy-2024-25', label: 'SY 2024-25', status: 'historical' },
  { id: 'esy-2025', label: 'ESY 2025', status: 'historical' },
  { id: 'sy-2025-26', label: 'SY 2025-26', status: 'current' },
  { id: 'esy-2026', label: 'ESY 2026', status: 'future' },
  { id: 'sy-2026-27', label: 'SY 2026-27', status: 'future' },
  { id: 'esy-2027', label: 'ESY 2027', status: 'future' }
];

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
