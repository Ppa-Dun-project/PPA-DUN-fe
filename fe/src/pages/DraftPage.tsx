// Draft Room — the main feature page.
// Displays: draft board (team rosters), player list with search/filter/sort,
// player comparison panel, Add/Taken bid modals, and player info modal.
//
// Data flow:
//   1. On mount, GET /api/draft/bootstrap (auth) fetches config, teams, picks
//   2. Public GET /api/draft/players returns the full player list (no PPA value / bid)
//   3. When authed, GET /api/draft/players/values (auth) returns per-player value info;
//      merged client-side by playerId into DraftPlayer
//   4. Draft picks are mutated via POST/DELETE /api/draft/picks (auth)
//
// Filtering, sorting, and pagination all run client-side on the merged list.
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FadeIn from "../components/ui/FadeIn";
import Skeleton from "../components/ui/Skeleton";
import Dropdown from "../components/ui/Dropdown";
import { useAuth } from "../lib/auth";
import { apiGet, apiGetAuth, apiPostAuth, apiDeleteAuth } from "../lib/api";

import type {
  DraftConfigLocal,
  DraftPick,
  DraftPlayer,
  DraftPlayerPublic,
  DraftPlayerValue,
  DraftPositionFilter,
  DraftSort,
  DraftTeam,
} from "../types/draft";
type DraftPosition = DraftPlayer["positions"][number];

import {
  DEFAULT_CONFIG,
  buildSlotTemplate,
  calculateCurrentRound,
  calculateRemainingBudget,
  clampRosterSize,
  draftCostClass,
  formatAvg,
  getPlayerDraftStatus,
  mlbTeamBadgeClass,
  readDraftConfig,
} from "../features/draft/utils";
import { formatPpa, ppaValueClass } from "../utils/playerValue";

import DraftRoomBoard from "../features/draft/components/DraftRoomBoard";
import AddBidModal from "../features/draft/components/AddBidModal";
import TakenBidModal from "../features/draft/components/TakenBidModal";
import PlayerComparisonModal from "../features/draft/components/PlayerComparisonModal";
import PlayerInfoModal from "../features/players/components/PlayerInfoModal";
import Pagination from "../features/players/components/Pagination";

const PAGE_SIZE = 30;

const DEFAULT_POSITION_FILTERS: DraftPositionFilter[] = [
  "ALL",
  "C",
  "1B",
  "2B",
  "3B",
  "SS",
  "OF",
  "UTIL",
  "P",
];

// Match a player against a position filter.
// - ALL   : always true
// - UTIL  : any non-pitcher position (1B/2B/3B/SS/OF/C/UTIL all qualify)
// - P     : any pitcher position (SP or RP)
// - other : exact match (case-insensitive, defensive against empty arrays)
function matchesPositionFilter(
  playerPositions: readonly string[] | undefined,
  filter: DraftPositionFilter
): boolean {
  if (filter === "ALL") return true;
  if (!playerPositions || playerPositions.length === 0) return false;

  const normalized = playerPositions.map((p) => p.toUpperCase());

  if (filter === "UTIL") {
    return normalized.some((p) => p !== "SP" && p !== "RP");
  }
  if (filter === "P") {
    return normalized.some((p) => p === "SP" || p === "RP");
  }
  return normalized.includes(filter);
}

const DEFAULT_SORT_OPTIONS: { value: DraftSort; label: string }[] = [
  { value: "score_desc", label: "By Score" },
  { value: "cost_desc", label: "By Draft Cost" },
  { value: "avg_desc", label: "By AVG" },
  { value: "hr_desc", label: "By HR" },
  { value: "rbi_desc", label: "By RBI" },
  { value: "sb_desc", label: "By SB" },
];

type DraftConfigResponse = {
  leagueType: string;
  budget: number;
  rosterPlayers: number;
  myTeamName: string;
  opponentsCount: number;
  oppTeamNames: string[];
};

// 백엔드 /api/draft/bootstrap 응답 — config / teams / picks 세 가지만 돌려받음
// (positionFilters / sortOptions 는 더 이상 서버에서 내려주지 않음; 프론트 상수 사용)
type DraftBootstrapResponse = {
  config: DraftConfigResponse;
  teams: DraftTeam[];
  picks: DraftPick[];
};

// 공개 /api/draft/players — PPA 값 / 추천 bid 없이 전체 선수 목록만
type DraftPlayersResponse = {
  items: DraftPlayerPublic[];
};

