import {
  ChangeDetectionStrategy,
  Component,
  effect,
  HostListener,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role } from '../../../core/models/role.model';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-role-form-dialog',
  imports: [ReactiveFormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <section
          class="dialog role-create-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-role-title"
          (click)="$event.stopPropagation()"
        >
          <header class="dialog__header">
            <div class="role-create-dialog__icon">
              <app-icon name="shield-plus" [size]="22" />
            </div>
            <div>
              <span class="eyebrow">Custom access</span>
              <h2 id="create-role-title">Create a new role</h2>
              <p>Start with a clear scope, then configure permissions in detail.</p>
            </div>
            <button type="button" class="icon-button" aria-label="Close dialog" (click)="close()">
              <app-icon name="x" [size]="18" />
            </button>
          </header>
          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="dialog__body">
              <label class="field">
                <span class="field__label">Role name</span>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="e.g. Support lead"
                  maxlength="40"
                  autofocus
                  [class.field__input--error]="nameInvalid()"
                />
                @if (nameInvalid()) {
                  <span class="field__error">
                    @if (form.controls.name.hasError('required')) {
                      Role name is required.
                    } @else {
                      Use at least 2 characters.
                    }
                  </span>
                }
              </label>
              <label class="field">
                <span class="field__label"
                  >Description <span class="field__optional">Optional</span></span
                >
                <textarea
                  rows="3"
                  formControlName="description"
                  maxlength="180"
                  placeholder="Describe who this role is for and what they can do."
                ></textarea>
                <span class="field__hint field__hint--right"
                  >{{ form.controls.description.value.length }}/180</span
                >
              </label>
              <div class="role-create-dialog__preview">
                <span class="role-create-dialog__preview-icon"
                  ><app-icon name="shield" [size]="19"
                /></span>
                <div>
                  <strong>{{ form.controls.name.value || 'Your new role' }}</strong>
                  <p>No permissions selected yet · You can adjust access after creation.</p>
                </div>
              </div>
              @if (serverError()) {
                <div class="inline-alert inline-alert--error" role="alert">
                  <app-icon name="alert" [size]="18" />
                  <span>{{ serverError() }}</span>
                </div>
              }
            </div>
            <footer class="dialog__footer">
              <button
                type="button"
                class="button button--secondary"
                [disabled]="saving()"
                (click)="close()"
              >
                Cancel
              </button>
              <button type="submit" class="button button--primary" [disabled]="saving()">
                @if (saving()) {
                  <span class="spinner spinner--small"></span>
                  Creating…
                } @else {
                  Create role
                  <app-icon name="arrow-right" [size]="16" />
                }
              </button>
            </footer>
          </form>
        </section>
      </div>
    }
  `,
  styles: `
    .role-create-dialog {
      width: min(500px, calc(100vw - 32px));
    }

    .dialog__header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 13px;
      align-items: flex-start;
      padding: 23px 24px 19px;
      border-bottom: 1px solid var(--border);
    }

    .dialog__header h2 {
      margin: 3px 0 0;
      font-size: 20px;
      letter-spacing: -0.025em;
    }

    .dialog__header p {
      margin: 5px 0 0;
      color: var(--text-muted);
      font-size: 11px;
      line-height: 1.55;
    }

    .role-create-dialog__icon {
      width: 43px;
      height: 43px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      color: var(--accent-strong);
      background: var(--accent-soft);
    }

    .dialog__body {
      display: grid;
      gap: 15px;
    }

    .role-create-dialog__preview {
      display: flex;
      gap: 11px;
      align-items: center;
      padding: 12px;
      border: 1px dashed #d2cdf0;
      border-radius: 11px;
      background: #faf9ff;
    }

    .role-create-dialog__preview-icon {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      border-radius: 9px;
      color: var(--accent);
      background: #eeebff;
    }

    .role-create-dialog__preview strong {
      display: block;
      color: var(--text-strong);
      font-size: 11px;
    }

    .role-create-dialog__preview p {
      margin: 3px 0 0;
      color: var(--text-faint);
      font-size: 9px;
    }
  `,
})
export class RoleFormDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly roleService = inject(RoleManagementService);
  private readonly toast = inject(ToastService);

  readonly isOpen = model(false);
  readonly created = output<Role>();
  protected readonly submitted = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly saving = this.roleService.saving;
  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    description: ['', [Validators.maxLength(180)]],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.form.reset({ name: '', description: '' });
        this.submitted.set(false);
        this.serverError.set(null);
      }
    });
  }

  protected nameInvalid(): boolean {
    const control = this.form.controls.name;
    return control.invalid && (control.touched || control.dirty || this.submitted());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && !this.saving()) this.close();
  }

  close(): void {
    if (!this.saving()) this.isOpen.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;
    this.serverError.set(null);
    const values = this.form.getRawValue();
    this.roleService
      .createRole({ name: values.name, description: values.description, permissionIds: [] })
      .subscribe({
        next: (role) => {
          this.isOpen.set(false);
          this.toast.show('Role created', `${role.name} is ready to configure.`);
          this.created.emit(role);
        },
        error: (error: unknown) => {
          this.serverError.set(
            error instanceof Error ? error.message : 'The role could not be created.',
          );
        },
      });
  }
}
