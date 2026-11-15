# Forms, Routing, Testing, and Tooling

This chapter covers the Angular systems around the main member and role features: Reactive Forms, the Router, component lifecycle, tests, styling, accessibility, and project tooling.

## Reactive Forms

Angular has two form styles:

- **Template-driven forms** put more form logic in the template.
- **Reactive Forms** define controls and validators in TypeScript.

This project uses Reactive Forms because the forms have typed values, conditional fields, async validation, server errors, reset behavior, and reusable dialog components.

### Setup

Import `ReactiveFormsModule` in the standalone component:

```ts
@Component({
  imports: [ReactiveFormsModule, IconComponent],
})
```

Import the module in JavaScript:

```ts
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
```

Both steps are required. The JavaScript import gives the class access to the API. The component `imports` metadata makes directives such as `formGroup` and `formControlName` legal in the template.

### Build a typed form

```ts
private readonly formBuilder = inject(FormBuilder);

protected readonly form = this.formBuilder.nonNullable.group({
  firstName: ['', [Validators.required]],
  lastName: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]],
  roleId: ['', [Validators.required]],
  department: ['Engineering' as Department],
});
```

`nonNullable.group` means the initial strings and selected department are not nullable. Accessing `form.controls.email.value` stays a string rather than `string | null`.

The initial value and validators form one control definition:

```text
'initial value'          first array item
[validators]             second array item
[asyncValidators]        optional third array item
```

### Connect the template

```html
<form [formGroup]="form" (ngSubmit)="submit()" novalidate>
  <input type="email" formControlName="email" />
  <button type="submit">Save</button>
</form>
```

`[formGroup]` attaches the root form. `formControlName` connects an input to the matching control. `(ngSubmit)` is Angular’s form submit event. `novalidate` prevents native browser validation UI from competing with the custom interface.

### Read values

```ts
const values = this.form.getRawValue();
```

`getRawValue()` includes disabled controls. For normal values, `this.form.value` is also available. The typed form ensures the raw object matches its declared control structure.

### Validation state

The form dialog uses:

```ts
if (this.form.invalid || this.form.pending || this.saving()) return;
```

- `invalid` means at least one control has an error.
- `pending` means an async validator is still running.
- `saving` prevents duplicate submissions.

It shows field errors only when the control is touched, dirty, or the form has been submitted:

```ts
control.hasError(error) && (control.touched || control.dirty || this.submitted());
```

This avoids showing red errors immediately on an untouched empty form.

### Marking interaction on submit

```ts
this.submitted.set(true);
this.form.markAllAsTouched();
```

If the user clicks submit without touching a required field, the errors become visible.

### Reset when a dialog opens

The user dialog uses an effect:

```ts
effect(() => {
  if (!this.isOpen()) return;
  const current = this.user();
  this.form.reset(current ? userValues(current) : emptyValues());
});
```

This keeps the component mounted while ensuring each opening starts with the correct invite or edit values.

### Custom synchronous validators

Angular validators are functions that return either `null` or an error object:

```ts
private requiredText(minLength: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    if (!value) return { required: true };
    if (value.length < minLength) return { minlength: true };
    return null;
  };
}
```

This validator trims before checking, which prevents a name containing only spaces from passing.

The role form uses built-in validators:

```ts
Validators.required;
Validators.minLength(2);
Validators.maxLength(40);
```

### Asynchronous validators

The email uniqueness check is asynchronous:

```ts
private emailAvailabilityValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    if (!value || control.hasError('email')) return of(null);

    return this.userService.isEmailAvailable(value, this.user()?.id).pipe(
      map((available) => (available ? null : { emailTaken: true })),
      catchError(() => of(null)),
      take(1),
    );
  };
}
```

An async validator does not return a promise by accident; it deliberately returns an observable of validation results. Angular watches completion and updates the control’s `pending` and validation state.

The `excludeUserId` argument matters when editing: the current user should be allowed to keep their own email.

### Server errors

Client validation cannot guarantee uniqueness or authorization. The repository checks email uniqueness again and the server would enforce it in production.

Server error display uses a separate `serverError` signal:

```ts
error: (error: unknown) => {
  this.serverError.set(messageFrom(error));
};
```

This stays visible while the form holds the user’s input and remains open.

### Reactive Forms versus React forms

| React pattern                      | Angular Reactive Forms           |
| ---------------------------------- | -------------------------------- |
| `useState` per field or one object | Typed `FormGroup`                |
| `onChange` handlers                | Form control value changes       |
| Manual validation functions        | Synchronous and async validators |
| `setError`                         | Error objects on controls        |
| `isSubmitted` and `touched` flags  | Built-in control state           |
| Controlled input values            | `formControlName` binding        |

The biggest difference is that Angular owns the form model and offers a consistent state machine for validity, interaction, async checks, and reset.

## Routing

### Routes configuration

