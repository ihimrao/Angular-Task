# Project Code Tour

There are two useful ways to explore this codebase:

1. Start at the screen and follow an interaction to storage.
2. Start at application boot and follow the component tree.

Use both. They teach different lessons: user-flow debugging and architecture reading.

## Directory responsibilities

```text
src/
├── main.ts
├── styles.scss
├── index.html
└── app/
    ├── app.config.ts
    ├── app.routes.ts
    ├── app.ts / app.html / app.scss
    ├── core/
    │   ├── data/
    │   ├── models/
    │   ├── repositories/
    │   ├── services/
    │   └── utils/
    ├── features/
    │   ├── users/
    │   └── roles/
    └── shared/
```

### `core`

`core` contains application-wide domain and infrastructure code:

- Types.
- Seed data.
- API contracts.
- Mock adapters.
- Feature services.
- Cross-feature utilities.

It does not render screens.

### `features`

Each feature owns its pages, dialogs, templates, styles, and feature-specific behavior.

- `users` owns member management.
- `roles` owns roles and permissions.

The feature folders may import `core` and `shared`, but `core` does not import feature components.

### `shared`

Reusable presentation components live here:

- Avatar.
- Icon.
- User status badge.
- Confirmation dialog.
- Toast stack.

Shared components should not know about the user-management page’s request state.

## Application boot path

1. [`src/main.ts`](../src/main.ts) calls `bootstrapApplication(App, appConfig)`.
2. [`app.config.ts`](../src/app/app.config.ts) installs the router and repository providers.
3. [`app.routes.ts`](../src/app/app.routes.ts) maps URLs to lazy feature components.
4. [`app.ts`](../src/app/app.ts) creates the application shell and listens for completed navigation.
5. [`app.html`](../src/app/app.html) renders navigation, the top bar, and `<router-outlet />`.
6. The route loads either the member page or the role page inside the outlet.

This is the Angular equivalent of a root layout and route outlet, although the syntax and provider mechanism differ from Next.js.

## Request path 1: loading the member table

This is the most important data flow to understand first.

### Step 1: the page initializes a query

In [`user-management.component.ts`](../src/app/features/users/user-management/user-management.component.ts), a `BehaviorSubject` starts with the default request:

```ts
private readonly querySubject = new BehaviorSubject<UserListRequest>({
  search: '',
  status: 'all',
  roleId: 'all',
  department: 'all',
  sortBy: 'name',
  sortDirection: 'asc',
  page: 1,
  pageSize: 8,
});
```

`BehaviorSubject` emits its current value immediately to every new subscriber. That is why the initial request does not need a separate “load first page” method.

### Step 2: a page-level stream reacts to each query

The request stream uses:

```ts
this.querySubject
  .pipe(
    tap(() => this.loading.set(true)),
    switchMap((request) => this.userService.listUsers(request)),
  )
  .subscribe((page) => {
    this.result.set(page);
    this.loading.set(false);
  });
```

The real code also catches errors and manages destruction. The pipeline has four responsibilities:

- `tap` updates loading and clears old errors before the request.
- `switchMap` calls the service with the latest request.
- `catchError` converts a failure into a usable empty page and an error signal.
- `subscribe` places the result into the component’s signal state.

### Step 3: the feature service delegates

[`UserManagementService.listUsers`](../src/app/core/services/user-management.service.ts) simply delegates to the injected API:

```ts
listUsers(request: UserListRequest): Observable<PaginatedResult<User>> {
  return this.userApi.list(request);
}
```

That thin method is useful because the component depends on business-service semantics rather than the token directly.

### Step 4: the configured repository implements behavior

[`MockUserRepository.list`](../src/app/core/repositories/mock-user.repository.ts) does the work:

1. Normalize the search text.
2. Filter by name, email, or job title.
3. Filter by status, role, and department.
4. Sort by the selected field and direction.
5. Slice the selected page.
6. Return a `PaginatedResult<User>` after a simulated delay.

The repository returns cloned objects. This prevents the UI from accidentally mutating repository state directly.

### Step 5: the component updates signals

```ts
this.result.set(page);
this.loading.set(false);
```

The template reads those signals and renders either skeletons, the table, or the empty state.

### Step 6: the template renders

[`user-management.component.html`](../src/app/features/users/user-management/user-management.component.html) uses `@for` with a stable user ID. Each row renders shared avatars and status badges and calls page methods for details, editing, or status changes.

