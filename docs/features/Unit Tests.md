Technical Feature: Unit Tests
=============

Overview
--------

Introduce unit tests for parts of the code where it is useful.

Requirements
------------

- Unit tests for queries and mutations in Convex code.
- Unit tests for React components including what they display and the effects of user interactions.

Convex function tests
---------------------

Convex queries and mutations are tested with [convex-test](https://docs.convex.dev/testing/convex-test) and Vitest. Test files live in `convex/**/*.test.ts` and run in the edge-runtime environment.

**Covered:**

- `words.listByUserAndLanguage` — unauthenticated (empty), authenticated with no words, locale-sorted results (including en vs sv), language filter, and user isolation.