```ts
export const routes: Routes = [
  {
    path: 'users',
    title: 'People · Nexora',
    loadComponent: () =>
      import('./features/users/user-management/user-management.component').then(
        (module) => module.UserManagementComponent,
      ),
  },
  {
    path: 'roles',
    title: 'Roles & permissions · Nexora',
    loadComponent: () => import('./features/roles/...').then(...),
    canDeactivate: [(component: RoleManagementComponent) => component.canDeactivate()],
    data: { pageTitle: 'Roles & permissions' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  { path: '**', redirectTo: 'users' },
];
```

Concepts:

- `path` is the URL segment.
- `title` sets the browser document title.
- `loadComponent` creates a lazy-loaded route.
- `canDeactivate` controls leaving the route.
- `data` stores static route metadata.
- `pathMatch: 'full'` prevents the empty route from matching every prefix.
- `**` is the wildcard fallback.

### Router outlet

The shell contains:

```html
<router-outlet />
```

The active route component renders at that location. The shell remains mounted while its routed child changes.

### Router links

```html
<a routerLink="/users" routerLinkActive="nav-link--active">Members</a>
```

`RouterLink` changes the URL without a full document request. `RouterLinkActive` applies the named class when the link’s route is active.

### Listening for navigation

```ts
this.router.events
  .pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    takeUntilDestroyed(),
  )
  .subscribe(() => {
    this.menuOpen.set(false);
    // Read the deepest active route for its pageTitle data.
  });
```

Router events are an observable stream. The type predicate creates a narrowed stream of only successful navigation-end events.

### Lazy loading

The production build reports member and role features as separate lazy chunks. The browser does not download both feature implementations on first load.

The initial route still loads after JavaScript starts. Lazy loading is not the same as server-side rendering.

### CanDeactivate

A route guard can return:

- `boolean`
- `Promise<boolean>`
- `Observable<boolean>`
- or a redirect URL in more advanced flows.

The role page currently uses a synchronous browser prompt:

```ts
canDeactivate(): boolean {
  return !this.hasUnsavedChanges() || window.confirm('Discard unsaved changes?');
}
```

This is functional and easy to reason about, but a production design could connect the guard to the reusable confirmation dialog. That requires returning a promise or observable from the guard and deciding whether to retry navigation after confirmation.

### Browser unload

Route guards only run inside the Angular router. Reloading the tab, closing it, or entering a different external URL needs a document-level event:

```ts
@HostListener('window:beforeunload', ['$event'])
warnBeforeUnload(event: BeforeUnloadEvent): void {
  if (this.hasUnsavedChanges()) {
    event.preventDefault();
    event.returnValue = '';
  }
}
```

Modern browsers control the exact wording and may only show the prompt after user interaction.

## Component lifecycle and hosts

`@HostListener` declares an event listener on the host element, document, or window:

```ts
@HostListener('document:keydown.escape')
onEscape(): void {
  if (this.isOpen()) this.close();
}
```

This is a declarative lifecycle-integrated listener. Angular removes it with the component.

Other lifecycle ideas:

- `ngOnInit` runs after Angular has initialized input bindings.
- `ngOnDestroy` is the old explicit cleanup hook.
- `DestroyRef` is a more composable cleanup hook used by `takeUntilDestroyed`.
- `afterNextRender` is useful for browser-only work after rendering. This project does not need it.

## Testing

The project uses Angular’s Vitest-based test builder. Tests are divided into:

- A shell component test.
- Repository tests for user behavior.
- Repository tests for role protection.

### TestBed

```ts
await TestBed.configureTestingModule({
  imports: [App],
  providers: [provideRouter([])],
}).compileComponents();

const fixture = TestBed.createComponent(App);
await fixture.whenStable();
```

`TestBed` creates an Angular test injector and compiles the component template.

Important terms:

- **Fixture** — a test wrapper around the created component and its DOM.
- **Component instance** — the TypeScript class being tested.
- **Native element** — the rendered host element.
- **`whenStable`** — waits for pending Angular async work in this setup.

The router provider is required because `App` imports router directives and the outlet. Without it, the template cannot create its router dependencies.

### Plain class tests

Repository tests do not use `TestBed`:

```ts
const repository = new MockUserRepository();
const result = await firstValueFrom(repository.list(request));
```

No template or Angular renderer is involved. Constructing the class directly keeps the test fast and gives clear failures.

### Testing observable errors

```ts
await expect(firstValueFrom(repository.delete('role-owner'))).rejects.toThrow(
  'System roles cannot be deleted.',
);
```

`firstValueFrom` converts the first observable result into a promise, allowing normal async/await assertions.

### What the tests protect

- The root component compiles and renders navigation.
- Search filters the repository.
- Pagination limits the result.
- Invitations create an invited member.
- Status changes update the member.
- System role deletion is rejected.
- Custom roles can be created and deleted.

### Useful next tests

