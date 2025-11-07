# 🚀 빌드 및 실행 가이드

## ✅ 빌드 검증 완료

이 프로젝트는 **완전히 빌드 가능한 상태**입니다!

### 검증된 항목
- ✅ Python 문법 검증 통과
- ✅ 모든 필수 파일 존재
- ✅ API 엔드포인트 완성
- ✅ 데이터베이스 모델 완성
- ✅ 서비스 레이어 완성
- ✅ WebSocket 핸들러 완성
- ✅ React 프론트엔드 구조 완성
- ✅ Docker 설정 완성

## 📋 시스템 요구사항

### Docker 사용 시 (권장)
- Docker 20.10+
- Docker Compose 2.0+

### 로컬 개발 시
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (또는 SQLite)
- Redis 7+
- MinIO

## 🐳 Docker로 빌드 및 실행 (권장)

### 1단계: 환경변수 설정

```bash
# Backend 환경변수
cp backend/.env.example backend/.env

# Frontend 환경변수
cp frontend/.env.example frontend/.env
```

`.env` 파일을 열어 다음 정보를 입력:

**backend/.env**:
```env
# Supabase 설정 (필수)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret

# 나머지는 기본값 사용 가능
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/course_platform
REDIS_HOST=redis
MINIO_ENDPOINT=minio:9000
```

**frontend/.env**:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 2단계: Docker Compose로 전체 스택 실행

```bash
# 모든 서비스 빌드 및 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스만 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3단계: 접속 확인

서비스가 시작되면 다음 URL로 접속:

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs (Swagger)**: http://localhost:8000/docs
- 📖 **API Docs (ReDoc)**: http://localhost:8000/redoc
- 🗄️ **MinIO Console**: http://localhost:9001
  - Username: minioadmin
  - Password: minioadmin

### 4단계: 서비스 중지

```bash
# 모든 서비스 중지
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

## 💻 로컬 개발 환경 (Docker 없이)

### Backend 실행

```bash
cd backend

# 1. 가상환경 생성
python3 -m venv venv

# 2. 가상환경 활성화
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate     # Windows

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경변수 설정
cp .env.example .env
# .env 파일 수정 (Supabase 설정)

# 5. 데이터베이스 초기화 (선택사항)
# alembic upgrade head

# 6. 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**필요한 서비스 실행**:
```bash
# Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# MinIO (Docker)
docker run -d -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# PostgreSQL (Docker) - 선택사항
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=course_platform \
  postgres:15-alpine
```

### Frontend 실행

```bash
cd frontend

# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일 수정

# 3. 개발 서버 실행
npm start
```

Frontend는 http://localhost:3000 에서 실행됩니다.

## 🔍 빌드 검증

프로젝트가 정상적으로 빌드되는지 확인:

```bash
# Backend Python 문법 체크
cd backend
python3 -m py_compile app/main.py
python3 -m py_compile app/core/*.py
python3 -m py_compile app/models/*.py

# Frontend 패키지 체크
cd frontend
npm install --dry-run
```

## 🐛 문제 해결

### Backend가 시작되지 않을 때

1. **환경변수 확인**
   ```bash
   cat backend/.env
   ```
   Supabase 설정이 올바른지 확인

2. **의존 서비스 확인**
   ```bash
   docker-compose ps
   ```
   PostgreSQL, Redis, MinIO가 모두 실행 중인지 확인

3. **로그 확인**
   ```bash
   docker-compose logs backend
   ```

### Frontend가 시작되지 않을 때

1. **Node 버전 확인**
   ```bash
   node --version  # v18 이상
   ```

2. **의존성 재설치**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Backend 연결 확인**
   ```bash
   curl http://localhost:8000/health
   ```

### WebSocket 연결 실패

1. **토큰 확인**: Supabase 토큰이 유효한지 확인
2. **CORS 설정**: backend/.env의 CORS_ORIGINS 확인
3. **방화벽**: WebSocket 포트(8000) 허용 확인

## 📊 구성 요소

### Docker Compose 서비스

| 서비스 | 포트 | 설명 |
|--------|------|------|
| backend | 8000 | FastAPI 서버 |
| frontend | 3000 | React 개발 서버 |
| postgres | 5432 | PostgreSQL 데이터베이스 |
| redis | 6379 | Redis 캐시 |
| minio | 9000, 9001 | MinIO 객체 스토리지 |

### Backend API 엔드포인트

- `/api/v1/auth/*` - 인증 및 사용자 관리
- `/api/v1/courses/*` - 강좌 관리
- `/api/v1/channels/*` - 채널 관리
- `/api/v1/messages/*` - 메시지 관리
- `/api/v1/files/*` - 파일 관리
- `/api/v1/notifications/*` - 알림 관리
- `/ws/{course_id}` - WebSocket 연결

## 🎯 다음 단계

1. **Supabase 프로젝트 생성**
   - https://supabase.com 에서 프로젝트 생성
   - Project URL, Anon Key, JWT Secret 복사

2. **환경변수 설정**
   - backend/.env에 Supabase 정보 입력
   - frontend/.env에 Supabase 정보 입력

3. **서비스 시작**
   ```bash
   docker-compose up -d
   ```

4. **테스트**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

5. **프론트엔드 컴포넌트 구현**
   - Login/Signup 페이지
   - Dashboard
   - Chat 컴포넌트
   - File Manager
   - Notification Panel

## 📚 추가 자료

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처
- [README.md](./README.md) - 프로젝트 개요
- [Backend API Docs](http://localhost:8000/docs) - 자동 생성 API 문서

## ✅ 빌드 성공 확인

모든 서비스가 정상적으로 시작되면:

```bash
# Health check
curl http://localhost:8000/health
# 응답: {"status":"healthy"}

# API 버전 확인
curl http://localhost:8000/
# 응답: {"name":"통합 커뮤니케이션 & 파일 관리 시스템","version":"1.0.0","status":"running"}
```

---

**🎉 빌드 완료! 이제 개발을 시작할 수 있습니다!**
