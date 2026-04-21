/**
 * DraftPlayer: 드래프트 풀에 있는 선수 정보
 * - number | null: 숫자 또는 null (타자가 아닌 투수는 null 등)
 */
export type DraftPlayer = {
  id: string;
  name: string;
  team: string;                  // MLB 팀 약어 (예: "NYY")
  positions: string[];           // 포지션 배열 (예: ["OF", "DH"])
  avg: number | null;            // 타율
  hr: number | null;             // 홈런
  rbi: number | null;            // 타점
  sb: number | null;             // 도루
  ppaValue: number;              // PPA-DUN 가치 점수
  recommendedBid: number;        // 추천 드래프트 비용
};

/**
 * DraftTeam: 드래프트 룸에 참여하는 팀
 */
export type DraftTeam = {
  id: string;
  name: string;
  isMine?: boolean;              // 내 팀인지 여부 (선택)
};

/**
 * DraftPickType: 드래프트 픽의 종류
 * - 유니온 타입: 두 값 중 하나만 가능
 */
export type DraftPickType = "mine" | "taken";

/**
 * DraftPick: 개별 드래프트 픽 정보
 */
export type DraftPick = {
  playerId: string;              // 뽑은 선수 ID
  draftedByTeamId: string;       // 뽑은 팀 ID
  slotIndex: number;             // 로스터 슬롯 번호
  slotPos: string;               // 슬롯 포지션 (예: "SP", "OF", "BENCH")
  bid: number | null;            // 낙찰가 ($)
  type: DraftPickType;           // "mine" 또는 "taken"
};

/**
 * DraftConfigLocal: 드래프트 설정 (localStorage에 저장)
 * - HomePage에서 유저가 입력 → 드래프트 룸 진입 시 사용
 */
export type DraftConfigLocal = {
  myTeamName?: string;
  oppTeamNames?: string[];       // 상대 팀 이름들
  opponentsCount?: number;       // 상대 수
  leagueType?: string;           // "standard" | "lite" | "custom"
  budget?: number;               // 예산 ($)
  rosterPlayers?: number;        // 로스터 인원
  createdAt?: string;            // 설정 생성 시간
};

/**
 * DraftSort: 드래프트 페이지의 정렬 옵션
 * - _desc: 내림차순 (높은 것부터)
 * - _asc: 오름차순
 */
export type DraftSort =
  | "score_desc"
  | "score_asc"
  | "cost_desc"
  | "cost_asc"
  | "avg_desc"
  | "hr_desc"
  | "rbi_desc"
  | "sb_desc";

/**
 * DraftPositionFilter: 포지션 필터 옵션
 */
export type DraftPositionFilter =
  | "ALL"      // 전체
  | "P"        // 투수 전체 (SP + RP)
  | "SP"       // 선발 투수
  | "RP"       // 구원 투수
  | "C"        // 포수
  | "1B"       // 1루수
  | "2B"       // 2루수
  | "3B"       // 3루수
  | "SS"       // 유격수
  | "OF"       // 외야수
  | "UTIL";    // 유틸리티
