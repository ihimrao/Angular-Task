# Angular Mental Model for a React/Next.js Developer

This chapter explains the Angular concepts used in the project. It focuses on the differences that matter in real code, not Angular’s entire API.

## 1. How an Angular application starts

React commonly starts with a root component through `createRoot`. Angular uses a bootstrap function and a configuration object.

```ts
// src/main.ts
bootstrapApplication(App, appConfig).catch((error) => console.error(error));
```

[`src/main.ts`](../src/main.ts) starts the root `App` component. [`app.config.ts`](../src/app/app.config.ts) supplies application-wide providers:

- `provideBrowserGlobalErrorListeners()` forwards browser-level errors into Angular’s error handling system.
- `provideRouter(routes)` installs the Angular Router.
- `{ provide: USER_API, useClass: MockUserRepository }` tells the injector which user API implementation to use.
- `{ provide: ROLE_API, useClass: MockRoleRepository }` does the same for roles.

An Angular provider is similar in purpose to a React provider or Next.js module-level service setup, but Angular has a full injector system rather than React Context.

## 2. Standalone components

Every component in this project is standalone. That means it declares its own template dependencies in `imports`.

```ts
@Component({
  selector: 'app-user-details-drawer',
  imports: [AvatarComponent, IconComponent, StatusBadgeComponent],
  templateUrl: './user-details-drawer.component.html',
  styleUrl: './user-details-drawer.component.scss',
})
export class UserDetailsDrawerComponent {}
```

There is no `AppModule`. Older Angular projects used NgModules to group declarations. Modern Angular strongly favors standalone bootstrap and standalone components.

The `imports` array is not the same as JavaScript `import` statements. JavaScript imports bring symbols into the file. The component’s `imports` array tells the template compiler which standalone components, directives, and pipes are legal in that template.

## 3. Component anatomy

An Angular component has three common parts:

| Part             | React analogy               | Responsibility                         |
| ---------------- | --------------------------- | -------------------------------------- |
| TypeScript class | Function component logic    | State, behavior, injected dependencies |
| HTML template    | JSX, but declarative syntax | Structure and event bindings           |
| SCSS file        | CSS Modules, roughly        | Scoped presentation                    |

The metadata links them:

```ts
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
```

The selector is the element name used by a parent template:

```html
<app-avatar [firstName]="user.firstName" [lastName]="user.lastName" />
```

Angular component styles are scoped by default. A `.member-cell` rule in one component does not automatically style every `.member-cell` elsewhere. Shared styles that intentionally apply globally live in [`styles.scss`](../src/styles.scss).

## 4. Templates

An Angular template binds component state to HTML.

### Interpolation

```html
<strong>{{ member.firstName }} {{ member.lastName }}</strong>
```

Interpolation is similar to `{member.firstName}` in JSX. Signal reads require parentheses:

```html
<strong>{{ pageTitle() }}</strong>
```

### Property binding

```html
<app-status-badge [status]="member.status" />
```

Square brackets express input direction: data travels from the parent to the child.

### Event binding

```html
<button type="button" (click)="openEdit(member)">Edit</button>
```

Parentheses express output direction: an event travels from the template to the component class.

### Two-way binding

```html
<app-user-form-dialog [(isOpen)]="formOpen" />
```

This is intentionally similar to a controlled React input, but Angular’s `model` signal creates a paired input and output. If the dialog sets `isOpen` to `false`, the parent’s `formOpen` signal is updated as well.

### Class and style bindings

```html
<tr [class.members-table__row--selected]="selectedIds().has(member.id)"></tr>
```

```html
<span [style.background]="member.avatarColor"></span>
```

Unlike a string `className`, Angular keeps individual class bindings separate. That makes conditional class composition clearer.

## 5. Built-in control flow

Angular 17+ provides block syntax directly in templates. This project does not use the older `NgIf`, `NgFor`, and `NgSwitch` directives.

```html
@if (error()) {
<div role="alert">{{ error() }}</div>
} @else {
<table>
  ...
</table>
}
```

