import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("registration", "routes/registration.tsx"),
    route("login", "routes/login.tsx"),
    route("forgotPassword", "routes/forgotPassword.tsx"),
    route("accountSettings", "routes/accountSettings.tsx"),
    route("profile", "routes/profile.tsx")
] satisfies RouteConfig;