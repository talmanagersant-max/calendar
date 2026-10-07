import { Injectable, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';

export interface IConfirmOptions {
  header: string;
  message: string;
  acceptLabel?: string;
  rejectLabel?: string;
  /** Destructive action - renders the accept button in the danger tone. */
  danger?: boolean;
  accept: () => void;
  reject?: () => void;
}

/**
 * "Are you sure?" dialogs, backed by ng-zorro's NzModalService.confirm. Styling comes from the
 * `.app-confirm` rules in styles.css (Tailwind tokens), not ng-zorro's theme.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NzModalService);

  confirm({ header, message, acceptLabel = 'Yes', rejectLabel = 'Cancel', danger = false, accept, reject }: IConfirmOptions): void {
    this.modal.confirm({
      nzTitle: header,
      nzContent: message,
      nzOkText: acceptLabel,
      nzCancelText: rejectLabel,
      nzOkDanger: danger,
      nzIconType: 'exclamation-circle',
      nzClassName: danger ? 'app-confirm app-confirm-danger' : 'app-confirm',
      nzCentered: true,
      nzClosable: false,
      nzOnOk: () => accept(),
      nzOnCancel: () => reject?.()
    });
  }
}
