# 게시판 서비스 (Board Service)

> **Kotlin + Ktor + MySQL + Next.js**로 구현한 현대적인 게시판 서비스

## 📌 프로젝트 소개

이 프로젝트는 기존 Spring Boot 기반 게시판 프로젝트의 문제점을 개선하고, 현대적인 기술 스택으로 재구현한 게시판 서비스입니다.

- **개발 기간**: 2024.12.01
- **개발 인원**: 1인 (개인 프로젝트)
- **GitHub**: [https://github.com/heodongun/guenchan-pyeonga.git](https://github.com/heodongun/guenchan-pyeonga.git)

---

## 🔍 기존 코드의 문제점과 개선 사항

### 1. 일관성 없는 예외 처리 → 전역 예외 처리 시스템

| 문제점 | 개선 방법 |
|--------|----------|
| orElseThrow() 사용으로 인해 모든 예외가 500 에러로 반환 | Ktor의 StatusPages를 활용한 전역 예외 처리 구현 |
| 클라이언트가 오류 원인 파악 불가 | 커스텀 예외 클래스로 적절한 HTTP 상태 코드 제공 (400, 401, 403, 404, 409) |

**개선 결과**:
- **개선 전**: 모든 예외가 500 에러로 반환되어 클라이언트가 원인 파악 불가
- **개선 후**: 비즈니스 예외별로 적절한 HTTP 상태 코드와 명확한 에러 메시지 제공

### 2. 동기 처리 방식 → 비동기 처리와 커서 기반 무한 스크롤

| 문제점 | 개선 방법 |
|--------|----------|
| LIMIT OFFSET 방식의 페이지네이션 | 커서 기반(Cursor-based) 무한 스크롤 구현 |
| 대량 데이터 처리 시 성능 저하 | Kotlin Coroutines를 활용한 비동기 처리 |

**개선 결과**:
- **개선 전**: OFFSET 방식으로 페이지가 뒤로 갈수록 성능 저하
- **개선 후**: lastId를 활용한 커서 기반 조회로 일정한 성능 유지, 비동기 처리로 응답 속도 개선

---

## ✨ 핵심 구현 기능

### 1. 커서 기반 무한 스크롤 (Cursor-based Infinite Scroll)

```kotlin
// ArticleRepository.kt
suspend fun findAllWithCursor(lastId: Long?, size: Int = 20): List<ArticleListItem> {
    val query = (Articles innerJoin Users)
        .leftJoin(Comments, { Articles.id }, { Comments.articleId })
        .slice(...)
        .selectAll()
        .apply {
            if (lastId != null) {
                andWhere { Articles.id less lastId }  // 커서 기반 조회
            }
        }
        .groupBy(Articles.id)
        .orderBy(Articles.id, SortOrder.DESC)
        .limit(size)

    return query.map { ... }
}
```

**기술적 이점**:
- OFFSET 방식 대비 일정한 조회 성능 유지
- 데이터가 많아져도 마지막 페이지 조회 속도가 느려지지 않음
- 비동기 처리로 서버 리소스 효율적 사용

### 2. Path Model 기반 계층형 댓글

```kotlin
// Comment 엔티티
object Comments : LongIdTable("comments") {
    val path = varchar("path", 1000).default("")  // 예: "1/5/12"
    val depth = integer("depth").default(0)
    val isDeleted = bool("is_deleted").default(false)
    // ...
}
```

**기술적 이점**:
- N-Depth 무한 계층 구조 지원 (기존: 2-Depth 제한)
- 한 번의 쿼리로 전체 계층 구조 조회 가능
- Path 기반 정렬로 효율적인 계층 표시

### 3. 재귀적 댓글 삭제 로직

```kotlin
// CommentService.kt
suspend fun deleteComment(commentId: Long, userId: Long) {
    val childrenCount = commentRepository.countNonDeletedChildren(commentId)

    if (childrenCount > 0) {
        // 자식이 있으면 Soft Delete
        commentRepository.softDelete(commentId)
    } else {
        // 자식이 없으면 Hard Delete
        commentRepository.hardDelete(commentId)

        // 부모도 재귀적으로 삭제 검사
        comment.parentId?.let { parentId ->
            recursivelyDeleteOrphanedParents(parentId)
        }
    }
}
```

**기술적 이점**:
- 자식 댓글 유무에 따른 Soft/Hard Delete 자동 결정
- 고아(Orphan) 댓글 자동 정리로 깔끔한 데이터 관리
- 재귀적 처리로 상위 댓글까지 자동 정리

---

## 🛠️ 기술 스택

### Backend
- **Language**: Kotlin 2.2.20
- **Framework**: Ktor 3.3.2
- **ORM**: Exposed 0.48.0
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Token)
- **Async**: Kotlin Coroutines

### Frontend
- **Framework**: Next.js 14.2.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: MySQL 8.0 (Docker)

---

## 📂 프로젝트 구조

```
guenchan-pyeonga/
├── backend/
│   ├── src/main/kotlin/com/example/
│   │   ├── domain/          # 도메인 모델
│   │   │   ├── user/
│   │   │   ├── article/
│   │   │   └── comment/
│   │   ├── repository/      # 데이터 접근 계층
│   │   ├── service/         # 비즈니스 로직
│   │   ├── route/           # API 라우트
│   │   ├── config/          # 설정 (DB, JWT, Exception)
│   │   └── util/            # 유틸리티
│   ├── build.gradle.kts
│   └── Dockerfile
├── frontend/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React 컴포넌트
│   ├── lib/                 # 유틸리티 함수
│   ├── package.json
│   └── Dockerfile
├── docs/                    # 프로젝트 문서
├── docker-compose.yml
└── README.md
```

---

## 🔗 API 명세

### 인증 (Authentication)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/signin` | 로그인 | ❌ |

### 게시글 (Articles)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/articles?lastId={id}&size={size}` | 게시글 목록 조회 (커서 기반) | ❌ |
| GET | `/api/articles/{id}` | 게시글 상세 조회 | ❌ |
| POST | `/api/articles` | 게시글 작성 | ✅ |
| PUT | `/api/articles/{id}` | 게시글 수정 | ✅ |
| DELETE | `/api/articles/{id}` | 게시글 삭제 | ✅ |

### 댓글 (Comments)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/comments/article/{articleId}` | 댓글 목록 조회 (계층 구조) | ❌ |
| POST | `/api/comments` | 댓글 작성 | ✅ |
| DELETE | `/api/comments/{id}` | 댓글 삭제 (재귀적) | ✅ |

---

## 💻 로컬 실행 방법

### 1. Docker Compose로 전체 실행 (권장)

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

- **Name**: 허돈건
- **GitHub**: [@heodongun](https://github.com/heodongun)
- **Email**: heodongun@example.com

---

**🚀 Generated with Claude Code**