Loops use an explicit track key:

```html
@for (member of result().items; track member.id) {
<tr>
  ...
</tr>
} @empty {
<tr>
  <td>No members found</td>
</tr>
}
```

`track` gives Angular stable identity for items. React’s `key` prop serves a similar purpose. Without stable tracking, Angular cannot update a list as efficiently or preserve DOM state correctly.

Templates can alias a value:

```html
@if (activeRole(); as role) {
<h2>{{ role.name }}</h2>
}
```

This narrows the value in the block, rather like `if (role)` in TypeScript.

## 6. Signals

A signal is a reactive value container.

```ts
protected readonly loading = signal(true);
```

Read it:

```ts
this.loading();
```

Replace it:

```ts
this.loading.set(false);
```

Derive from the previous value:

```ts
this.selectedIds.update((current) => {
  const next = new Set(current);
  next.add(userId);
  return next;
});
```

Signals are not React hooks:

- They can be created in fields, services, constructors, or tests.
- There is no “rules of hooks” ordering problem.
- `set` always creates a write; it does not batch by comparing old and new values.
- Reading a signal from a template or `computed` registers a dependency.
- A `readonly` property containing a signal can still have its value changed through `.set()`. `readonly` prevents replacing the signal object itself.

### Signal mental model

```text
signal          = writable reactive value
computed        = cached value derived from other reactive values
effect          = side effect that reruns when dependencies change
input           = read-only reactive value supplied by a parent
model           = writable input with a paired change output
output          = event emitted by a child
```

### Where signals are used

- Page loading state and dialog visibility.
- Selected user IDs.
- Draft role name, description, and permission set.
- Toast messages.
- Feature-service role state.
- Derived page counts and confirmation copy.

## 7. Computed signals

```ts
protected readonly totalPages = computed(() =>
  Math.max(1, Math.ceil(this.result().total / this.result().pageSize)),
);
```

`computed` is closer to a memoized derived variable than to `useMemo`. Angular tracks the signals read inside it. When `result` changes, Angular lazily recalculates the total when someone reads `totalPages()`. It does not require a dependency array.

Use `computed` for:

- Pagination calculations.
- Counts and percentages.
- A role name resolved from an ID.
- “Has unsaved changes” based on several draft values.
- Confirmation text derived from the current action.

Avoid `computed` when the operation must talk to a server, write another signal, log, or mutate external state.

## 8. Effects

```ts
effect(() => {
  const roles = this.roles();
  if (!this.initialized && roles.length > 0) {
    this.initialized = true;
    this.applyRole(roles[0]);
  }
});
```

An effect reruns when tracked signal dependencies change. It is used sparingly in this project:

- Select the first role when role data first arrives.
- Reset a user or role form when a dialog opens.

Do not use effects as a replacement for every event handler. If a button click changes state, do it in the click method. Effects are best for synchronization with something outside normal render flow or initialization that genuinely reacts to another reactive value.

React developers often use `useEffect` to synchronize derived state. In Angular, prefer `computed` for derivation and avoid an effect unless a side effect is required.

## 9. Signal inputs

```ts
readonly user = input.required<User | null>();
readonly loading = input(false);
readonly roleName = computed(
  () => this.roles().find((role) => role.id === this.user()?.roleId)?.name ?? 'Unassigned',
);
```

The parent supplies inputs:

```html
<app-user-details-drawer [user]="detailsUser()" [loading]="detailsLoading()" />
```

Inputs are read as functions inside the component. Angular knows which template expressions and computed values depend on them.

`input.required<T>()` states that the parent must supply the input. It removes the “undefined because the parent forgot it” problem from the internal component type.

## 10. Signal outputs

```ts
readonly editRequested = output<User>();

requestEdit(): void {
  const value = this.user();
  if (value) this.editRequested.emit(value);
}
```

Parent:

```html
<app-user-details-drawer (editRequested)="openEdit($event)" />
```

An output is the Angular equivalent of a callback prop. It makes the event contract clear and typed. `$event` contains the emitted value.