- Duplicate email invitation rejection.
- Email availability excludes the edited user.
- Bulk status updates only selected IDs.
- Role duplicate-name rejection.
- CSV escaping and formula-prefix protection.
- Search debounce with fake timers.
- Unsaved-change computed behavior.
- A component interaction test around the invite dialog.

Do not test private implementation details. Test the behavior a caller observes.

## Styling architecture

### Global tokens

[`styles.scss`](../src/styles.scss) defines CSS variables:

```css
:root {
  --accent: #6955d9;
  --text-strong: #1d2431;
  --border: #e7e8ec;
}
```

Components consume the variables, so visual tokens stay consistent.

### Shared controls

Buttons, fields, dialogs, spinners, toasts, and skeletons use global classes. These are deliberate cross-component primitives, not accidental global leakage.

### Component ownership

Feature-specific styles stay in component SCSS files:

- Member dashboard and table layout.
- Role editor and permission modules.
- Invite drawer.
- User detail drawer.
- Application shell.

This matches React CSS Modules conceptually: the styles belong to the view where they are declared.

### Responsive strategy

The project uses:

- CSS grid for the statistics and main dashboards.
- Flexbox for toolbars and row actions.
- Breakpoints at roughly 1050, 1000, 860, 760, 700, 620, and 520 px.
- A mobile card replacement for the desktop table.
- A horizontal scroller only inside the role list.
- `min-width: 0` on grid/flex children that must shrink.
- Full-page overflow assertions in the screenshot script.

The last point is important. An element inside an overflow container can still make the entire page wider if a grid item’s automatic minimum size prevents shrinking. Developers often fix this by adding `overflow: hidden` to the page, which hides the problem instead of solving it. The role page fix was `min-width: 0` on the grid items.

### Accessibility and responsive layout

The code includes:

- Native buttons and form controls.
- Explicit labels and `aria-label` where text is visually absent.
- `aria-sort` on sortable columns.
- Dialog roles and modal semantics.
- `aria-live` for toast announcements.
- Escape-key handling.
- Visible focus styles.
- Reduced-motion media query.
- Responsive touch targets.

Potential improvements:

- Full focus trapping inside modal dialogs.
- Restoring focus to the trigger after dialog close.
- More complete table row semantics.
- An accessible confirmation flow that avoids `window.confirm`.

Documenting these gaps is part of understanding production quality. A UI can be visually complete and still need accessibility refinement.

## Tooling

### Angular CLI

```bash
npm start
npm run build
npm test -- --watch=false
```

The CLI:

- Compiles templates and TypeScript.
- Runs the development server.
- Injects live reload.
- Bundles lazy chunks.
- Applies production optimization and budgets.

### `angular.json`

The build configuration defines:

- Browser entry point.
- TypeScript config.
- Global styles and assets.
- Initial bundle budget.
- Per-component style budget.
- Production hashing and optimization.
- Development source maps.

The component style budget had to be adjusted because the role interface has a substantial, feature-owned stylesheet. Budgets are not arbitrary; they create a tradeoff between locality and delivered CSS size.

### TypeScript strictness

Enabled checks include:

- `strict`
- `noImplicitOverride`
- `noPropertyAccessFromIndexSignature`
- `noImplicitReturns`
- `noFallthroughCasesInSwitch`
- `strictInjectionParameters`
- `strictInputAccessModifiers`

These settings catch mistakes that JavaScript would let through. When adding a feature, let the compiler guide the type changes instead of casting values to `any`.

### Prettier

Formatting is handled by Prettier:

```bash
npx prettier --check "src/**/*.{ts,html,scss}" "scripts/**/*.mjs" README.md
```

### Screenshot and browser verification

[`scripts/capture-screenshots.mjs`](../scripts/capture-screenshots.mjs) uses `playwright-core` with a locally installed Chromium-compatible browser. It:

1. Starts a browser context.
2. Clears local persistence for deterministic seed data.
3. Loads the member page.
4. Waits for real rows rather than arbitrary timers.
5. Verifies search.
6. Opens member details.
7. Opens the invite form.
8. Loads roles.
9. Changes a permission and verifies the unsaved-change guard blocks navigation.
10. Captures desktop and mobile views.
11. Fails on console errors or horizontal page overflow.

This is an application smoke test plus visual regression foundation. A full production suite would normally use dedicated component and end-to-end test projects rather than keeping all browser verification in one script.

## Which concepts to study next

If you continue beyond this project, prioritize:

1. `HttpClient`, interceptors, and request cancellation.
2. Angular lifecycle hooks in detail.
3. Accessibility and focus management.
4. Component and end-to-end testing.
5. Angular’s router parameter and resolver patterns.
6. State architecture at a larger scale.
7. SSR and hydration only if your product needs them.

Continue to the [practice exercises](./06-exercises-and-progress.md) for a guided path from small edits to a backend replacement.
