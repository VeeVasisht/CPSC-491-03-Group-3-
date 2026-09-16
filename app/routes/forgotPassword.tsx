import type { Route } from "./+types/forgotPassword";
import { ForgotPassword }  from "~/account_settings/ForgetPassword";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Account Settings | WeTravel" },
    { name: "description", content: "Manage account settings." },
  ];
}

export default function ForgotPasswordPage() {
  return ( <ForgotPassword/> );
}
