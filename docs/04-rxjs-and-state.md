# RxJS and State Guide

RxJS can feel like the steepest part of Angular to a React developer. The fastest way to learn it is to stop treating an observable as “Angular’s Promise” and start treating it as a description of a value that can arrive over time.

This project uses RxJS for repository calls, form streams, request coordination, combined requests, and cleanup. It uses Angular Signals for the current view state that results from those streams.

## The four core ideas

### Observable

An `Observable<T>` describes a producer of zero or more future `T` values. It does nothing by itself until subscribed, unless it shares a live source through a subject or other multicasting construct.

```ts
listUsers(request: UserListRequest): Observable<PaginatedResult<User>> {
  return this.userApi.list(request);
}
```

This says, “When subscribed, I will provide one paginated user result or an error.” It does not mean the request has already happened.

### Subscription

A subscription starts consumption:

```ts
this.userService.listUsers(request).subscribe((result) => {
  this.result.set(result);
});
```

In React, a Promise callback usually runs once. An observable may emit many values. Therefore the subscription may need a defined lifetime.

### Operator

An operator transforms, filters, combines, delays, or handles a stream. Operators are composed inside `pipe`:

```ts
source$.pipe(
  map((value) => value.user),
  catchError(() => of(null)),
);
```

Read a pipeline from top to bottom as the sequence of transformations.

### Subject

A subject is both an observable and an observer. Code can push values into it, and other code can subscribe to them.

- `Subject<T>` emits only values pushed after a subscriber joins.
- `BehaviorSubject<T>` stores a current value and emits it immediately to new subscribers.
- `ReplaySubject<T>` replays a configured history.

This project uses `BehaviorSubject` for the current table query and `Subject` for a user-triggered bulk action.

## Signals versus observables in this app

| Question                                           | Signal                                                               | Observable                                           |
| -------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| Do I need the current value synchronously?         | Yes                                                                  | Usually no                                           |
| Is this a request or event stream?                 | Usually no                                                           | Yes                                                  |
| Does the template need to read it directly?        | Good fit                                                             | Awaiting a signal conversion is usually clearer here |
| Does it emit multiple times over time?             | It changes over time, but does not have completion or error channels | Yes                                                  |
| Do I need operators such as debounce or switchMap? | Use the form or request stream first                                 | Yes                                                  |

The page subscribes to request observables and writes successful results into signals. The template reads signals. This keeps rendering synchronous and simple.

## The table loading pipeline

The central example is in [`user-management.component.ts`](../src/app/features/users/user-management/user-management.component.ts):

```ts
this.querySubject
  .pipe(
    tap(() => {
      this.loading.set(true);
      this.error.set(null);
    }),
    switchMap((request) =>
      this.userService.listUsers(request).pipe(
        catchError((error: unknown) => {
          this.error.set(this.errorMessage(error, 'Could not load members.'));
          return of({ ...EMPTY_PAGE, page: request.page, pageSize: request.pageSize });
        }),
      ),
    ),
    takeUntilDestroyed(this.destroyRef),
  )
  .subscribe((page) => {
    this.result.set(page);
    this.loading.set(false);
  });
```

### Step-by-step behavior

1. The `BehaviorSubject` emits the current request immediately.
2. `tap` runs a side effect without changing the request value.
3. `switchMap` subscribes to the service request.
4. If the query changes, `switchMap` unsubscribes from the previous request and starts the new one.
5. `catchError` catches a request failure and replaces it with a safe empty page.
6. `takeUntilDestroyed` closes the whole chain when the component is destroyed.
7. The final subscriber writes into signals.

### Why `switchMap` matters

Imagine the user types quickly:

```text
Request A: "may"    ────── takes 700 ms
Request B: "maya"   ── takes 200 ms
```

Without `switchMap`, request A may finish after request B and overwrite the newer result with stale data. `switchMap` cancels A when B arrives.

Use `switchMap` when only the latest value matters:

- Search.
- Filter changes.
- Route parameter changes.
- A refresh that supersedes the previous page request.

Use `mergeMap` when every request matters and concurrency is acceptable. Use `concatMap` when order matters and requests must run sequentially. Use `exhaustMap` when repeated clicks should be ignored while one operation is active. This project does not use those three because it does not need their behavior.

## Operator reference for this project

### `map`

Transforms every emitted value.

Project use:

```ts
map((available) => (available ? null : { emailTaken: true }));
```

This turns an availability boolean into an Angular form validation result.

### `filter`

Lets through only values that pass a predicate.

Project use:

```ts
this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd));
```

The type predicate also narrows the stream element type to `NavigationEnd`.

### `tap`

Performs a side effect without changing the emitted value.

Project use:

```ts
tap(() => this.loading.set(true));
```

Use `tap` for logging or exposing intermediate state. Do not hide core transformations in it; use `map` or `switchMap` for actual data changes.

### `debounceTime`

Waits for a quiet period before emitting the latest value.

```ts
this.filterForm.controls.search.valueChanges.pipe(debounceTime(280));
```

This reduces search requests while typing.

Important nuance: this project applies debounce to the form-control stream, while the query itself still emits immediately when filters, sorting, or paging change.

### `switchMap`

Maps each source value to an inner observable and switches to the newest inner observable.

Project uses:

- List users when query changes.
- Run bulk user status updates.

The operator is not only for HTTP. It works with any observable.

### `catchError`

Intercepts an error and returns a replacement observable.

```ts
catchError((error: unknown) => {
  this.error.set(message);
  return of(EMPTY_PAGE);
});
```

An error normally terminates a stream. `catchError` lets the stream recover.

There are two project patterns:

- **Recover into a usable fallback** for table loading.
- **Record the message and rethrow** from role services so the calling component can decide how to present the failure.

### `finalize`

