import { Injectable, computed, inject, signal } from '@angular/core';
import { IWaiver, generateWaivers } from '@osse/shared/data-access';
import { ShellDataService } from './shell-data.service';

function todayShort(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

let nextId = 1;

/** Waivers across all LEAs/years; `waivers` is scoped to the top-nav LEA / School / School Year. */
@Injectable({ providedIn: 'root' })
export class WaiverService {
  private readonly shell = inject(ShellDataService);

  private readonly _all = signal<IWaiver[]>(generateWaivers(this.shell.allCalendars()));

  readonly waivers = computed(() => {
    const leaId = this.shell.lea()?.id;
    const schoolId = this.shell.school()?.id;
    const yearId = this.shell.yearId();
    return this._all().filter((w) => w.leaId === leaId && w.yearId === yearId && (!schoolId || w.schoolId === schoolId));
  });

  submit(params: { school: string; schoolId: string | null; type: string }): IWaiver {
    const waiver: IWaiver = {
      id: `WV-${this.shell.cycleStart()}-N${String(nextId++).padStart(3, '0')}`,
      school: params.school,
      lea: this.shell.lea()?.name ?? '',
      leaId: this.shell.lea()?.id,
      schoolId: params.schoolId,
      yearId: this.shell.yearId(),
      type: params.type,
      submitted: todayShort(),
      reviewer: 'Unassigned',
      status: 'Pending',
      resolved: null
    };
    this._all.update((list) => [waiver, ...list]);
    return waiver;
  }

  setStatus(id: string, status: IWaiver['status'], reviewer?: string): void {
    this._all.update((list) =>
      list.map((w) => (w.id === id ? { ...w, status, reviewer: reviewer ?? w.reviewer, resolved: status === 'Pending' || status === 'Under Review' ? null : todayShort() } : w))
    );
  }
}
