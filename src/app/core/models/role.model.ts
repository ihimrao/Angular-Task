export interface Permission {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly risk: 'standard' | 'sensitive' | 'critical';
}

export interface PermissionModule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly permissions: readonly Permission[];
}

export interface Role {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly isSystem: boolean;
  readonly memberCount: number;
  readonly permissionIds: readonly string[];
  readonly updatedAt: string;
}

export interface CreateRoleRequest {
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly string[];
}

export interface UpdateRoleRequest {
  readonly name: string;
  readonly description: string;
  readonly permissionIds: readonly string[];
}
