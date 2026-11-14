import type { Route } from "./+types/login";
import { Login } from "../login/Login";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login | WeTravel" },
    { name: "description", content: "Log in to your WeTravel account." },
  ];
}

export default function LoginPage() {
  return <Login />;
}
