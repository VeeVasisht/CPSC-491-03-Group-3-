# CPSC-491-03-Group-3-

All code work for Senior CapStone Project

## Directions for running

Make sure firebase-tools is installed:
```
firebase --version
```

To test the website with emulators run:
```
firebase emulators:start
```
and in another terminal:
```
npm run dev
```
Open the link it gives to the website.
Any data you post / accounts you create can be viewed
in the links the emulator gives you.

## We Travel Structure

After commits the main branch should look like the following tree.

```text
.github/workflows/
│   ├── ci.yml
app/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── PublicOnly.tsx
│   │   │   └── RequireAuth.tsx
│   │   ├── navigation/
│   │   │   └── MainNav.tsx
│   │   └── session/
│   │   │   ├── SessionErrorState.tsx
│   │   │   └──SessionLoadingScreen.tsx
│   ├── css/
│   │   └── registration.css
│   ├── firebase/
│   │   ├── auth.integration.test.ts
│   │   ├── auth.resetPassword.test.ts
│   │   ├── auth.test.ts
│   │   ├── auth.ts
│   │   ├── firebase.ts
│   │   └── firebaseUI.ts
│   ├── models/
│   │   ├── comment.ts
│   │   ├── forgetPassword.test.ts
│   │   ├── forgetPassword.ts
│   │   ├── like.ts
│   │   ├── userProfile.test.ts
│   │   └── userProfile.ts
│   ├── profile/
│   │   └── Profile.tsx
│   ├── registration/
│   │   └── Registration.tsx
│   ├── routes/
│   │   ├── home.tsx
│   │   ├── login.tsx
│   │   ├── profile.tsx
│   │   └── registration.tsx
│   ├── services/
│   │   ├── profileService.test.ts
│   │   └── profileService.ts
│   ├── session/
│   │   ├── AuthSessionContext.tsx
│   │   ├── sessionRouting.test.ts
│   │   ├── sessionRouting.ts
│   │   ├── sessionService.test.ts
│   │   └── sessionService.ts
│   └── welcome/
│   │   ├── logo-dark.svg
│   │   ├── logo-light.svg
│   │   └── welcome.tsx
│   ├── app.css
│   ├── authService.js
│   ├── config.js
│   ├── root.tsx
│   ├── routes.ts
│   └── validation.ts
├── components/
│   ├── Button.jsx
│   └── FormMessage.jsx
├── docs/
│   └──sprint1-navigation-session.md
├── pages/
│   ├── AccountSettings.jsx
│   ├── AccountSettings.test.jsx
│   ├── ForgetPassword.jsx
│   └── ForgetPassword.test.jsx
├── public/
│   └── favicon.ico
├── .dockerignore
├── .env.emulator
├── .firebaserc
├── .gitignore
├── Dockerfile
├── README.md
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── package-lock.json
├── package.json
├── react-router.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── we_travel.jsx (empty file)
```
