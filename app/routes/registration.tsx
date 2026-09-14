import type { Route } from "./+types/registration";
import { Registration } from "../registration/Registration";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Registration | WeTravel" },
        { name: "description", content: "Create an account."}
    ];
}

export default function RegistrationPage() {
    return <Registration />;
}