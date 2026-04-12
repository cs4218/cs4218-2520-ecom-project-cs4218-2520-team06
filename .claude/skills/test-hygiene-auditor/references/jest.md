# Jest audit checklist (reference)

Use this as a checklist when Jest is detected. Tailor recommendations to repo conventions.

## Inter-test isolation and cleanup

### Mocks and spies

- Identify usage of `jest.mock(...)`, `jest.spyOn(...)`, manual stubs.
- Common leak: spies/mocks persist across tests.
- Recommend choosing one of the following patterns consistently:
  - `afterEach(() => jest.clearAllMocks())` when you want call history reset but keep mock implementations.
  - `afterEach(() => jest.resetAllMocks())` when you want to reset mock implementations too.
  - `afterEach(() => jest.restoreAllMocks())` when using `spyOn` so original implementations are restored.

Notes:

- `clearAllMocks` does not restore originals for spies.
- `resetAllMocks` can break tests that rely on persistent mock implementations.
- `restoreAllMocks` requires spies and can be too broad if used blindly.

### Module cache and singleton leakage

- Leak vector: module-level state persists across tests due to Node module caching.
- Smells:
  - Tests pass/fail depending on order.
  - Shared caches or singletons created at import time.
- Remedies:
  - Refactor to inject dependencies rather than relying on module singletons.
  - Consider `jest.resetModules()` for suites that truly need import-level isolation.
  - Consider `jest.isolateModules()` for one-off imports.

### Timers and async work

- Fake timers leak if not restored:
  - `jest.useFakeTimers()` without returning to real timers.
  - Always recommend `afterEach(() => jest.useRealTimers())` when fake timers are used.
- Unawaited promises cause hidden cross-test effects.
- Smells:
  - Tests sometimes hang or finish early.
  - Warnings about open handles.

### Globals/env/date/random

- Leak vectors:
  - `process.env` mutated without restoring.
  - `Date.now` mocked without restore.
  - `Math.random` mocked without restore.
- Remediation:
  - Snapshot env at suite start and restore in `afterEach` or `afterAll`.
  - Prefer dependency injection for clocks/random.

## Brittle patterns

- Snapshot-only tests for multi-branch behavior.
- Asserting internals (private methods, implementation calls) rather than observable behavior.
- Over-mocking: mocks return constant payloads that eliminate meaningful data dependence.

## Control-flow and data-dependence coverage tactics

### Control-flow testing ideas

- Identify key branches and add explicit tests for:
  - guard clause triggers
  - error handling / rejected promise branches
  - retry/fallback paths
  - state-machine transitions

Practical mechanics:

- Prefer table-driven tests: `test.each([...])` for branch and partition coverage.

### Data dependence ideas

- Partition inputs into equivalence classes:
  - valid minimal, valid typical, valid maximal
  - invalid type/shape, missing fields, unknown enum
- Control implicit deps explicitly:
  - time, timezone/locale, randomness, feature flags.

## Evidence to cite in reports

- Specific hooks: `beforeEach`, `afterEach`, suite-level setup.
- Specific mock calls: `jest.mock`, `jest.spyOn`.
- Specific timer APIs and usage.
