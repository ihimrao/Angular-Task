import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
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

export interface UserApi {
  list(request: UserListRequest): Observable<PaginatedResult<User>>;
  getStatistics(): Observable<UserStatistics>;
  getById(id: string): Observable<User>;
  getActivity(id: string): Observable<readonly UserActivity[]>;
  isEmailAvailable(email: string, excludeUserId?: string): Observable<boolean>;
  invite(request: InviteUserRequest): Observable<User>;
  update(id: string, request: UpdateUserRequest): Observable<User>;
  setStatus(id: string, status: 'active' | 'suspended'): Observable<User>;
  bulkSetStatus(ids: readonly string[], action: BulkUserAction): Observable<readonly User[]>;
}

export const USER_API = new InjectionToken<UserApi>('USER_API');
