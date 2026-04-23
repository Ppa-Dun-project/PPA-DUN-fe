import type { MyTeamPlayer, MyTeamPosFilter, MyTeamSort } from "../../types/myteam";

/**
 * 선수 목록 필터링
 * - 이름/팀명 검색 (대소문자 무시)
 * - 포지션 필터 (ALL이면 전체)
 * - BENCH(1B) 같은 포맷도 포지션 문자열에 포함되면 매칭
 */
export function filterMyTeam(
  players: MyTeamPlayer[],
  query: string,
  pos: MyTeamPosFilter
): MyTeamPlayer[] {
  const q = query.trim().toLowerCase();

  return players.filter((player) => {
    const matchesQuery =
      !q || player.name.toLowerCase().includes(q) || player.team.toLowerCase().includes(q);
    const matchesPos = pos === "ALL" ? true : player.pos.includes(pos);
    return matchesQuery && matchesPos;
  });
}

/** 선수 목록 정렬 (정렬 옵션별 비교 함수 적용) */
export function sortMyTeam(players: MyTeamPlayer[], sort: MyTeamSort): MyTeamPlayer[] {
  // 원본 배열을 변경하지 않도록 복사본 사용
  const copy = [...players];

  switch (sort) {
    case "score_desc":
      return copy.sort((a, b) => b.ppaValue - a.ppaValue);
    case "score_asc":
      return copy.sort((a, b) => a.ppaValue - b.ppaValue);
    case "cost_desc":
      return copy.sort((a, b) => b.cost - a.cost);
    case "cost_asc":
      return copy.sort((a, b) => a.cost - b.cost);
    case "avg_desc":
      return copy.sort((a, b) => b.avg - a.avg);
    case "hr_desc":
      return copy.sort((a, b) => b.hr - a.hr);
    case "rbi_desc":
      return copy.sort((a, b) => b.rbi - a.rbi);
    case "sb_desc":
      return copy.sort((a, b) => b.sb - a.sb);
    default:
      return copy;
  }
}

/** 타율을 .300 같은 야구식 표기로 포맷 (0이면 "-") */
export function formatAvg(avg: number) {
  if (!avg) return "-";
  return avg.toFixed(3).replace("0.", ".");
}

