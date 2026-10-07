import { Injectable, inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface IToastMessage {
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  /** Milliseconds before auto-dismiss. */
  life?: number;
}

/**
 * App-wide toast notifications, backed by ng-zorro's NzNotificationService. Colors come from
 * the `.app-toast-*` rules in styles.css (Tailwind tokens), not ng-zorro's theme.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly notification = inject(NzNotificationService);

  add({ severity, summary, detail, life }: IToastMessage): void {
    const type = severity === 'warn' ? 'warning' : severity;
    this.notification.create(type, summary, detail ?? '', {
      nzClass: `app-toast app-toast-${type}`,
      nzDuration: life ?? 4500,
      nzPlacement: 'topRight'
    });
  }
}
