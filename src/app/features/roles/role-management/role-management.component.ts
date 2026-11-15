import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { PERMISSION_MODULES } from '../../../core/data/permissions.data';
import { PermissionModule, Role } from '../../../core/models/role.model';
import { RoleManagementService } from '../../../core/services/role-management.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatRelativeTime } from '../../../core/utils/date.util';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { IconComponent } from '../../../shared/icon/icon.component';
import { RoleFormDialogComponent } from '../role-form-dialog/role-form-dialog.component';

type RoleConfirm = 'switch' | 'delete' | null;

@Component({
  selector: 'app-role-management',
  imports: [ConfirmDialogComponent, IconComponent, RoleFormDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss',
})
export class RoleManagementComponent {
  private readonly roleService = inject(RoleManagementService);
  private readonly toast = inject(ToastService);
  private initialized = false;

  protected readonly modules = PERMISSION_MODULES;
  protected readonly roles = this.roleService.roles;
  protected readonly loading = this.roleService.loading;
  protected readonly saving = this.roleService.saving;
  protected readonly serviceError = this.roleService.error;
  protected readonly customRoleCount = this.roleService.customRoleCount;
  protected readonly totalMembers = this.roleService.totalMembers;
  protected readonly activeRoleId = signal('');
  protected readonly draftName = signal('');
  protected readonly draftDescription = signal('');
  protected readonly draftPermissions = signal<ReadonlySet<string>>(new Set());
  protected readonly createOpen = signal(false);
  protected readonly confirmType = signal<RoleConfirm>(null);
  protected readonly pendingRoleId = signal<string | null>(null);
  protected readonly validationError = signal<string | null>(null);
  protected readonly formatRelative = formatRelativeTime;

  protected readonly activeRole = computed(
    () => this.roles().find((role) => role.id === this.activeRoleId()) ?? null,
  );
  protected readonly isOwner = computed(() => this.activeRole()?.id === 'role-owner');
  protected readonly selectedPermissionCount = computed(() => this.draftPermissions().size);
  protected readonly permissionCoverage = computed(() =>
    Math.round(
      (this.selectedPermissionCount() /
        this.modules.reduce((sum, module) => sum + module.permissions.length, 0)) *
        100,
    ),
  );
  protected readonly hasUnsavedChanges = computed(() => {
    const role = this.activeRole();
    if (!role) return false;
    const nameChanged = !role.isSystem && this.draftName().trim() !== role.name;
    const descriptionChanged = this.draftDescription().trim() !== role.description;
    const current = [...this.draftPermissions()].sort();
    const saved = [...role.permissionIds].sort();
    const permissionsChanged =
      current.length !== saved.length ||
      current.some((permission, index) => permission !== saved[index]);
    return nameChanged || descriptionChanged || permissionsChanged;
  });
  protected readonly confirmOpen = computed(() => this.confirmType() !== null);
  protected readonly confirmConfig = computed(() => {
    if (this.confirmType() === 'delete') {
      const role = this.activeRole();
      return {
        title: `Delete “${role?.name ?? 'this role'}”?`,
        message:
          role && role.memberCount > 0
            ? `${role.memberCount} members are assigned to this role. Move them to another role before deleting it.`
            : 'This custom role will be permanently removed. This action cannot be undone.',
        confirmLabel: 'Delete role',
      };
    }
    return {
      title: 'Discard unsaved changes?',
      message:
        'Your role name, description, or permission changes have not been saved. Switching roles will discard them.',
      confirmLabel: 'Discard changes',
    };
  });

  constructor() {
    this.roleService.loadRoles();
    effect(() => {
      const roles = this.roles();
      const firstRole = roles[0];
      if (!this.initialized && firstRole) {
        this.initialized = true;
        this.applyRole(firstRole);
      }
    });
  }

  selectRole(role: Role): void {
    if (role.id === this.activeRoleId()) return;
    if (this.hasUnsavedChanges()) {
      this.pendingRoleId.set(role.id);
      this.confirmType.set('switch');
      return;
    }
    this.applyRole(role);
  }

  moduleSelected(module: PermissionModule): boolean {
    return module.permissions.every((permission) => this.draftPermissions().has(permission.id));
  }

  moduleSomeSelected(module: PermissionModule): boolean {
    return (
      !this.moduleSelected(module) &&
      module.permissions.some((permission) => this.draftPermissions().has(permission.id))
    );
  }

  moduleSelectedCount(module: PermissionModule): number {
    return module.permissions.filter((permission) => this.draftPermissions().has(permission.id))
      .length;
  }

  togglePermission(permissionId: string, checked: boolean): void {
    if (this.isOwner()) return;
    this.draftPermissions.update((current) => {
      const next = new Set(current);
      if (checked) next.add(permissionId);
      else next.delete(permissionId);
      return next;
    });
    this.validationError.set(null);
  }

  toggleModule(module: PermissionModule, checked: boolean): void {
    if (this.isOwner()) return;
    this.draftPermissions.update((current) => {
      const next = new Set(current);
      for (const permission of module.permissions) {
        if (checked) next.add(permission.id);
        else next.delete(permission.id);
      }
      return next;
    });
  }

  selectAllPermissions(): void {
    if (this.isOwner()) return;
    this.draftPermissions.set(
      new Set(
        this.modules.flatMap((module) => module.permissions.map((permission) => permission.id)),
      ),
    );
  }

  clearAllPermissions(): void {
    if (this.isOwner()) return;
    this.draftPermissions.set(new Set());
  }

  resetDraft(): void {
    const role = this.activeRole();
    if (role) this.applyRole(role);
    this.validationError.set(null);
  }

  saveChanges(): void {
    const role = this.activeRole();
    if (!role || this.saving()) return;
    const name = role.isSystem ? role.name : this.draftName().trim();
    if (name.length < 2) {
      this.validationError.set('Role name must contain at least 2 characters.');
      return;
    }
    if (name.length > 40) {
      this.validationError.set('Role name cannot exceed 40 characters.');
      return;
    }
    if (!role.isSystem && name.toLowerCase() !== role.name.toLowerCase()) {
      const duplicate = this.roles().some(
        (candidate) =>
          candidate.id !== role.id && candidate.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        this.validationError.set('A role with this name already exists.');
        return;
      }
    }

    this.validationError.set(null);
    this.roleService
      .updateRole(role.id, {
        name,
        description: this.draftDescription().trim(),
        permissionIds: [...this.draftPermissions()],
      })
      .subscribe({
        next: (updated) => {
          this.applyRole(updated);
          this.toast.show('Role updated', `${updated.name} permissions have been saved.`);
        },
        error: (error: unknown) => {
          this.validationError.set(
            error instanceof Error ? error.message : 'The role could not be saved.',
          );
        },
      });
  }

  requestDelete(): void {
    const role = this.activeRole();
    if (!role || role.isSystem) {
      this.toast.show(
        'System role protected',
        'Built-in roles cannot be deleted. Create a custom role for specific access needs.',
        'info',
      );
      return;
    }
    this.confirmType.set('delete');
  }

  retryRoles(): void {
    this.roleService.loadRoles();
  }

  roleCreated(role: Role): void {
    this.initialized = true;
    this.applyRole(role);
  }

  confirmAction(): void {
    if (this.confirmType() === 'switch') {
      const target = this.roles().find((role) => role.id === this.pendingRoleId());
      this.confirmType.set(null);
      this.pendingRoleId.set(null);
      if (target) this.applyRole(target);
      return;
    }

    const role = this.activeRole();
    if (!role) return;
    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.confirmType.set(null);
        const nextRole = this.roles()[0];
        if (nextRole) this.applyRole(nextRole);
        this.toast.show('Role deleted', `${role.name} was removed from the organization.`);
      },
      error: (error: unknown) => {
        this.confirmType.set(null);
        this.toast.show(
          'Role could not be deleted',
          error instanceof Error ? error.message : 'Please try again.',
          'error',
        );
      },
    });
  }

  cancelConfirmation(): void {
    this.pendingRoleId.set(null);
  }

  canDeactivate(): boolean {
    return (
      !this.hasUnsavedChanges() ||
      window.confirm('You have unsaved role changes. Leave this page and discard them?')
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private applyRole(role: Role): void {
    this.activeRoleId.set(role.id);
    this.draftName.set(role.name);
    this.draftDescription.set(role.description);
    this.draftPermissions.set(new Set(role.permissionIds));
    this.validationError.set(null);
  }
}