### Why this architecture helps

The UI component knows:

- What request to send.
- How to show loading and error states.
- How to render the result.

It does not know:

- Whether data comes from memory or HTTP.
- How filtering is implemented.
- Where persistence lives.

That separation is what makes a REST replacement realistic.

## Request path 2: search with debounce

The search field belongs to a Reactive Form:

```ts
this.filterForm.controls.search.valueChanges
  .pipe(debounceTime(280), takeUntilDestroyed(this.destroyRef))
  .subscribe((search) => {
    this.updateQuery({ search, page: 1 });
  });
```

The steps are:

1. User types.
2. The form control emits every value change.
3. `debounceTime(280)` waits for a pause in typing.
4. The query signal is updated.
5. The query subject receives the new request.
6. `switchMap` starts the new request and abandons an older in-flight one when necessary.
7. The new page replaces the old result.

Without debounce, every keystroke would cause a request. Without `switchMap`, a slow earlier request could arrive after a faster later request and overwrite the correct result.

## Request path 3: invite a member

### Form creation

[`UserFormDialogComponent`](../src/app/features/users/user-form-dialog/user-form-dialog.component.ts) creates a non-nullable form group. Each control starts with a concrete value, so TypeScript does not have to treat every value as nullable.

### Validation

The email field uses three layers:

- A custom required/trimmed-length validator.
- The browser/Angular email validator.
- An asynchronous email availability validator.

The async validator calls `UserManagementService.isEmailAvailable`, maps the boolean response to either `null` or `{ emailTaken: true }`, handles network failure, and takes one result.

### Submit

`submit()`:

1. Marks the form as submitted and touched.
2. Stops if the form is invalid, pending, or already saving.
3. Reads the raw values.
4. Calls the feature service.
5. Disables the submit UI while saving.
6. Shows a toast and closes on success.
7. Displays a server error without closing on failure.

### Repository mutation

The mock repository validates uniqueness again, creates the `User`, writes the new array to `localStorage`, and returns the new user through an observable.

### Parent refresh

The dialog emits `saved`. The page handles that output by refreshing the current query and statistics:

```html
<app-user-form-dialog ... (saved)="memberSaved()" />
```

This is a typed child-to-parent event. The child does not import the parent page.

## Request path 4: view a member

The page immediately opens the drawer with the row’s user data:

```ts
this.detailsUser.set(user);
this.detailsOpen.set(true);
```

It separately loads detailed activity:

```ts
this.userService
  .getDetails(user.id)
  .pipe(finalize(() => this.detailsLoading.set(false)))
  .subscribe(({ user, activity }) => {
    this.detailsUser.set(user);
    this.detailsActivity.set(activity);
  });
```

`getDetails` uses `forkJoin` to wait for user details and activity together. `forkJoin` is appropriate because both requests should produce one final combined value. If either fails, the combined observable fails.

## Request path 5: suspend or activate

1. A row action calls `requestStatusToggle(user)`.
2. The page stores the target user and opens a confirmation dialog.
3. `confirmAction()` decides the next status.
4. The dialog enters a loading state.
5. The service calls `setStatus`.
6. The mock repository updates the correct user and persists the result.
7. The page refreshes the table and statistics.
8. If the detail drawer is open for that user, its local copy is updated.
9. A toast confirms the outcome.

Confirmation copy is derived with a `computed` signal, so the same dialog component can display different text depending on the pending action.

## Request path 6: bulk actions

Bulk selection is a `Set<string>` stored in a signal. A set makes membership checks and additions constant time.

The page derives:

- Whether every visible row is selected.
- Whether only some visible rows are selected.
- The total selection count.

The user chooses activate or suspend. The selection count and action are stored, then the shared confirmation dialog appears. Confirming pushes the action into a `Subject`, which is handled with `switchMap`:

```ts
this.bulkActionTrigger
  .pipe(switchMap((action) => this.userService.bulkSetStatus(ids, action)))
  .subscribe((users) => {
    this.selectedIds.set(new Set());
    this.refresh();
  });
```

The real handler also catches errors and finalizes the loading state.

## Request path 7: CSV export

[`UserManagementService.exportUsers`](../src/app/core/services/user-management.service.ts) combines two observables:

- All users matching the current filters.
- All roles for mapping role IDs to labels.

It then:

