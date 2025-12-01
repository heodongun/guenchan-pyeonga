# 배포 및 실행 가이드

## 📋 목차
1. [사전 준비사항](#1-사전-준비사항)
2. [Docker Compose로 전체 실행](#2-docker-compose로-전체-실행)
3. [개별 서비스 실행](#3-개별-서비스-실행)
4. [API 테스트](#4-api-테스트)
5. [문제 해결](#5-문제-해결)

---

## 1. 사전 준비사항

### 필수 소프트웨어

- **Docker Desktop** (버전 20.10 이상)
  - macOS/Windows: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
  - Linux: Docker Engine + Docker Compose

- **Git** (프로젝트 클론용)
  ```bash
  git --version
  ```

### Docker 설정 확인

```bash
# Docker 버전 확인
docker --version
# 출력 예: Docker version 29.1.1

# Docker Compose 버전 확인
docker-compose --version
# 출력 예: Docker Compose version v2.40.3
```

### 포트 사용 확인

다음 포트들이 사용 가능한지 확인하세요:
- **3000**: Frontend (Next.js)
- **8080**: Backend (Ktor)
- **3306**: MySQL Database

```bash
# macOS/Linux에서 포트 사용 확인
lsof -i :3000
lsof -i :8080
lsof -i :3306

# Windows PowerShell에서 포트 사용 확인
netstat -ano | findstr :3000
netstat -ano | findstr :8080
netstat -ano | findstr :3306
```

---

## 2. Docker Compose로 전체 실행

### 2.1. 프로젝트 클론

```bash
# GitHub에서 클론
git clone https://github.com/heodongun/guenchan-pyeonga.git
cd guenchan-pyeonga
```

### 2.2. Docker 설정 문제 해결 (macOS/Linux)

Docker Desktop credential 오류가 발생할 경우:

```bash
# Docker config 파일 수정
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
	"auths": {},
	"currentContext": "desktop-linux"
}
EOF
```

### 2.3. 전체 시스템 실행

```bash
# 모든 서비스 빌드 및 실행
docker-compose up -d --build
```

> 프론트엔드의 `/api/*` 요청은 Next.js 서버가 `BACKEND_API_ORIGIN` 환경 변수로 지정된 주소로 프록시합니다. 기본값은 `http://backend:8080`이며, 백엔드 주소를 바꿨다면 이 값도 함께 수정하세요.

**실행 과정**:
1. MySQL 이미지 다운로드 (처음 실행 시)
2. Backend Dockerfile로 Kotlin 프로젝트 빌드
3. Frontend Dockerfile로 Next.js 프로젝트 빌드
4. 세 개의 컨테이너 시작

### 2.4. 실행 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 출력 예시:
# NAME                IMAGE               STATUS
# board-mysql         mysql:8.0           Up
# board-backend       board-backend       Up
# board-frontend      board-frontend      Up
```

### 2.5. 로그 확인

```bash
# 전체 로그 확인
docker-compose logs

# 특정 서비스 로그 확인
docker-compose logs -f backend    # 백엔드 로그
docker-compose logs -f frontend   # 프론트엔드 로그
docker-compose logs -f mysql      # MySQL 로그
```

### 2.6. 서비스 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

### 2.7. 종료

```bash
# 서비스 중지
docker-compose down

# 서비스 중지 + 볼륨 삭제 (데이터베이스 초기화)
docker-compose down -v
```

---

## 3. 개별 서비스 실행

Docker 없이 개별적으로 실행하는 방법입니다.

### 3.1. MySQL 실행

#### Docker로 MySQL만 실행

```bash
docker run -d \
  --name board-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=board_db \
  -e MYSQL_USER=board_user \
  -e MYSQL_PASSWORD=boardpassword \
  -p 3306:3306 \
  mysql:8.0
```

#### 로컬 MySQL 사용

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE board_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3.2. Backend 실행

```bash
cd backend

# 환경 변수 설정 (.env 파일 또는 export)
export DB_URL="jdbc:mysql://localhost:3306/board_db?useSSL=false&allowPublicKeyRetrieval=true"
export DB_USER="root"
export DB_PASSWORD="password"
export JWT_SECRET="my-super-secret-jwt-key-change-in-production"
export JWT_ISSUER="board-api"
export JWT_AUDIENCE="board-users"

# Gradle로 실행
./gradlew run

# 또는 빌드 후 실행
./gradlew build
java -jar build/libs/*.jar
```

**백엔드 실행 확인**:
```bash
curl http://localhost:8080/health
# 출력: OK
```

### 3.3. Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 파일 생성)
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# 개발 서버 실행
npm run dev
```

**프론트엔드 접속**:
- http://localhost:3000

---

## 4. API 테스트

### 4.1. Health Check

```bash
curl http://localhost:8080/health
```

**응답**:
```
OK
```

### 4.2. 회원가입

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "nickname": "테스터"
  }'
```

**응답 예시**:
```json
{
  "user": {
    "id": 1,
    "email": "test@example.com",
    "nickname": "테스터",
    "createdAt": "2024-12-01T14:00:00"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4.3. 로그인

```bash
curl -X POST http://localhost:8080/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4.4. 게시글 작성 (인증 필요)

```bash
# 먼저 로그인해서 토큰 받기
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:8080/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "첫 번째 게시글",
    "content": "안녕하세요! 테스트 게시글입니다."
  }'
```

**응답 예시**:
```json
{
  "id": 1,
  "title": "첫 번째 게시글",
  "content": "안녕하세요! 테스트 게시글입니다.",
  "authorId": 1,
  "authorNickname": "테스터",
  "viewCount": 0,
  "createdAt": "2024-12-01T14:05:00",
  "updatedAt": "2024-12-01T14:05:00"
}
```

### 4.5. 게시글 목록 조회 (커서 기반)

```bash
# 첫 페이지
curl http://localhost:8080/api/articles?size=20

# 두 번째 페이지 (nextCursor 사용)
curl http://localhost:8080/api/articles?lastId=20&size=20
```

**응답 예시**:
```json
{
  "articles": [
    {
      "id": 20,
      "title": "게시글 제목",
      "authorNickname": "작성자",
      "viewCount": 10,
      "commentCount": 5,
      "createdAt": "2024-12-01T14:00:00"
    }
  ],
  "hasNext": true,
  "nextCursor": 19
}
```

### 4.6. 댓글 작성

```bash
curl -X POST http://localhost:8080/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "좋은 글이네요!",
    "articleId": 1,
    "parentId": null
  }'
```

### 4.7. 대댓글 작성

```bash
curl -X POST http://localhost:8080/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "감사합니다!",
    "articleId": 1,
    "parentId": 1
  }'
```

### 4.8. 댓글 목록 조회 (계층 구조)

```bash
curl http://localhost:8080/api/comments/article/1
```

**응답 예시** (계층 구조):
```json
[
  {
    "id": 1,
    "content": "좋은 글이네요!",
    "authorId": 1,
    "authorNickname": "테스터",
    "parentId": null,
    "depth": 0,
    "isDeleted": false,
    "createdAt": "2024-12-01T14:10:00",
    "children": [
      {
        "id": 2,
        "content": "감사합니다!",
        "authorId": 1,
        "authorNickname": "테스터",
        "parentId": 1,
        "depth": 1,
        "isDeleted": false,
        "createdAt": "2024-12-01T14:11:00",
        "children": []
      }
    ]
  }
]
```

---

## 5. 문제 해결

### 5.1. Docker credential 오류

**증상**:
```
error getting credentials - err: exec: "docker-credential-desktop": executable file not found
```

**해결**:
```bash
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
	"auths": {},
	"currentContext": "desktop-linux"
}
EOF
```

### 5.2. MySQL 컨테이너가 시작되지 않음

**증상**:
```
board-mysql | Error: Database is uninitialized
```

**해결**:
```bash
# 볼륨 삭제 후 재시작
docker-compose down -v
docker-compose up -d
```

### 5.3. Backend 빌드 실패

**증상**:
```
Could not resolve dependencies
```

**해결**:
```bash
cd backend

# Gradle 캐시 클리어
./gradlew clean --refresh-dependencies

# 재빌드
./gradlew build
```

### 5.4. Frontend npm install 실패

**증상**:
```
npm ERR! network timeout
```

**해결**:
```bash
cd frontend

# npm 캐시 클리어
npm cache clean --force

# 재설치
rm -rf node_modules package-lock.json
npm install
```

### 5.5. 포트가 이미 사용 중

**증상**:
```
Error: Port 8080 is already in use
```

**해결 (macOS/Linux)**:
```bash
# 프로세스 찾기
lsof -i :8080

# 프로세스 종료
kill -9 <PID>
```

**해결 (Windows)**:
```powershell
# 프로세스 찾기
netstat -ano | findstr :8080

# 프로세스 종료
taskkill /PID <PID> /F
```

### 5.6. CORS 오류

**증상**:
```
Access to fetch at 'http://localhost:8080' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**확인사항**:
1. Backend의 CORS 설정 확인 (Application.kt)
2. Frontend의 API URL 확인 (.env.local)

**해결**:
```kotlin
// Application.kt에 CORS 설정이 있는지 확인
install(CORS) {
    anyHost()
    allowHeader("Content-Type")
    allowHeader("Authorization")
}
```

---

## 6. 성능 테스트

### 6.1. Apache Bench로 부하 테스트

```bash
# 설치 (macOS)
brew install httpd

# 100명의 동시 사용자, 총 1000개 요청
ab -n 1000 -c 100 http://localhost:8080/api/articles?size=20
```

**결과 예시**:
```
Concurrency Level:      100
Time taken for tests:   2.345 seconds
Complete requests:      1000
Failed requests:        0
Requests per second:    426.44 [#/sec]
Time per request:       234.5 [ms]
```

### 6.2. 데이터베이스 쿼리 성능 확인

```bash
# MySQL 접속
docker exec -it board-mysql mysql -u board_user -pboardpassword board_db

# 실행 계획 확인
EXPLAIN SELECT * FROM articles ORDER BY id DESC LIMIT 20;

# 인덱스 확인
SHOW INDEX FROM articles;
```

---

## 7. 프로덕션 배포 체크리스트

### 환경 변수 설정

- [ ] `JWT_SECRET` 변경 (강력한 랜덤 문자열)
- [ ] `DB_PASSWORD` 변경
- [ ] `MYSQL_ROOT_PASSWORD` 변경
- [ ] CORS 설정 변경 (`anyHost()` → 특정 도메인만 허용)

### 보안 설정

- [ ] HTTPS 설정 (Let's Encrypt, CloudFlare 등)
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] 데이터베이스 외부 접근 차단
- [ ] Rate Limiting 설정

### 모니터링

- [ ] 로그 수집 (ELK Stack, CloudWatch 등)
- [ ] 성능 모니터링 (Prometheus, Grafana)
- [ ] 오류 추적 (Sentry 등)

---

## 8. 빠른 시작 스크립트

### start.sh (전체 실행)

```bash
#!/bin/bash

echo "🚀 Starting Board Service..."

# Docker Compose 실행
docker-compose up -d --build

# 서비스 준비 대기
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health Check
echo "🔍 Checking backend health..."
curl -s http://localhost:8080/health

echo ""
echo "✅ Services are ready!"
echo ""
echo "📌 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
```

사용법:
```bash
chmod +x start.sh
./start.sh
```

---

**🚀 Generated with Claude Code**
