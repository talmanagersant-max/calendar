import { Injectable, computed, inject, signal } from '@angular/core';
import { SampleDataRepository } from '@osse/shared/data-access';

const LEA_STORAGE_KEY = 'osse-current-context-lea';
const SITE_STORAGE_KEY = 'osse-current-context-site';

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
 * The active LEA/Site context, set from the top-nav context switcher. Pages that list or filter
 * calendar data read this to scope themselves to the selection, the same way they already read
 * SchoolYearService for the active school year - this is not just a display label.
 */
@Injectable({ providedIn: 'root' })
export class CurrentContextService {
  private readonly repo = inject(SampleDataRepository);

  private readonly _leaId = signal<string | null>(loadStored(LEA_STORAGE_KEY) ?? this.repo.leaList[0]?.id ?? null);
  // null siteId means "All Sites" within the selected LEA.
  private readonly _siteId = signal<string | null>(loadStored(SITE_STORAGE_KEY));

  readonly leaId = this._leaId.asReadonly();
  readonly siteId = this._siteId.asReadonly();

  readonly currentLea = computed(() => this.repo.leaList.find((l) => l.id === this._leaId()) ?? null);
  readonly currentSite = computed(() => this.repo.schoolList.find((s) => s.id === this._siteId()) ?? null);
  readonly sitesInLea = computed(() => this.repo.schoolList.filter((s) => s.leaId === this._leaId()));

  setLea(id: string): void {
    this._leaId.set(id);
    persist(LEA_STORAGE_KEY, id);
    // A site from the previous LEA can't still apply once the LEA changes.
    if (this._siteId() && !this.sitesInLea().some((s) => s.id === this._siteId())) {
      this.setSite(null);
    }
  }

  setSite(id: string | null): void {
    this._siteId.set(id);
    persist(SITE_STORAGE_KEY, id);
  }
}
