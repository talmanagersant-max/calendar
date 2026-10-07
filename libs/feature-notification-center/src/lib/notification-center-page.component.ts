import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NotificationCategory } from '@osse/shared/data-access';
import { NotificationFeedService, ShellDataService } from '@osse/shared/ui';

type ShowFilter = 'all' | 'unread';

@Component({
  selector: 'osse-notification-center-page',
  standalone: true,
  imports: [NzButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-slate-900">Notification Center</h1>
          <p class="mt-1 text-sm text-slate-500">{{ shell.scopeLabel() }} · {{ shell.year().label }}</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="markAllRead()">Mark All Read</button>
          <button nz-button nzType="default" class="btn-secondary" type="button" (click)="notify('Settings would open here')">Settings</button>
        </div>
      </div>

      @if (unreadCount() > 0) {
        <div class="flex items-center justify-between rounded-lg border border-o-accent-200 bg-o-accent-50 px-4 py-2.5 text-sm text-o-accent-800">
          <span class="font-medium">{{ unreadCount() }} unread notifications</span>
          <button nz-button nzType="text" type="button" nzSize="small" (click)="markAllRead()">Mark All Read</button>
        </div>
      }

      <div class="grid gap-4 xl:grid-cols-[220px_1fr]">
        <div class="space-y-4">
          <div>
            <div class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Filter by Type</div>
            <div class="space-y-1">
              <button
                nz-button
                [nzType]="(categoryFilter() !== 'all') ? 'text' : 'primary'"
                type="button"
                [class.btn-secondary]="!(categoryFilter() === 'all')"
                class="!w-full !justify-between"
                (click)="categoryFilter.set('all')"
              >
                <span>All</span>
                <span class="rounded-full px-1.5 text-xs" [class.bg-white]="categoryFilter() === 'all'" [class.text-o-accent-600]="categoryFilter() === 'all'" [class.bg-slate-100]="categoryFilter() !== 'all'">{{
                  feed().length
                }}</span>
              </button>
              @for (cat of categories; track cat) {
                <button
                  nz-button
                  [nzType]="(categoryFilter() !== cat) ? 'text' : 'primary'"
                  type="button"
                  [class.btn-secondary]="!(categoryFilter() === cat)"
                  class="!w-full !justify-between"
                  (click)="categoryFilter.set(cat)"
                >
                  <span>{{ cat }}</span>
                  <span class="rounded-full px-1.5 text-xs" [class.bg-white]="categoryFilter() === cat" [class.text-o-accent-600]="categoryFilter() === cat" [class.bg-slate-100]="categoryFilter() !== cat">{{
                    countFor(cat)
                  }}</span>
                </button>
              }
            </div>
          </div>

          <div>
            <div class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Show</div>
            <div class="space-y-1">
              <button
                nz-button
                [nzType]="(showFilter() !== 'all') ? 'text' : 'primary'"
                type="button"
                [class.btn-secondary]="!(showFilter() === 'all')"
                class="!w-full !justify-start"
                (click)="showFilter.set('all')"
              >All</button>
              <button
                nz-button
                [nzType]="(showFilter() !== 'unread') ? 'text' : 'primary'"
                type="button"
                [class.btn-secondary]="!(showFilter() === 'unread')"
                class="!w-full !justify-start"
                (click)="showFilter.set('unread')"
              >Unread Only</button>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          @for (item of filteredFeed(); track item.id) {
            <div class="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4" [class.border-l-4]="!item.read" [class.border-l-o-accent-500]="!item.read">
              <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" [class]="item.iconTone">
                  <i class="fa-solid" [class]="item.icon"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-semibold text-slate-900">{{ item.title }}</h3>
                    @if (!item.read) {
                      <span class="h-1.5 w-1.5 rounded-full bg-o-accent-500"></span>
                    }
                  </div>
                  <p class="mt-1 text-sm text-slate-600">{{ item.description }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{{ item.category }}</span>
                    @if (item.highPriority) {
                      <span class="inline-flex items-center rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-700">High Priority</span>
                    }
                    <span class="font-mono text-[11px] text-slate-400">{{ item.time }}</span>
                  </div>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button nz-button nzType="default" class="btn-secondary" type="button" nzSize="small" (click)="notify('Opening ' + item.title)">View →</button>
                @if (!item.read) {
                  <button nz-button nzType="text" class="btn-secondary" type="button" nzSize="small" (click)="dismiss(item.id)">Dismiss</button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class NotificationCenterPageComponent {
  readonly shell = inject(ShellDataService);
  private readonly feedService = inject(NotificationFeedService);
  readonly feed = this.feedService.items;

  readonly categories: NotificationCategory[] = ['Deadline', 'Approval', 'Compliance', 'DOT Routing'];
  readonly categoryFilter = signal<'all' | NotificationCategory>('all');
  readonly showFilter = signal<ShowFilter>('all');

  readonly unreadCount = computed(() => this.feed().filter((n) => !n.read).length);

  readonly filteredFeed = computed(() => {
    return this.feed().filter((item) => {
      if (this.categoryFilter() !== 'all' && item.category !== this.categoryFilter()) return false;
      if (this.showFilter() === 'unread' && item.read) return false;
      return true;
    });
  });

  countFor(category: NotificationCategory): number {
    return this.feed().filter((n) => n.category === category).length;
  }

  dismiss(id: string): void {
    this.feedService.dismiss(id);
  }

  markAllRead(): void {
    this.feedService.markAllRead();
  }

  notify(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
