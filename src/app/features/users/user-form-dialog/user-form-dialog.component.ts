import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { catchError, map, Observable, of, take } from 'rxjs';
import { Department, InviteUserRequest, User } from '../../../core/models/user.model';
import { Role } from '../../../core/models/role.model';
import { UserManagementService } from '../../../core/services/user-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type UserFormMode = 'invite' | 'edit';

@Component({
  selector: 'app-user-form-dialog',
  imports: [ReactiveFormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserManagementService);
  private readonly toast = inject(ToastService);

  readonly isOpen = model(false);
  readonly mode = input<UserFormMode>('invite');
  readonly user = input<User | null>(null);
  readonly roles = input<readonly Role[]>([]);
  readonly saved = output<User>();

  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly isEdit = computed(() => this.mode() === 'edit');
  protected readonly departments: readonly Department[] = [
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Customer Success',
    'Finance',
    'People & Culture',
  ];

  protected readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [this.requiredText(2)]],
    lastName: ['', [this.requiredText(2)]],
    email: ['', [this.requiredText(3)], [this.emailAvailabilityValidator()]],
    roleId: ['', [this.requiredText(1)]],
    department: this.formBuilder.nonNullable.control<Department>('Engineering', [
      this.requiredText(1),
    ]),
    jobTitle: ['', [this.requiredText(2)]],
    phone: [''],
    location: [''],
    message: [''],
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }
      const current = this.user();
      if (this.mode() === 'edit' && current) {
        this.form.reset({
          firstName: current.firstName,
          lastName: current.lastName,
          email: current.email,
          roleId: current.roleId,
          department: current.department,
          jobTitle: current.jobTitle,
          phone: current.phone,
          location: current.location,
          message: '',
        });
      } else {
        const defaultRole =
          this.roles().find((role) => role.name === 'Member')?.id ?? this.roles()[0]?.id ?? '';
        this.form.reset({
          firstName: '',
          lastName: '',
          email: '',
          roleId: defaultRole,
          department: 'Engineering',
          jobTitle: '',
          phone: '',
          location: '',
          message: '',
        });
      }
      this.submitted.set(false);
      this.serverError.set(null);
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && !this.saving()) {
      this.close();
    }
  }

  close(): void {
    if (!this.saving()) {
      this.isOpen.set(false);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  submit(): void {
    this.submitted.set(true);
    this.serverError.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending || this.saving()) {
      return;
    }

    this.saving.set(true);
    const values = this.form.getRawValue();

    if (this.mode() === 'invite') {
      const request: InviteUserRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        roleId: values.roleId,
        department: values.department,
        jobTitle: values.jobTitle,
        message: values.message,
      };
      this.userService.inviteUser(request).subscribe({
        next: (user) => this.handleSuccess(user, `${user.firstName} has been invited to Nexora.`),
        error: (error: unknown) => this.handleError(error),
      });
      return;
    }

    const current = this.user();
    if (!current) {
      this.saving.set(false);
      this.serverError.set('This member could not be loaded. Close the dialog and try again.');
      return;
    }

    this.userService
      .updateUser(current.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        roleId: values.roleId,
        department: values.department,
        jobTitle: values.jobTitle,
        phone: values.phone,
        location: values.location,
      })
      .subscribe({
        next: (user) => this.handleSuccess(user, `${user.firstName}'s profile has been updated.`),
        error: (error: unknown) => this.handleError(error),
      });
  }

  hasError(controlName: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[controlName];
    return (
      control.hasError(error) &&
      (control.touched || control.dirty || this.submitted()) &&
      control.invalid
    );
  }

  private handleSuccess(user: User, message: string): void {
    this.saving.set(false);
    this.isOpen.set(false);
    this.toast.show(this.isEdit() ? 'Member updated' : 'Invitation sent', message);
    this.saved.emit(user);
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.serverError.set(
      error instanceof Error
        ? error.message
        : `The member could not be ${this.isEdit() ? 'updated' : 'invited'}. Please try again.`,
    );
  }

  private requiredText(minLength: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = typeof control.value === 'string' ? control.value.trim() : '';
      if (!value) return { required: true };
      if (value.length < minLength) return { minlength: true };
      return null;
    };
  }

  private emailAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const value = typeof control.value === 'string' ? control.value.trim() : '';
      if (!value || control.hasError('email')) {
        return of(null);
      }
      return this.userService.isEmailAvailable(value, this.user()?.id).pipe(
        map((available) => (available ? null : { emailTaken: true })),
        catchError(() => of(null)),
        take(1),
      );
    };
  }
}
