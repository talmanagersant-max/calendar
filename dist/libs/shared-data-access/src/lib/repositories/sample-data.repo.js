var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@angular/core';
let SampleDataRepository = class SampleDataRepository {
    constructor() {
        this.metrics = [
            { label: 'Active calendars', value: '148', change: '+12.4%', tone: 'positive' },
            { label: 'Open approvals', value: '27', change: '+5', tone: 'warning' },
            { label: 'School compliance', value: '96.1%', change: '+2.1%', tone: 'positive' },
            { label: 'Pending waivers', value: '11', change: '-3', tone: 'neutral' }
        ];
        this.notifications = [
            { id: 'n1', title: 'Bell schedule review', description: 'Cedar Grove requires a bell schedule update for the 2026 term.', type: 'warning', createdAt: '2h ago', read: false },
            { id: 'n2', title: 'Compliance report ready', description: 'Annual compliance dashboard was refreshed and published.', type: 'info', createdAt: '5h ago', read: true },
            { id: 'n3', title: 'Holiday closure approved', description: 'Amherst district holiday closure has received approval.', type: 'success', createdAt: '1d ago', read: true },
            { id: 'n4', title: 'DOT routing issue', description: 'Three route assignments need review before dispatch.', type: 'urgent', createdAt: '1d ago', read: false }
        ];
        this.leaList = [
            { id: 'lea-1001', name: 'North Valley LEA', region: 'North', contact: 'Alicia Gomez', email: 'alicia.gomez@northvalley.org', status: 'Active' },
            { id: 'lea-1002', name: 'Harbor District', region: 'Coastal', contact: 'Marcus Bell', email: 'marcus.bell@harbordistrict.org', status: 'Review' },
            { id: 'lea-1003', name: 'Summit Academy', region: 'Central', contact: 'Diane Foster', email: 'diane.foster@summitacademy.org', status: 'Pending' }
        ];
        this.schoolList = [
            { id: 'sch-2001', name: 'Cedar Grove HS', leaId: 'lea-1001', gradeBand: '9-12', studentCount: 1420, city: 'Riverview', status: 'Open' },
            { id: 'sch-2002', name: 'Oak Street Academy', leaId: 'lea-1001', gradeBand: 'K-8', studentCount: 830, city: 'Northfield', status: 'Operational' },
            { id: 'sch-2003', name: 'Willow Lake ES', leaId: 'lea-1002', gradeBand: 'PK-5', studentCount: 610, city: 'Harbor', status: 'Review' }
        ];
        this.calendars = [
            { id: 'cal-4001', name: '2026-2027 Standard Calendar', schoolName: 'Cedar Grove HS', cycle: 'A/B Rotation', status: 'Approved', lastUpdated: '2026-09-08' },
            { id: 'cal-4002', name: '2026-2027 ESY Calendar', schoolName: 'Oak Street Academy', cycle: '4-Week ESY', status: 'Draft', lastUpdated: '2026-09-09' },
            { id: 'cal-4003', name: 'Winter Break Overlay', schoolName: 'Willow Lake ES', cycle: 'Holiday', status: 'Needs Review', lastUpdated: '2026-09-12' }
        ];
        this.calendarDetails = {
            'cal-4001': {
                id: 'cal-4001',
                name: '2026-2027 Standard Calendar',
                cycle: 'A/B Rotation',
                totalDays: 180,
                days: [
                    { day: 1, label: 'Aug 12', status: 'instruction' },
                    { day: 2, label: 'Aug 13', status: 'instruction' },
                    { day: 3, label: 'Aug 14', status: 'pd' },
                    { day: 4, label: 'Aug 15', status: 'dismissal' },
                    { day: 5, label: 'Aug 16', status: 'instruction' },
                    { day: 6, label: 'Aug 17', status: 'holiday' },
                    { day: 7, label: 'Aug 18', status: 'esy' }
                ],
                staffNotes: 'Professional development and campus closure windows aligned to site staffing.'
            }
        };
        this.complianceItems = [
            { id: 'cmp-1', title: 'Annual risk review', owner: 'Compliance Office', dueDate: '2026-09-20', status: 'On Track' },
            { id: 'cmp-2', title: 'TRI training deadline', owner: 'Operations', dueDate: '2026-09-18', status: 'At Risk' },
            { id: 'cmp-3', title: 'Renewal packet review', owner: 'School Leadership', dueDate: '2026-09-16', status: 'Past Due' }
        ];
        this.notificationsFeed = [
            { id: 'n-1', title: 'Calendar sync warning', body: 'The last sync created a duplicate Bell schedule entry.', priority: 'High', receivedAt: '2026-09-15T08:00:00', category: 'Calendar' },
            { id: 'n-2', title: 'Waiver status update', body: 'M. Lewis waiver was resubmitted and sent to review.', priority: 'Medium', receivedAt: '2026-09-14T13:30:00', category: 'Approval' },
            { id: 'n-3', title: 'Compliance follow-up', body: 'Five schools require signed attendance checklists.', priority: 'Low', receivedAt: '2026-09-13T18:20:00', category: 'Compliance' }
        ];
    }
};
SampleDataRepository = __decorate([
    Injectable({ providedIn: 'root' })
], SampleDataRepository);
export { SampleDataRepository };
//# sourceMappingURL=sample-data.repo.js.map