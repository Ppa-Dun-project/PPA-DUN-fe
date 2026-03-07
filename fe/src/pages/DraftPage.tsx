import { useEffect, useMemo, useRef, useState } from "react";
import FadeIn from "../components/ui/FadeIn";
import Skeleton from "../components/ui/Skeleton";
import Dropdown from "../components/ui/Dropdown";
import { useAuth } from "../lib/auth";

import type {
  DraftPick,
  DraftPlayer,
  DraftPositionFilter,
  DraftSort,
  DraftTeam,
} from "../types/draft";
type DraftPosition = DraftPlayer["positions"][number];

import { buildMockDraftTeams } from "../features/draft/mock";
import {
  buildSlotTemplate,
  calculateCurrentRound,
  calculateRemainingBudget,
  clampRosterSize,
  draftCostClass,
  filterDraftPlayers,
  findAvailableSlotIndex,
  formatAvg,
  getAllowedPositionsForPlayer,
  getPlayerDraftStatus,
  mlbTeamBadgeClass,
  readDraftConfig,
  seedInitialPicks,
  sortDraftPlayers,
  valueClass,
} from "../features/draft/utils";

import DraftRoomBoard from "../features/draft/components/DraftRoomBoard";
import AddBidModal from "../features/draft/components/AddBidModal";
import TakenBidModal from "../features/draft/components/TakenBidModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const BACKEND_LIST_LIMIT = 200;

const draftPositionFilters = [
  "ALL",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "OF",
  "UTIL",
  "SP",
  "RP",
] as const;

const SORT_OPTIONS: { value: DraftSort; label: string }[] = [
  { value: "score_desc", label: "By Score" },
  { value: "cost_desc", label: "By Draft Cost" },
  { value: "avg_desc", label: "By AVG" },
  { value: "hr_desc", label: "By HR" },
  { value: "rbi_desc", label: "By RBI" },
  { value: "sb_desc", label: "By SB" },
];

type ApiPlayerListItem = {
  id: number;
  name: string;
  team: string;
  positions: string[];
  valueScore: number;
};

