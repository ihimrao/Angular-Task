# Quick Reference and Glossary

Use this page while reading the code. It is a compact index rather than a replacement for the explanatory chapters.

## Angular and TypeScript API index

| API or feature                       | What it means here                                        | Project example                             |
| ------------------------------------ | --------------------------------------------------------- | ------------------------------------------- |
| `bootstrapApplication`               | Starts a standalone Angular app                           | [`main.ts`](../src/main.ts)                 |
| `ApplicationConfig`                  | Typed application provider configuration                  | [`app.config.ts`](../src/app/app.config.ts) |
| `provideRouter`                      | Installs Angular Router services and directives           | `app.config.ts`                             |
| `provideBrowserGlobalErrorListeners` | Connects browser errors to Angular                        | `app.config.ts`                             |
| `@Component`                         | Declares a component and its metadata                     | All `.component.ts` files                   |
| `selector`                           | HTML element name used by a parent                        | `app-avatar`                                |
| `imports` metadata                   | Template dependencies available to a standalone component | Every component                             |
| `templateUrl` / `styleUrl`           | External template and component stylesheet                | Feature components                          |
| `ChangeDetectionStrategy.OnPush`     | Restricts unnecessary change-checking                     | Most templates                              |
| `signal`                             | Writable reactive state                                   | Loading, draft role, dialogs                |
| `computed`                           | Lazily derived, cached reactive value                     | Page counts, unsaved state                  |
| `effect`                             | Side effect that follows signal dependencies              | Dialog reset, initial role                  |
| `input`                              | Read-only signal input from a parent                      | Avatar, drawer                              |
| `input.required`                     | Input that must be supplied                               | `user` in detail drawer                     |
| `model`                              | Writable input plus paired output                         | Dialog `isOpen`                             |
| `output`                             | Typed event emitted to a parent                           | `saved`, `editRequested`                    |
| `inject`                             | Requests a dependency from the active injector            | Services and components                     |
| `@Injectable`                        | Marks a class available to DI                             | Toast and feature services                  |
| `providedIn: 'root'`                 | Registers a class as a root singleton                     | `ToastService`                              |
| `InjectionToken`                     | Runtime token for an interface contract                   | `USER_API`, `ROLE_API`                      |
| `DestroyRef`                         | Injection token for component destruction cleanup         | User table page                             |
| `takeUntilDestroyed`                 | Completes a stream when its context is destroyed          | Router events, query stream                 |
| `@HostListener`                      | Adds host/document/window listener                        | Escape and before-unload                    |
| `Router`                             | Imperative router API                                     | Root app navigation listener                |
| `NavigationEnd`                      | Router event after successful navigation                  | `App`                                       |
| `RouterOutlet`                       | Location where route component renders                    | Shell template                              |
| `RouterLink`                         | SPA navigation directive                                  | Sidebar                                     |
| `RouterLinkActive`                   | Adds a class for the active route                         | Sidebar                                     |
| `Routes`                             | Route configuration array                                 | `app.routes.ts`                             |
| `loadComponent`                      | Lazy component function                                   | Feature routes                              |
| `title`                              | Document title for a route                                | Feature routes                              |
| `data`                               | Static route metadata                                     | `pageTitle`                                 |
| `canDeactivate`                      | Guard before leaving a route                              | Role page                                   |
| `ReactiveFormsModule`                | Template directives for reactive forms                    | User and role dialogs                       |
| `FormBuilder`                        | Concisely constructs typed forms                          | Form dialogs                                |
| `nonNullable.group`                  | Typed form group without null values                      | User and role forms                         |
| `FormControl` states                 | validity, touched, dirty, pending                         | User form template                          |
| `Validators`                         | Built-in synchronous validators                           | Role creation                               |
| `AsyncValidatorFn`                   | Asynchronous form validator signature                     | Email availability                          |
| `FormGroup.reset`                    | Resets values and state                                   | Dialog opening                              |
| `FormGroup.markAllAsTouched`         | Reveals errors on submit                                  | User and role submit                        |
| `formControlName`                    | Connects input to named control                           | Form templates                              |
| `ngSubmit`                           | Angular form submit binding                               | Form elements                               |
| `HostListener`                       | Declarative document/window listeners                     | Escape handling                             |

## TypeScript features

| Feature           | Example                              | Why it appears                           |
| ----------------- | ------------------------------------ | ---------------------------------------- |
| Union type        | `UserStatus`                         | Prevent invalid state strings            |
| Interface         | `User`, `Role`                       | Define structural domain contracts       |
| Generic           | `Observable<User>`                   | Preserve the value type through streams  |
| Generic interface | `PaginatedResult<T>`                 | Reuse pagination with different entities |
| `Pick`            | `UpdateUserRequest`                  | Derive a narrower entity shape           |
| `Record`          | Status label maps                    | Require all union keys                   |
| `readonly`        | `readonly id: string`                | Prevent accidental property replacement  |
| `unknown`         | caught error variables               | Force safe error narrowing               |
| `instanceof`      | `error instanceof Error`             | Narrow unknown throw values              |
| Type predicate    | `event is NavigationEnd`             | Narrow router event streams              |
| `satisfies`       | Updated user object                  | Validate shape while retaining inference |
| `Map`             | Role ID to role name                 | Efficient ID lookup                      |
| `Set`             | Selected user IDs and permission IDs | Efficient membership and uniqueness      |
| `keyof`           | Form control name parameter          | Keep helper methods type-safe            |
| Optional chaining | `user()?.id`                         | Handle nullable values explicitly        |

