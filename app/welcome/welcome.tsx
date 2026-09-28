import { Link } from "react-router";

export function Welcome() {
  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
        <header className="flex flex-col items-center gap-9">
          <h1>WeTravel</h1>
        </header>
        <div className="max-w-[300px] w-full space-y-6 px-4">
          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <Link to="/accountSettings">Account Settings</Link> <br/>
            <Link to="/forgotPassword">Forgot Password</Link> <br/>
            <Link to="/registration">Registration</Link> <br />
            <Link to="/createPost">Create a Post</Link>
          </nav>
        </div>
      </div>
    </main>
  );
}