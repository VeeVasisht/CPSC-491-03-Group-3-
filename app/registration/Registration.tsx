import {
    GoogleSignInButton,
    OAuthScreen,
    SignUpAuthScreen,
} from "@firebase-oss/ui-react";
import { useNavigate } from "react-router";

import { ensureUserProfile } from "../firebase/auth";

export function Registration() {
    const navigate = useNavigate();

    async function handleGoogleSignIn(
        user: import("firebase/auth").User
    ) {
        await ensureUserProfile(user);
        navigate("/");
    }

    return (
        <main className="registration-page">
            <section className="registration-card">
                <header className="registration-header">
                    <h1>Join WeTravel</h1>
                    <p>
                        Create an account and start planning your next trip.
                    </p>
                </header>

                <div className="registration-auth">
                    <OAuthScreen onSignIn={handleGoogleSignIn}>
                        <GoogleSignInButton />
                    </OAuthScreen>

                    <div className="registration-divider">
                        <span>or</span>
                    </div>

                    <SignUpAuthScreen
                        onSignUp={() => navigate("/")}
                    />
                </div>

                <footer className="registration-footer">
                    <p>
                        Already have an account?{" "}
                        <a href="/login">Log in</a>
                    </p>
                </footer>
            </section>
        </main>
    );
}