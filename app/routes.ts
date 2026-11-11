import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("registration", "routes/registration.tsx"),
  route("login", "routes/login.tsx"),
  route("forgotPassword", "routes/forgotPassword.tsx"),
  route("accountSettings", "routes/accountSettings.tsx"),
  route("profile", "routes/profile.tsx"),
  route("createPost", "routes/createPost.tsx"),
  route("map", "routes/map.tsx"),
  route("locationFeed", "routes/locationFeed.tsx"),
  route("feed", "routes/feed.tsx"),
  route("itineraries", "routes/itineraries.tsx"),
  route("trips/:tripId/itineraries", "routes/itineraries.tsx", {
    id: "trip-itineraries",
  }),
  route("trips", "routes/trips.tsx"),
  route("trips/:tripId", "routes/tripDetail.tsx"),
] satisfies RouteConfig;
