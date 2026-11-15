export type UserStatus = 'active' | 'invited' | 'suspended';

export type Department =
  | 'Engineering'
  | 'Product'
  | 'Design'
  | 'Marketing'
  | 'Sales'
  | 'Customer Success'
  | 'Finance'
  | 'People & Culture';

export interface User {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roleId: string;
  readonly department: Department;
  readonly jobTitle: string;
  readonly status: UserStatus;
  readonly avatarColor: string;
  readonly phone: string;
  readonly location: string;
  readonly timezone: string;
  readonly mfaEnabled: boolean;
  readonly createdAt: string;
  readonly lastActiveAt: string | null;
}

export interface UserListRequest {
  readonly search: string;
  readonly status: UserStatus | 'all';
  readonly roleId: string | 'all';
  readonly department: Department | 'all';
  readonly sortBy: UserSortField;
  readonly sortDirection: 'asc' | 'desc';
  readonly page: number;
  readonly pageSize: number;
}

export type UserSortField = 'name' | 'status' | 'department' | 'lastActiveAt';

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface UserStatistics {
  readonly total: number;
  readonly active: number;
  readonly invited: number;
  readonly suspended: number;
  readonly activeRate: number;
}

export interface InviteUserRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly roleId: string;
  readonly department: Department;
  readonly jobTitle: string;
  readonly message: string;
}

export type UpdateUserRequest = Pick<
  User,
  'firstName' | 'lastName' | 'email' | 'roleId' | 'department' | 'jobTitle' | 'phone' | 'location'
>;

export type BulkUserAction = 'activate' | 'suspend';

export interface UserActivity {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly occurredAt: string;
  readonly kind: 'login' | 'invite' | 'role' | 'security' | 'status';
}
