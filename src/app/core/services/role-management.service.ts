import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../models/role.model';
import { ROLE_API } from '../repositories';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private readonly roleApi = inject(ROLE_API);
  private readonly rolesState = signal<readonly Role[]>([]);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly roles = this.rolesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly totalMembers = computed(() =>
    this.rolesState().reduce((sum, role) => sum + role.memberCount, 0),
  );
  readonly customRoleCount = computed(
    () => this.rolesState().filter((role) => !role.isSystem).length,
  );

  loadRoles(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.roleApi
      .list()
      .pipe(
        tap((roles) =>
          this.rolesState.set(
            [...roles].sort((left, right) => {
              if (left.isSystem !== right.isSystem) {
                return left.isSystem ? -1 : 1;
              }
              return left.name.localeCompare(right.name);
            }),
          ),
        ),
        catchError((error: unknown) => {
          this.errorState.set(this.errorMessage(error, 'Roles could not be loaded.'));
          return [];
        }),
        finalize(() => this.loadingState.set(false)),
      )
      .subscribe();
  }

  createRole(request: CreateRoleRequest): Observable<Role> {
    this.savingState.set(true);
    this.errorState.set(null);
    return this.roleApi.create(request).pipe(
      tap((role) => this.rolesState.update((roles) => [...roles, role])),
      catchError((error: unknown) => {
        this.errorState.set(this.errorMessage(error, 'The role could not be created.'));
        return throwError(() => error);
      }),
      finalize(() => this.savingState.set(false)),
    );
  }

  updateRole(id: string, request: UpdateRoleRequest): Observable<Role> {
    this.savingState.set(true);
    this.errorState.set(null);
    return this.roleApi.update(id, request).pipe(
      tap((updated) =>
        this.rolesState.update((roles) =>
          roles.map((role) => (role.id === updated.id ? updated : role)),
        ),
      ),
      catchError((error: unknown) => {
        this.errorState.set(this.errorMessage(error, 'The role could not be saved.'));
        return throwError(() => error);
      }),
      finalize(() => this.savingState.set(false)),
    );
  }

  deleteRole(id: string): Observable<void> {
    this.savingState.set(true);
    this.errorState.set(null);
    return this.roleApi.delete(id).pipe(
      tap(() => this.rolesState.update((roles) => roles.filter((role) => role.id !== id))),
      catchError((error: unknown) => {
        this.errorState.set(this.errorMessage(error, 'The role could not be deleted.'));
        return throwError(() => error);
      }),
      finalize(() => this.savingState.set(false)),
    );
  }

  private errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }
}