## RxJS API index

| API               | Category           | Main project use                           |
| ----------------- | ------------------ | ------------------------------------------ |
| `Observable`      | Type               | Return contract for repository operations  |
| `Subscription`    | Lifecycle          | Created when code calls `subscribe`        |
| `BehaviorSubject` | State/event source | Current user query                         |
| `Subject`         | Event source       | Bulk action trigger                        |
| `of`              | Creation           | Mock request values                        |
| `throwError`      | Creation           | Mock validation and not-found errors       |
| `delay`           | Timing             | Simulate network latency                   |
| `pipe`            | Composition        | Attach operator chain                      |
| `map`             | Transform          | Convert availability boolean to form error |
| `filter`          | Select             | Keep only `NavigationEnd` events           |
| `tap`             | Side effect        | Set loading/error flags                    |
| `debounceTime`    | Timing             | Delay search until typing pauses           |
| `switchMap`       | Flatten/switch     | Keep only latest table request             |
| `catchError`      | Error recovery     | Convert failure to UI state/fallback       |
| `finalize`        | Cleanup            | Always stop loading or saving              |
| `forkJoin`        | Combination        | User + activity; users + roles             |
| `take`            | Limit              | Async validator takes one result           |
| `firstValueFrom`  | Interop/test       | Convert first test response to Promise     |

## Dependency reference

### Runtime dependencies

| Package                      | Why it is present                         |
| ---------------------------- | ----------------------------------------- |
| `@angular/core`              | Components, signals, DI, bootstrap        |
| `@angular/common`            | Common Angular runtime tokens and helpers |
| `@angular/forms`             | Reactive Forms                            |
| `@angular/router`            | SPA navigation and guards                 |
| `@angular/platform-browser`  | Browser bootstrap platform                |
| `@angular/compiler`          | Compiles Angular templates                |
| `rxjs`                       | Observables and stream operators          |
| `tslib`                      | TypeScript helper runtime                 |
| `@fontsource-variable/inter` | Locally bundled Inter font                |

### Development dependencies

| Package                 | Why it is present                               |
| ----------------------- | ----------------------------------------------- |
| `@angular/cli`          | Create, serve, build, and test                  |
| `@angular/build`        | Modern Angular application builder              |
| `@angular/compiler-cli` | Angular template/type compilation               |
| `typescript`            | Type checking and compilation                   |
| `vitest`                | Unit test runner                                |
| `jsdom`                 | DOM environment for tests                       |
| `prettier`              | Consistent code/document formatting             |

## Glossary

**Binding**
Connection in a template between data or an event and the view. Square brackets are inputs, parentheses are events.

**Bootstrap**
The process that starts the root Angular application.

**Change detection**
Angular’s process of deciding which views need updating. Signals and OnPush reduce unnecessary checks.

**Component**
A class plus template and styles, identified by a selector.

**Computed**
A cached derivation that tracks signals read inside it.

**DI / Dependency Injection**
A system that creates and supplies dependencies through an injector rather than requiring classes to construct them manually.

**Directive**
Behavior or template syntax applied to an element. Reactive form bindings are directives. This project mostly uses built-in control-flow syntax instead of structural directives.

**Effect**
A side effect that reruns when signals it reads change.

**Form control**
An object holding a value, validation state, and events for one field.

**Form group**
A collection of controls with an aggregate validity/value state.

**Guard**
A router hook that can permit or block navigation.

**Host listener**
An event handler attached to a component host or a global target such as `document`.

**Injection token**
A runtime key used to request or provide a value that is not a concrete class.

**Input**
Data provided by a parent component.

**Lazy loading**
Loading a feature’s code only when its route is visited.

**Observable**
A description of zero or more values over time; consumption starts with subscription or another consumer.

**Operator**
A function that transforms or coordinates an observable stream.

**Output**
A typed event emitted by a child component for its parent.

**Provider**
Configuration that determines how a dependency token is resolved.

**Reactive Form**
A form model built in TypeScript, with Angular-managed values and validation.

**Repository**
An adapter that implements a data-access contract. Components do not know whether it is mock, HTTP, GraphQL, or IndexedDB.

**Route**
A mapping from a URL path to a component and related behavior.

**Service**
A class intended for shared logic, data, or state, usually registered through DI.

**Signal**
A reactive value getter with `.set` and `.update`; dependencies are tracked when it is read.

**Standalone component**
A component that declares its template imports itself rather than belonging to an NgModule.

**Strict mode**
TypeScript settings that reject many unsafe null and implicit-type patterns.

**Subject**
An observable and observer that broadcasts pushed values.

**Subscription**
The active consumer of an observable stream and the object used to cancel it.

**Template**
Angular’s HTML-based declarative view format.

**Two-way binding**
A paired input/output convention that reads and writes the same value.

## Reading symbol cheat sheet

```ts
const count = signal(0); // create writable state
count(); // read value
count.set(1); // replace value
count.update((n) => n + 1); // derive next value
```

```ts
const double = computed(() => count() * 2); // derived
```

```ts
input.required<User>(); // parent must provide
input(false); // parent may omit
model(false); // parent uses [(value)] if needed
output<User>(); // child emits to parent
```

```html
[property]="expression" input direction (event)="handler($event)" output direction [(model)]="value"
input and output together
```

```ts
source$
  .pipe(
    map((value) => transform(value)),
    catchError((error) => fallback()),
  )
  .subscribe((value) => this.state.set(value));
```

Once this shorthand looks familiar, revisit the project and choose one feature to trace without opening the documentation.
