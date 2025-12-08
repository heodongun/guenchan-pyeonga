# Homeground (Kotlin + Ktor + MySQL + Next.js)

동네 공간 예약 · 모임 일정 · 후기/질문 아카이브를 한 번에 다루는 커뮤니티 서비스입니다. 프론트는 Next.js, 백엔드는 Ktor + Exposed + MySQL로 구성되며 Docker Compose로 손쉽게 올릴 수 있습니다.

---

## ✨ 핵심 특징
- **동네 생활 흐름**: 공간 예약, 모임 일정, 후기/질문 게시판을 하나의 서비스 경험으로 제공합니다.
- **커서 기반 무한 스크롤**: `lastId` 커서를 활용해 일정한 조회 성능을 유지합니다.
- **계층형 댓글 & 재귀 삭제**: Path 모델로 깊이 제한 없이 댓글 트리를 표현하고, 자식 유무에 따라 Soft/Hard Delete를 처리합니다.
- **전역 예외 처리 & JWT 인증**: StatusPages 기반 에러 핸들링, JWT로 인증/인가를 단순화합니다.
- **Docker Compose 원클릭 실행**: MySQL · 백엔드 · 프론트를 한 번에 올리고 헬스체크로 의존성을 보장합니다.

---

## 프로젝트 구조
```
guenchan-pyeonga/
├── backend/                 # Ktor + Exposed + MySQL API
├── frontend/                # Next.js (App Router) UI
├── docs/                    # 문서 모음 (개편 기록 등)
├── docker-compose.yml       # 전체 스택 기동
└── README.md
```

---

## 실행 방법
### 1) Docker Compose (권장)
```bash
docker compose up -d --build
```
- 프론트: http://localhost:3000
- 백엔드: http://localhost:8080
- 헬스체크: `GET /health`

### 2) 로컬 단독 실행
- 백엔드: `cd backend && ./gradlew run`
- 프론트: `.env.local`에 `NEXT_PUBLIC_API_URL=http://localhost:8080` 설정 후 `npm install && npm run dev`

---

## API 요약
- 인증: `POST /api/auth/signup`, `POST /api/auth/signin`
- 게시글: `GET /api/articles?lastId&size`, `GET /api/articles/{id}`, `POST/PUT/DELETE /api/articles`
- 댓글: `GET /api/comments/article/{articleId}`, `POST /api/comments`, `DELETE /api/comments/{id}`

---

## 기술 스택
- **Backend**: Kotlin 2.2.x, Ktor 3.3.x, Exposed, MySQL 8, JWT, Coroutines
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Infra**: Docker, Docker Compose, HikariCP, Logback

---

## 변경 이력
- 개편/배포/테스트 로그는 `docs/CHANGELOG_HOMEGROUND.md`와 `docs/DESIGN_IMPROVEMENTS.md`를 참고하세요.

```bash
# 레포지토리 클론
git clone https://github.com/heodongun/guenchan-pyeonga.git
cd guenchan-pyeonga

# Docker Compose로 전체 시스템 실행
docker-compose up -d --build

# 서비스 접속
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8080
# - MySQL: localhost:3306
```

### 2. 개별 실행

#### Backend
```bash
cd backend

# 환경 변수 설정 (.env 파일 생성)
DB_URL=jdbc:mysql://localhost:3306/board_db
DB_USER=root
DB_PASSWORD=password
JWT_SECRET=my-secret-key

# 실행
./gradlew run
```

#### Frontend
```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 파일 생성)
NEXT_PUBLIC_API_URL=http://localhost:8080

# 개발 서버 실행
npm run dev
```

---

## 🎥 시연 영상

[YouTube 링크 추가 예정]

---

## 📚 참고 자료

- [Ktor Documentation](https://ktor.io/docs/)
- [Exposed ORM](https://github.com/JetBrains/Exposed)
- [Next.js Documentation](https://nextjs.org/docs)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

---

## 📝 라이선스

MIT License

---

## 👤 개발자

- **Name**: 허동운
- **GitHub**: [@heodongun](https://github.com/heodongun)
- **Email**: heodongun@example.com

---

**🚀 Generated with Claude Code**