type ApiPlayersListResponse = {
  items: ApiPlayerListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiPlayerDetailResponse = {
  id: number;
  name: string;
  team: string;
  positions: string[];
  valueScore: number;
  stats: {
    hr: number;
  };
};

const DRAFT_POSITIONS = new Set<DraftPosition>([
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "OF",
  "UTIL",
  "SP",
  "RP",
  "BENCH",
]);

async function requestPlayers(
  params: URLSearchParams,
  signal: AbortSignal
): Promise<ApiPlayersListResponse> {
  const res = await fetch(`${API_BASE_URL}/api/players?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ApiPlayersListResponse;
}

async function requestPlayerDetail(
  playerId: number,
  signal: AbortSignal
): Promise<ApiPlayerDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/players/${playerId}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as ApiPlayerDetailResponse;
}

function normalizeDraftPositions(rawPositions: string[]): DraftPosition[] {
  const normalized = rawPositions
    .map((pos) => pos.trim().toUpperCase())
    .map((pos) => (pos === "DH" ? "UTIL" : pos))
    .filter((pos): pos is DraftPosition => DRAFT_POSITIONS.has(pos as DraftPosition))
    .filter((pos) => pos !== "BENCH");

  if (normalized.length === 0) return ["UTIL"];
  return Array.from(new Set(normalized));
}

function estimateRecommendedBid(valueScore: number, positions: DraftPosition[]): number {
  const isPitcher = positions.every((pos) => pos === "SP" || pos === "RP");
  const multiplier = isPitcher ? 0.28 : 0.45;
  return Math.max(1, Math.round(valueScore * multiplier));
}

export default function DraftPage() {
  const authed = useAuth();
  const draftRoomTopRef = useRef<HTMLDivElement | null>(null);

  // TODO(백엔드/DB): 드래프트 설정도 서버/DB 기반으로 교체 가능
  const config = useMemo(() => readDraftConfig(), []);
  const teams = useMemo<DraftTeam[]>(
    () => buildMockDraftTeams(config.myTeamName, config.oppTeamName),
    [config]
  );

  const rosterSlots = useMemo(() => clampRosterSize(config.rosterPlayers), [config.rosterPlayers]);
  const slotTemplate = useMemo(() => buildSlotTemplate(rosterSlots), [rosterSlots]);

  const [players, setPlayers] = useState<DraftPlayer[]>([]);

  // 초기 더미 드래프트 상태
  const [picks, setPicks] = useState<DraftPick[]>(() => seedInitialPicks(teams, slotTemplate));

  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<DraftPositionFilter>("ALL");
  const [sort, setSort] = useState<DraftSort>("score_desc");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compare toggle state (placeholder for later compare feature)
  const [compareAId, setCompareAId] = useState<string | null>(null);
  const [compareBId, setCompareBId] = useState<string | null>(null);

  // Modal state
  const [addTarget, setAddTarget] = useState<DraftPlayer | null>(null);
  const [takenTarget, setTakenTarget] = useState<DraftPlayer | null>(null);

  const playersById = useMemo<Record<string, DraftPlayer>>(
    () => Object.fromEntries(players.map((p) => [p.id, p])),
    [players]
  );

  const filtered = useMemo(() => {
    const f = filterDraftPlayers(players, query, position);
    return sortDraftPlayers(f, sort);
  }, [players, query, position, sort]);

  const myTeam = teams.find((t) => t.isMine) ?? teams[0];

  const remainingBudget = useMemo(
    () => calculateRemainingBudget(config.budget ?? 260, myTeam.id, picks),
    [config.budget, myTeam.id, picks]
  );

  const currentRound = useMemo(
    () => calculateCurrentRound(teams.length, rosterSlots, picks),
    [teams.length, rosterSlots, picks]
  );

  const selectedA = useMemo(
    () => players.find((p) => p.id === compareAId) ?? null,
    [players, compareAId]
  );
  const selectedB = useMemo(
    () => players.find((p) => p.id === compareBId) ?? null,
    [players, compareBId]
  );

  const handleCompareToggle = (playerId: string) => {
    if (!authed) return;

    if (compareAId === playerId) {
      // Keep ordering compact: if A is removed and B exists, promote B -> A.
      setCompareAId(compareBId);
      setCompareBId(null);
      return;
    }

    if (compareBId === playerId) {
      setCompareBId(null);
      return;
    }

    if (!compareAId) {
      setCompareAId(playerId);
      return;
    }

    if (!compareBId) {
      setCompareBId(playerId);
      return;
    }

    // Both occupied: replace B with the latest selection.
    setCompareBId(playerId);
  };

  const clearCompare = () => {
    setCompareAId(null);
    setCompareBId(null);
  };

  // ✅ 유지: 이제 실제로 아래 AddBidModal에서 사용함
  const addAllowedPositions = useMemo(() => {
    if (!addTarget) return [];
    return getAllowedPositionsForPlayer(myTeam.id, addTarget, slotTemplate, picks);
  }, [addTarget, myTeam.id, slotTemplate, picks]);

  const takenAllowedByTeam = useMemo(() => {
    if (!takenTarget) return {};
    const out: Record<string, DraftPosition[]> = {};
    for (const team of teams) {
      if (team.isMine) continue;
      out[team.id] = getAllowedPositionsForPlayer(team.id, takenTarget, slotTemplate, picks);
    }
    return out;
  }, [takenTarget, teams, slotTemplate, picks]);

  const handleRemovePick = (pick: DraftPick) => {
    setPicks((prev) =>
      prev.filter(
        (p) =>
          !(
            p.playerId === pick.playerId &&
            p.draftedByTeamId === pick.draftedByTeamId &&
            p.slotIndex === pick.slotIndex
          )
      )
    );
  };

  const handleAddFinish = (bid: number, selectedPos: DraftPosition) => {
    if (!addTarget) return;

    const slotIndex = findAvailableSlotIndex(myTeam.id, selectedPos, slotTemplate, picks);
    if (slotIndex === -1) return;

    setPicks((prev) => [
      ...prev.filter((p) => p.playerId !== addTarget.id),
      {
        playerId: addTarget.id,
        draftedByTeamId: myTeam.id,
        slotIndex,
        slotPos: selectedPos,
        bid,
        type: "mine",
      },
    ]);

    setAddTarget(null);

    // ✅ Finish 후 맨 위 Draft Room으로 부드럽게 이동
    draftRoomTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTakenFinish = (
    draftedByTeamId: string,
    bid: number | null,
    selectedPos: DraftPosition
  ) => {
    if (!takenTarget) return;

    const slotIndex = findAvailableSlotIndex(draftedByTeamId, selectedPos, slotTemplate, picks);
    if (slotIndex === -1) return;

    setPicks((prev) => [
      ...prev.filter((p) => p.playerId !== takenTarget.id),
      {
        playerId: takenTarget.id,
        draftedByTeamId,
        slotIndex,
        slotPos: selectedPos,
        bid,
        type: "taken",
      },
    ]);

    setTakenTarget(null);

    // ✅ Finish 후 맨 위 Draft Room으로 부드럽게 이동
    draftRoomTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // TODO(백엔드/DB): 현재 picks 상태를 서버에 저장하도록 교체 필요
  // 예) POST /api/draft/picks, DELETE /api/draft/picks/:id
  useEffect(() => {
    // localStorage backup (프론트 임시 보관)
    localStorage.setItem("ppadun_draft_room_mock", JSON.stringify(picks));
  }, [picks]);

  // 선수 목록은 backend API에서 로드하고 현재 Draft UI 타입으로 매핑한다.
  useEffect(() => {
    const controller = new AbortController();

    const requestParams = new URLSearchParams();
    if (query.trim()) requestParams.set("query", query.trim());
    requestParams.set("sort", "value_desc");
    requestParams.set("page", "1");
    requestParams.set("limit", String(BACKEND_LIST_LIMIT));

    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    requestPlayers(requestParams, controller.signal)
      .then(async (listData) => {
        const detailResults = await Promise.allSettled(
          listData.items.map((item) => requestPlayerDetail(item.id, controller.signal))
        );
        if (controller.signal.aborted) return;

        const nextPlayers: DraftPlayer[] = listData.items.map((item, idx) => {
          const detail = detailResults[idx].status === "fulfilled" ? detailResults[idx].value : null;
          const positions = normalizeDraftPositions(detail?.positions ?? item.positions);
          const valueScore = detail?.valueScore ?? item.valueScore;
          const hr = detail?.stats?.hr;

          return {
            id: String(item.id),
            name: item.name,
            positions,
            recommendedBid: estimateRecommendedBid(valueScore, positions),
            team: item.team,
            avg: null,
            hr: typeof hr === "number" ? hr : null,
            rbi: null,
            sb: null,
            ppaValue: valueScore,
          };
        });

        setPlayers(nextPlayers);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setPlayers([]);
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [query]);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-black text-white/70">PPA-DUN</div>
            <h1 className="mt-1 text-3xl font-black text-white">Draft Room</h1>
            <p className="mt-2 text-sm text-white/60">
              {String(config.leagueType ?? "standard").toUpperCase()} • $
              {config.budget ?? 260} Budget • {rosterSlots} Players
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-xs font-extrabold text-white/60">Remaining Budget</div>
            <div className="mt-1 text-2xl font-black text-emerald-400">${remainingBudget}</div>
          </div>
        </div>
      </FadeIn>

      {/* Draft Room board: 로그인 유저만 표시 */}
      <FadeIn delayMs={60}>
        <div ref={draftRoomTopRef}>
          {authed ? (
            <DraftRoomBoard
              teams={teams}
              slotTemplate={slotTemplate}
              picks={picks}
              playersById={playersById}
              currentRound={currentRound}
              totalRounds={rosterSlots}
              authed={authed}
              onRemovePick={handleRemovePick}
            />
          ) : (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-lg font-black text-white">Guest View</div>
              <div className="mt-2 text-sm text-white/60">
                로그인하면 Draft Room 상태 보드와 Add / Taken 기능을 사용할 수 있습니다.
              </div>
            </section>
          )}
        </div>
      </FadeIn>

      {/* Search + filters */}
      <FadeIn delayMs={100} className="relative z-40">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-md">
              <div className="text-xs font-extrabold text-white/70">Search</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search player name..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-white/25"
              />
            </div>

            <div className="w-full lg:w-72">
              <Dropdown<DraftSort>
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={setSort}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {draftPositionFilters.map((p) => {
              const active = position === p;
              return (
                <button
                  key={p}
                  onClick={() => setPosition(p as DraftPositionFilter)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-extrabold transition",
                    active
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  {p}
                </button>
              );
            })}

            <div className="ml-auto text-lg font-black text-emerald-400">
              Remaining Budget: ${remainingBudget}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Recommendation button above compare bar */}
      <FadeIn delayMs={110}>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-xl border border-fuchsia-400/35 bg-fuchsia-500/12 px-4 py-2 text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-500/20"
            title="추천 팝업은 다음 단계에서 연결"
          >
            ✦ PPA-DUN Recommendation
          </button>
        </div>
      </FadeIn>

      {/* Compare selection placeholder */}
      <FadeIn delayMs={120}>
        <section className="rounded-2xl border border-fuchsia-500/55 bg-[#1b1228] p-4 shadow-[0_0_22px_rgba(168,85,247,0.22)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
              <div className="rounded-xl bg-fuchsia-500/15 px-4 py-3 ring-1 ring-fuchsia-300/40 lg:min-w-[170px]">
                <div className="text-sm font-black text-fuchsia-200">Compare</div>
                <div className="mt-0.5 text-[11px] font-bold text-white/65">Select 2 players</div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 rounded-xl border border-emerald-400/50 bg-emerald-500/12 px-3 py-2 shadow-[0_0_16px_rgba(16,185,129,0.18)]">
                  {selectedA ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <span className="text-sm">⚾</span>
                        <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-black text-emerald-100">
                          A
                        </span>
                        <span className="truncate font-black text-white">{selectedA.name}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-white/70">
                        {selectedA.positions.join("/")} · {selectedA.team} · ${selectedA.recommendedBid}
                      </div>
                      <div className="mt-1 text-[10px] text-white/55">
                        AVG {formatAvg(selectedA.avg)} | HR {selectedA.hr ?? "—"} | RBI{" "}
                        {selectedA.rbi ?? "—"} | SB {selectedA.sb ?? "—"}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-white/55">Select player A</div>
                  )}
                </div>

                <div className="text-center text-xs font-black text-fuchsia-200 sm:px-1">VS</div>

                <div className="min-w-0 flex-1 rounded-xl border border-emerald-400/50 bg-emerald-500/12 px-3 py-2 shadow-[0_0_16px_rgba(16,185,129,0.18)]">
                  {selectedB ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <span className="text-sm">⚾</span>
                        <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-black text-emerald-100">
                          B
                        </span>
                        <span className="truncate font-black text-white">{selectedB.name}</span>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-white/70">
                        {selectedB.positions.join("/")} · {selectedB.team} · ${selectedB.recommendedBid}
                      </div>
                      <div className="mt-1 text-[10px] text-white/55">
                        AVG {formatAvg(selectedB.avg)} | HR {selectedB.hr ?? "—"} | RBI{" "}
                        {selectedB.rbi ?? "—"} | SB {selectedB.sb ?? "—"}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-white/55">Select player B</div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                type="button"
                onClick={clearCompare}
                disabled={!selectedA && !selectedB}
                className="rounded-xl border border-white/15 bg-black/25 px-4 py-2 text-xs font-black text-white/80 transition hover:bg-white/10 disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!selectedA || !selectedB || !authed}
                className="rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-black text-white transition hover:bg-fuchsia-500 disabled:opacity-40"
                title="비교 팝업은 다음 단계에서 연결"
              >
                ⚡ Compare
              </button>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Players table */}
      <FadeIn delayMs={140}>
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-[.4fr_1.8fr_.6fr_.8fr_.8fr_.8fr_.8fr_.8fr_.9fr_1.3fr_1.1fr_.9fr] bg-black/40 px-4 py-3 text-xs font-extrabold text-white/60">
            <div>#</div>
            <div>Player</div>
            <div>Pos</div>
            <div>Draft Cost</div>
            <div>Team</div>
            <div>AVG</div>
            <div>HR</div>
            <div>RBI</div>
            <div>SB</div>
            <div>PPA-DUN Value</div>
            <div>Action</div>
            <div>Compare</div>
          </div>

          <div className="bg-black/20">
            {loading && (
              <div className="p-4">
                <Skeleton className="h-24" />
              </div>
            )}

            {!loading && error && (
              <div className="p-4 text-sm text-red-200">
                Failed to load players: {error}
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <div className="p-4 text-sm text-white/70">
                No results. Try another search or filter.
              </div>
            )}

            {!loading &&
              !error &&
              filtered.map((p, idx) => {
                const status = getPlayerDraftStatus(p.id, picks, teams);
                const compareAActive = compareAId === p.id;
                const compareBActive = compareBId === p.id;
                const compareRole = compareAActive ? "A" : compareBActive ? "B" : null;
                const compareActive = Boolean(compareRole);

                return (
                  <div
                    key={p.id}
                    className={[
                      "grid grid-cols-[.4fr_1.8fr_.6fr_.8fr_.8fr_.8fr_.8fr_.8fr_.9fr_1.3fr_1.1fr_.9fr] items-center px-4 py-3 text-sm text-white/85 transition",
                      compareActive
                        ? "relative z-[1] my-1 rounded-xl border border-emerald-400/75 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                        : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="text-white/45">{idx + 1}</div>

                    <div className="font-semibold text-white">{p.name}</div>

                    <div>
                      <span className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-extrabold text-white/80">
                        {p.positions[0]}
                      </span>
                    </div>

                    <div className={draftCostClass(authed)}>${p.recommendedBid}</div>

                    <div>
                      <span
                        className={[
                          "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-extrabold",
                          mlbTeamBadgeClass(p.team),
                        ].join(" ")}
                      >
                        {p.team}
                      </span>
                    </div>

                    <div className="text-white/70">{formatAvg(p.avg)}</div>
                    <div className="font-semibold text-amber-300">{p.hr ?? "—"}</div>
                    <div className="text-white/70">{p.rbi ?? "—"}</div>
                    <div className="font-semibold text-amber-300">{p.sb ?? "—"}</div>

                    <div className={`font-black ${valueClass(p.ppaValue, authed)}`}>
                      {p.ppaValue.toFixed(1)}
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2">
                      {status.kind === "mine" ? (
                        <div className="rounded-xl bg-sky-500/15 px-3 py-2 text-xs font-black text-sky-200 ring-1 ring-sky-400/20">
                          {status.label}
                        </div>
                      ) : status.kind === "taken" ? (
                        <div className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-black text-rose-200 ring-1 ring-rose-400/20">
                          {status.label}
                        </div>
                      ) : authed ? (
                        <>
                          <button
                            onClick={() => setAddTarget(p)}
                            className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-200 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setTakenTarget(p)}
                            className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-black text-rose-200 ring-1 ring-rose-400/20 transition hover:bg-rose-500/25"
                          >
                            Taken
                          </button>
                        </>
                      ) : (
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/40 blur-[1px]">
                          Sign in required
                        </div>
                      )}
                    </div>

                    {/* Compare toggle switch */}
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        disabled={!authed}
                        onClick={() => handleCompareToggle(p.id)}
                        className={[
                          "relative h-6 w-14 rounded-full border transition",
                          compareActive
                            ? "border-emerald-300/70 bg-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                            : "border-white/10 bg-white/5 hover:bg-white/10",
                          !authed ? "opacity-40" : "",
                        ].join(" ")}
                        title={!authed ? "로그인 필요" : compareRole ? `Selected ${compareRole}` : "Select for compare"}
                      >
                        <span
                          className={[
                            "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200",
                            compareActive ? "translate-x-8" : "translate-x-0",
                          ].join(" ")}
                        />
                        {compareRole && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-950">
                            {compareRole}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="border-t border-white/10 px-4 py-3 text-xs text-white/45">
            Players are loaded from backend API. Draft 저장/삭제, 팀별 상태, 액션 결과는 추후 API로 확장 예정입니다.
          </div>
        </section>
      </FadeIn>

      {/* Add modal */}
      {addTarget && (
        <AddBidModal
          key={`add-${addTarget.id}`}
          open={true}
          player={addTarget}
          allowedPositions={addAllowedPositions}
          onClose={() => setAddTarget(null)}
          onConfirm={handleAddFinish}
        />
      )}

      {/* Taken modal */}
      {takenTarget && (
        <TakenBidModal
          key={`taken-${takenTarget.id}`}
          open={true}
          player={takenTarget}
          teams={teams}
          allowedPositionsByTeam={takenAllowedByTeam}
          onClose={() => setTakenTarget(null)}
          onConfirm={handleTakenFinish}
        />
      )}
    </div>
  );
}
