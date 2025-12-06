# 개선 사항 문서

## 📋 목차
1. [전역 예외 처리 시스템](#1-전역-예외-처리-시스템)
2. [커서 기반 무한 스크롤과 비동기 처리](#2-커서-기반-무한-스크롤과-비동기-처리)
3. [Path Model 기반 계층형 댓글](#3-path-model-기반-계층형-댓글)
4. [재귀적 댓글 삭제 로직](#4-재귀적-댓글-삭제-로직)
5. [요청 검증과 API 방어선](#5-요청-검증과-api-방어선)
6. [댓글 트리 빌더 안정화](#6-댓글-트리-빌더-안정화)

---

## 1. 전역 예외 처리 시스템

### 🔴 기존 문제점

기존 Spring Boot 프로젝트에서는 `orElseThrow()`를 사용하여 예외를 발생시켰으나, 이는 다음과 같은 문제점이 있었습니다:

```java
// 기존 방식
public Article getArticle(Long id) {
    return articleRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Article not found"));
}
```

**문제점**:
- 모든 예외가 500 Internal Server Error로 반환
- 클라이언트가 오류의 원인을 파악할 수 없음
- 비즈니스 로직 예외와 시스템 예외 구분 불가

### ✅ 개선 방법

Ktor의 `StatusPages` 플러그인을 활용하여 전역 예외 처리 시스템을 구현했습니다.

#### 1) 커스텀 예외 클래스 정의

```kotlin
// util/exceptions/Exceptions.kt
sealed class BoardException(message: String) : Exception(message)

class NotFoundException(message: String = "리소스를 찾을 수 없습니다.") : BoardException(message)
class BadRequestException(message: String = "잘못된 요청입니다.") : BoardException(message)
class UnauthorizedException(message: String = "인증이 필요합니다.") : BoardException(message)
class ForbiddenException(message: String = "권한이 없습니다.") : BoardException(message)
class ConflictException(message: String = "이미 존재하는 리소스입니다.") : BoardException(message)
```

#### 2) 전역 예외 핸들러

```kotlin
// config/ExceptionHandling.kt
fun Application.configureExceptionHandling() {
    install(StatusPages) {
        exception<NotFoundException> { call, cause ->
            call.respond(
                HttpStatusCode.NotFound,
                ErrorResponse(
                    status = 404,
                    message = cause.message ?: "리소스를 찾을 수 없습니다."
                )
            )
        }

        exception<BadRequestException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ErrorResponse(400, cause.message))
        }

        // ... 다른 예외 처리
    }
}
```

### 📊 개선 효과

| 항목 | 개선 전 | 개선 후 |
|------|---------|---------|
| HTTP 상태 코드 | 모두 500 | 예외 종류별 적절한 코드 (400, 401, 403, 404, 409) |
| 에러 메시지 | 불명확 | 구체적이고 명확한 메시지 |
| 클라이언트 경험 | 오류 원인 파악 불가 | 명확한 오류 원인 제공 |

---

## 2. 커서 기반 무한 스크롤과 비동기 처리

### 🔴 기존 문제점

기존 프로젝트에서는 LIMIT OFFSET 방식의 페이지네이션을 사용했습니다:

```java
// 기존 방식
Page<Article> articles = articleRepository.findAll(PageRequest.of(page, size));
```

**문제점**:
- 페이지 번호가 커질수록 OFFSET 값도 커져 성능 저하
- 대량 데이터 조회 시 응답 시간 증가
- 동기 방식으로 인한 스레드 블로킹

### ✅ 개선 방법

커서 기반(Cursor-based) 페이지네이션과 Kotlin Coroutines를 활용한 비동기 처리를 구현했습니다.

#### 1) 커서 기반 조회

```kotlin
// repository/ArticleRepository.kt
suspend fun findAllWithCursor(lastId: Long?, size: Int = 20): List<ArticleListItem> {
    val query = (Articles innerJoin Users)
        .leftJoin(Comments, { Articles.id }, { Comments.articleId })
        .slice(...)
        .selectAll()
        .apply {
            if (lastId != null) {
                andWhere { Articles.id less lastId }  // 커서 기반 필터링
            }
        }
        .orderBy(Articles.id, SortOrder.DESC)
        .limit(size)

    return query.map { ... }
}
```

#### 2) 비동기 서비스 레이어

```kotlin
// service/ArticleService.kt
suspend fun getArticles(lastId: Long?, size: Int = 20): ArticleListResponse {
    val articles = dbQuery {  // 비동기 데이터베이스 쿼리
        articleRepository.findAllWithCursor(lastId, size + 1)
    }

    val hasNext = articles.size > size
    val resultArticles = if (hasNext) articles.dropLast(1) else articles
    val nextCursor = if (hasNext) resultArticles.lastOrNull()?.id else null

    return ArticleListResponse(
        articles = resultArticles,
        hasNext = hasNext,
        nextCursor = nextCursor
    )
}
```

### 📊 개선 효과

| 항목 | LIMIT OFFSET 방식 | 커서 기반 방식 |
|------|-------------------|----------------|
| 첫 페이지 조회 속도 | 빠름 | 빠름 |
| 마지막 페이지 조회 속도 | 느림 (OFFSET 10000 등) | 일정 (항상 빠름) |
| 메모리 사용 | 많음 | 적음 |
| 동시 요청 처리 | 스레드 블로킹 | Non-blocking |

**성능 비교** (예상):
- 10,000번째 페이지 조회 시:
  - OFFSET 방식: ~500ms
  - 커서 방식: ~50ms
- 동시 100명 접속 시:
  - 동기 방식: 스레드 풀 고갈 위험
  - 비동기 방식: 안정적 처리

---

## 3. Path Model 기반 계층형 댓글

### 🔴 기존 문제점

기존 프로젝트에서는 부모-자식 관계만으로 댓글을 관리했습니다:

```java
// 기존 방식
@Entity
public class Comment {
    @Id
    private Long id;

    @ManyToOne
    private Comment parent;  // 부모 댓글
}
```

**문제점**:
- 2-Depth로 제한됨 (대댓글의 대댓글 불가)
- 전체 계층 구조 조회 시 N+1 문제 발생
- 계층 순서 정렬이 복잡함

### ✅ 개선 방법

Path Model을 도입하여 무한 깊이의 계층 구조를 지원합니다.

#### 1) Path Model 구조

```kotlin
// domain/comment/Comment.kt
object Comments : LongIdTable("comments") {
    val parentId = long("parent_id").nullable()
    val path = varchar("path", 1000).default("")  // 계층 경로
    val depth = integer("depth").default(0)       // 깊이
    // ...
}
```

**Path 예시**:
- 최상위 댓글 (id=1): path = "", depth = 0
- 1의 답글 (id=5): path = "1", depth = 1
- 5의 답글 (id=12): path = "1/5", depth = 2
- 12의 답글 (id=27): path = "1/5/12", depth = 3

#### 2) Path 기반 조회

```kotlin
// repository/CommentRepository.kt
suspend fun findByArticleId(articleId: Long): List<Comment> {
    return (Comments innerJoin Users)
        .select { Comments.articleId eq articleId }
        .orderBy(Comments.path to SortOrder.ASC, Comments.id to SortOrder.ASC)
        .map { it.toComment() }
}
```

#### 3) 자식 댓글 조회

```kotlin
suspend fun findChildren(parentId: Long): List<Comment> {
    val parent = findById(parentId) ?: return emptyList()
    val pathPrefix = if (parent.path.isEmpty()) "${parent.id}" else "${parent.path}/${parent.id}"

    return (Comments innerJoin Users)
        .select { Comments.path like "$pathPrefix%" }
        .map { it.toComment() }
}
```

### 📊 개선 효과

| 항목 | 기존 방식 | Path Model |
|------|-----------|------------|
| 최대 깊이 | 2-Depth | 무한 |
| 쿼리 횟수 | N+1 문제 | 1회 |
| 정렬 복잡도 | 높음 | Path 기반 간단 정렬 |
| 자식 조회 | 재귀 쿼리 필요 | LIKE 쿼리로 간단 |

---

## 4. 재귀적 댓글 삭제 로직

### 🔴 기존 문제점

기존 프로젝트에서는 댓글 삭제 시 단순히 삭제만 수행했습니다:

```java
// 기존 방식
public void deleteComment(Long id) {
    commentRepository.deleteById(id);
}
```

**문제점**:
- 자식 댓글이 있는 경우 외래 키 제약 조건 위반
- 또는 자식 댓글까지 강제 삭제되어 데이터 손실
- 삭제된 댓글의 흔적이 남지 않아 맥락 파악 어려움

### ✅ 개선 방법

Soft Delete와 Hard Delete를 조합한 재귀적 삭제 로직을 구현했습니다.

#### 1) Soft Delete와 Hard Delete

```kotlin
// repository/CommentRepository.kt
suspend fun softDelete(id: Long) {
    Comments.update({ Comments.id eq id }) {
        it[Comments.isDeleted] = true
        it[Comments.content] = "삭제된 댓글입니다."
    }
}

suspend fun hardDelete(id: Long) {
    Comments.deleteWhere { Comments.id eq id }
}
```

#### 2) 재귀적 삭제 로직

```kotlin
// service/CommentService.kt
suspend fun deleteComment(commentId: Long, userId: Long) {
    val comment = commentRepository.findById(commentId) ?: throw NotFoundException()

    if (comment.authorId != userId) throw ForbiddenException()

    dbQuery {
        val childrenCount = commentRepository.countNonDeletedChildren(commentId)

        if (childrenCount > 0) {
            // 1. 자식이 있으면 Soft Delete
            commentRepository.softDelete(commentId)
        } else {
            // 2. 자식이 없으면 Hard Delete
            commentRepository.hardDelete(commentId)

            // 3. 부모도 재귀적으로 삭제 검사
            comment.parentId?.let { parentId ->
                recursivelyDeleteOrphanedParents(parentId)
            }
        }
    }
}
```

#### 3) 고아 댓글 처리

```kotlin
private suspend fun recursivelyDeleteOrphanedParents(parentId: Long) {
    val parent = commentRepository.findById(parentId) ?: return

    // 부모가 삭제되지 않은 상태면 중단
    if (!parent.isDeleted) return

    // 부모의 자식 중 삭제되지 않은 댓글이 있는지 확인
    val nonDeletedChildren = commentRepository.countNonDeletedChildren(parentId)

    if (nonDeletedChildren == 0L) {
        // 자식이 없으면 물리적 삭제
        commentRepository.hardDelete(parentId)

        // 조부모도 재귀적으로 검사
        parent.parentId?.let { grandParentId ->
            recursivelyDeleteOrphanedParents(grandParentId)
        }
    }
}
```

### 📊 삭제 시나리오

#### 시나리오 1: 자식 댓글이 있는 경우

```
Before:
  ├─ 댓글 A (삭제 요청)
  │   ├─ 댓글 B
  │   └─ 댓글 C

After:
  ├─ [삭제된 댓글입니다.] (Soft Delete)
  │   ├─ 댓글 B
  │   └─ 댓글 C
```

#### 시나리오 2: 자식 댓글이 없는 경우

```
Before:
  ├─ 댓글 A
  │   ├─ 댓글 B (삭제 요청)

After:
  ├─ 댓글 A
      (댓글 B는 물리적 삭제)
```

#### 시나리오 3: 고아 댓글 정리

```
Before:
  ├─ [삭제된 댓글입니다.] (부모, isDeleted=true)
  │   └─ 댓글 B (삭제 요청)

After:
  (부모와 댓글 B 모두 물리적 삭제)
```

### 📊 개선 효과

| 항목 | 기존 방식 | 재귀적 삭제 |
|------|-----------|-------------|
| 자식 댓글 처리 | 강제 삭제 또는 오류 | Soft Delete로 보존 |
| 데이터 손실 | 발생 가능 | 최소화 |
| 고아 댓글 | 수동 정리 필요 | 자동 정리 |
| 맥락 유지 | 불가능 | "삭제된 댓글입니다." 표시로 유지 |

---

## 5. 요청 검증과 API 방어선

### ⚠️ 기존 문제
- 필드 검증을 서비스 레이어에서만 수행해, 라우트마다 중복 로직 발생
- `size`/`lastId` 등 쿼리 파라미터에 대한 방어 로직 부족

### ✅ 개선
- Ktor `RequestValidation` 플러그인으로 입력 모델을 선제 검증
- 이메일/비밀번호 길이, 제목/본문/댓글 글자수 제한 추가
- 커서 기반 조회 시 `size`(1~50), `lastId`(양수) 강제 검증
- JWT 추출을 `ApplicationCall.userIdOrThrow()` 확장으로 일원화해 라우트 가독성과 보안성 향상

```kotlin
fun Application.configureRequestValidation() {
    install(RequestValidation) {
        validate<SignUpRequest> { req ->
            when {
                !emailRegex.matches(req.email) -> Invalid("이메일 형식이 올바르지 않습니다.")
                req.password.length < 8 -> Invalid("비밀번호는 8자 이상이어야 합니다.")
                req.nickname.length !in 2..20 -> Invalid("닉네임은 2~20자 사이여야 합니다.")
                else -> Valid
            }
        }
        validate<CreateArticleRequest> { req ->
            if (req.title.length !in 1..120) Invalid("제목은 1~120자 사이여야 합니다.") else Valid
        }
        // ...
    }
}

// 라우트에서 JWT 추출
authenticate("auth-jwt") {
    post {
        val userId = call.userIdOrThrow()
        val request = call.receive<CreateArticleRequest>()
        // ...
    }
}
```

### 🎯 효과
- 잘못된 페이로드/쿼리를 애플리케이션 진입 시점에서 차단 → 서비스 로직 단순화
- 라우트별 사용자 인증/파라미터 검증이 템플릿화되어 유지보수성 상승
- 클라이언트는 400/401 응답으로 즉시 피드백을 받아 재시도 가능

---

## 6. 댓글 트리 빌더 안정화

### ⚠️ 기존 문제
- 평탄화된 댓글 목록을 트리로 변환할 때 children/parent 매핑이 중복되어 가독성이 떨어짐
- 순서 보존이 명확하지 않아 정렬 안정성이 흔들릴 여지 존재

### ✅ 개선
- 입력 순서를 유지하는 children 인덱스를 구축하고, `CommentResponse` 맵으로 한 번만 복사 후 재귀 조립

```kotlin
private fun buildCommentTree(comments: List<Comment>): List<CommentResponse> {
    val responseMap = comments.associate { it.id to it.copy(children = emptyList()).toResponse() }
    val childrenIndex = mutableMapOf<Long, MutableList<Long>>()

    comments.forEach { comment ->
        comment.parentId?.let { parent ->
            childrenIndex.getOrPut(parent) { mutableListOf() }.add(comment.id)
        }
    }

    fun attachChildren(commentId: Long): CommentResponse {
        val base = responseMap.getValue(commentId)
        val nested = childrenIndex[commentId]?.map { attachChildren(it) } ?: emptyList()
        return base.copy(children = nested)
    }

    return comments.filter { it.parentId == null }.map { attachChildren(it.id) }
}
```

### 🎯 효과
- 경로 기반 정렬 유지 + 입력 순서 반영 → 일관된 댓글 노출
- 변환 과정 단순화로 유지보수성 향상, 불필요한 데이터 복사 제거

---

## 📈 종합 개선 효과

### 성능 개선
- **커서 기반 조회**: 대량 데이터 환경에서 일정한 조회 속도 유지
- **비동기 처리**: 동시 요청 처리 능력 향상 (예상: 3~5배)
- **Path Model**: N+1 문제 해결로 댓글 조회 속도 개선

### 사용자 경험 개선
- **명확한 오류 메시지**: 문제 해결이 쉬워짐
- **무한 스크롤**: 페이지 이동 없이 자연스러운 콘텐츠 소비
- **계층형 댓글**: 맥락 파악이 용이한 대화형 구조

### 개발자 경험 개선
- **타입 안전성**: Kotlin의 강력한 타입 시스템
- **코드 간결성**: Kotlin의 표현력 있는 문법
- **비동기 처리**: Coroutines의 직관적인 비동기 코드

---

**🚀 Generated with Claude Code**
