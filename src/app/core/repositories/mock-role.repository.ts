import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { MOCK_ROLES } from '../data/roles.data';
import { CreateRoleRequest, Role, UpdateRoleRequest } from '../models/role.model';
import { RoleApi } from './role-api';

const STORAGE_KEY = 'nexora.roles.v1';
const NETWORK_DELAY = 380;
const ROLE_COLORS = ['#6955d9', '#3871a8', '#2f897a', '#b47728', '#ad5f88', '#66758f'];

@Injectable()
export class MockRoleRepository implements RoleApi {
  private roles: Role[] = this.readRoles();

  list(): Observable<readonly Role[]> {
    return of(this.roles.map((role) => ({ ...role }))).pipe(delay(NETWORK_DELAY));
  }

  getById(id: string): Observable<Role> {
    const role = this.roles.find((candidate) => candidate.id === id);
    return role
      ? of({ ...role }).pipe(delay(NETWORK_DELAY))
      : throwError(() => new Error('We could not find that role.')).pipe(delay(180));
  }

  create(request: CreateRoleRequest): Observable<Role> {
    if (this.nameExists(request.name)) {
      return throwError(() => new Error('A role with this name already exists.')).pipe(delay(240));
    }

    const role: Role = {
      id: `role-${crypto.randomUUID()}`,
      name: request.name.trim(),
      description: request.description.trim(),
      color: ROLE_COLORS[this.roles.length % ROLE_COLORS.length] ?? '#6955d9',
      isSystem: false,
      memberCount: 0,
      permissionIds: [...new Set(request.permissionIds)],
      updatedAt: new Date().toISOString(),
    };
    this.roles = [...this.roles, role];
    this.persist();
    return of({ ...role }).pipe(delay(NETWORK_DELAY));
  }

  update(id: string, request: UpdateRoleRequest): Observable<Role> {
    const existing = this.roles.find((role) => role.id === id);
    if (!existing) {
      return throwError(() => new Error('We could not update this role.')).pipe(delay(180));
    }
    if (this.nameExists(request.name, id)) {
      return throwError(() => new Error('A role with this name already exists.')).pipe(delay(240));
    }

    const updated: Role = {
      ...existing,
      name: existing.isSystem ? existing.name : request.name.trim(),
      description: request.description.trim(),
      permissionIds: [...new Set(request.permissionIds)],
      updatedAt: new Date().toISOString(),
    };
    this.roles = this.roles.map((role) => (role.id === id ? updated : role));
    this.persist();
    return of({ ...updated }).pipe(delay(NETWORK_DELAY));
  }

  delete(id: string): Observable<void> {
    const existing = this.roles.find((role) => role.id === id);
    if (!existing) {
      return throwError(() => new Error('We could not find that role.')).pipe(delay(180));
    }
    if (existing.isSystem) {
      return throwError(() => new Error('System roles cannot be deleted.')).pipe(delay(180));
    }
    if (existing.memberCount > 0) {
      return throwError(
        () => new Error('Move assigned members to another role before deleting this role.'),
      ).pipe(delay(180));
    }

    this.roles = this.roles.filter((role) => role.id !== id);
    this.persist();
    return of(undefined).pipe(delay(NETWORK_DELAY));
  }

  private nameExists(name: string, excludeId?: string): boolean {
    const normalized = name.trim().toLowerCase();
    return this.roles.some(
      (role) => role.name.toLowerCase() === normalized && role.id !== excludeId,
    );
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.roles));
    } catch {
      // Keep the in-memory view usable in privacy-restricted browsers.
    }
  }

  private readRoles(): Role[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          return parsed as Role[];
        }
      }
    } catch {
      // Fall back to the provided system roles.
    }
    return MOCK_ROLES.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));
  }
}
