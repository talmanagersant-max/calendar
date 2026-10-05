import { Injectable, computed, inject } from '@angular/core';
import { CurrentRoleService } from './current-role.service';
import { SchoolYearService } from './school-year.service';

@Injectable({ providedIn: 'root' })
export class CalendarPermissionsService {
  private readonly roleService = inject(CurrentRoleService);
  private readonly yearService = inject(SchoolYearService);

  // A historical year is finished and read-only regardless of role; within a
  // current/future year, only roles that plausibly own a calendar can create one.
  readonly canCreateCalendars = computed(() => !this.yearService.isHistorical() && this.roleService.canCreateCalendars());
}
