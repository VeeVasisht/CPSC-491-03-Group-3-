import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";

import { auth, db } from "../app/firebase/firebase";

connectAuthEmulator(
  auth,
  "http://127.0.0.1:9099",
  {
    disableWarnings: true,
  }
);

connectFirestoreEmulator(
  db,
  "127.0.0.1",
  8080
);