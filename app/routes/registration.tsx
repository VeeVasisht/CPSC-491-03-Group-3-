import type { Route } from "./+types/registration";
import { Registration } from "../registration/Registration";
import { firebaseUI } from "~/firebase/firebaseUI";
import { FirebaseUIProvider } from "@firebase-oss/ui-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Registration | WeTravel" },
    { name: "description", content: "Create an account." },
  ];
}

export default function RegistrationPage() {
  return (
    <FirebaseUIProvider ui={firebaseUI}>
      <Registration />
    </FirebaseUIProvider>
  );
}