// 인증 /api/draft/players/values — 로그인 사용자에게만 PPA 값과 추천 bid 를 playerId 별로 제공
type DraftPlayerValuesResponse = {
  items: DraftPlayerValue[];
};

type DraftPicksResponse = {
  userId: string;
  items: DraftPick[];
};

type DraftPickUpsertIn = {
  playerId: string;
  draftedByTeamId: string;
  slotPos: DraftPosition;
  bid: number | null;
  type: DraftPick["type"];
};

function toInitialConfig(local: DraftConfigLocal): DraftConfigResponse {
  return {
    leagueType: local.leagueType ?? "standard",
    budget: local.budget ?? 260,
    rosterPlayers: local.rosterPlayers ?? 12,
    myTeamName: (local.myTeamName ?? "My Team").trim() || "My Team",
    opponentsCount: local.opponentsCount ?? DEFAULT_CONFIG.opponentsCount,
    oppTeamNames: local.oppTeamNames ?? [],
  };
}

function resolveDraftSlotPosition(player: DraftPlayer): DraftPosition {
  return (player.positions[0] ?? "UTIL") as DraftPosition;
}

// 공개 선수 목록과 인증 값 목록을 playerId 기준으로 머지
function mergePlayersWithValues(
  publicPlayers: DraftPlayerPublic[],
  values: DraftPlayerValue[] | null
): DraftPlayer[] {
  if (!values) return publicPlayers.map((player) => ({ ...player }));

  const valueById = new Map(values.map((v) => [v.playerId, v]));
  return publicPlayers.map((player) => {
    const v = valueById.get(player.id);
    return v
      ? { ...player, ppaValue: v.ppaValue, recommendedBid: v.recommendedBid }
      : { ...player };
  });
}

