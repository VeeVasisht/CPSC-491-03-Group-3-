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
# We Travel Structure

After commits the main branch should look like the following tree.

app/
│   ├── components/
│   │   ├── LoginForm.tsx
│   │   ├── LogoutButton.tsx
│   ├── firebase/
│   │   ├── auth.integration.test.ts
│   │   ├── auth.test.ts
│   │   ├── auth.ts
│   │   ├── firebase.ts
│   │   └── loginLogout.test.ts
│   ├── models/
│   │   ├── login.test.ts
│   │   ├── login.ts
│   │   ├── userProfile.test.ts
│   │   └── userProfile.ts
│   ├── routes/
│   │   ├── home.tsx
│   │   └── login.tsx
│   └── welcome
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
├── pages/
│   ├── ForgotPassword.jsx
│   └── AccountSettings.jsx
├── public/
│   └── favicon.ico
├── .dockerignore
├── .firebaserc
├── .gitignore
├── Dockerfile
├── README.md
├── firebase.json
├── firestore-debug.log
├── firestore.indexes.json
├── firestore.rules
├── package-lock.json
├── package.json
├── react-router.config.js
├── tsconfig.json
├── vite.config.ts
└── we_travel.jsx
