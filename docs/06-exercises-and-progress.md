# Exercises and Progress Tracker

The fastest way to learn Angular is to make one small change, predict what will happen, and then use the compiler and browser to verify your prediction.

Work in small commits or copied branches. Keep `npm test -- --watch=false` and `npm run build` passing after each exercise.

## How to use an exercise

For every exercise:

1. Write down the current behavior.
2. Identify the model, state, service, and template involved.
3. Make the smallest change.
4. Fix compiler errors without using `any`.
5. Test the happy path.
6. Test loading, empty, and error behavior if relevant.
7. Check mobile width.
8. Explain what changed in one paragraph.

That last step matters more than the code itself.

## Level 1: Learn the shape of the code

### Exercise 1.1 — Rename a label

Change “People” to “Team directory” in the page header and navigation.

**Files:**

- [`app.html`](../src/app/app.html)
- [`user-management.component.html`](../src/app/features/users/user-management/user-management.component.html)
- [`app.routes.ts`](../src/app/app.routes.ts)

**Learn:**

- Template interpolation and static HTML.
- Route title versus visible heading.
- How a text change affects accessibility names.

**Done when:** The heading, top bar, navigation, browser title, and tests are consistent.

### Exercise 1.2 — Change page size options

Change the table page sizes from `[8, 16, 24]` to `[10, 20, 50]`.

**File:** [`user-management.component.ts`](../src/app/features/users/user-management/user-management.component.ts)

**Learn:**

- Component class fields.
- Pagination request state.
- Why the initial page size must also be updated.

**Done when:** The select shows the new values and each page contains the expected number of members.

### Exercise 1.3 — Change the initial sort

Start with members sorted by department descending.

**Learn:**

- A request is a complete snapshot of query state.
- One default object controls initial sorting.

**Done when:** Reloading preserves the default sort and the column’s `aria-sort` value matches.

### Exercise 1.4 — Trace one click

Without editing code, write a one-page trace for the “Suspend member” action from click to repository mutation.

Include:

- Template handler.
- Page signal changes.
- Confirmation component.
- Service call.
- Repository method.
- Observable lifecycle.
- UI refresh.

**Done when:** Another developer can follow your trace without opening unrelated files.

## Level 2: Components and signals

### Exercise 2.1 — Add a dashboard summary

Add a fifth statistic card for “Members with MFA.” Calculate the number from the repository and expose it through `UserStatistics`.

**Files:**

- [`user.model.ts`](../src/app/core/models/user.model.ts)
- [`mock-user.repository.ts`](../src/app/core/repositories/mock-user.repository.ts)
- [`user-management.component.ts`](../src/app/features/users/user-management/user-management.component.ts)
- [`user-management.component.html`](../src/app/features/users/user-management/user-management.component.html)

**Learn:**

- Extend an interface.
- Update a repository response.
- Add a signal-backed UI card.
- Keep a realistic responsive grid.

**Done when:** The count is correct and the card stacks naturally on mobile.

### Exercise 2.2 — Extract a member summary component

Create a standalone `MemberSummaryComponent` with:

```ts
readonly member = input.required<User>();
readonly selected = input(false);
readonly selectedChange = output<boolean>();
readonly viewRequested = output<User>();
```

Render it inside the table row or mobile card.

**Learn:**

- Reusable component boundaries.
- Required inputs.
- Outputs.
- Template event propagation.

**Done when:** The parent behavior is unchanged and the component does not inject the user service unless it genuinely needs data.

### Exercise 2.3 — Replace a method with a computed signal

Find a template method that derives a value only from signals, such as a role name lookup. Replace it with a `computed`.

**Learn:**

- Dependency tracking.
- Cached derivation.
- Why methods may run more often than computed signals.

**Done when:** The same output appears with no unnecessary service calls or writes.

### Exercise 2.4 — Add a reusable empty-state component

Extract the empty member table state into a shared component with inputs for title, message, icon, and action label. Use it again in the role error state if appropriate.

**Learn:**

- Projection versus inputs. This exercise uses inputs.
- Accessible component APIs.
- Avoiding duplicated presentation.

**Done when:** The component is used at least twice or its second use is clearly planned.

## Level 3: Services, repositories, and RxJS

### Exercise 3.1 — Move department options to an API

Add `getDepartments()` to `UserApi`, implement it in the mock repository, expose it from `UserManagementService`, and load it into a signal.

**Learn:**

- Injection token contracts.
- Business-service delegation.
- Observable-to-signal bridging.
- Replacing a hard-coded UI list.

**Done when:** The filter still works and the page has no direct dependency on repository internals.

### Exercise 3.2 — Add a user-triggered refresh