## 11. Model inputs

```ts
readonly isOpen = model(false);
```

The child can read and update it:

```ts
this.isOpen.set(false);
```

The parent can use a two-way binding:

```html
<app-confirm-dialog [(isOpen)]="dialogOpen" />
```

This is useful for a reusable modal’s open state. Do not use a model merely to let a child mutate a parent’s state directly. Prefer an output when the child should request an action rather than own the shared state.

## 12. Dependency injection

Dependency injection means a class declares what it needs, and Angular’s injector creates or retrieves it.

```ts
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messagesState = signal<readonly ToastMessage[]>([]);
}
```

Another class requests it:

```ts
private readonly toast = inject(ToastService);
```

`providedIn: 'root'` creates one service instance for the root injector, which is why all components see the same toast list and the same role state.

### Why not just import a singleton object?

Dependency injection gives Angular a replaceable composition boundary. Tests can supply a different implementation. The application can select mock or REST repositories. Dependencies can be scoped to a route or component when needed. An imported mutable object cannot be swapped that easily.

### Injection tokens

An interface disappears at runtime, so Angular cannot use `UserApi` as a provider key. `InjectionToken` creates a real runtime token:

```ts
export const USER_API = new InjectionToken<UserApi>('USER_API');
```

The service requests the token:

```ts
private readonly userApi = inject(USER_API);
```

Configuration binds it to a class:

```ts
{ provide: USER_API, useClass: MockUserRepository }
```

This pattern is the foundation for swapping to REST.

## 13. Services

Services hold cross-component state and business operations.

This project has three service types:

1. **Feature services** — [`UserManagementService`](../src/app/core/services/user-management.service.ts) and [`RoleManagementService`](../src/app/core/services/role-management.service.ts) coordinate operations used by pages.
2. **UI services** — [`ToastService`](../src/app/core/services/toast.service.ts) owns application-wide notifications.
3. **Repository services** — the mock repository classes implement storage and validation behind API interfaces.

A page does not import `MOCK_USERS`. It asks a service to list users. The service asks the API token. The configured repository decides where the data comes from.

## 14. Component lifecycle

Angular components have lifecycle hooks such as `ngOnInit`, `ngAfterViewInit`, and `ngOnDestroy`. This project often avoids explicit hooks because:

- Field initializers set up signals and forms.
- `inject()` is callable during construction.
- Effects handle a few reactive synchronization needs.
- `takeUntilDestroyed` handles observable cleanup.

For example, the user page begins loading from its constructor and its field initialization. It does not need `ngOnInit` to assign injected services.

Use `ngOnInit` when you specifically need a lifecycle stage after inputs are initialized and before the view is displayed. Do not add it automatically to every component.

## 15. Change detection and OnPush

Most components use:

```ts
changeDetection: ChangeDetectionStrategy.OnPush,
```

Think of `OnPush` as an optimization boundary. Angular only needs to check the component in response to known triggers such as:

- A signal it reads changes.
- A template event handler runs.
- An input from the parent changes.
- An observable event causes a signal update.

This project updates signals after asynchronous operations, so the UI reliably receives the new state. With OnPush, mutating a plain object property without changing a signal or observable can fail to update the view.

React also encourages immutable updates, but for a different reason: React must detect changed state. Angular signals provide the dependency notification. Always update signals through `set` or `update`.

## 16. Observables versus signals

Signals and observables solve different problems.

| Signals                           | Observables                                                |
| --------------------------------- | ---------------------------------------------------------- |
| Hold a current value              | Represent a stream that may emit zero, one, or many values |
| Read synchronously with `value()` | Usually consumed by subscribing or using `async`           |
| Excellent for view state          | Excellent for requests, events, and complex composition    |
| Lazily track dependencies         | Operators transform streams over time                      |

This project deliberately uses both:

- Signals hold current UI state.
- Observables represent repository calls and value-change/form-event streams.
- Services expose observables.
- Components subscribe, then write results into signals.

There is no requirement to choose one exclusively.

## 17. Reactive Forms

