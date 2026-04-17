/**
 * readEnvValue: 환경변수를 안전하게 읽는 헬퍼
 * - 값이 있으면 공백 제거 후 반환
 * - 값이 없거나 빈 문자열이면 fallback 기본값 반환
 *
 * rawValue?.trim(): 옵셔널 체이닝
 * - rawValue가 undefined면 undefined 반환 (에러 안 남)
 * - rawValue가 있으면 trim() 호출
 */
function readEnvValue(rawValue: string | undefined, fallback: string) {
  const trimmed = rawValue?.trim();
  // 삼항 연산자: trimmed가 truthy면 사용, 아니면 fallback
  return trimmed ? trimmed : fallback;
}

// 드래프트 룸 ID — 어떤 드래프트 방의 데이터인지 구분
// - .env에 VITE_DRAFT_ROOM_ID=... 로 설정 가능
// - 없으면 "default" 사용
export const DRAFT_ROOM_ID = readEnvValue(import.meta.env.VITE_DRAFT_ROOM_ID, "default");

// 내 팀 ID — API 호출 시 내 팀을 식별
export const MY_TEAM_ID = readEnvValue(import.meta.env.VITE_MY_TEAM_ID, "team-0");