Add a Refresh button that emits the current query through the query subject. Track refresh loading separately from initial loading if you want a spinner rather than a full skeleton.

**Learn:**

- `BehaviorSubject.next`.
- `switchMap`.
- Distinguishing initial and repeat loading states.

**Done when:** Two rapid refresh clicks do not produce stale results or stuck loading.

### Exercise 3.3 — Simulate a network error

Add a temporary development-only flag to `MockUserRepository.list` that throws an error. Verify the error panel and Retry action, then remove or hide the flag behind a clear query parameter.

**Learn:**

- `throwError`.
- `catchError`.
- Error signal state.
- Retry behavior.

**Done when:** Loading always clears, an error is understandable, and retry recovers.

### Exercise 3.4 — Test bulk behavior

Add repository tests that bulk suspend only selected IDs and leave every other user untouched.

**Learn:**

- `Set` selection.
- Immutable array mapping.
- Observable test conversion.

**Done when:** The tests pass for both activate and suspend.

### Exercise 3.5 — Explain `switchMap` versus `mergeMap`

Write a short note explaining why search should use `switchMap`, then describe a concrete scenario where another product might need `mergeMap`.

**Learn:** Stream concurrency rather than operator memorization.

**Done when:** Your explanation includes a stale-response example.

## Level 4: Forms

### Exercise 4.1 — Add an employee ID

Add a required `employeeId` field with format `EMP-1234`.

**Files to consider:**

- User model.
- Invite request.
- Update request.
- Form group.
- Template.
- Mock repository.

**Learn:**

- Domain types propagate through the system.
- Custom synchronous validation.
- Typed form values.

**Done when:** Invalid IDs are rejected before submit and the repository receives a typed field.

### Exercise 4.2 — Add a confirmation password or invite confirmation

For the invite form, add a checkbox such as “Send a welcome email.” Make its default explicit. If unused by the mock backend, still model the request as optional.

**Learn:**

- Checkbox controls.
- Non-nullable defaults.
- Optional request fields.

**Done when:** The form output is correct whether checked or unchecked.

### Exercise 4.3 — Improve duplicate role validation

Add a synchronous duplicate-name validator that reads the current role list, while keeping the repository check as the final authority.

**Learn:**

- Custom validators with component context.
- Immediate UI feedback versus server enforcement.
- Why client validation is not security.

**Done when:** Renaming a role to an existing name shows an inline error before save.

### Exercise 4.4 — Test the async email validator

Add a focused test for email availability that excludes the edited user.

**Learn:**

- Async validator result types.
- Promise conversion in tests.
- Identity-specific uniqueness rules.

**Done when:** The same email is available for its current owner and unavailable for another member.

### Exercise 4.5 — Prevent role deletion with assignments earlier

The repository rejects deletion of roles with members. Move that decision into the confirmation state so the dialog explains the problem and does not offer a misleading primary action.

**Learn:**

- Derived confirmation config.
- Domain rules versus UI rules.
- Keeping server-side protection even after UX improvement.

**Done when:** The user cannot proceed into a guaranteed-failure deletion action.

## Level 5: Routing and guards

### Exercise 5.1 — Add a settings placeholder

Create a lazy `SettingsPageComponent`, add `/settings`, set its title and route data, and connect the existing sidebar button.

**Learn:**

- Lazy component loading.
- Route data.
- Active navigation.

**Done when:** Deep-linking to `/settings` works and the correct title is displayed.

### Exercise 5.2 — Create a custom route-navigation dialog

Replace the role page’s `window.confirm` guard with the existing confirmation dialog.

**Learn:**

- A guard can return an observable.
- A subject can represent the user’s confirmation.
- Router navigation may be retried after confirmation.

**Done when:** Cancel stays on the role page; Confirm discards and navigates.

### Exercise 5.3 — Preserve filters in the URL

Store search, status, role, department, and sort in query parameters and read them on page load.

**Learn:**

- `ActivatedRoute`.
- Query parameter observables.
- Deep-linkable UI state.
- Interaction between router state and local signals.

**Done when:** Copying and opening the URL restores the same filtered view.

## Level 6: HTTP and production architecture

### Exercise 6.1 — Build a REST user repository

Implement `UserApi` with `HttpClient`.

Minimum endpoints:

```text
GET    /api/users
GET    /api/users/:id
GET    /api/users/:id/activity
GET    /api/users/email-available
GET    /api/users/statistics
POST   /api/users/invitations
PATCH  /api/users/:id
PATCH  /api/users/:id/status
PATCH  /api/users/status/bulk
```

**Learn:**

- `provideHttpClient`.
- Typed HTTP generics.
- `HttpParams`.
- Provider swapping.
- DTO mapping and error handling.

