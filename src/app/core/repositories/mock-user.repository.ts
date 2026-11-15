import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { MOCK_USERS } from '../data/users.data';
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
import { UserApi } from './user-api';

const STORAGE_KEY = 'nexora.users.v1';
const NETWORK_DELAY = 420;
const AVATAR_COLORS = ['#6955d9', '#d46b48', '#328b84', '#4f78b8', '#ad5f88', '#9b7138'];

@Injectable()
export class MockUserRepository implements UserApi {
  private users: User[] = this.readUsers();

  list(request: UserListRequest): Observable<PaginatedResult<User>> {
    const normalizedSearch = request.search.trim().toLowerCase();
    const filtered = this.users.filter((user) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.jobTitle.toLowerCase().includes(normalizedSearch);
      const matchesStatus = request.status === 'all' || user.status === request.status;
      const matchesRole = request.roleId === 'all' || user.roleId === request.roleId;
      const matchesDepartment =
        request.department === 'all' || user.department === request.department;

      return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
    });

    const sorted = [...filtered].sort((left, right) => {
      let comparison = 0;
      switch (request.sortBy) {
        case 'name':
          comparison = `${left.firstName} ${left.lastName}`.localeCompare(
            `${right.firstName} ${right.lastName}`,
          );
          break;
        case 'status':
          comparison = left.status.localeCompare(right.status);
          break;
        case 'department':
          comparison = left.department.localeCompare(right.department);
          break;
        case 'lastActiveAt':
          comparison = (left.lastActiveAt ?? '').localeCompare(right.lastActiveAt ?? '');
          break;
      }
      return request.sortDirection === 'asc' ? comparison : -comparison;
    });

    const start = (request.page - 1) * request.pageSize;
    const result: PaginatedResult<User> = {
      items: sorted.slice(start, start + request.pageSize).map((user) => ({ ...user })),
      total: sorted.length,
      page: request.page,
      pageSize: request.pageSize,
    };

