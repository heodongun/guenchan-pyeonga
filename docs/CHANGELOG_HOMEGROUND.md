# Homeground 개편 변경 기록 (2025-12-08)

## 개요
- 기존 AI 톤의 게시판을 **동네 생활 서비스 Homeground**로 리포지셔닝하고, 프론트/인증/게시글 흐름을 모두 일관된 브랜드 스타일로 교체했습니다.
- 백엔드(Ktor)와 MySQL, 프론트(Next.js)를 Docker Compose로 재빌드해 end-to-end 동작을 확인했습니다.

## 프론트엔드
- 색상/폰트/컴포넌트 토큰 재정의: `brand-*` 팔레트와 `Noto Sans KR` 적용, 공용 카드/버튼/배지(`brand-card`, `brand-button`, `brand-button-ghost`, `brand-pill`) 도입.
- 홈 화면 재구성: 추천 공간, 오늘 일정, 3대 서비스(공간 예약/모임 일정/이야기 아카이브), 주간 일정, 커뮤니티 피드 흐름으로 정보 설득 → 참여 CTA 강화.
- 게시글 상세/작성/인증 페이지 카피 및 UI를 생활형 톤으로 통일, 로딩·오류·비어 있음 상태를 동일한 스타일로 처리.
- 프록시 설정으로 프론트에서 `/api/**` 호출 시 백엔드로 리라이트(`next.config.js`).

## 백엔드
- 기존 도메인/서비스/레포지토리 구조 유지, Compose 환경 변수로 MySQL·JWT 연결 (DB_URL/USER/PASSWORD/JWT_*).
- 회원가입/로그인/게시글 작성/댓글 작성 기능을 실제 컨테이너 환경에서 스모크 테스트로 검증.

## 인프라/배포
- `docker compose up -d --build`로 이미지 재빌드 및 컨테이너 기동 확인 (frontend:3000, backend:8080, mysql:3306).
- Compose 헬스체크(mysql)로 백엔드 의존성 안정화.

## 확인된 동작(스모크 테스트)
- `GET /health` → OK.
- 회원가입 `POST /api/auth/signup` → 토큰 발급 확인.
- 인증 토큰으로 게시글 작성 `POST /api/articles`, 댓글 작성 `POST /api/comments` 성공.
- 프론트에서 `/api/articles` 호출 시 백엔드 응답 정상(Next.js 리라이트 경유).

## 후속 제안
- ESLint 프롬프트 수락 후 `npm run lint` 실행해 정적 검사 정리.
- 실제 공간/모임 데이터를 API로 연동하고, 이야기 피드에 태그/필터 추가.