**Done when:** No component imports `MockUserRepository` and changing only the provider switches implementations.

### Exercise 6.2 — Server-side pagination

Make `RestUserRepository` request one page at a time, with sorting and filters supplied as query parameters.

**Learn:**

- Backend contract design.
- Server-driven pagination.
- Stable ordering.

**Done when:** Rapid query changes do not show stale pages and total count remains correct.

### Exercise 6.3 — Add an error interceptor

Normalize API errors into a consistent object, such as:

```ts
interface ApiError {
  status: number;
  code: string;
  message: string;
  field?: string;
}
```

Map HTTP errors into this shape and show field errors when appropriate.

**Learn:**

- `HttpInterceptorFn`.
- Error normalization.
- User-safe messages.

**Done when:** Components do not depend on raw `HttpErrorResponse` details.

### Exercise 6.4 — Test CSV security

Add a utility test proving that a value beginning with `=`, `+`, `-`, or `@` is neutralized when exported.

**Learn:**

- CSV formula injection.
- Why quoting and formula prefixes are different concerns.
- Testing security behavior.

**Done when:** The exported content is still spreadsheet-safe.

### Exercise 6.5 — Add end-to-end tests

Move the current browser smoke flow into dedicated end-to-end tests covering:

- Invite and validation.
- Search and filters.
- Bulk status update.
- Role creation.
- Permission save.
- Unsaved-change cancellation.
- Mobile accessibility.

**Learn:**

- Stable test selectors.
- Test isolation and state reset.
- Browser automation as a delivery check.

**Done when:** Tests do not depend on approximate sleep durations.

## Angular developer progress checklist

Mark concepts only after you can use them and explain their tradeoff.

### Foundations

- [ ] I can explain how `main.ts` starts the app.
- [ ] I can explain what standalone components change.
- [ ] I understand why component styles are scoped.
- [ ] I can read Angular templates confidently.
- [ ] I can explain `ChangeDetectionStrategy.OnPush`.
- [ ] I can distinguish interpolation, property binding, event binding, and two-way binding.

### Signals

- [ ] I can create and update a signal.
- [ ] I can derive a value with `computed`.
- [ ] I know when an effect is appropriate.
- [ ] I can define a required input.
- [ ] I can emit a typed output.
- [ ] I can design a `model` two-way input.
- [ ] I avoid mutating objects or sets held by signals.

### Dependency injection

- [ ] I understand `providedIn: 'root'`.
- [ ] I can inject a service with `inject`.
- [ ] I can explain why interfaces need injection tokens.
- [ ] I can swap a provider implementation.
- [ ] I can decide whether state belongs in a component or root service.

### RxJS

- [ ] I can explain observable, subscription, and operator.
- [ ] I can explain when an observable is cold or hot.
- [ ] I know why `switchMap` avoids stale search results.
- [ ] I can recover from errors with `catchError`.
- [ ] I can reset loading with `finalize`.
- [ ] I can combine finite requests with `forkJoin`.
- [ ] I clean up long-lived component subscriptions.
- [ ] I know when signals are simpler than observables.

### Forms

- [ ] I can build a typed non-nullable form.
- [ ] I understand touched, dirty, invalid, and pending.
- [ ] I can write a custom synchronous validator.
- [ ] I can write and test an async validator.
- [ ] I can keep server errors separate from validation errors.
- [ ] I can reset a dialog form correctly.

### Routing

- [ ] I can define and lazy-load a route.
- [ ] I can use route data and title.
- [ ] I understand active router links.
- [ ] I can explain a `CanDeactivate` guard.
- [ ] I know route guards do not cover browser reload/close.

### Testing and quality

- [ ] I can create a component with `TestBed`.
- [ ] I can test a repository without `TestBed`.
- [ ] I can convert an observable to a test promise.
- [ ] I can read a strict TypeScript error and fix the type.
- [ ] I can run production build and unit tests.
- [ ] I check desktop, mobile, keyboard, and error states.
- [ ] I can identify a horizontal overflow source rather than hiding it.

## Final capstone

Build a small “Departments” feature using the same architecture:

1. Add `DepartmentEntity` and `DepartmentApi`.
2. Implement a persistent mock repository.
3. Add a root feature service.
4. Build a lazy page with statistics.
5. Add search and pagination.
6. Add an edit dialog with Reactive Forms.
7. Add one destructive action with confirmation.
8. Add loading, empty, success, and error states.
9. Add tests for filtering and a protected action.
10. Replace the mock with an HTTP adapter in a second step.

If you can complete the capstone without copying the user page blindly, you have a practical working understanding of this project’s Angular architecture—not just its syntax.
