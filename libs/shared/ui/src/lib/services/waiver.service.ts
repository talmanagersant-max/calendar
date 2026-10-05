import { Injectable, inject, signal } from '@angular/core';
import { IWaiver, SampleDataRepository } from '@osse/shared/data-access';

function todayShort(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class WaiverService {
  private readonly repo = inject(SampleDataRepository);

  private readonly _waivers = signal<IWaiver[]>(this.repo.waivers);
  readonly waivers = this._waivers.asReadonly();

  submit(params: { school: string; lea: string; type: string }): IWaiver {
    const waiver: IWaiver = {
      id: `WV-${new Date().getFullYear()}-${String(nextId++).padStart(3, '0')}`,
      school: params.school,
      lea: params.lea,
      type: params.type,
      submitted: todayShort(),
      reviewer: 'Unassigned',
      status: 'Pending',
      resolved: null
    };
    this._waivers.update((list) => [waiver, ...list]);
    return waiver;
  }

  setStatus(id: string, status: IWaiver['status'], reviewer?: string): void {
    this._waivers.update((list) => list.map((w) => (w.id === id ? { ...w, status, reviewer: reviewer ?? w.reviewer, resolved: status === 'Pending' || status === 'Under Review' ? null : todayShort() } : w)));
  }
}
