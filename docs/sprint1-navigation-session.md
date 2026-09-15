# Sprint 1 – Navigation & Session Management

## Developer
Burhan Taskin

## Role
Person 5 – Navigation & Session Management

## What I Worked On

For Sprint 1, my main responsibility was setting up the navigation and session management for WeTravel. My part makes sure the app knows whether a user is logged in or not and sends them to the correct page.

The basic flow I worked on is:

App Opens → Check User Session → Login Page or Main App

If the user is already logged in, they are taken to the main app. If they are not logged in, they are sent to the login page.

## Navigation

I added protected and public routes to separate the logged-in part of the app from the authentication pages.

A user who is not logged in should not be able to access protected pages. Also, if a user is already logged in, they should not be sent back to the login page unless they sign out.

## Session Management

I used Firebase Auth to keep track of the user's session. The app listens for changes in the authentication state and updates the navigation automatically.

I also added persistent sessions so a user can refresh or reopen the app without having to log in again as long as their session is still valid.

## Loading and Errors

While Firebase is checking whether the user has an active session, the app shows a loading screen instead of showing the wrong page for a moment.

I also added an error screen with a retry option in case there is a problem checking the user's session.

## Logout

When the user signs out, Firebase updates their authentication state. The navigation then automatically sends them back to the login page.

I decided to handle logout this way instead of manually redirecting the user because it keeps the navigation connected to the actual authentication state.

## Testing

I added tests for:

- Logged-in users being sent to the main app
- Logged-out users being sent to login
- Loading session state
- Session errors
- Firebase session persistence
- Firebase authentication state changes

Before submitting my code, I will also run:

- `npm test`
- `npm run typecheck`
- `npm run build`

## Team Integration

My part connects with the other Sprint 1 features:

- Person 1 – Registration
- Person 2 – Login and Logout
- Person 3 – User Profile
- Person 4 – Password and Account Management

I am not recreating their features. My part provides the navigation and session system that connects these features together.

## Completion

My Sprint 1 work will be complete once the navigation and session features work correctly, the tests pass, the code is reviewed through a Pull Request by another group member, and the approved code is merged into the group's main branch.
