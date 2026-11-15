import { Routes } from '@angular/router';
import { RoleManagementComponent } from './features/roles/role-management/role-management.component';

export const routes: Routes = [
  {
    path: 'users',
    title: 'People · Nexora',
    loadComponent: () =>
      import('./features/users/user-management/user-management.component').then(
        (module) => module.UserManagementComponent,
      ),
    data: { pageTitle: 'People' },
  },
  {
    path: 'roles',
    title: 'Roles & permissions · Nexora',
    loadComponent: () =>
      import('./features/roles/role-management/role-management.component').then(
        (module) => module.RoleManagementComponent,
      ),
    canDeactivate: [(component: RoleManagementComponent) => component.canDeactivate()],
    data: { pageTitle: 'Roles & permissions' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '**', redirectTo: 'users' },
];
