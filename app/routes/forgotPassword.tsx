import type { Route } from "./+types/forgotPassword";
import { ForgotPassword }  from "~/account_settings/ForgetPassword";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Forget Password | WeTravel" },
    { name: "description", content: "Reset Your Password" },
  ];
}

export default function ForgotPasswordPage() {
  return ( <ForgotPassword/> );
}
