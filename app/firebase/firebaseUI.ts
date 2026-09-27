import {
    initializeUI,
    requireDisplayName,
} from "@firebase-oss/ui-core";

import { app } from "./firebase";

export const firebaseUI = initializeUI({
    app,
    behaviors: [
        requireDisplayName(),
    ],
});