import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CheckCircleOutline, CloseCircleOutline, CloseOutline, ExclamationCircleOutline, InfoCircleOutline, LoadingOutline } from '@ant-design/icons-angular/icons';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';

// Only the icons ng-zorro renders internally (toast types, confirm dialog, close, button loading),
// registered statically so nothing is fetched at runtime. NzModalModule supplies NzModalService
// (used by ConfirmService), which ng-zorro doesn't provide in root.
const NZ_ICONS = [CheckCircleOutline, CloseCircleOutline, CloseOutline, ExclamationCircleOutline, InfoCircleOutline, LoadingOutline];

bootstrapApplication(AppComponent, {
  providers: [provideRouter(appRoutes), provideAnimationsAsync(), importProvidersFrom(NzIconModule.forRoot(NZ_ICONS), NzModalModule)]
}).catch((err) => console.error(err));
