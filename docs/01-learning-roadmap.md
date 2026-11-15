# Six-Week Angular Learning Roadmap

This plan is optimized for a developer who already knows React and Next.js. It alternates short theory blocks with changes to this real codebase.

## Success criteria

You are finished with the roadmap when you can do all of the following without copying another feature blindly:

- Create a standalone Angular component with an input, output, signal state, and typed model.
- Explain when a value belongs in component state, a service, or a repository.
- Use an observable, compose operators, and clean up a subscription.
- Build and validate a Reactive Form, including a custom asynchronous validator.
- Add a lazy route and explain how its guard works.
- Replace a mock repository with an HTTP repository.
- Run tests, read a production build, and diagnose a responsive layout problem.
- Add a small feature with loading, empty, success, and error states.

## Weekly plan

| Week | Main topic                                  | Project outcome                                         | Estimated time |
| ---- | ------------------------------------------- | ------------------------------------------------------- | -------------- |
| 1    | TypeScript and Angular mental model         | Read and explain every file in the application shell    | 5–7 hours      |
| 2    | Components, templates, signals, and styling | Add a reusable component and a computed dashboard value | 5–7 hours      |
| 3    | Dependency injection, services, and RxJS    | Trace and extend a complete data-loading flow           | 6–8 hours      |
| 4    | Reactive Forms and API boundaries           | Add a validated field and a REST adapter in a branch    | 6–8 hours      |
| 5    | Routing, guards, testing, and accessibility | Add a route and tests for an isolated component/service | 5–7 hours      |
| 6    | Refactoring, performance, and production    | Complete one advanced exercise and document the result  | 5–7 hours      |

## Phase 0: Orientation

**Time:** 45–60 minutes

**Read:**

- [Angular mental model](./02-angular-core-concepts.md)
- [Project code tour](./03-project-code-tour.md), sections “Request path” and “Directory responsibilities”

**Do:**

1. Run `npm install` and `npm start`.
2. Open every main route and open the invite and role dialogs.
3. Open DevTools and inspect one member row in the DOM.
4. Run `npm run build` and `npm test -- --watch=false`.

**Checkpoint:** You can explain why the browser can update the table after a mock request even though there is no backend.

## Phase 1: TypeScript for application design

**Time:** 4–5 hours across two or three sessions.

You do not need to relearn JavaScript. Focus on the TypeScript features this project uses to make invalid states difficult.

**Topics:**

- Interfaces and structural typing.
- `readonly` properties.
- String-literal unions such as `UserStatus`.
- Optional values and strict null checks.
- Generic types such as `Observable<User>` and `PaginatedResult<T>`.
- `Pick<User, ...>`.
- `Record<K, V>`.
- `unknown` versus `any`.
- `satisfies`.
- Type predicates like `event is NavigationEnd`.
- Utility types and `Map`/`Set` for relationship and selection state.
- Non-null assertions versus proper narrowing.

**Read:**

