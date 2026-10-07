import { Injectable } from '@angular/core';
import { IBellSchedule } from '../interfaces/operations.interface';

/**
 * Static reference data shared by every scope. Everything scoped to an LEA / School / School Year
 * (calendars, approvals, compliance, routing, ...) is generated in shell-seed.ts and served by
 * ShellDataService instead.
 */
@Injectable({ providedIn: 'root' })
export class SampleDataRepository {
  readonly bellSchedules: IBellSchedule[] = [
    { id: 'BS-001', name: 'Standard ES', level: 'Elementary', start: '7:45 AM', end: '3:15 PM', totalMinutes: 390, instrMinutes: 345, schoolsUsing: 42 },
    { id: 'BS-002', name: 'Standard MS', level: 'Middle School', start: '8:20 AM', end: '3:20 PM', totalMinutes: 360, instrMinutes: 315, schoolsUsing: 28 },
    { id: 'BS-003', name: 'Standard HS', level: 'High School', start: '8:45 AM', end: '3:45 PM', totalMinutes: 360, instrMinutes: 330, schoolsUsing: 31 },
    { id: 'BS-004', name: 'Extended Day', level: 'All', start: '7:30 AM', end: '4:30 PM', totalMinutes: 480, instrMinutes: 430, schoolsUsing: 15 },
    { id: 'BS-005', name: 'Early Dismissal Variant', level: 'All', start: '7:45 AM', end: '1:00 PM', totalMinutes: 195, instrMinutes: 165, schoolsUsing: 8 }
  ];
}