export default function DraftPage() {
  const authed = useAuth();
  const [searchParams] = useSearchParams();
  const draftRoomTopRef = useRef<HTMLDivElement | null>(null); // Scroll target after draft pick

  // Read draft config from localStorage (set on HomePage's DraftSetupCard).
  const localConfig = useMemo(() => readDraftConfig(), []);

  // Core draft state — populated by the bootstrap API call.
  const [config, setConfig] = useState<DraftConfigResponse>(() => toInitialConfig(localConfig));
  const [teams, setTeams] = useState<DraftTeam[]>([]);       // All teams in the draft room
  const [picks, setPicks] = useState<DraftPick[]>([]);       // All draft picks made so far
  // 공개 API 에서 받아온 기본 목록 (값 없음)
  const [publicPlayers, setPublicPlayers] = useState<DraftPlayerPublic[]>([]);
  // 인증 API 에서 받아온 값 테이블 (playerId → { ppaValue, recommendedBid })
  // 비로그인 또는 조회 실패 시 null
  const [playerValues, setPlayerValues] = useState<DraftPlayerValue[] | null>(null);

  const [query, setQuery] = useState(() => searchParams.get("query")?.trim() ?? "");
  const [position, setPosition] = useState<DraftPositionFilter>("ALL");
  const [sort, setSort] = useState<DraftSort>("score_desc");
  const [page, setPage] = useState(1);

  // 필터/정렬 옵션은 더 이상 서버가 내려주지 않음 — 상수 그대로 사용
  const positionFilters = DEFAULT_POSITION_FILTERS;
  const sortOptions = DEFAULT_SORT_OPTIONS;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player comparison state — user selects two players (A and B) to compare side-by-side.
  const [compareAId, setCompareAId] = useState<string | null>(null);
  const [compareBId, setCompareBId] = useState<string | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);     // Player info modal

  // Modal targets — which player the user clicked "Add" or "Taken" on.
  const [addTarget, setAddTarget] = useState<DraftPlayer | null>(null);
  const [takenTarget, setTakenTarget] = useState<DraftPlayer | null>(null);

  // Derived values (memoized to avoid recalculation on every render).
  // Prefer localConfig.rosterPlayers (user's original choice) over backend's potentially
  // clamped value — backend may enforce a higher minimum that overrides user's setting.
  const rosterSlots = useMemo(
    () => clampRosterSize(localConfig.rosterPlayers ?? config.rosterPlayers),
    [localConfig.rosterPlayers, config.rosterPlayers]
  );
  const slotTemplate = useMemo(() => buildSlotTemplate(rosterSlots), [rosterSlots]);

  // 공개 선수 목록 + 인증 값 목록을 playerId 로 머지한 최종 UI 목록
  const allPlayers = useMemo<DraftPlayer[]>(
    () => mergePlayersWithValues(publicPlayers, playerValues),
    [publicPlayers, playerValues]
  );

  // Client-side filter + sort + paginate (server returns full list).
  const filteredPlayers = useMemo(() => {
    let result = allPlayers;

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
      );
    }

    if (position !== "ALL") {
      result = result.filter((p) => matchesPositionFilter(p.positions, position));
    }

    const sorted = [...result].sort((a, b) => {
      switch (sort) {
        case "cost_desc":
          return (b.recommendedBid ?? 0) - (a.recommendedBid ?? 0);
        case "avg_desc":
          return (b.avg ?? 0) - (a.avg ?? 0);
        case "hr_desc":
          return (b.hr ?? 0) - (a.hr ?? 0);
        case "rbi_desc":
          return (b.rbi ?? 0) - (a.rbi ?? 0);
        case "sb_desc":
          return (b.sb ?? 0) - (a.sb ?? 0);
        case "score_desc":
        default:
          return (b.ppaValue ?? 0) - (a.ppaValue ?? 0);
      }
    });

    return sorted;
  }, [allPlayers, query, position, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));

  // Clamp page if filter reduces totalPages below current page (setState during render)
  if (page > totalPages) {
    setPage(1);
  }

  const players = useMemo(
    () => filteredPlayers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPlayers, page]
  );

  // Quick lookup: playerId → DraftPlayer object.
  const playersById = useMemo<Record<string, DraftPlayer>>(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players]
  );

  const myTeam = teams.find((team) => team.isMine) ?? teams[0] ?? null;

  // Calculate remaining budget for each team based on their picks.
  const remainingBudgetByTeam = useMemo(() => {
    const spentByTeam = new Map<string, number>();
    for (const pick of picks) {
      if (typeof pick.bid !== "number") continue;
      spentByTeam.set(pick.draftedByTeamId, (spentByTeam.get(pick.draftedByTeamId) ?? 0) + pick.bid);
    }
    return Object.fromEntries(
      teams.map((team) => [
        team.id,
        Math.max(0, config.budget - (spentByTeam.get(team.id) ?? 0)),
      ])
    ) as Record<string, number>;
  }, [teams, picks, config.budget]);

  const remainingBudget = useMemo(() => {
    if (!myTeam) return config.budget;
    return remainingBudgetByTeam[myTeam.id] ?? calculateRemainingBudget(config.budget, myTeam.id, picks);
  }, [config.budget, myTeam, picks, remainingBudgetByTeam]);

  const currentRound = useMemo(() => {
    if (teams.length === 0) return 1;
    return calculateCurrentRound(teams.length, rosterSlots, picks);
  }, [teams.length, rosterSlots, picks]);

  const selectedA = useMemo(
    () => players.find((player) => player.id === compareAId) ?? null,
    [players, compareAId]
  );
  const selectedB = useMemo(
    () => players.find((player) => player.id === compareBId) ?? null,
    [players, compareBId]
  );

  const openAddModal = (player: DraftPlayer) => {
    setAddTarget(player);
  };

  const openTakenModal = (player: DraftPlayer) => {
    setTakenTarget(player);
  };

  const closeAddModal = () => {
    setAddTarget(null);
  };

  const closeTakenModal = () => {
    setTakenTarget(null);
  };

  // Bootstrap: 인증 필요. config / teams / picks 세 가지만 받음.
  // 로그인 상태가 아니면 아예 호출하지 않음 (토큰 없으면 apiGetAuth 가 즉시 throw).
  useEffect(() => {
    if (!authed) {
      // setState 를 effect body 에서 바로 호출하면 cascading render 가 발생하므로 마이크로태스크로 지연.
      queueMicrotask(() => {
        setTeams([]);
        setPicks([]);
      });
      return;
    }

    const controller = new AbortController();

    apiGetAuth<DraftBootstrapResponse>(
      "/api/draft/bootstrap",
      {
        leagueType: localConfig.leagueType,
        budget: localConfig.budget,
        rosterPlayers: localConfig.rosterPlayers,
        myTeamName: localConfig.myTeamName,
        oppTeamNames: localConfig.oppTeamNames?.join(",") || "",
        opponentsCount: localConfig.opponentsCount,
      },
      controller.signal
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setConfig(data.config);
        setTeams(data.teams);
        setPicks(data.picks);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to bootstrap draft data");
      });

    return () => controller.abort();
  }, [authed, localConfig]);

  // 공개 선수 목록 — 한 번만 호출. 검색/필터/정렬/페이지네이션은 아래 useMemo 에서 처리.
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    apiGet<DraftPlayersResponse>("/api/draft/players", undefined, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setPublicPlayers(data.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setPublicPlayers([]);
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  // 인증된 사용자에게만 PPA 값 + 추천 bid 를 불러와 playerId 로 공개 목록과 머지한다.
  // 로그아웃 시 값을 즉시 지워서 UI 에 남지 않도록 함.
  useEffect(() => {
    if (!authed) {
      queueMicrotask(() => setPlayerValues(null));
      return;
    }

    const controller = new AbortController();

    apiGetAuth<DraftPlayerValuesResponse>(
      "/api/draft/players/values",
      undefined,
      controller.signal
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setPlayerValues(data.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error(err);
        setPlayerValues(null);
      });

    return () => controller.abort();
  }, [authed]);

  // Toggle player selection for A/B comparison (max 2 players).
  const handleCompareToggle = (playerId: string) => {
    if (!authed) return;
    if (comparisonOpen) setComparisonOpen(false);

    if (compareAId === playerId) {
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

    setCompareBId(playerId);
  };

  const clearCompare = () => {
    setCompareAId(null);
    setCompareBId(null);
    setComparisonOpen(false);
  };

  const clearCompareA = () => {
    setCompareAId(null);
    setComparisonOpen(false);
  };

  const clearCompareB = () => {
    setCompareBId(null);
    setComparisonOpen(false);
  };

  const openPlayerInfo = (rawPlayerId: string) => {
    const parsed = Number(rawPlayerId);
    if (!Number.isFinite(parsed)) {
      setError("Invalid player id");
      return;
    }
    setProfilePlayerId(parsed);
  };

  const closePlayerInfo = () => {
    setProfilePlayerId(null);
  };

  // Remove a draft pick via DELETE API and update local state.
  const handleRemovePick = (pick: DraftPick) => {
    void apiDeleteAuth<DraftPicksResponse>(`/api/draft/picks/${pick.playerId}`)
      .then((data) => setPicks(data.items))
      .catch((err: unknown) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to remove pick");
      });
  };

  // "Add" action: draft a player to my team with the given bid amount.
  const handleAddFinish = (bid: number) => {
    if (!addTarget || !myTeam) return;

    const payload: DraftPickUpsertIn = {
      playerId: addTarget.id,
      draftedByTeamId: myTeam.id,
      slotPos: resolveDraftSlotPosition(addTarget),
      bid,
      type: "mine",
    };

    void apiPostAuth<DraftPicksResponse, DraftPickUpsertIn>(
      "/api/draft/picks",
      payload,
      { rosterPlayers: rosterSlots }
    )
      .then((data) => {
        setPicks(data.items);
        closeAddModal();
        draftRoomTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to save draft pick");
      });
  };

  // "Taken" action: record that an opponent team drafted this player.
  const handleTakenFinish = (draftedByTeamId: string, bid: number) => {
    if (!takenTarget) return;

    const payload: DraftPickUpsertIn = {
      playerId: takenTarget.id,
      draftedByTeamId,
      slotPos: resolveDraftSlotPosition(takenTarget),
      bid,
      type: "taken",
    };

    void apiPostAuth<DraftPicksResponse, DraftPickUpsertIn>(
      "/api/draft/picks",
      payload,
      { rosterPlayers: rosterSlots }
    )
      .then((data) => {
        setPicks(data.items);
        closeTakenModal();
        draftRoomTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to save draft pick");
      });
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-black text-white/70">PPA-DUN</div>
            <h1 className="mt-1 text-3xl font-black text-white">Draft Room</h1>
            <p className="mt-2 text-sm text-white/60">
              {String(config.leagueType ?? "standard").toUpperCase()} - ${config.budget} Budget - {rosterSlots} Players
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-xs font-extrabold text-white/60">Remaining Budget</div>
            <div className="mt-1 text-2xl font-black text-emerald-400">${remainingBudget}</div>
          </div>
        </div>
      </FadeIn>

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
                Sign in to use the live draft room board and Add / Taken actions.
              </div>
            </section>
          )}
        </div>
      </FadeIn>

      <FadeIn delayMs={100} className="relative z-40">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-md">
              <div className="text-xs font-extrabold text-white/70">Search</div>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search player name..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-white/40 focus:border-white/25"
              />
            </div>

            <div className="w-full lg:w-72">
              <Dropdown<DraftSort>
                label="Sort"
                value={sort}
                options={sortOptions}
                onChange={(next) => {
                  setSort(next);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {positionFilters.map((filterValue) => {
              const active = position === filterValue;
              return (
                <button
                  key={filterValue}
                  onClick={() => {
                    setPosition(filterValue);
                    setPage(1);
                  }}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-extrabold transition",
                    active
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
                  ].join(" ")}
                >
                  {filterValue}
                </button>
              );
            })}

            <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
              Remaining Budget: ${remainingBudget}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delayMs={120}>
        <section className="rounded-2xl border border-fuchsia-500/55 bg-[#1b1228] p-4 shadow-[0_0_22px_rgba(168,85,247,0.22)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
              <div className="rounded-xl bg-fuchsia-500/15 px-4 py-3 ring-1 ring-fuchsia-300/40 lg:min-w-[170px]">
                <div className="text-sm font-black text-fuchsia-200">Compare</div>
                <div className="mt-0.5 text-[11px] font-bold text-white/65">Select 2 players</div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
                <div className="min-w-0 w-full rounded-xl border border-emerald-400/50 bg-emerald-500/12 px-3 py-2 shadow-[0_0_16px_rgba(16,185,129,0.18)] sm:w-[300px]">
                  {selectedA ? (
                    <>
                      <div className="flex items-center justify-between gap-2 text-xs text-white/80">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-black text-emerald-100">A</span>
                          <span className="truncate font-black text-white">{selectedA.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={clearCompareA}
                          className="grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/20 text-[10px] font-black text-white/80 transition hover:bg-white/15"
                          aria-label="Remove player A from compare"
                          title="Remove player A"
                        >
                          X
                        </button>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-white/70">
                        {selectedA.positions.join("/")} - {selectedA.team} - ${selectedA.recommendedBid ?? "—"}
                      </div>
                      <div className="mt-1 text-[10px] text-white/55">
                        AVG {formatAvg(selectedA.avg)} | HR {selectedA.hr ?? "-"} | RBI {selectedA.rbi ?? "-"} | SB {selectedA.sb ?? "-"}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs font-bold text-white/55">Select player A</div>
                  )}
                </div>

                <div className="text-center text-xs font-black text-fuchsia-200 sm:px-1">VS</div>

                <div className="min-w-0 w-full rounded-xl border border-emerald-400/50 bg-emerald-500/12 px-3 py-2 shadow-[0_0_16px_rgba(16,185,129,0.18)] sm:w-[300px]">
                  {selectedB ? (
                    <>
                      <div className="flex items-center justify-between gap-2 text-xs text-white/80">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded bg-emerald-500/25 px-1.5 py-0.5 font-black text-emerald-100">B</span>
                          <span className="truncate font-black text-white">{selectedB.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={clearCompareB}
                          className="grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/20 text-[10px] font-black text-white/80 transition hover:bg-white/15"
                          aria-label="Remove player B from compare"
                          title="Remove player B"
                        >
                          X
                        </button>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-white/70">
                        {selectedB.positions.join("/")} - {selectedB.team} - ${selectedB.recommendedBid ?? "—"}
                      </div>
                      <div className="mt-1 text-[10px] text-white/55">
                        AVG {formatAvg(selectedB.avg)} | HR {selectedB.hr ?? "-"} | RBI {selectedB.rbi ?? "-"} | SB {selectedB.sb ?? "-"}
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
                onClick={() => setComparisonOpen(true)}
                disabled={!selectedA || !selectedB || !authed}
                className="rounded-xl bg-fuchsia-600 px-4 py-2 text-xs font-black text-white transition hover:bg-fuchsia-500 disabled:opacity-40"
                title={!authed ? "Sign in required" : "Open player comparison"}
              >
                Compare
              </button>
            </div>
          </div>
        </section>
      </FadeIn>

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

            {!loading && error && <div className="p-4 text-sm text-red-200">Failed to load players: {error}</div>}

            {!loading && !error && players.length === 0 && (
              <div className="p-4 text-sm text-white/70">No results. Try another search or filter.</div>
            )}

            {!loading &&
              !error &&
              players.map((player, idx) => {
                const status = getPlayerDraftStatus(player.id, picks, teams);
                const compareAActive = compareAId === player.id;
                const compareBActive = compareBId === player.id;
                const compareRole = compareAActive ? "A" : compareBActive ? "B" : null;
                const compareActive = Boolean(compareRole);

                return (
                  <div
                    key={player.id}
                    className={[
                      "grid grid-cols-[.4fr_1.8fr_.6fr_.8fr_.8fr_.8fr_.8fr_.8fr_.9fr_1.3fr_1.1fr_.9fr] items-center px-4 py-3 text-sm text-white/85 transition",
                      compareActive
                        ? "relative z-[1] my-1 rounded-xl border border-emerald-400/75 bg-emerald-500/10 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                        : "hover:bg-white/5",
                    ].join(" ")}
                  >
                    <div className="text-white/45">{(page - 1) * PAGE_SIZE + idx + 1}</div>

                    <div>
                      <button
                        type="button"
                        onClick={() => openPlayerInfo(player.id)}
                        className="rounded-md border border-transparent px-2 py-1 -mx-2 -my-1 font-semibold text-white transition hover:border-white/35 hover:bg-white/5 hover:text-amber-200 focus-visible:border-white/45 focus-visible:bg-white/10 focus-visible:outline-none"
                      >
                        {player.name}
                      </button>
                    </div>

                    <div>
                      <span className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-extrabold text-white/80">
                        {player.positions[0]}
                      </span>
                    </div>

                    <div className={draftCostClass(authed)}>${player.recommendedBid ?? "—"}</div>

                    <div>
                      <span
                        className={[
                          "inline-flex items-center rounded-lg border px-2 py-1 text-[11px] font-extrabold",
                          mlbTeamBadgeClass(player.team),
                        ].join(" ")}
                      >
                        {player.team}
                      </span>
                    </div>

                    <div className="text-white/70">{formatAvg(player.avg)}</div>
                    <div className="font-semibold text-amber-300">{player.hr ?? "-"}</div>
                    <div className="text-white/70">{player.rbi ?? "-"}</div>
                    <div className="font-semibold text-amber-300">{player.sb ?? "-"}</div>

                    <div className={`font-black ${ppaValueClass(player.ppaValue, { authed })}`}>
                      {formatPpa(player.ppaValue)}
                    </div>

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
                            onClick={() => openAddModal(player)}
                            className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-200 ring-1 ring-emerald-400/20 transition hover:bg-emerald-500/25"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => openTakenModal(player)}
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

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        disabled={!authed}
                        onClick={() => handleCompareToggle(player.id)}
                        className={[
                          "relative h-6 w-14 rounded-full border transition",
                          compareActive
                            ? "border-emerald-300/70 bg-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                            : "border-white/10 bg-white/5 hover:bg-white/10",
                          !authed ? "opacity-40" : "",
                        ].join(" ")}
                        title={!authed ? "Sign in required" : compareRole ? `Selected ${compareRole}` : "Select for compare"}
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
            Players and draft picks are loaded from backend APIs.
          </div>
        </section>

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </FadeIn>

      {addTarget && (
        <AddBidModal
          key={`add-${addTarget.id}`}
          open={true}
          player={addTarget}
          remainingBudget={remainingBudget}
          onClose={closeAddModal}
          onConfirm={handleAddFinish}
        />
      )}

      {takenTarget && (
        <TakenBidModal
          key={`taken-${takenTarget.id}`}
          open={true}
      player={takenTarget}
      teams={teams}
      remainingBudgetByTeam={remainingBudgetByTeam}
      onClose={closeTakenModal}
      onConfirm={handleTakenFinish}
    />
  )}

      <PlayerComparisonModal
        open={comparisonOpen && Boolean(selectedA) && Boolean(selectedB)}
        playerA={selectedA}
        playerB={selectedB}
        onClose={() => setComparisonOpen(false)}
      />

      <PlayerInfoModal
        open={profilePlayerId !== null}
        playerId={profilePlayerId}
        onClose={closePlayerInfo}
      />

    </div>
  );
}