- [`user.model.ts`](../src/app/core/models/user.model.ts)
- [`role.model.ts`](../src/app/core/models/role.model.ts)
- [`tsconfig.json`](../tsconfig.json)
- TypeScript sections in [Angular core concepts](./02-angular-core-concepts.md#typescript-features-used)

**Exercise:** Add a `UserTag` string union and an optional `tags?: readonly UserTag[]` field to `User`. Populate one seed user. Follow every compiler error until the build succeeds.

**Checkpoint:** Explain why `status: string` is weaker than `status: UserStatus`, and why `unknown` is useful for caught errors.

## Phase 2: Components, templates, and signals

**Time:** 6–8 hours.

**Topics:**

- Standalone components and the `imports` array.
- Component selector, template, and scoped styles.
- The component class lifecycle.
- Signal state with `signal`, `set`, and `update`.
- Derived state with `computed`.
- Side effects with `effect`.
- Signal inputs: `input` and `input.required`.
- Signal outputs: `output`.
- Two-way model inputs with `model`.
- `ChangeDetectionStrategy.OnPush`.
- Template interpolation, bindings, events, and control flow.
- Why Angular templates use `value()` when reading signals.

**Read:**

- [`avatar.component.ts`](../src/app/shared/avatar/avatar.component.ts)
- [`status-badge.component.ts`](../src/app/shared/status-badge/status-badge.component.ts)
- [`confirm-dialog.component.ts`](../src/app/shared/confirm-dialog/confirm-dialog.component.ts)
- [`user-details-drawer.component.ts`](../src/app/features/users/user-details-drawer/user-details-drawer.component.ts)
- Components and signals in [Angular core concepts](./02-angular-core-concepts.md#components)

**Exercise:** Create a `MemberSummaryCardComponent` that accepts a `User` as a required input and emits `viewRequested`. Render it once in the member page. Then replace a manually computed value with a `computed`.

**Checkpoint:** You can add an input and output without looking it up, and you can explain why a signal getter is called as a function.

## Phase 3: Dependency injection and services

**Time:** 4–5 hours.

**Topics:**

- `@Injectable({ providedIn: 'root' })`.
- The injector tree at a high level.
- `inject()` compared with constructor parameter injection.
- Singleton service scope.
- `InjectionToken`.
- Provider configuration with `useClass`.
- Separating UI state from business logic.
- Why interfaces make adapters swappable.

**Read:**

- [`app.config.ts`](../src/app/app.config.ts)
- [`user-api.ts`](../src/app/core/repositories/user-api.ts)
- [`mock-user.repository.ts`](../src/app/core/repositories/mock-user.repository.ts)
- [`user-management.service.ts`](../src/app/core/services/user-management.service.ts)
- [`toast.service.ts`](../src/app/core/services/toast.service.ts)
- Dependency injection in [Angular core concepts](./02-angular-core-concepts.md#dependency-injection)

**Exercise:** Add `getDepartments(): Observable<readonly Department[]>` to the user API, implement it in the mock, expose it through the feature service, and use it in the filter instead of the page’s hard-coded array.

**Checkpoint:** You can describe the path from component to service to token to concrete repository and explain which layer should know about `localStorage`.

## Phase 4: RxJS

**Time:** 5–7 hours.

Start with the concept, not operator memorization.

**Topics:**

- Observable, observer, subscription, producer, and consumer.
- Finite versus ongoing streams.
- Creating streams with `of`, `throwError`, and subjects.
- `Subject` versus `BehaviorSubject`.
- The `pipe` model.
- Transformation, filtering, timing, flattening, combining, error handling, and finalization.
- The specific operators used here: `map`, `filter`, `debounceTime`, `switchMap`, `catchError`, `finalize`, `forkJoin`, `take`, `tap`, and `delay`.
- `firstValueFrom` in tests.
- Subscription cleanup with `takeUntilDestroyed`.
- Combining RxJS with signals without duplicating state.

**Read:**

- [RxJS and state guide](./04-rxjs-and-state.md)
- The loading pipeline in [`user-management.component.ts`](../src/app/features/users/user-management/user-management.component.ts)
- The async email validator in [`user-form-dialog.component.ts`](../src/app/features/users/user-form-dialog/user-form-dialog.component.ts)

**Exercise:** Add a `refreshUsers` button that sends the current query through the existing `querySubject`, then add a loading message only when a refresh is user-triggered.

**Checkpoint:** You can explain why `switchMap` is used for the table request and why `forkJoin` is used for details and CSV export.

## Phase 5: Reactive Forms

**Time:** 4–6 hours.

**Topics:**

- Model-driven versus template-driven forms.
- `ReactiveFormsModule`.
- `FormBuilder.nonNullable.group`.
- Nested controls and typed control access.
- Built-in validators.
- Custom validators.
- Asynchronous validators.
- Control states: valid, invalid, touched, dirty, pending.
- Showing errors only after interaction.
- Resetting a form when a dialog opens.
- Server errors versus validation errors.
- Disabling pending submissions.

**Read:**

- [`user-form-dialog.component.ts`](../src/app/features/users/user-form-dialog/user-form-dialog.component.ts)
- [`user-form-dialog.component.html`](../src/app/features/users/user-form-dialog/user-form-dialog.component.html)
- [`role-form-dialog.component.ts`](../src/app/features/roles/role-form-dialog/role-form-dialog.component.ts)
- Forms section in [Forms, routing, testing, and tooling](./05-forms-routing-testing-tooling.md#reactive-forms)

**Exercise:** Add a required `employeeId` field with a `^EMP-\d{4}$` pattern, a helpful error message, and update the request model and repository.

**Checkpoint:** You can distinguish synchronous validation from an async uniqueness check and explain why the submit button respects `form.pending`.

## Phase 6: Routing, guards, and unsaved changes

**Time:** 3–4 hours.

**Topics:**

- `Routes` array and route matching.
- Redirects and wildcard routes.
- Lazy loading with `loadComponent`.
- `RouterOutlet`, `RouterLink`, and `RouterLinkActive`.
- Route title and `data`.
- `CanDeactivate`.
- Listening to router events.
- `beforeunload` for closing or reloading the browser tab.
- Why a custom in-page dialog is better than a browser `confirm` when possible.

**Read:**

- [`app.routes.ts`](../src/app/app.routes.ts)
- [`app.ts`](../src/app/app.ts)
- [`role-management.component.ts`](../src/app/features/roles/role-management/role-management.component.ts)
- Routing section in [Forms, routing, testing, and tooling](./05-forms-routing-testing-tooling.md#routing)

**Exercise:** Add a settings placeholder route and lazy component. Give it a title and connect it from the existing sidebar.

**Checkpoint:** You can explain the difference between navigation within an SPA and a browser document unload.

## Phase 7: HTTP and moving from mock to REST

**Time:** 5–7 hours.

**Topics:**

- `provideHttpClient`.
- Injecting `HttpClient`.
- Typed GET, POST, PATCH, and DELETE.
- Server-side filtering and pagination contracts.
- Mapping API DTOs to UI models.
- Error normalization.
- Query parameters.
- File download as a `Blob`.
- Abort and cancellation behavior through `switchMap` and `HttpClient`.

**Read:**

- [REST adapter walkthrough](./03-project-code-tour.md#moving-from-mock-to-rest)
- [`user-api.ts`](../src/app/core/repositories/user-api.ts)
- [`role-api.ts`](../src/app/core/repositories/role-api.ts)

**Exercise:** Build a `RestUserRepository` behind the existing token. You may use a tiny local JSON server or a mocked backend. Do not change the user page component.

**Checkpoint:** The UI compiles and works with either `MockUserRepository` or `RestUserRepository` selected in `app.config.ts`.

## Phase 8: Testing Angular

**Time:** 4–5 hours.

**Topics:**

- `TestBed`.
- Component fixture creation.
- Asynchronous test setup with `compileComponents` and `whenStable`.
- Router providers in tests.
- Testing services and repositories through public behavior.
- Converting an observable to a promise with `firstValueFrom`.
- Rejected observables and `rejects.toThrow`.
- What to test versus what not to test.

**Read:**

- [`app.spec.ts`](../src/app/app.spec.ts)
- [`mock-user.repository.spec.ts`](../src/app/core/repositories/mock-user.repository.spec.ts)
- [`mock-role.repository.spec.ts`](../src/app/core/repositories/mock-role.repository.spec.ts)
- Testing section in [Forms, routing, testing, and tooling](./05-forms-routing-testing-tooling.md#testing)

**Exercise:** Add tests that reject duplicate email invitations and confirm that filtering by department narrows the result.

**Checkpoint:** You can explain why repository tests do not need Angular’s template compiler.

## Phase 9: Styling, responsiveness, and accessibility

**Time:** 3–5 hours.

**Topics:**

- Component style encapsulation.
- Global CSS variables.
- Grid and flexbox.
- Responsive breakpoints.
- `min-width: 0` and why overflow bugs occur.
- Horizontal scrolling intentionally confined to a child.
- Accessible labels, buttons, dialogs, focus, and live regions.
- `aria-*` attributes.
- Reduced-motion support.
- Semantic table and form markup.

**Read:**

- [`styles.scss`](../src/styles.scss)
- All component `.scss` files
- Accessibility section in [Forms, routing, testing, and tooling](./05-forms-routing-testing-tooling.md#accessibility-and-responsive-layout)

**Exercise:** Run the application at 390 px. Find one control with weak focus treatment and improve it without breaking desktop.

**Checkpoint:** You can diagnose whether horizontal overflow comes from the page, a grid track, or an intentionally scrollable child.

## Phase 10: Build, performance, and final review

**Time:** 3–4 hours.

**Topics:**

- Angular CLI development and production builds.
- Lazy chunk output.
- Build budgets.
- Source maps.
- CSS size and component style budgets.
- `OnPush` and signals.
- Avoiding unnecessary subscriptions and duplicated derived state.
- Prettier and deterministic formatting.

**Read:**

- [`angular.json`](../angular.json)
- [`package.json`](../package.json)
- [Exercises and progress tracker](./06-exercises-and-progress.md)

**Exercise:** Add a feature from the intermediate list and write a short note explaining every architectural decision you made.

**Checkpoint:** You can run the build, interpret the bundle report, and identify why the feature pages are in lazy chunks.

## Suggested weekly rhythm

| Day       | Activity                          | Duration       |
| --------- | --------------------------------- | -------------- |
| Monday    | Read one concept chapter          | 45 minutes     |
| Tuesday   | Follow the relevant project file  | 45 minutes     |
| Wednesday | Change one small thing            | 60 minutes     |
| Thursday  | Write or extend a test            | 45 minutes     |
| Friday    | Review and explain the week aloud | 30 minutes     |
| Weekend   | One larger exercise and cleanup   | 90–120 minutes |

Do not spend a week memorizing operators. Learn the category, then use documentation. The roadmap is successful when you can read unfamiliar Angular code and form a reliable hypothesis about where data comes from and how it changes.
