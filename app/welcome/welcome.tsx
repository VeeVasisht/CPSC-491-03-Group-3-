import { Link } from "react-router";
import { UserRound, KeyRound, SquarePen, Map } from "lucide-react";

/**
 * Defines the pages displayed as navigation cards on the home page.
 * Each entry specifies the page title, description, route, and Lucide icon.
 * The Welcome component uses this array to dynamically generate the cards.
 */
const pages = [
  {
    title: "Account Settings",
    description: "Manage your account and profile settings.",
    path: "/accountSettings",
    icon: UserRound,
  },
  {
    title: "Forgot Password",
    description: "Reset your password and recover your account.",
    path: "/forgotPassword",
    icon: KeyRound,
  },
  {
    title: "Create a Post",
    description: "Share your travel experiences with others.",
    path: "/createPost",
    icon: SquarePen,
  },
  {
    title: "Explore Map",
    description: "Discover locations and explore the map.",
    path: "/map",
    icon: Map,
  },
];

export function Welcome() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome to WeTravel
          </h1>

          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Explore, share, and manage your travel experiences.
          </p>
        </header>

        {/* Navigation Cards */}
        <nav
          aria-label="Main navigation"
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {pages.map((page) => {
            const Icon = page.icon;

            return (
              <Link
                key={page.path}
                to={page.path}
                className="
                  group flex flex-col items-center
                  rounded-2xl border border-gray-200
                  bg-white p-8 text-center
                  shadow-sm transition-all duration-200
                  hover:-translate-y-1 hover:border-blue-400
                  hover:shadow-lg
                  focus-visible:outline-2
                  focus-visible:outline-offset-4
                  focus-visible:outline-blue-500
                  dark:border-gray-700
                  dark:bg-gray-800
                  dark:hover:border-blue-500
                "
              >
                {/* SVG Icon */}
                <div
                  className="
                    mb-6 flex h-20 w-20
                    items-center justify-center
                    rounded-2xl bg-blue-50
                    text-blue-600
                    transition-colors
                    group-hover:bg-blue-100
                    dark:bg-blue-900/30
                    dark:text-blue-400
                    dark:group-hover:bg-blue-900/50
                  "
                >
                  <Icon size={44} strokeWidth={1.75} aria-hidden="true" />
                </div>

                {/* Card Title */}
                <h2
                  className="
                    mb-2 text-xl font-semibold
                    text-gray-900
                    dark:text-white
                  "
                >
                  {page.title}
                </h2>

                {/* Card Description */}
                <p
                  className="
                    text-sm leading-relaxed
                    text-gray-600
                    dark:text-gray-400
                  "
                >
                  {page.description}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>
    </main>
  );
}
