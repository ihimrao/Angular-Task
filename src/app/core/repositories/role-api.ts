import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateRoleRequest, Role, UpdateRoleRequest } from '../models/role.model';

export interface RoleApi {
  list(): Observable<readonly Role[]>;
  getById(id: string): Observable<Role>;
  create(request: CreateRoleRequest): Observable<Role>;
  update(id: string, request: UpdateRoleRequest): Observable<Role>;
  delete(id: string): Observable<void>;
}

export const ROLE_API = new InjectionToken<RoleApi>('ROLE_API');
