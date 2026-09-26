import type { Route } from "./+types/forgotPassword";
import { ForgotPassword }  from "~/account_settings/ForgotPassword";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Forgot Password | WeTravel" },
    { name: "description", content: "Reset your password" },
  ];
}

export default function ForgotPasswordPage() {
  return ( <ForgotPassword/> );
}
