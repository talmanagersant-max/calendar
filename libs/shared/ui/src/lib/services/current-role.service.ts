import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'osse-current-role';
const DEFAULT_ROLE = 'OSSE Administrator';

// The 25-role LEA Role vocabulary from the OSSE LEA Requirements Calendar,
// plus the app's own default board-level persona.
export const LEA_ROLES: string[] = [
  DEFAULT_ROLE,
  'ACCESS for ELLs 2.0 Coordinator',
  'ADT Technical Manager',
  'Assessment POC',
  'Attendance POC',
  'CFSA POC',
  'Chief Financial Officer',
  'Early Childhood Transition Coordinator',
  'ELL/LEP Coordinator',
  'Faculty and Staff POC',
  'Head of School',
  'Health POC',
  'Homeless Liaison',
  'LEA Approver',
  'LEA Assessment Manager',
  'LEA Data Manager',
  'LEA Enrollment Audit Point of Contact',
  'LEA Finance/Grants Manager',
  'MSAA Coordinator',
  'Pre-K Special Ed POC',
  'Principal',
  'School Approver',
  'School Enrollment Audit POC',
  'School Garden Coordinator',
  'Special Education POC',
  'Transportation Manager'
];

// Roles that plausibly own/submit a school calendar. Everyone else in the LEA Role
// vocabulary (POCs, coordinators, managers of a specific program) gets read-only access
// to whatever calendars their parent organization has already created.
const CALENDAR_CREATOR_ROLES = new Set<string>([
  DEFAULT_ROLE,
  'Head of School',
  'Principal',
  'LEA Approver',
  'LEA Data Manager',
  'School Approver'
]);

function loadStoredRole(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && LEA_ROLES.includes(stored) ? stored : DEFAULT_ROLE;
  } catch {
    return DEFAULT_ROLE;
  }
}

@Injectable({ providedIn: 'root' })
export class CurrentRoleService {
  readonly roles = LEA_ROLES;

  private readonly _role = signal<string>(loadStoredRole());
  readonly role = this._role.asReadonly();
  readonly canCreateCalendars = computed(() => CALENDAR_CREATOR_ROLES.has(this._role()));

  setRole(role: string): void {
    this._role.set(role);
    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch {
      // Persistence is a nice-to-have; the switcher still works within the session if storage is blocked.
    }
  }
}