Runs cleanup whether the stream completes or errors.

```ts
.pipe(finalize(() => this.saving.set(false)))
```

This prevents a loading indicator from becoming stuck after failure. It is similar to a `finally` block.

### `forkJoin`

Waits for multiple finite observables to complete and emits one object of their final values.

```ts
forkJoin({
  user: this.userApi.getById(id),
  activity: this.userApi.getActivity(id),
});
```

Use it when:

- All requests are required.
- Each stream is finite.
- You want one combined success value.

Do not use `forkJoin` with an observable that never completes.

### `firstValueFrom`

Converts the first emitted observable value into a Promise in tests:

```ts
const result = await firstValueFrom(repository.list(request));
```

This is convenient when testing a finite API response with normal async/await syntax.

### `take`

Takes a limited number of emissions, then completes.

Project use:

```ts
this.userService.isEmailAvailable(...).pipe(
  map(...),
  catchError(() => of(null)),
  take(1),
)
```

The API should emit once, but `take(1)` makes the validator contract explicit and completes the inner observable.

### `of`

Creates an observable that emits the supplied value synchronously and then completes.

The mock repositories use `of(data).pipe(delay(...))` to imitate an asynchronous request while keeping deterministic data.

### `throwError`

Creates an observable that immediately errors when subscribed.

```ts
return throwError(() => new Error('System roles cannot be deleted.'));
```

`throwError` takes a factory in modern RxJS. Use a factory so the error object is created at subscription time.

### `delay`

Delays every emission by a given number of milliseconds.

Project use:

```ts
return of(result).pipe(delay(NETWORK_DELAY));
```

This makes skeleton loading and disabled states visible in the demonstration. A real HTTP request already has latency, so a REST repository would not add `delay`.

## Subjects in this project

### Query subject

```ts
private readonly querySubject = new BehaviorSubject<UserListRequest>(initialQuery);
```

Why `BehaviorSubject`:

- The current query is a meaningful value.
- New subscribers should start loading immediately.
- The UI also maintains a query signal for synchronous template reads.

When query changes:

```ts
const next = { ...this.query(), ...patch };
this.query.set(next);
this.querySubject.next(next);
```

The two containers are intentional:

- The signal reflects current UI state.
- The subject drives the asynchronous request pipeline.

They must be updated together. A useful intermediate exercise is to encapsulate both behind one method and add a test for consistency.

### Bulk action subject

```ts
private readonly bulkActionTrigger = new Subject<BulkUserAction>();
```

A bulk action is an event, not a current value. A new subscriber should not rerun the previous bulk action. That is why it uses `Subject`, not `BehaviorSubject`.

## Async validators are observables too

Angular Async Validators return an observable or promise of validation errors.

```ts
return this.userService.isEmailAvailable(value, this.user()?.id).pipe(
  map((available) => (available ? null : { emailTaken: true })),
  catchError(() => of(null)),
  take(1),
);
```

Validation result meanings:

- `null`: valid.
- `{ emailTaken: true }`: a field error exists.

The error handler returns valid on infrastructure failure. That prevents a transient availability check failure from permanently blocking the form, but the submit/repository layer still performs final uniqueness validation.

In a stricter application, you may choose to mark the control as pending/unavailable or show “could not verify” rather than silently passing validation.

## Subscription cleanup

Unbounded subscriptions can keep work alive after the related UI is gone. The main cleanup tool in components is:

```ts
private readonly destroyRef = inject(DestroyRef);

source$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(...);
```

This is roughly an `AbortController` and cleanup function combined for RxJS.

Where cleanup is used:

- Router events in the root application component.
- Search value changes.
- Table query stream.
- Bulk action stream.

Finite service subscriptions such as a single invite call still complete, but they should also be considered when a component might be destroyed mid-operation.

`takeUntilDestroyed()` without an explicit `DestroyRef` works in an injection context such as a component constructor. In field initializers or instances where there is no injection context, pass the injected `DestroyRef`.

## Error channels versus error flags

There are three distinct errors in this application:

1. **Validation errors** — an input is not acceptable.
2. **Transport or server errors** — a request failed.
3. **Domain errors** — a business rule rejected the operation, such as deleting a system role.

They should not all be represented by one signal.

- Form errors belong on form controls.
- Page load errors belong in an error signal with retry UI.
- Mutation errors often belong in a dialog or toast.
- Domain protection should also be enforced in the repository/API, not just the UI.

## Cold and hot streams

An observable returned by `of()` or an HTTP call is usually cold: each subscription starts a new producer. A subject is hot: one shared source emits to current subscribers.

A useful rule:

- If a function returns “the result of doing work when subscribed,” it is probably cold.
- If the class already owns a live stream and exposes it, it may be hot.

The mock `list()` method constructs a result only when called, but returns a new observable. The query subject owns a live event coordinator.

## Combining RxJS without overusing it

You do not need to make every variable an observable. This project uses a pragmatic split:

- Signals for current view state.
- RxJS for events, async calls, operator composition, and completion/error flows.
- Services for shared domain state.
- Templates for declarations.

If you add a new feature, start with the simplest correct mechanism:

1. A local value that changes on events: `signal`.
2. A derived current value: `computed`.
3. A shared application state: a root service with signals.
4. A request, stream, or composition: an observable.
5. A network request that only the current view cares about: subscribe and write to signals.

## Exercises

### Beginner

Change the debounce from 280 ms to 500 ms. Explain the behavioral tradeoff rather than just changing the number.

### Intermediate

Add a “Retry” button that emits the existing query again through the `BehaviorSubject`. Confirm that `switchMap` does not overwrite a newer user query.

### Advanced

Refactor the query signal and subject behind one page-state service. Design an API that prevents the two representations from becoming inconsistent, then test search, sorting, and pagination transitions.
