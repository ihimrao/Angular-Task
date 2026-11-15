# Nexora Organization Management

A responsive enterprise user-management application built with Angular 22. It covers the complete administrator workflow for members, invitations, account status, CSV export, roles, and module-based permissions.

The application runs entirely in the browser. A persistent mock API is included behind typed repository interfaces, so the feature components can move to a real REST backend without being rewritten.

## Quick start

Prerequisites:

- Node.js 20 or newer
- npm 10 or newer

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200).

Useful commands:

```bash
npm run build       # strict production build
npm test            # repository and shell tests
```

## Screenshots

### Member management

![Member management dashboard](./screenshots/user-management-desktop.png)

### Invite member

![Invite member form](./screenshots/invite-member-form.png)

### Roles and permissions

![Roles and permissions editor](./screenshots/roles-permissions-desktop.png)

### Responsive mobile layout

![Member management on mobile](./screenshots/user-management-mobile.png)

![Roles and permissions on mobile](./screenshots/roles-permissions-mobile.png)

## Implemented functionality

### Members

- Dashboard statistics for total, active, invited, and suspended members, including active rate.
- Status tabs with live counts.
- Debounced search across name, email, and job title.
- Advanced role and department filters with reset.
- Sortable name, department, status, and last-active columns.
- Server-ready pagination model with page size selection.
- Bulk selection across the visible page and bulk activate/suspend actions.
- Invite form with Reactive Forms validation, async duplicate-email checking, and inline errors.
- Edit member profile and access details.
- Member detail drawer with organization, contact, security, timezone, and activity information.
- Activation and suspension confirmation dialogs.
- Filter-aware CSV export with proper escaping and spreadsheet-friendly encoding.
- Responsive mobile card layout with equivalent actions.

### Roles and permissions

- Multiple system and custom roles.
- Permission modules for members, roles, security, billing, and integrations.
- Individual permission toggles and module-level select-all state.
- Global select-all and deselect-all actions.
- Custom role creation with duplicate-name protection.
- Role description and permission editing.
- System-role protection: system roles cannot be deleted.
- Owner role always retains full access.
- Role deletion confirmation and protection for custom roles with assigned members.
- Unsaved-change indicators, in-page role-switch warning, router guard, and browser unload warning.

### Shared states

- Skeleton loading states for cards and tables.
- Empty directory state with filter recovery.
- Error presentation with retry actions.
- Success, error, and informational toast notifications.
- Disabled, pending, and confirmation states for asynchronous actions.

## Component architecture

The application uses standalone components and a feature-first structure with a framework-independent domain layer.

```text
src/app/
├── core/
│   ├── data/                # Curated users, roles, and permission catalog
│   ├── models/              # Strictly typed domain contracts
│   ├── repositories/        # API interfaces, injection tokens, mock adapters
│   ├── services/            # User, role, and notification business services
│   └── utils/               # Date formatting helpers
├── features/
│   ├── users/
│   │   ├── user-management/
│   │   ├── user-form-dialog/
│   │   └── user-details-drawer/
│   └── roles/
│       ├── role-management/
│       └── role-form-dialog/
├── shared/                  # Avatar, status, icon, dialog, toast primitives
├── app.routes.ts            # Lazy feature routes and unsaved-change guard
├── app.config.ts            # Router and repository provider configuration
└── app.ts                   # Responsive application shell
```

### Layers

1. **Presentation components** own UI state, form controls, selection, drawers, and responsive layouts.
2. **Feature services** coordinate API calls, statistics, exports, and role mutation state without exposing repository details.
3. **Repository interfaces** define the backend contract. `USER_API` and `ROLE_API` are injection tokens.
4. **Mock repositories** implement those contracts with RxJS observables, simulated latency, validation, unique constraints, and `localStorage` persistence.
5. **Shared components** provide consistent icons, avatars, status badges, confirmation dialogs, and toasts.

Routing is lazy: the member and role features are loaded only when needed. Angular Signals drive local state, while RxJS handles form streams, request cancellation, fork-joined details, and bulk mutation flows.

## Switching to REST APIs

UI components only depend on `UserManagementService`, `RoleManagementService`, and the injected repository interfaces. To connect a backend:

1. Implement `UserApi` and `RoleApi` using `HttpClient`.
2. Map REST payloads to the types in `src/app/core/models`.
3. Replace the mock classes in `src/app/app.config.ts`:

```ts
providers: [
  provideHttpClient(),
  { provide: USER_API, useClass: RestUserRepository },
  { provide: ROLE_API, useClass: RestRoleRepository },
];
```

4. Keep the same observable response contracts for pagination, mutations, errors, and CSV data.

No user or role page changes are required.

## Validation and data behavior

- TypeScript `strict` mode is enabled.
- Forms are non-nullable Reactive Forms.
- Work email checks are asynchronous and exclude the member currently being edited.
- Duplicate emails and role names are rejected by the repository layer as well as the UI.
- Mock operations add 320–550 ms of latency to exercise loading and disabled states.
- Seed data lives in `src/app/core/data`.
- Changes persist under the `nexora.users.v1` and `nexora.roles.v1` browser storage keys.

To restore the curated demo data, run this in the browser console and reload:

```js
localStorage.removeItem('nexora.users.v1');
localStorage.removeItem('nexora.roles.v1');
location.reload();
```

## Quality checks

- Production build succeeds with no compiler warnings.
- Unit checks cover application creation, filtering and pagination, invitation/status updates, system-role deletion protection, and custom role lifecycle.
- Desktop and mobile layouts were verified at 1440 px and 390 px widths.

## Known limitations

- There is no real backend, authentication, email delivery, or audit-event ingestion. Invitations and activity records are simulated locally.
- Roles use curated member counts for the demo; a real API should calculate assignment counts transactionally.
- CSV export is generated from the loaded mock dataset; a production endpoint may stream larger exports.
- The Owner permission matrix is intentionally locked to preserve full-access recovery.
- System role names are immutable, although their descriptions and permissions can be adjusted.
- The screenshot utility requires a local Chromium-compatible browser and the development server.
