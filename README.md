# 통합 커뮤니케이션 & 파일 관리 시스템

학습자와 강사 간의 자료 공유, 알림, 실시간 소통, 협업이 가능한 통합 교육 플랫폼

## 🎯 프로젝트 목표

외부 서비스(Slack, Google Drive 등) 없이도 완결된 교육 운영 환경을 제공하는 올인원 플랫폼

## ✨ 핵심 기능

### 1️⃣ 실시간 메시징 / 커뮤니케이션 (Slack 유사)
- ✅ 강의별/스터디별/프로젝트별 채널 관리
- ✅ 스레드형 대화 (Q&A, 과제 토론)
- ✅ @멘션 & 실시간 알림
- ✅ 이모지 리액션
- ✅ 공지 핀 고정
- ✅ 파일 첨부 (자료함 자동 연동)

### 2️⃣ 파일 관리 시스템 (Google Drive 유사)
- ✅ 폴더 구조 자동 생성 및 관리
- ✅ 파일 업로드/다운로드/미리보기
- ✅ 버전 관리 및 이력 추적
- ✅ 역할 기반 권한 제어 (교수/조교/학생)
- ✅ 태그 기반 분류 및 검색
- ✅ 채팅 파일 자동 연동

### 3️⃣ 알림 시스템
- ✅ 멘션, 과제, 파일 업로드 등 이벤트 알림
- ✅ 알림센터 통합 관리
- ✅ 읽음/안읽음 상태 관리

### 4️⃣ 평가 시스템 (과제 & 채점) ⭐ NEW!
- ✅ 과제 생성 및 관리
  - 마감일, 배점 설정
  - 늦은 제출 허용 및 감점 설정
  - 재제출 허용 옵션
  - JSON 기반 채점 기준(Rubric) 관리
- ✅ 학생 제출 관리
  - 텍스트 및 파일 제출
  - 제출 이력 추적
  - 늦은 제출 자동 감지
- ✅ 채점 및 평가
  - 점수 및 백분율 자동 계산
  - 상세 피드백 작성
  - 채점 결과 공개/비공개 제어
  - 채점 통계 (평균 점수, 제출율 등)
- ✅ 알림 통합
  - 과제 등록 시 학생에게 알림
  - 제출 시 교수에게 알림
  - 채점 완료 시 학생에게 알림

## 🏗️ 기술 스택

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (개발) / PostgreSQL (운영)
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Auth**: Supabase
- **Real-time**: WebSocket

### Frontend
- **Framework**: React
- **State**: React Context + React Query
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **Real-time**: WebSocket Client

### Infrastructure
- **Container**: Docker & Docker Compose
- **Database Migration**: Alembic

## 📁 프로젝트 구조

```
claude-code-playground/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/            # API 엔드포인트
│   │   ├── core/           # 설정 및 보안
│   │   ├── models/         # 데이터베이스 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── services/       # 비즈니스 로직
│   │   ├── websocket/      # WebSocket 핸들러
│   │   └── main.py         # 메인 애플리케이션
│   ├── alembic/            # 데이터베이스 마이그레이션
│   ├── requirements.txt
│   └── .env.example
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── contexts/       # Context API
│   │   ├── services/       # API & WebSocket 서비스
│   │   ├── pages/          # 페이지 컴포넌트
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
├── docker/                 # Docker 설정
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── docker-compose.yml      # Docker Compose 설정
├── ARCHITECTURE.md         # 상세 아키텍처 문서
└── README.md              # 이 파일
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 백엔드 환경변수 설정
cp backend/.env.example backend/.env
# .env 파일을 열어 Supabase, Redis, MinIO 설정 입력

# 프론트엔드 환경변수 설정
cp frontend/.env.example frontend/.env
# .env 파일을 열어 API URL, Supabase 설정 입력
```

### 2. Docker로 전체 스택 실행

