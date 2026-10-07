import { Injectable, computed, inject, signal } from '@angular/core';
import { INotificationFeedItem, NotificationCategory } from '@osse/shared/data-access';
import { ShellDataService } from './shell-data.service';

let nextId = 1;

/**
 * Notification feed for the current shell scope: a few items derived from the scope's own data
 * (deadline, latest approval, open violation, routing conflict) plus anything raised by user
 * actions in this session, which are tagged with the LEA / year they happened in.
 */
@Injectable({ providedIn: 'root' })
export class NotificationFeedService {
  private readonly shell = inject(ShellDataService);

  private readonly _added = signal<INotificationFeedItem[]>([]);
  private readonly _readIds = signal<Set<string>>(new Set());

  private readonly scopedItems = computed<INotificationFeedItem[]>(() => {
    const lea = this.shell.lea();
    if (!lea) return [];
    const yearId = this.shell.yearId();
    const prefix = `nf-${lea.id}-${this.shell.school()?.id ?? 'all'}-${yearId}`;
    const items: INotificationFeedItem[] = [];
    const counts = this.shell.counts();
    const scope = this.shell.scopeLabel();
    const status = this.shell.yearStatus();

    if (counts.missing > 0 && status !== 'historical') {
      items.push({
        id: `${prefix}-deadline`,
        icon: 'fa-clock',
        iconTone: 'bg-amber-100 text-amber-700',
        title: `${this.shell.year().label} calendar deadline: ${this.shell.dueDate()}`,
        description: `${counts.missing} site(s) in ${scope} have not submitted a ${this.shell.year().label} calendar yet.`,
        category: 'Deadline',
        highPriority: true,
        time: '2 hours ago',
        read: false
      });
    }
    const approved = this.shell.siteCalendars().find((c) => c.status === 'Approved');
    if (approved) {
      items.push({
        id: `${prefix}-approved`,
        icon: 'fa-check',
        iconTone: 'bg-emerald-100 text-emerald-700',
        title: `Calendar Approved: ${approved.schoolName}`,
        description: `${approved.id} (${approved.type}) was approved by J. Torres.`,
        category: 'Approval',
        highPriority: false,
        time: '5 hours ago',
        read: false
      });
    }
    const violation = this.shell.complianceViolations().find((v) => v.status === 'Open');
    if (violation) {
      items.push({
        id: `${prefix}-violation`,
        icon: 'fa-triangle-exclamation',
        iconTone: 'bg-red-100 text-red-700',
        title: `Compliance Violation: ${violation.school}`,
        description: violation.issue,
        category: 'Compliance',
        highPriority: true,
        time: 'Yesterday',
        read: false
      });
    }
    const conflict = this.shell.routingConflicts().find((c) => c.status !== 'Resolved');
    if (conflict) {
      items.push({
        id: `${prefix}-dot`,
        icon: 'fa-bus',
        iconTone: 'bg-o-accent-100 text-o-accent-700',
        title: 'DOT Routing Conflict Detected',
        description: `${conflict.school}: ${conflict.issue}.`,
        category: 'DOT Routing',
        highPriority: conflict.severity === 'High',
        time: 'Yesterday',
        read: true
      });
    }
    if (status !== 'historical' && this.shell.yearKind() === 'SY') {
      items.push({
        id: `${prefix}-waiver-window`,
        icon: 'fa-clock',
        iconTone: 'bg-amber-100 text-amber-700',
        title: `Waiver Submission Window Opens Nov 1, ${this.shell.cycleStart()}`,
        description: 'Prepare documentation for any make-up day or reduced-time waivers.',
        category: 'Deadline',
        highPriority: false,
        time: '2 days ago',
        read: true
      });
    }
    return items;
  });

  readonly items = computed<INotificationFeedItem[]>(() => {
    const leaId = this.shell.lea()?.id;
    const yearId = this.shell.yearId();
    const read = this._readIds();
    const added = this._added().filter((item) => item.leaId === leaId && item.yearId === yearId);
    return [...added, ...this.scopedItems()].map((item) => ({ ...item, read: item.read || read.has(item.id) }));
  });
  readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);

  add(params: { title: string; description: string; category: NotificationCategory; highPriority?: boolean; icon?: string; iconTone?: string }): void {
    const item: INotificationFeedItem = {
      id: `notif-${nextId++}`,
      leaId: this.shell.lea()?.id,
      yearId: this.shell.yearId(),
      icon: params.icon ?? 'fa-solid fa-circle-info',
      iconTone: params.iconTone ?? 'text-o-accent-600 bg-o-accent-50',
      title: params.title,
      description: params.description,
      category: params.category,
      highPriority: params.highPriority ?? false,
      time: 'Just now',
      read: false
    };
    this._added.update((list) => [item, ...list]);
  }

  markAllRead(): void {
    this._readIds.update((set) => {
      const next = new Set(set);
      this.items().forEach((item) => next.add(item.id));
      return next;
    });
  }

  dismiss(id: string): void {
    this._readIds.update((set) => new Set(set).add(id));
  }
}