1. Builds headers and rows.
2. Escapes every value.
3. Neutralizes spreadsheet formula prefixes such as `=`, `+`, `-`, and `@`.
4. Adds a UTF-8 byte order mark.
5. Creates a browser `Blob`.

The component starts a download with a temporary object URL.

## Request path 8: build a custom role

[`RoleFormDialogComponent`](../src/app/features/roles/role-form-dialog/role-form-dialog.component.ts) uses Reactive Forms for name and description. The role starts with no permissions.

On success:

1. `RoleManagementService` adds the returned role to its signal state.
2. The dialog emits the new role.
3. The page switches the role editor to the new role.
4. The user configures permissions.

The role page maintains a working draft separately from the saved role:

- `activeRole` comes from service state.
- `draftName`, `draftDescription`, and `draftPermissions` are editable.
- `hasUnsavedChanges` compares draft and saved state.

This separation prevents typing from modifying shared service state before the user clicks Save.

## Request path 9: save permissions

Permission IDs are stored in a `Set<string>`. Toggling one permission creates a new set and emits it through the signal. Creating a new set matters because an in-place mutation would not notify signal consumers.

Module-level and global controls operate on the same set:

- Toggle one permission.
- Toggle every permission in a module.
- Select all permissions in the application.
- Deselect all.

On save:

1. Validate the draft name.
2. Check for a duplicate custom-role name.
3. Call `RoleManagementService.updateRole`.
4. The service calls the repository.
5. The repository persists the role and owner protection rules.
6. Service state is updated with the returned role.
7. The page resets its draft to the saved version.

## Request path 10: unsaved role changes

The role page protects changes in three ways:

- Switching roles within the page opens a custom confirmation dialog.
- Navigating to another route triggers `CanDeactivate`.
- Reloading or closing the browser tab triggers `beforeunload`.

The router guard returns a boolean:

```ts
canDeactivate(): boolean {
  return !this.hasUnsavedChanges() || window.confirm('Discard unsaved changes?');
}
```

Angular can also support an observable or promise guard for a fully asynchronous custom flow. This implementation uses the browser prompt for route-level navigation and a reusable custom dialog for in-page switching.

## Moving from mock to REST

The project intentionally separates the API contract from its implementation.

### Current contract

```ts
export interface UserApi {
  list(request: UserListRequest): Observable<PaginatedResult<User>>;
  getStatistics(): Observable<UserStatistics>;
  getById(id: string): Observable<User>;
  getActivity(id: string): Observable<UserActivity[]>;
  isEmailAvailable(email: string, excludeUserId?: string): Observable<boolean>;
  invite(request: InviteUserRequest): Observable<User>;
  update(id: string, request: UpdateUserRequest): Observable<User>;
  setStatus(id: string, status: 'active' | 'suspended'): Observable<User>;
  bulkSetStatus(ids: readonly string[], action: BulkUserAction): Observable<User[]>;
}
```

### Add HTTP

In `app.config.ts`, add `provideHttpClient()`.

### Implement the adapter

A REST implementation might look like this:

```ts
@Injectable()
export class RestUserRepository implements UserApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  list(request: UserListRequest): Observable<PaginatedResult<User>> {
    const params = new HttpParams({
      fromObject: {
        search: request.search,
        status: request.status,
        roleId: request.roleId,
        department: request.department,
        sortBy: request.sortBy,
        sortDirection: request.sortDirection,
        page: request.page,
        pageSize: request.pageSize,
      },
    });
    return this.http.get<PaginatedResult<User>>(this.baseUrl, { params });
  }

  invite(request: InviteUserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  // Implement the remaining methods using GET, PATCH, and DELETE.
}
```

### Swap the provider

```ts
{ provide: USER_API, useClass: RestUserRepository }
```

No member page or dialog should need to change.

### Production concerns to add

- Map backend DTO fields if they differ from UI models.
- Normalize HTTP errors into user-safe messages.
- Use interceptors for authentication and correlation IDs.
- Coordinate server pagination, sorting, and filtering contracts.
- Ensure the backend enforces permissions and system-role protections.
- Use a streaming export endpoint for very large directories.
- Decide whether email availability needs a debounce at the HTTP layer as well.

The current mock is useful, but client-side checks are never a substitute for server-side authorization.

## Where to read next

For the state and stream details, continue with [RxJS and state](./04-rxjs-and-state.md). For forms, guards, testing, and tooling, continue with [Forms, routing, testing, and tooling](./05-forms-routing-testing-tooling.md).
