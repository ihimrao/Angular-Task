import { PermissionModule } from '../models/role.model';

export const PERMISSION_MODULES: readonly PermissionModule[] = [
  {
    id: 'directory',
    name: 'Member directory',
    description: 'Control access to people data and account lifecycle.',
    icon: 'users',
    permissions: [
      {
        id: 'members.view',
        label: 'View members',
        description: 'See member profiles, statuses, and directory information.',
        risk: 'standard',
      },
      {
        id: 'members.invite',
        label: 'Invite members',
        description: 'Send invitations and grant access to the organization.',
        risk: 'sensitive',
      },
      {
        id: 'members.edit',
        label: 'Edit members',
        description: 'Change profile details, roles, and department assignments.',
        risk: 'sensitive',
      },
      {
        id: 'members.suspend',
        label: 'Suspend members',
        description: 'Temporarily block a member from signing in.',
        risk: 'critical',
      },
      {
        id: 'members.export',
        label: 'Export directory',
        description: 'Download member and organization data as CSV.',
        risk: 'sensitive',
      },
    ],
  },
  {
    id: 'roles',
    name: 'Roles & access',
    description: 'Manage permission sets and assign access across the team.',
    icon: 'shield',
    permissions: [
      {
        id: 'roles.view',
        label: 'View roles',
        description: 'View roles, permission coverage, and assigned members.',
        risk: 'standard',
      },
      {
        id: 'roles.manage',
        label: 'Manage roles',
        description: 'Create, update, and delete custom roles.',
        risk: 'critical',
      },
      {
        id: 'roles.assign',
        label: 'Assign roles',
        description: 'Assign roles to organization members.',
        risk: 'sensitive',
      },
    ],
  },
  {
    id: 'security',
    name: 'Security & audit',
    description: 'Review security posture and organization activity.',
    icon: 'lock',
    permissions: [
      {
        id: 'security.audit',
        label: 'View audit log',
        description: 'Review security events and administrative activity.',
        risk: 'sensitive',
      },
      {
        id: 'security.sessions',
        label: 'Manage sessions',
        description: 'Revoke active user sessions across the organization.',
        risk: 'critical',
      },
      {
        id: 'security.policies',
        label: 'Manage policies',
        description: 'Configure authentication and security policies.',
        risk: 'critical',
      },
    ],
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Manage plans, invoices, and payment methods.',
    icon: 'card',
    permissions: [
      {
        id: 'billing.view',
        label: 'View billing',
        description: 'View plan details and invoices.',
        risk: 'sensitive',
      },
      {
        id: 'billing.manage',
        label: 'Manage billing',
        description: 'Change the plan and update payment information.',
        risk: 'critical',
      },
    ],
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connect and administer third-party applications.',
    icon: 'puzzle',
    permissions: [
      {
        id: 'integrations.view',
        label: 'View integrations',
        description: 'See connected apps and integration status.',
        risk: 'standard',
      },
      {
        id: 'integrations.manage',
        label: 'Manage integrations',
        description: 'Connect apps and rotate API credentials.',
        risk: 'critical',
      },
    ],
  },
];

export const ALL_PERMISSION_IDS: readonly string[] = PERMISSION_MODULES.flatMap((module) =>
  module.permissions.map((permission) => permission.id),
);
