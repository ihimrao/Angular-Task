import { inject, Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import {
  BulkUserAction,
  InviteUserRequest,
  PaginatedResult,
  UpdateUserRequest,
  User,
  UserActivity,
  UserListRequest,
  UserStatistics,
} from '../models/user.model';
import { Role } from '../models/role.model';
import { ROLE_API, USER_API } from '../repositories';

export interface UserDetails {
  readonly user: User;
  readonly activity: readonly UserActivity[];
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly userApi = inject(USER_API);
  private readonly roleApi = inject(ROLE_API);

  listUsers(request: UserListRequest): Observable<PaginatedResult<User>> {
    return this.userApi.list(request);
  }

  getStatistics(): Observable<UserStatistics> {
    return this.userApi.getStatistics();
  }

  listRoles(): Observable<readonly Role[]> {
    return this.roleApi.list().pipe(
      map((roles) =>
        [...roles].sort((left, right) => {
          if (left.isSystem !== right.isSystem) {
            return left.isSystem ? -1 : 1;
          }
          return left.name.localeCompare(right.name);
        }),
      ),
    );
  }

  getDetails(id: string): Observable<UserDetails> {
    return forkJoin({
      user: this.userApi.getById(id),
      activity: this.userApi.getActivity(id),
    });
  }

  isEmailAvailable(email: string, excludeUserId?: string): Observable<boolean> {
    return this.userApi.isEmailAvailable(email, excludeUserId);
  }

  inviteUser(request: InviteUserRequest): Observable<User> {
    return this.userApi.invite(request);
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<User> {
    return this.userApi.update(id, request);
  }

  setStatus(id: string, status: 'active' | 'suspended'): Observable<User> {
    return this.userApi.setStatus(id, status);
  }

  bulkSetStatus(ids: readonly string[], action: BulkUserAction): Observable<readonly User[]> {
    return this.userApi.bulkSetStatus(ids, action);
  }

  exportUsers(request: UserListRequest): Observable<Blob> {
    return forkJoin({
      result: this.userApi.list({ ...request, page: 1, pageSize: 10_000 }),
      roles: this.roleApi.list(),
    }).pipe(
      map(({ result, roles }) => {
        const roleMap = new Map(roles.map((role) => [role.id, role.name]));
        const rows: readonly (readonly string[])[] = [
          [
            'First name',
            'Last name',
            'Email',
            'Role',
            'Department',
            'Job title',
            'Status',
            'Location',
            'Phone',
            'MFA enabled',
            'Joined',
            'Last active',
          ],
          ...result.items.map((user) => [
            user.firstName,
            user.lastName,
            user.email,
            roleMap.get(user.roleId) ?? user.roleId,
            user.department,
            user.jobTitle,
            user.status,
            user.location,
            user.phone,
            user.mfaEnabled ? 'Yes' : 'No',
            this.formatDate(user.createdAt),
            user.lastActiveAt ? this.formatDate(user.lastActiveAt) : 'Never',
          ]),
        ];
        const csv = rows
          .map((row) => row.map((value) => this.escapeCsv(value)).join(','))
          .join('\r\n');
        return new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
      }),
    );
  }

  downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    const spreadsheetSafeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${spreadsheetSafeValue.replaceAll('"', '""')}"`;
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  }
}