```bash
# 모든 서비스 시작 (PostgreSQL, Redis, MinIO, Backend, Frontend)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 3. 로컬 개발 환경 (Docker 없이)

#### Backend 실행

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션 (옵션)
alembic upgrade head

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## 🔗 접속 URL

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (admin/minioadmin)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 📚 API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 인증 흐름

1. **Supabase**로 사용자 가입/로그인
2. Supabase에서 발급된 **JWT 토큰**을 받음
3. 모든 API 요청 시 `Authorization: Bearer <token>` 헤더에 토큰 포함
4. 백엔드에서 토큰 검증 후 요청 처리

## 🗄️ 데이터베이스 스키마

주요 테이블:
- `user_profiles`: 사용자 프로필 (Supabase auth 확장)
- `courses`: 강좌 정보
- `course_members`: 강좌 멤버십 (역할: instructor/assistant/student)
- `channels`: 채팅 채널
- `messages`: 메시지 (스레드 지원)
- `files`: 파일 정보 (버전 관리)
- `folders`: 폴더 구조
- `notifications`: 알림

자세한 스키마는 `ARCHITECTURE.md` 파일을 참고하세요.

## 🎨 화면 구성

### 주요 페이지
1. **대시보드**: 내 강좌 목록, 최근 알림
2. **강좌 홈**: 강좌 정보, 공지사항, 멤버 목록
3. **채팅**: Slack 스타일 실시간 채팅
4. **자료함**: Google Drive 스타일 파일 관리
5. **알림**: 모든 알림 통합 관리

## 🔧 개발 가이드

### 새로운 API 엔드포인트 추가

1. `backend/app/models/`에 모델 추가
2. `backend/app/schemas/`에 Pydantic 스키마 추가
3. `backend/app/api/v1/endpoints/`에 라우터 추가
4. `backend/app/api/v1/api.py`에 라우터 등록

### 새로운 React 페이지 추가

1. `frontend/src/pages/`에 페이지 컴포넌트 생성
2. `frontend/src/App.jsx`에 라우트 추가
3. 필요시 `frontend/src/services/api.js`에 API 호출 함수 추가

### WebSocket 이벤트 추가

1. `backend/app/websocket/handlers.py`에 핸들러 추가
2. `EVENT_HANDLERS` 딕셔너리에 등록
3. `frontend/src/services/websocket.js`에 클라이언트 메서드 추가

## 🧪 테스트

```bash
# Backend 테스트
cd backend
pytest

# Frontend 테스트
cd frontend
npm test
```

## 📝 환경변수 설정

### Backend (.env)
```env
DATABASE_URL=sqlite+aiosqlite:///./app.db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
REDIS_HOST=localhost
REDIS_PORT=6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=course-files
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🎯 사용 시나리오

### 시나리오 1: 강의자료 업로드 및 알림
1. 교수가 강의자료 폴더에 PDF 업로드
2. 시스템이 자동으로 MinIO에 저장
3. 강좌 멤버 전체에게 알림 발송
4. 학생들이 알림을 클릭해 파일 다운로드

### 시나리오 2: 실시간 Q&A
1. 학생이 채팅방에 질문 작성
2. 교수를 @멘션하여 알림 발송
3. 교수가 실시간으로 답변 (WebSocket)
4. 스레드 형태로 대화 이력 관리

### 시나리오 3: 과제 제출 및 피드백
1. 학생이 과제 폴더에 파일 업로드
2. 시스템이 버전 관리 (같은 이름 파일도 이력 보존)
3. 조교가 파일 다운로드 후 피드백 작성
4. 학생에게 피드백 알림 발송

## 🛠️ 문제 해결

### 백엔드가 시작되지 않을 때
- `.env` 파일이 올바르게 설정되었는지 확인
- Redis, MinIO, PostgreSQL이 실행 중인지 확인
- 로그 확인: `docker-compose logs backend`

### 프론트엔드 연결 오류
- 백엔드가 정상 실행 중인지 확인
- CORS 설정이 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### WebSocket 연결 실패
- 토큰이 유효한지 확인
- 방화벽이 WebSocket 연결을 차단하지 않는지 확인

## 📖 상세 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 상세 시스템 아키텍처
- [API Documentation](http://localhost:8000/docs) - 자동 생성 API 문서

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 📄 라이선스

MIT License

## 👥 제작

Claude Code와 함께 개발된 교육 플랫폼

---

**Note**: 이 프로젝트는 개발용 보일러플레이트입니다. 프로덕션 환경에서는 추가적인 보안 설정, 성능 최적화, 에러 처리가 필요합니다.
