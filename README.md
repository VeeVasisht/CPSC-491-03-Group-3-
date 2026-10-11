# CPSC-491-03-Group-3-

All code work for Senior CapStone Project

## Automatic Deployment
Once a PR is merged into main, the production build is updated and
deployed to this website: [wetravel-569a0.web.app](wetravel-569a0.web.app)

## Directions for Running the Dev Build

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

### Seeding test data

The emulators need Java 21+ (`java -version`). With the emulators running,
seed a test user and 15 feed posts (some with locations, some without):
```
npm run seed:emulator
```

Then log in at http://localhost:5173/login as `feedtester@wetravel.test` /
`password123` and open `/feed`. Emulator data is wiped when the emulators
stop, so re-run the seed after each restart (it is safe to run repeatedly).

## We Travel Structure

After commits the main branch should look like the following tree.

```text
.github/workflows/
│   ├── ci.yml
app/
│   ├── account_settings/
│   │   ├── AccountSettings.test.tsx
│   │   ├── AccountSettings.tsx
│   │   ├── ForgotPassword.test.tsx
│   │   ├── ForgotPassword.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── PublicOnly.tsx
│   │   │   └── RequireAuth.tsx
│   │   ├── location/
│   │   │   ├── LocationPicker.tsx
│   │   │   └── PostLocation.tsx
│   │   ├── navigation/
│   │   │   └── MainNav.tsx
│   │   ├── saves/
│   │   │   └── SavePostButton.tsx
│   │   └── session/
│   │   │   ├── SessionErrorState.tsx
│   │   │   └── SessionLoadingScreen.tsx
│   │   ├── social/
│   │   │   ├── CommentSection.tsx
│   │   │   └── LikeButton.tsx
│   ├── create_post/
│   │   └── CreatePost.tsx
│   ├── css/
│   │   ├── CreatePost.css
│   │   └── registration.css
│   ├── firebase/
│   │   ├── auth.integration.test.ts
│   │   ├── auth.resetPassword.test.ts
│   │   ├── auth.test.ts
│   │   ├── auth.ts
│   │   ├── createPost.test.ts
│   │   ├── firebase.ts
│   │   ├── firebaseUI.ts
│   │   └── posts.ts
│   ├── models/
│   │   ├── comment.test.ts
│   │   ├── comment.ts
│   │   ├── forgetPassword.test.ts
│   │   ├── forgetPassword.ts
│   │   ├── geotag.test.ts
│   │   ├── geotag.ts
│   │   ├── like.ts
│   │   ├── posts.ts
│   │   ├── userProfile.test.ts
│   │   └── userProfile.ts
│   ├── profile/
│   │   └── Profile.tsx
│   ├── registration/
│   │   └── Registration.tsx
│   ├── routes/
│   │   ├── accountSettings.tsx
│   │   ├── createPost.tsx
│   │   ├── forgotPassword.tsx
│   │   ├── home.tsx
│   │   ├── login.tsx
│   │   ├── profile.tsx
│   │   └── registration.tsx
│   ├── services/
│   │   ├── postLocationService.test.ts
│   │   ├── postLocationService.ts
│   │   ├── profileService.test.ts
│   │   ├── profileService.ts
│   │   ├── savedPostService.test.ts
│   │   ├── savedPostService.ts
│   │   ├── socialService.test.ts
│   │   └── socialService.ts
│   ├── session/
│   │   ├── AuthSessionContext.tsx
│   │   ├── sessionRouting.test.ts
│   │   ├── sessionRouting.ts
│   │   ├── sessionService.test.ts
│   │   └── sessionService.ts
│   └── welcome/
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
├── storage.rules
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```
