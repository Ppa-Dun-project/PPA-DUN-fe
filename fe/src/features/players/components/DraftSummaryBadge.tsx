type DraftConfig = {
  myTeamName?: string;
  oppTeamNames?: string[];
  leagueType?: string;
  budget?: number;
  rosterPlayers?: number;
};

function readDraft(): DraftConfig | null {
  try {
    const raw = localStorage.getItem("ppadun_draft_config");
    if (!raw) return null;
    return JSON.parse(raw) as DraftConfig;
  } catch {
    return null;
  }
}

export default function DraftSummaryBadge() {
  const cfg = readDraft();
  if (!cfg) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs font-black text-white/70">Draft</div>
      <div className="mt-2 text-sm font-black text-white">
        {cfg.leagueType ?? "standard"} • ${cfg.budget ?? 0} • {cfg.rosterPlayers ?? 0} players
      </div>
      {cfg.myTeamName && (
        <div className="mt-1 text-xs text-white/60">
          My team: <span className="text-white/80">{cfg.myTeamName}</span>
        </div>
      )}
    </div>
  );
}