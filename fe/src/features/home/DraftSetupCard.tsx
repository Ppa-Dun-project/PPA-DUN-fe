import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/LOGO.png";
import { isAuthed } from "../../lib/auth";

type LeagueType = "standard" | "lite" | "custom";

const presets = {
  standard: { label: "Standard", budget: 260, players: 12, note: "$260 • 12 players" },
  lite: { label: "Lite", budget: 200, players: 10, note: "$200 • 10 players" },
  custom: { label: "Custom", budget: 260, players: 12, note: "Set your own" },
} as const;

function pill(active: boolean) {
  return [
    "flex-1 rounded-2xl border px-3 py-3 text-left transition",
    active ? "border-white/30 bg-white/10" : "border-white/10 bg-black/30 hover:bg-white/5",
  ].join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function DraftSetupCard() {
  const navigate = useNavigate();
  const authed = isAuthed();

  const [myTeam, setMyTeam] = useState<string>("");

  // ✅ New: opponents count + dynamic names
  const [opponentsCount, setOpponentsCount] = useState<number>(0); // 0 ~ 12
  const [opponentTeams, setOpponentTeams] = useState<string[]>([]);

  const [leagueType, setLeagueType] = useState<LeagueType>("standard");

  // custom values
  const [customBudget, setCustomBudget] = useState<number>(260);
  const [customPlayers, setCustomPlayers] = useState<number>(12);

  const computed = useMemo(() => {
    if (leagueType === "custom") {
      return {
        budget: customBudget,
        players: customPlayers,
        note: `$${customBudget} • ${customPlayers} players`,
      };
    }
    return presets[leagueType];
  }, [leagueType, customBudget, customPlayers]);

  const applyOpponentsCount = (next: number) => {
    const c = clamp(next, 0, 12);
    setOpponentsCount(c);

    setOpponentTeams((prev) => {
      const sliced = prev.slice(0, c);
      if (sliced.length < c) {
        return [...sliced, ...Array(c - sliced.length).fill("")];
      }
      return sliced;
    });
  };

  const updateOpponentName = (idx: number, value: string) => {
    setOpponentTeams((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const onStartDraft = () => {
    const trimmedOppNames = opponentTeams.map((n) => n.trim());

    // MVP: draft 설정 값을 로컬에 저장
    const draftConfig = {
      myTeamName: myTeam.trim(),
      opponentsCount,
      oppTeamName: trimmedOppNames[0] ?? "", // ✅ backward-compatible (first opponent)
      oppTeamNames: trimmedOppNames, // ✅ new: all opponents
      leagueType,
      budget: computed.budget,
      rosterPlayers: computed.players,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("ppadun_draft_config", JSON.stringify(draftConfig));

    const target = "/players";

    // 게스트면 로그인 유도
    if (!authed) {
      const redirect = encodeURIComponent(target);
      navigate(`/login?redirect=${redirect}`, { replace: true });
      return;
    }

    navigate(target);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      {/* Header: logo left, text right, whole row centered */}
      <div className="flex items-center justify-center gap-3">
        {/* Logo: no gray frame, crop nicely */}
        <div className="h-12 w-12 overflow-hidden rounded-2xl">
          <img src={logo} alt="Logo" className="h-full w-full object-cover" />
        </div>

        <div className="text-left">
          <div className="text-base font-black leading-tight text-white">Draft Setup</div>
        </div>
      </div>

      {/* Form */}
      <div className="mt-5 space-y-4">
        {/* My team */}
        <div>
          <label className="text-xs font-extrabold text-white/70">My team name</label>
          <input
            value={myTeam}
            onChange={(e) => setMyTeam(e.target.value)}
            placeholder="e.g., Black Sluggers"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
          />
        </div>

        {/* ✅ Opponents count + / - */}
        <div>
          <label className="text-xs font-extrabold text-white/70">
            Participants (opponents){" "}
            <span className="text-white/40">(max 12)</span>
          </label>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyOpponentsCount(opponentsCount - 1)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-white/80 hover:bg-white/5"
              aria-label="Decrease opponents"
            >
              −
            </button>

            <input
              type="number"
              min={0}
              max={12}
              value={opponentsCount}
              onChange={(e) => applyOpponentsCount(Number(e.target.value || 0))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/25"
            />

            <button
              type="button"
              onClick={() => applyOpponentsCount(opponentsCount + 1)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-black/30 text-white/80 hover:bg-white/5"
              aria-label="Increase opponents"
            >
              +
            </button>
          </div>

          <div className="mt-1 text-xs text-white/50">
            Enter how many opponents you&apos;ll draft with. We&apos;ll generate name fields below.
          </div>
        </div>

        {/* ✅ Dynamic opponent team name fields */}
        {opponentsCount > 0 && (
          <div className="space-y-3">
            {opponentTeams.map((name, idx) => (
              <div key={idx}>
                <label className="text-xs font-extrabold text-white/70">
                  Opponent team {idx + 1} name
                </label>
                <input
                  value={name}
                  onChange={(e) => updateOpponentName(idx, e.target.value)}
                  placeholder={`e.g., Team ${String.fromCharCode(66 + idx)}`} // Team B, C, D...
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/25"
                />
              </div>
            ))}
          </div>
        )}

        {/* League type */}
        <div>
          <div className="text-xs font-extrabold text-white/70">League type</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={pill(leagueType === "standard")}
              onClick={() => setLeagueType("standard")}
            >
              <div className="text-sm font-black text-white">Standard</div>
              <div className="mt-1 text-xs text-white/60">$260 • 12 players</div>
            </button>

            <button
              type="button"
              className={pill(leagueType === "lite")}
              onClick={() => setLeagueType("lite")}
            >
              <div className="text-sm font-black text-white">Lite</div>
              <div className="mt-1 text-xs text-white/60">$200 • 10 players</div>
            </button>

            <button
              type="button"
              className={pill(leagueType === "custom")}
              onClick={() => setLeagueType("custom")}
            >
              <div className="text-sm font-black text-white">Custom</div>
              <div className="mt-1 text-xs text-white/60">Set your own</div>
            </button>
          </div>
        </div>

        {/* Custom controls */}
        {leagueType === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs font-bold text-white/70">Budget ($)</div>
              <input
                type="number"
                min={1}
                value={customBudget}
                onChange={(e) => setCustomBudget(Number(e.target.value || 0))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs font-bold text-white/70">Roster players</div>
              <input
                type="number"
                min={1}
                value={customPlayers}
                onChange={(e) => setCustomPlayers(Number(e.target.value || 0))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-bold text-white/70">Budget ($)</div>
            <div className="mt-2 text-2xl font-black text-white">{computed.budget}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs font-bold text-white/70">Roster players</div>
            <div className="mt-2 text-2xl font-black text-white">{computed.players}</div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={onStartDraft}
          className="mt-1 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:translate-y-[-1px] hover:bg-white/90 active:translate-y-0"
        >
          Start Draft →
        </button>

        {!authed && (
          <div className="text-center text-xs text-white/50">
            Guests can view this, but starting a draft requires login.
          </div>
        )}
      </div>
    </section>
  );
}