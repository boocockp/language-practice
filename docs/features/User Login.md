Feature: User Login
===================

Overview
--------

A user needs to login to use the app.  For most collections in the database, the records will belong to one user,
and each user will only be able to see their own data.

Requirements
------------

- On any page of the app, the user can login.
- The login sequence is started by a button at the right hand side of the nav bar, to the right of the current language select
- The only authentication method initially is Email + Password
- There will initially be no support for sending password reset emails
- The user login applies to all browser windows/tabs in which the user has the app open
- The user sees only data records where the `userId` field is the same as the current user's id
- When logged in, the Login button is replaced by the user name (or email if not available) and a logout button.

Technical notes
---------------

- Use Convex Auth as documented at https://docs.convex.dev/auth/convex-auth 
- The current user details should be made available throughout the client app by using a React context
- Most database queries and server function calls will need to include the userId

Implemented
----------

- Convex Auth (email + password, no reset). Current user via `AuthContext` / `useAuth()`. See `docs/ARCHITECTURE.md` (Authentication) and `src/contexts/AuthContext.tsx`.

Future improvements
-------------------

- Distinguish between incorrect login and a technical failure in login when showing the error message to the user
- Ensure that the type of login error (eg Invalid Secret or Invalid Account Id) does not appear in the browser console in production
