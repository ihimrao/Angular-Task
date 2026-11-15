import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-stack',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.messages(); track toast.id) {
        <article class="toast" [class]="'toast toast--' + toast.tone">
          <div class="toast__icon">
            <app-icon
              [name]="
                toast.tone === 'success' ? 'check' : toast.tone === 'error' ? 'alert' : 'info'
              "
              [size]="17"
            />
          </div>
          <div class="toast__content">
            <strong>{{ toast.title }}</strong>
            @if (toast.message) {
              <p>{{ toast.message }}</p>
            }
          </div>
          <button
            type="button"
            class="icon-button icon-button--small"
            aria-label="Dismiss notification"
            (click)="toastService.dismiss(toast.id)"
          >
            <app-icon name="x" [size]="16" />
          </button>
        </article>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      z-index: 1100;
      right: 24px;
      bottom: 24px;
      display: grid;
      gap: 10px;
      width: min(390px, calc(100vw - 32px));
      pointer-events: none;
    }

    .toast {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 15px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.98);
      box-shadow: 0 16px 40px rgba(25, 33, 50, 0.16);
      animation: toast-in 240ms ease-out;
      pointer-events: auto;
    }

    .toast__icon {
      width: 30px;
      height: 30px;
      display: grid;
      place-items: center;
      border-radius: 9px;
    }

    .toast--success .toast__icon {
      color: #15755b;
      background: #e9f7f2;
    }

    .toast--error .toast__icon {
      color: #a44747;
      background: #fff0ef;
    }

    .toast--info .toast__icon {
      color: #4e54aa;
      background: #efefff;
    }

    .toast__content {
      min-width: 0;
      flex: 1;
      padding-top: 3px;
    }

    .toast__content strong {
      display: block;
      color: var(--text-strong);
      font-size: 13px;
      line-height: 1.35;
    }

    .toast__content p {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.5;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px) scale(0.98);
      }
    }

    @media (max-width: 600px) {
      .toast-stack {
        right: 16px;
        bottom: 16px;
      }
    }
  `,
})
export class ToastStackComponent {
  readonly toastService = inject(ToastService);
}
