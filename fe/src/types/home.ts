/**
 * NewsItem: 뉴스 항목의 데이터 구조
 * - ? 붙은 필드는 선택 사항 (없어도 됨)
 */
export type NewsItem = {
  id: string;              // 고유 식별자
  title: string;           // 뉴스 제목
  summary: string;         // 뉴스 요약
  publishedAt: string;     // 발행 시간 (ISO 문자열)
  url?: string;            // 원문 링크 (선택)
  source?: string;         // 출처 (선택, 예: "MLB.com")
  imageUrl?: string;       // 썸네일 이미지 URL (선택, 없으면 텍스트만 표시)
};

/**
 * TopPlayer: 상위 선수 정보 (현재 사용되지 않지만 타입 정의만 유지)
 */
export type TopPlayer = {
  id: string;
  name: string;
  team: string;            // MLB 팀 약어
  positions: string[];     // 포지션 목록 (배열)
  valueScore: number;      // PPA-DUN 가치 점수
};