    return of(result).pipe(delay(NETWORK_DELAY));
  }

  getStatistics(): Observable<UserStatistics> {
    const total = this.users.length;
    const active = this.users.filter((user) => user.status === 'active').length;
    const invited = this.users.filter((user) => user.status === 'invited').length;
    const suspended = this.users.filter((user) => user.status === 'suspended').length;

    return of({
      total,
      active,
      invited,
      suspended,
      activeRate: total === 0 ? 0 : Math.round((active / total) * 100),
    }).pipe(delay(NETWORK_DELAY));
  }

  getById(id: string): Observable<User> {
    const user = this.users.find((candidate) => candidate.id === id);
    return user
      ? of({ ...user }).pipe(delay(NETWORK_DELAY))
      : throwError(() => new Error('We could not find that member.')).pipe(delay(180));
  }

  getActivity(id: string): Observable<readonly UserActivity[]> {
    const user = this.users.find((candidate) => candidate.id === id);
    if (!user) {
      return throwError(() => new Error('Member activity is unavailable.')).pipe(delay(180));
    }

    const baseDate = new Date(user.lastActiveAt ?? user.createdAt);
    const activities: readonly UserActivity[] = [
      {
        id: `${id}-activity-1`,
        title:
          user.status === 'invited'
            ? 'Invitation sent'
            : user.status === 'suspended'
              ? 'Account suspended'
              : 'Signed in',
        description:
          user.status === 'invited'
            ? `An invitation was sent to ${user.email}.`
            : user.status === 'suspended'
              ? 'Access was suspended by an organization administrator.'
              : 'Signed in from a recognized device.',
        occurredAt: baseDate.toISOString(),
        kind:
          user.status === 'invited' ? 'invite' : user.status === 'suspended' ? 'status' : 'login',
      },
      {
        id: `${id}-activity-2`,
        title: 'Role reviewed',
        description: 'Organization access was reviewed by an administrator.',
        occurredAt: new Date(baseDate.getTime() - 3 * 86_400_000).toISOString(),
        kind: 'role',
      },
      {
        id: `${id}-activity-3`,
        title: 'Security check passed',
        description: user.mfaEnabled
          ? 'Multi-factor authentication is enabled for this account.'
          : 'Multi-factor authentication has not been enabled yet.',
        occurredAt: new Date(baseDate.getTime() - 12 * 86_400_000).toISOString(),
        kind: 'security',
      },
    ];

    return of(activities).pipe(delay(320));
  }

  isEmailAvailable(email: string, excludeUserId?: string): Observable<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const isAvailable = !this.users.some(
      (user) => user.email.toLowerCase() === normalizedEmail && user.id !== excludeUserId,
    );
    return of(isAvailable).pipe(delay(550));
  }

  invite(request: InviteUserRequest): Observable<User> {
    if (this.emailExists(request.email)) {
      return throwError(() => new Error('A member with this email address already exists.')).pipe(
        delay(280),
      );
    }

    const now = new Date().toISOString();
    const user: User = {
      id: `usr-${crypto.randomUUID()}`,
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email: request.email.trim().toLowerCase(),
      roleId: request.roleId,
      department: request.department,
      jobTitle: request.jobTitle.trim(),
      status: 'invited',
      avatarColor: AVATAR_COLORS[this.users.length % AVATAR_COLORS.length] ?? '#6955d9',
      phone: '',
      location: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      mfaEnabled: false,
      createdAt: now,
      lastActiveAt: null,
    };
    this.users = [user, ...this.users];
    this.persist();
    return of({ ...user }).pipe(delay(NETWORK_DELAY));
  }

  update(id: string, request: UpdateUserRequest): Observable<User> {
    if (this.emailExists(request.email, id)) {
      return throwError(() => new Error('A member with this email address already exists.')).pipe(
        delay(280),
      );
    }

    const index = this.users.findIndex((user) => user.id === id);
    const existing = this.users[index];
    if (!existing) {
      return throwError(() => new Error('We could not update this member.')).pipe(delay(180));
    }

    const updated: User = {
      ...existing,
      ...request,
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      email: request.email.trim().toLowerCase(),
      jobTitle: request.jobTitle.trim(),
      phone: request.phone.trim(),
      location: request.location.trim(),
    };
    this.users = this.users.map((user) => (user.id === id ? updated : user));
    this.persist();
    return of({ ...updated }).pipe(delay(NETWORK_DELAY));
  }

  setStatus(id: string, status: 'active' | 'suspended'): Observable<User> {
    const existing = this.users.find((user) => user.id === id);
    if (!existing) {
      return throwError(() => new Error('We could not update this member.')).pipe(delay(180));
    }

    const updated: User = {
      ...existing,
      status,
      lastActiveAt:
        existing.lastActiveAt ?? (status === 'active' ? new Date().toISOString() : null),
    };
    this.users = this.users.map((user) => (user.id === id ? updated : user));
    this.persist();
    return of({ ...updated }).pipe(delay(NETWORK_DELAY));
  }

  bulkSetStatus(ids: readonly string[], action: BulkUserAction): Observable<readonly User[]> {
    const selectedIds = new Set(ids);
    const status = action === 'activate' ? 'active' : 'suspended';
    const updatedUsers: User[] = [];
    this.users = this.users.map((user) => {
      if (!selectedIds.has(user.id)) {
        return user;
      }
      const updated = { ...user, status } satisfies User;
      updatedUsers.push(updated);
      return updated;
    });
    this.persist();
    return of(updatedUsers.map((user) => ({ ...user }))).pipe(delay(NETWORK_DELAY));
  }

  private emailExists(email: string, excludeId?: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.users.some(
      (user) => user.email.toLowerCase() === normalized && user.id !== excludeId,
    );
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
    } catch {
      // The in-memory repository remains functional when storage is unavailable.
    }
  }

  private readUsers(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as User[];
        }
      }
    } catch {
      // Invalid or inaccessible storage falls back to the curated seed data.
    }
    return MOCK_USERS.map((user) => ({ ...user }));
  }
}
