// Login page: uses Google OAuth for authentication.
// Preserves the ?redirect param so the user is sent back to their intended page after login.
import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiPost } from "../lib/api";
import { login } from "../lib/auth";

const GOOGLE_CLIENT_ID =
  "96806984873-n9in5glb21d6lni6acqnkdrcmk9b6b2c.apps.googleusercontent.com";

type GoogleCredentialResponse = {
  credential: string;
};

type AuthResponse = {
  token: string;
  email: string;
  name: string;
};

type GoogleAccountsId = {
  initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void;
  renderButton: (el: HTMLElement, config: Record<string, string>) => void;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const error = params.get("error");
  // After login, redirect to the page user originally wanted (default: /).
  const redirect = params.get("redirect")
    ? decodeURIComponent(params.get("redirect") as string)
    : "/";

  const handleCredentialResponse = useCallback(
    (response: GoogleCredentialResponse) => {
      apiPost<AuthResponse, { credential: string }>("/api/auth/google/verify", {
        credential: response.credential,
      })
        .then((data) => {
          login(data.token);
          navigate(redirect, { replace: true });
        })
        .catch((err) => {
          console.error("Google login failed:", err);
        });
    },
    [navigate, redirect]
  );

  useEffect(() => {
    const google = (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } }).google;
    if (!google?.accounts?.id || !googleBtnRef.current) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
      text: "signin_with",
      shape: "pill",
      locale: "en",
    });
  }, [handleCredentialResponse]);

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
          AUTH
        </div>

        <h1 className="mt-4 text-2xl font-bold text-white md:text-3xl">
          Login
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Sign in with your Google account to access all features.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            Login failed: {error}
          </div>
        )}

        <div ref={googleBtnRef} className="mt-6 w-full opacity-85 transition hover:opacity-100" />

        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-xs text-white/50">Redirect after login</div>
          <div className="mt-1 break-all font-mono text-xs text-white/80">
            {redirect}
          </div>
        </div>
      </div>
    </div>
  );
}
