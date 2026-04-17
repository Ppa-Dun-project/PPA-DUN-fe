/**
 * timeAgo: ISO 시간 문자열을 "3h ago" 같은 상대 시간으로 변환
 *
 * 예시:
 *   timeAgo("2026-04-17T10:00:00Z") → "3h ago"
 *   timeAgo(어제) → "1d ago"
 *
 * 동작:
 * 1. ISO 문자열을 Date 객체로 변환 → 밀리초 타임스탬프 추출
 * 2. 현재 시간과의 차이 계산
 * 3. 적절한 단위(분/시간/일)로 표시
 */
export function timeAgo(iso: string): string {
  // new Date(iso).getTime(): ISO 문자열 → 밀리초 단위 타임스탬프
  // Date.now(): 현재 시간 타임스탬프
  const diff = Date.now() - new Date(iso).getTime();

  // Math.floor: 내림 (예: 3.7 → 3)
  // 60000: 1분 = 60초 × 1000밀리초
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";          // 1분 미만
  if (mins < 60) return `${mins}m ago`;     // 60분 미만

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;   // 24시간 미만

  // 24시간 이상은 일 단위로 표시
  return `${Math.floor(hours / 24)}d ago`;
}