Reactive Forms keep form state and validation in the component class.

```ts
private readonly formBuilder = inject(FormBuilder);

protected readonly form = this.formBuilder.nonNullable.group({
  firstName: ['', [this.requiredText(2)]],
  email: ['', [this.requiredText(3)], [this.emailAvailabilityValidator()]],
});
```

Template:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <input formControlName="firstName" />
</form>
```

Important states:

- `invalid`: at least one validator fails.
- `touched`: the user focused and blurred the control.
- `dirty`: the user changed the value.
- `pending`: an async validator is still running.
- `valid`: no errors and not pending.

This project marks values as touched during submit so validation messages appear even when the user never interacted with a required field.

## 18. Routing

Routes are data, not JSX:

```ts
{
  path: 'users',
  title: 'People · Nexora',
  loadComponent: () =>
    import('./features/users/user-management/user-management.component').then(
      (module) => module.UserManagementComponent,
    ),
}
```

The router matches the URL and renders the selected component inside `<router-outlet />`.

`loadComponent` creates a lazy chunk. Angular downloads that feature only after navigation reaches it, keeping the initial bundle smaller.

A `CanDeactivate` guard asks a component whether navigation may continue. The role page uses that to protect unsaved permission changes.

## 19. TypeScript features used

### Interfaces and structural typing

```ts
export interface User {
  readonly id: string;
  readonly email: string;
  readonly status: UserStatus;
}
```

TypeScript checks the shape. The data does not need to be created by a class implementing `User`.

### Literal unions

```ts
export type UserStatus = 'active' | 'invited' | 'suspended';
```

This makes typo-based invalid states compiler errors rather than runtime bugs.

### Generics

```ts
export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
}
```

`T` preserves the item type. `PaginatedResult<User>` gives a typed user page; `PaginatedResult<Role>` could be used for roles.

### `Pick`

```ts
export type UpdateUserRequest = Pick<
  User,
  'firstName' | 'lastName' | 'email' | 'roleId' | 'department' | 'jobTitle' | 'phone' | 'location'
>;
```

This derives a narrower request shape from the full entity instead of duplicating property names.

### `Record`

```ts
const labels: Record<UserStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
};
```

It guarantees that every status key has a label.

### `unknown`

Caught values are typed as `unknown` because JavaScript can throw any value. Code checks `error instanceof Error` before reading `.message`.

### `satisfies`

```ts
const updated = { ...user, status } satisfies User;
```

This checks that the expression matches `User` while retaining the useful inferred type.

## 20. CSS and accessibility

The project uses CSS rather than Angular Material or a utility framework.

- CSS custom properties define global color, spacing, and shadow tokens.
- Component SCSS keeps local rules close to the view.
- CSS grid builds the dashboard and role editor.
- Flexbox handles toolbars, row actions, and compact controls.
- Media queries transform the table into cards on mobile.
- `min-width: 0` permits grid and flex children to shrink.
- Animations respect `prefers-reduced-motion`.

Accessibility details include semantic buttons, table headers, form labels, `aria-label`, `role="dialog"`, `aria-modal`, `aria-live` toasts, focus-visible outlines, and keyboard escape handling.

Accessibility is not a single Angular feature. It is a property of the rendered HTML, interaction behavior, and visual design.

## 21. What the project does not use

These omissions are intentional and worth understanding:

- **NgModules:** standalone components replace them.
- **NgRx or another store library:** signals are sufficient for this scope.
- **Angular Material:** the UI uses custom components and CSS.
- **HttpClient:** the mock repositories imitate API observables; a REST adapter adds `HttpClient`.
- **SSR:** this Angular project is a browser SPA. Angular supports SSR, but it is not configured.
- **Zone.js-specific logic:** the app does not depend on global mutable state or manual change detection.
- **Pipe-heavy templates:** date helpers are functions because they are also reused in TypeScript.
- **A component library:** small shared components demonstrate component design directly.

After this chapter, read the [project code tour](./03-project-code-tour.md) and follow the request path from click to rendered row.
