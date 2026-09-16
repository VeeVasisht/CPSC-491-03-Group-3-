import type { Route } from "./+types/accountSettings";
import { AccountSettings } from "~/account_settings/AccountSettings";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Account Settings | WeTravel" },
    { name: "description", content: "Manage account settings." },
  ];
}

export default function AccountSettingsPage() {
  return ( <AccountSettings/> );
}
