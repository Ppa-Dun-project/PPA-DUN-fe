import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/LOGO.png";

export default function SignInCard() {
  const navigate = useNavigate();
  const location = useLocation();

  const onGoogleSignIn = () => {
    // TODO (Backend): Google OAuth 연동 시, 백엔드 엔드포인트로 이동하도록 변경
    // 예) window.location.href = `${API_BASE_URL}/auth/google?redirect=${encodeURIComponent(location.pathname)}`
    const redirect = encodeURIComponent(location.pathname + location.search);
    navigate(`/login?redirect=${redirect}`);
  };

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

        <button
          onClick={onGoogleSignIn}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-white/90 hover:translate-y-[-1px] active:translate-y-0"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/5">
            G
          </span>
          Sign in with Google
        </button>

        <div className="mt-8 w-full border-t border-white/10 pt-6 text-left">
          <div className="text-xs font-black text-white/70">What you get with PPA-DUN:</div>
          <ul className="mt-3 space-y-2 text-xs text-white/65">
            <li>🤖 AI-powered player valuations</li>
            <li>📊 Live draft with budget tracking</li>
            <li>📰 Daily news & injury reports</li>
            <li>🏆 Roster optimization tools</li>
          </ul>
        </div>
      </div>
    </section>
  );
}