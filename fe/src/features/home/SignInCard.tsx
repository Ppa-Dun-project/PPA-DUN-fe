import { useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiPost } from "../../lib/api";
import { login } from "../../lib/auth";
import logo from "../../assets/LOGO.png";

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

export default function SignInCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    (response: GoogleCredentialResponse) => {
      apiPost<AuthResponse, { credential: string }>("/api/auth/google/verify", {
        credential: response.credential,
      })
        .then((data) => {
          login(data.token);
          const redirect = location.pathname + location.search;
          navigate(redirect === "/login" ? "/" : redirect, { replace: true });
        })
        .catch((err) => {
          console.error("Google login failed:", err);
        });
    },
    [navigate, location]
  );

  useEffect(() => {
    const google = (window as unknown as { google?: { accounts?: { id?: {
      initialize: (config: { client_id: string; callback: (r: GoogleCredentialResponse) => void }) => void;
      renderButton: (el: HTMLElement, config: Record<string, string>) => void;
    } } } }).google;
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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 overflow-hidden rounded-3xl bg-white/10 p-2">
          <img src={logo} alt="PPA-Dun logo" className="h-full w-full object-cover" />
        </div>

        <div className="mt-4 text-sm font-black text-white">PPA-DUN</div>

        <div className="mt-6 text-lg font-black text-white">Sign in to get started</div>
        <div className="mt-2 text-xs text-white/55">
          Draft players, track your team, and win.
        </div>

        <div ref={googleBtnRef} className="mt-6 w-full opacity-85 transition hover:opacity-100" />

        <div className="mt-8 w-full border-t border-white/10 pt-6 text-left">
          <div className="text-xs font-black text-white/70">What you get with PPA-DUN:</div>
          <ul className="mt-3 space-y-2 text-xs text-white/65">
            <li>AI-powered player valuations</li>
            <li>Live draft with budget tracking</li>
            <li>Daily news & injury reports</li>
            <li>Roster optimization tools</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
