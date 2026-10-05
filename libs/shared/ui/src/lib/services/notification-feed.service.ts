import { Injectable, inject, signal } from '@angular/core';
import { INotificationFeedItem, NotificationCategory, SampleDataRepository } from '@osse/shared/data-access';

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class NotificationFeedService {
  private readonly repo = inject(SampleDataRepository);

  private readonly _items = signal<INotificationFeedItem[]>(this.repo.notificationFeed);
  readonly items = this._items.asReadonly();

  readonly unreadCount = signal(0);

  constructor() {
    this.unreadCount.set(this._items().filter((item) => !item.read).length);
  }

  add(params: { title: string; description: string; category: NotificationCategory; highPriority?: boolean; icon?: string; iconTone?: string }): void {
    const item: INotificationFeedItem = {
      id: `notif-${nextId++}`,
      icon: params.icon ?? 'fa-solid fa-circle-info',
      iconTone: params.iconTone ?? 'text-o-accent-600 bg-o-accent-50',
      title: params.title,
      description: params.description,
      category: params.category,
      highPriority: params.highPriority ?? false,
      time: 'Just now',
      read: false
    };
    this._items.update((list) => [item, ...list]);
  }

  markAllRead(): void {
    this._items.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  dismiss(id: string): void {
    this._items.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }
}
