import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  model,
  output,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-dialog',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <section
          class="dialog confirm-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          <div class="dialog__body confirm-dialog__body">
            <div
              class="confirm-dialog__icon"
              [class.confirm-dialog__icon--danger]="destructive()"
              [class.confirm-dialog__icon--warning]="tone() === 'warning'"
            >
              <app-icon [name]="icon()" [size]="23" />
            </div>
            <h2 [id]="titleId">{{ title() }}</h2>
            <p>{{ message() }}</p>
          </div>
          <footer class="dialog__footer">
            <button
              type="button"
              class="button button--secondary"
              [disabled]="loading()"
              (click)="cancel()"
            >
              {{ cancelLabel() }}
            </button>
            <button
              type="button"
              class="button"
              [class.button--danger]="destructive()"
              [class.button--primary]="!destructive()"
              [disabled]="loading()"
              (click)="confirmed.emit()"
            >
              @if (loading()) {
                <span class="spinner spinner--small"></span>
              }
              {{ confirmLabel() }}
            </button>
          </footer>
        </section>
      </div>
    }
  `,
  styles: `
    .confirm-dialog {
      width: min(452px, calc(100vw - 32px));
    }

    .confirm-dialog__body {
      padding: 26px 26px 22px;
    }

    .confirm-dialog__icon {
      width: 46px;
      height: 46px;
      display: grid;
      place-items: center;
      margin-bottom: 18px;
      border-radius: 14px;
      color: #5a52a7;
      background: #f0efff;
    }

    .confirm-dialog__icon--warning {
      color: #a66a12;
      background: #fff6df;
    }

    .confirm-dialog__icon--danger {
      color: #a44747;
      background: #fff0ef;
    }

    h2 {
      margin: 0;
      color: var(--text-strong);
      font-size: 19px;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }

    p {
      margin: 8px 0 0;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.65;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly isOpen = model(false);
  readonly title = input('Confirm action');
  readonly message = input('');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly destructive = input(false);
  readonly tone = input<'default' | 'warning'>('default');
  readonly icon = input('alert');
  readonly loading = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  protected readonly titleId = `confirm-dialog-title-${Math.random().toString(36).slice(2)}`;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && !this.loading()) {
      this.cancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.loading()) {
      this.cancel();
    }
  }

  cancel(): void {
    this.isOpen.set(false);
    this.cancelled.emit();
  }
}
