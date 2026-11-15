import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, debounceTime, finalize, of, switchMap, tap } from 'rxjs';
import { Role } from '../../../core/models/role.model';
import {
  BulkUserAction,
  Department,
  PaginatedResult,
  User,
  UserListRequest,
  UserSortField,
  UserStatistics,
  UserStatus,
  UserActivity,
} from '../../../core/models/user.model';
import { ToastService } from '../../../core/services/toast.service';
import { UserManagementService } from '../../../core/services/user-management.service';
import { formatRelativeTime } from '../../../core/utils/date.util';
import { AvatarComponent } from '../../../shared/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { UserDetailsDrawerComponent } from '../user-details-drawer/user-details-drawer.component';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

type ConfirmMode = 'status' | 'bulk' | null;

const EMPTY_PAGE: PaginatedResult<User> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 8,
};

@Component({
  selector: 'app-user-management',
  imports: [
    ReactiveFormsModule,
    AvatarComponent,
    ConfirmDialogComponent,
    IconComponent,
    StatusBadgeComponent,
    UserDetailsDrawerComponent,
    UserFormDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserManagementService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly querySubject = new BehaviorSubject<UserListRequest>({
    search: '',
    status: 'all',
    roleId: 'all',
    department: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
    page: 1,
    pageSize: 8,
  });

  protected readonly query = signal<UserListRequest>(this.querySubject.value);
  protected readonly result = signal<PaginatedResult<User>>(EMPTY_PAGE);
  protected readonly statistics = signal<UserStatistics>({
    total: 0,
    active: 0,
    invited: 0,
    suspended: 0,
    activeRate: 0,
  });
  protected readonly roles = signal<readonly Role[]>([]);
  protected readonly loading = signal(true);
  protected readonly statsLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly exporting = signal(false);

  protected readonly formOpen = signal(false);
  protected readonly formMode = signal<'invite' | 'edit'>('invite');
  protected readonly editingUser = signal<User | null>(null);
  protected readonly detailsOpen = signal(false);
  protected readonly detailsUser = signal<User | null>(null);
  protected readonly detailsActivity = signal<readonly UserActivity[]>([]);
  protected readonly detailsLoading = signal(false);
  protected readonly statusUpdating = signal(false);
  protected readonly confirmMode = signal<ConfirmMode>(null);
  protected readonly actionLoading = signal(false);
  protected readonly statusTarget = signal<User | null>(null);
  protected readonly bulkAction = signal<BulkUserAction | null>(null);

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
  protected readonly pageSizes = [8, 16, 24];
  protected readonly formatRelative = formatRelativeTime;

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    search: '',
    status: this.formBuilder.nonNullable.control<UserStatus | 'all'>('all'),
    roleId: 'all',
    department: this.formBuilder.nonNullable.control<Department | 'all'>('all'),
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.result().total / this.result().pageSize)),
  );
  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );
  protected readonly recordStart = computed(() =>
    this.result().total === 0 ? 0 : (this.result().page - 1) * this.result().pageSize + 1,
  );
  protected readonly recordEnd = computed(() =>
    Math.min(this.result().page * this.result().pageSize, this.result().total),
  );
  protected readonly pageAllSelected = computed(() => {
    const selection = this.selectedIds();
    return (
      this.result().items.length > 0 && this.result().items.every((user) => selection.has(user.id))
    );
  });
  protected readonly pageSomeSelected = computed(() => {
    const selection = this.selectedIds();
    return !this.pageAllSelected() && this.result().items.some((user) => selection.has(user.id));
  });
  protected readonly selectionCount = computed(() => this.selectedIds().size);
  protected readonly confirmOpen = computed(() => this.confirmMode() !== null);
  protected readonly confirmConfig = computed(() => {
    const member = this.statusTarget();
    if (this.confirmMode() === 'bulk') {
      const count = this.selectionCount();
      const suspend = this.bulkAction() === 'suspend';
      return {
        title: suspend
          ? `Suspend ${count} selected members?`
          : `Activate ${count} selected members?`,
        message: suspend
          ? 'These members will immediately lose access to Nexora. You can activate them again later.'
          : 'These members will regain access to the organization using their existing sign-in credentials.',
        confirmLabel: suspend ? 'Suspend members' : 'Activate members',
        destructive: suspend,
        icon: suspend ? 'user-minus' : 'user-check',
      };
    }
    const suspend = member?.status !== 'suspended';
    return {
      title: suspend
        ? `Suspend ${member?.firstName ?? 'this member'}?`
        : `Activate ${member?.firstName ?? 'this member'}?`,
      message: suspend
        ? 'Their active sessions will be revoked and they will not be able to sign in until access is restored.'
        : 'They will be able to sign in and access the organization with their existing permissions.',
      confirmLabel: suspend ? 'Suspend access' : 'Activate member',
      destructive: suspend,
      icon: suspend ? 'user-minus' : 'user-check',
    };
  });

  constructor() {
    this.filterForm.controls.search.valueChanges
      .pipe(debounceTime(280), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
        this.updateQuery({ search, page: 1 });
      });

    this.querySubject
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((request) =>
          this.userService.listUsers(request).pipe(
            catchError((error: unknown) => {
              this.error.set(
                this.errorMessage(
                  error,
                  'We couldn’t load the member directory. Please try again.',
                ),
              );
              return of({ ...EMPTY_PAGE, page: request.page, pageSize: request.pageSize });
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.result.set(page);
        this.loading.set(false);
      });

    this.loadRoles();
    this.loadStatistics();
  }

  updateStatus(status: UserStatus | 'all'): void {
    this.filterForm.controls.status.setValue(status);
    this.applyFilters();
  }

  applyFilters(): void {
    const filters = this.filterForm.getRawValue();
    this.updateQuery({
      search: filters.search,
      status: filters.status,
      roleId: filters.roleId,
      department: filters.department,
      page: 1,
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: 'all',
      roleId: 'all',
      department: 'all',
    });
    this.updateQuery({
      search: '',
      status: 'all',
      roleId: 'all',
      department: 'all',
      page: 1,
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.result().page) return;
    this.updateQuery({ page });
  }

  changePageSize(value: string): void {
    const pageSize = Number(value);
    this.updateQuery({ pageSize, page: 1 });
  }

  sortBy(field: UserSortField): void {
    const current = this.query();
    this.updateQuery({
      sortBy: field,
      sortDirection: current.sortBy === field && current.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  }

  ariaSort(field: UserSortField): 'ascending' | 'descending' | 'none' {
    if (this.query().sortBy !== field) return 'none';
    return this.query().sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  toggleUser(id: string, checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  togglePage(checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const user of this.result().items) {
        if (checked) next.add(user.id);
        else next.delete(user.id);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  requestBulkAction(action: BulkUserAction): void {
    if (this.selectionCount() === 0) return;
    this.bulkAction.set(action);
    this.confirmMode.set('bulk');
  }

  confirmAction(): void {
    this.actionLoading.set(true);
    if (this.confirmMode() === 'bulk') {
      const action = this.bulkAction();
      if (!action) {
        this.actionLoading.set(false);
        return;
      }
      this.userService
        .bulkSetStatus([...this.selectedIds()], action)
        .pipe(
          finalize(() => {
            this.confirmMode.set(null);
            this.actionLoading.set(false);
          }),
        )
        .subscribe({
          next: (users) => {
            if (users.length === 0) return;
            this.toast.show(
              'Member access updated',
              `${users.length} ${users.length === 1 ? 'member was' : 'members were'} updated.`,
            );
            this.selectedIds.set(new Set());
            this.refresh();
          },
          error: (error: unknown) => {
            this.toast.show(
              'Bulk action failed',
              this.errorMessage(error, 'The selected members could not be updated.'),
              'error',
            );
          },
        });
      return;
    }
    const member = this.statusTarget();
    if (!member) {
      this.actionLoading.set(false);
      return;
    }
    const status = member.status === 'suspended' ? 'active' : 'suspended';
    this.statusUpdating.set(true);
    this.userService
      .setStatus(member.id, status)
      .pipe(
        finalize(() => {
          this.statusUpdating.set(false);
          this.actionLoading.set(false);
          this.confirmMode.set(null);
        }),
      )
      .subscribe({
        next: (updated) => {
          this.toast.show(
            status === 'active' ? 'Member activated' : 'Member suspended',
            status === 'active'
              ? `${updated.firstName} can now access the organization.`
              : `${updated.firstName} no longer has access to Nexora.`,
          );
          if (this.detailsUser()?.id === updated.id) {
            this.detailsUser.set(updated);
          }
          this.refresh();
        },
        error: (error: unknown) => {
          this.toast.show(
            'Status update failed',
            this.errorMessage(error, 'The member status could not be changed.'),
            'error',
          );
        },
      });
  }

  cancelConfirmation(): void {
    this.statusTarget.set(null);
    this.bulkAction.set(null);
  }

  openInvite(): void {
    this.formMode.set('invite');
    this.editingUser.set(null);
    this.formOpen.set(true);
  }

  openEdit(user: User): void {
    this.detailsOpen.set(false);
    this.editingUser.set(user);
    this.formMode.set('edit');
    this.formOpen.set(true);
  }

  openDetails(user: User): void {
    this.detailsUser.set(user);
    this.detailsActivity.set([]);
    this.detailsLoading.set(true);
    this.detailsOpen.set(true);
    this.userService
      .getDetails(user.id)
      .pipe(finalize(() => this.detailsLoading.set(false)))
      .subscribe({
        next: (details) => {
          this.detailsUser.set(details.user);
          this.detailsActivity.set(details.activity);
        },
        error: (error: unknown) => {
          this.detailsLoading.set(false);
          this.toast.show(
            'Profile details unavailable',
            this.errorMessage(error, 'Member activity could not be loaded.'),
            'error',
          );
        },
      });
  }

  requestStatusToggle(user: User): void {
    this.statusTarget.set(user);
    this.confirmMode.set('status');
  }

  memberSaved(): void {
    this.refresh();
  }

  exportCsv(): void {
    if (this.exporting()) return;
    this.exporting.set(true);
    this.userService
      .exportUsers(this.query())
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (blob) => {
          const timestamp = new Intl.DateTimeFormat('en-CA').format(new Date());
          this.userService.downloadBlob(blob, `nexora-members-${timestamp}.csv`);
          this.toast.show(
            'CSV export ready',
            `${this.result().total} member records were exported with the active filters.`,
          );
        },
        error: (error: unknown) => {
          this.toast.show(
            'Export failed',
            this.errorMessage(error, 'The member directory could not be exported.'),
            'error',
          );
        },
      });
  }

  retry(): void {
    this.refresh();
    this.loadStatistics();
  }

  roleName(roleId: string): string {
    return this.roles().find((role) => role.id === roleId)?.name ?? 'Unassigned';
  }

  private updateQuery(patch: Partial<UserListRequest>): void {
    const next = { ...this.query(), ...patch };
    this.query.set(next);
    this.selectedIds.set(new Set());
    this.querySubject.next(next);
  }

  private refresh(): void {
    this.querySubject.next(this.query());
    this.loadStatistics();
  }

  private loadStatistics(): void {
    this.statsLoading.set(true);
    this.userService
      .getStatistics()
      .pipe(finalize(() => this.statsLoading.set(false)))
      .subscribe({
        next: (statistics) => this.statistics.set(statistics),
        error: () => {
          this.toast.show(
            'Statistics unavailable',
            'Member totals could not be refreshed right now.',
            'error',
          );
        },
      });
  }

  private loadRoles(): void {
    this.userService.listRoles().subscribe({
      next: (roles) => this.roles.set(roles),
      error: () =>
        this.toast.show('Roles unavailable', 'Role filters could not be loaded.', 'error'),
    });
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
