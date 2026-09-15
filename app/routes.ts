import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/login.tsx"),
    route("forget-password", "../pages/ForgotPassword.jsx"),
    route("settings", "../pages/AccountSettings.jsx"),
] satisfies RouteConfig;