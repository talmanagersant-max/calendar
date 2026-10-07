import { Injectable, computed, signal } from '@angular/core';
import { LEA_DIRECTORY } from '@osse/shared/data-access';

// Keys bumped from the old LEA/Site switcher so stale ids from the previous mock list aren't restored.
const LEA_STORAGE_KEY = 'osse-context-directory-lea';
const SCHOOL_STORAGE_KEY = 'osse-context-directory-school';
// KIPP DC is the default LEA on first load (the largest LEA in the directory).
const DEFAULT_LEA_ID = 'lea-kipp';

function loadStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persist(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Persistence is a nice-to-have; the switcher still works within the session if storage is blocked.
  }
}

/**
 * The active LEA/School context, set from the top-nav context switcher. Pages that list or filter
 * calendar data read this to scope themselves to the selection, the same way they already read
 * SchoolYearService for the active school year - this is not just a display label.
 */
@Injectable({ providedIn: 'root' })
export class CurrentContextService {
  readonly leaOptions = LEA_DIRECTORY;

  private readonly _leaId = signal<string>(this.initialLeaId());
  // null schoolId means "All Schools" within the selected LEA.
  private readonly _schoolId = signal<string | null>(this.initialSchoolId());

  readonly leaId = this._leaId.asReadonly();
  readonly schoolId = this._schoolId.asReadonly();

  readonly currentLea = computed(() => LEA_DIRECTORY.find((l) => l.id === this._leaId()) ?? null);
  readonly schoolsInLea = computed(() => this.currentLea()?.schools ?? []);
  readonly currentSchool = computed(() => this.schoolsInLea().find((s) => s.id === this._schoolId()) ?? null);

  setLea(id: string): void {
    this._leaId.set(id);
    persist(LEA_STORAGE_KEY, id);
    // A school from the previous LEA can't still apply once the LEA changes.
    if (this._schoolId() && !this.schoolsInLea().some((s) => s.id === this._schoolId())) {
      this.setSchool(null);
    }
  }

  setSchool(id: string | null): void {
    this._schoolId.set(id);
    persist(SCHOOL_STORAGE_KEY, id);
  }

  private initialLeaId(): string {
    const stored = loadStored(LEA_STORAGE_KEY);
    if (stored && LEA_DIRECTORY.some((l) => l.id === stored)) return stored;
    return LEA_DIRECTORY.some((l) => l.id === DEFAULT_LEA_ID) ? DEFAULT_LEA_ID : LEA_DIRECTORY[0].id;
  }

  private initialSchoolId(): string | null {
    const stored = loadStored(SCHOOL_STORAGE_KEY);
    const lea = LEA_DIRECTORY.find((l) => l.id === this._leaId());
    return stored && lea?.schools.some((s) => s.id === stored) ? stored : null;
  }
}
