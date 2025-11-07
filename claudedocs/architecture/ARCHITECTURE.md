# 통합 커뮤니케이션 & 파일 관리 시스템 - 아키텍처

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                   React + WebSocket Client                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│                        FastAPI                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  REST API    │  │  WebSocket   │  │  Auth        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase   │ │   PostgreSQL │ │    Redis     │
│     Auth     │ │   (SQLite)   │ │   Caching    │
└──────────────┘ └──────────────┘ └──────────────┘
                         │
                         ▼
                 ┌──────────────┐
                 │    MinIO     │
                 │Object Storage│
                 └──────────────┘
```

## 🗂️ 프로젝트 구조

```
claude-code-playground/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py
│   │   │   │   │   ├── courses.py
│   │   │   │   │   ├── channels.py
│   │   │   │   │   ├── messages.py
│   │   │   │   │   ├── files.py
│   │   │   │   │   ├── notifications.py
│   │   │   │   │   └── users.py
│   │   │   │   └── api.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── channel.py
│   │   │   ├── message.py
│   │   │   ├── file.py
│   │   │   └── notification.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── channel.py
│   │   │   ├── message.py
│   │   │   ├── file.py
│   │   │   └── notification.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── message_service.py
│   │   │   ├── file_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── cache_service.py
│   │   │   └── storage_service.py
│   │   ├── websocket/
│   │   │   ├── connection_manager.py
│   │   │   └── handlers.py
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── tests/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── files/
│   │   │   ├── notifications/
│   │   │   └── common/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Course.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Files.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   ├── websocket.js
│   │   │   └── storage.js
│   │   ├── hooks/
│   │   ├── contexts/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── .env.example
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
└── README.md
```

## 🗄️ 데이터베이스 스키마

### Users (Supabase Auth 연동)
```sql
-- Supabase에서 관리되는 auth.users 테이블과 연동
-- 추가 사용자 정보만 local DB에 저장
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Courses (강좌)
```sql
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    code VARCHAR(50) UNIQUE,
    instructor_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### Course Members (강좌 멤버십)
```sql
CREATE TABLE course_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'instructor', 'assistant', 'student'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id)
);

CREATE INDEX idx_course_members_course ON course_members(course_id);
CREATE INDEX idx_course_members_user ON course_members(user_id);
```

### Channels (채널/채팅방)
```sql
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL, -- 'public', 'private', 'dm'
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false
);

CREATE INDEX idx_channels_course ON channels(course_id);
```

### Messages (메시지)
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    parent_message_id UUID REFERENCES messages(id), -- 스레드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false
);

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_parent ON messages(parent_message_id);
CREATE INDEX idx_messages_pinned ON messages(channel_id, is_pinned) WHERE is_pinned = true;
```

### Message Reactions (메시지 반응)
```sql
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message ON message_reactions(message_id);
```

### Mentions (멘션)
```sql
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false,
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_mentions_user ON mentions(user_id, is_read);
```

### Files (파일)
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id),
    uploaded_by UUID REFERENCES user_profiles(id),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    version INT DEFAULT 1,
    parent_file_id UUID REFERENCES files(id), -- 버전 관리
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_files_course ON files(course_id);
CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_parent ON files(parent_file_id);
```

### Folders (폴더)
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    parent_folder_id UUID REFERENCES folders(id),
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_folders_course ON folders(course_id);
CREATE INDEX idx_folders_parent ON folders(parent_folder_id);
```

### File Tags (파일 태그)
```sql
CREATE TABLE file_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, tag)
);

CREATE INDEX idx_file_tags_tag ON file_tags(tag);
```

### Message Files (메시지에 첨부된 파일)
```sql
CREATE TABLE message_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, file_id)
);
```

### Notifications (알림)
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'mention', 'file_upload', 'assignment', 'announcement'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    link TEXT,
    related_id UUID, -- 관련 엔티티 ID (유연한 참조)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

### Announcements (공지사항)
```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id),
    created_by UUID REFERENCES user_profiles(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_course ON announcements(course_id, created_at DESC);
```

### Assignments (과제)
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID REFERENCES user_profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    start_date TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    late_submission_allowed BOOLEAN DEFAULT false,
    late_penalty_percent INTEGER DEFAULT 0,
    max_points FLOAT NOT NULL DEFAULT 100.0,
    rubric JSON, -- 채점 기준
    allow_resubmission BOOLEAN DEFAULT false,
    show_solutions_after_due BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_assignments_course ON assignments(course_id, due_date DESC);
```

### Submissions (제출물)
```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(id),
    content TEXT,
    submission_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT false,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, graded, returned
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
```

### Grades (평가/성적)
```sql
CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
    graded_by UUID REFERENCES user_profiles(id),
    points FLOAT NOT NULL,
    max_points FLOAT NOT NULL,
    percentage FLOAT,
    letter_grade VARCHAR(5), -- A+, A, B+, etc.
    feedback TEXT,
    rubric_scores JSON, -- 세부 채점 내역
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_released BOOLEAN DEFAULT false
);

CREATE INDEX idx_grades_submission ON grades(submission_id);
```

### Assignment Files (과제 첨부 파일)
```sql
CREATE TABLE assignment_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    file_type VARCHAR(50) DEFAULT 'material', -- material, solution, rubric
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Submission Files (제출 파일)
```sql
CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API 엔드포인트 설계

### Authentication
- `POST /api/v1/auth/login` - Supabase 토큰으로 로그인
- `POST /api/v1/auth/logout` - 로그아웃
- `GET /api/v1/auth/me` - 현재 사용자 정보

### Courses
- `GET /api/v1/courses` - 내 강좌 목록
- `POST /api/v1/courses` - 강좌 생성
- `GET /api/v1/courses/{id}` - 강좌 상세
- `PUT /api/v1/courses/{id}` - 강좌 수정
- `DELETE /api/v1/courses/{id}` - 강좌 삭제
- `POST /api/v1/courses/{id}/members` - 멤버 추가
- `GET /api/v1/courses/{id}/members` - 멤버 목록

### Channels
- `GET /api/v1/courses/{course_id}/channels` - 채널 목록
- `POST /api/v1/courses/{course_id}/channels` - 채널 생성
- `GET /api/v1/channels/{id}` - 채널 상세
- `PUT /api/v1/channels/{id}` - 채널 수정
- `DELETE /api/v1/channels/{id}` - 채널 삭제

### Messages
- `GET /api/v1/channels/{channel_id}/messages` - 메시지 목록 (페이지네이션)
- `POST /api/v1/channels/{channel_id}/messages` - 메시지 전송
- `GET /api/v1/messages/{id}` - 메시지 상세
- `PUT /api/v1/messages/{id}` - 메시지 수정
- `DELETE /api/v1/messages/{id}` - 메시지 삭제
- `POST /api/v1/messages/{id}/reactions` - 리액션 추가
- `DELETE /api/v1/messages/{id}/reactions/{emoji}` - 리액션 제거
- `GET /api/v1/messages/{id}/thread` - 스레드 메시지 목록

### Files
- `GET /api/v1/courses/{course_id}/files` - 파일 목록
- `POST /api/v1/courses/{course_id}/files` - 파일 업로드
- `GET /api/v1/files/{id}` - 파일 정보
- `GET /api/v1/files/{id}/download` - 파일 다운로드
- `GET /api/v1/files/{id}/preview` - 파일 미리보기
- `DELETE /api/v1/files/{id}` - 파일 삭제
- `GET /api/v1/files/{id}/versions` - 파일 버전 목록
- `POST /api/v1/files/{id}/tags` - 태그 추가

### Folders
- `GET /api/v1/courses/{course_id}/folders` - 폴더 목록
- `POST /api/v1/courses/{course_id}/folders` - 폴더 생성
- `PUT /api/v1/folders/{id}` - 폴더 수정
- `DELETE /api/v1/folders/{id}` - 폴더 삭제

### Notifications
- `GET /api/v1/notifications` - 알림 목록
- `PUT /api/v1/notifications/{id}/read` - 알림 읽음 처리
- `PUT /api/v1/notifications/read-all` - 모든 알림 읽음 처리

### Assignments
- `GET /api/v1/assignments?course_id={id}` - 과제 목록
- `POST /api/v1/assignments` - 과제 생성
- `GET /api/v1/assignments/{id}` - 과제 상세
- `PUT /api/v1/assignments/{id}` - 과제 수정
- `DELETE /api/v1/assignments/{id}` - 과제 삭제
- `GET /api/v1/assignments/{id}/stats` - 과제 통계 (제출/채점 현황)

### Submissions
- `POST /api/v1/assignments/{id}/submissions` - 과제 제출
- `GET /api/v1/assignments/{id}/submissions` - 제출 목록 (교수/조교)
- `GET /api/v1/assignments/{id}/my-submission` - 내 제출 확인

### Grading
- `POST /api/v1/assignments/submissions/{id}/grade` - 채점하기
- `PUT /api/v1/assignments/submissions/{id}/grade` - 채점 수정
- `GET /api/v1/assignments/submissions/{id}/grade` - 채점 결과 조회

### WebSocket
- `WS /ws/{course_id}` - 강좌별 실시간 통신

## 🔐 권한 시스템

### 역할 (Roles)
- **instructor** (교수): 모든 권한
- **assistant** (조교): 읽기 + 제한적 쓰기
- **student** (학생): 주로 읽기 전용

### 권한 매트릭스

| 기능 | Instructor | Assistant | Student |
|------|------------|-----------|---------|
| 강좌 생성/수정/삭제 | ✅ | ❌ | ❌ |
| 채널 생성/수정 | ✅ | ✅ | ❌ |
| 메시지 전송 | ✅ | ✅ | ✅ |
| 파일 업로드 (강의자료) | ✅ | ✅ | ❌ |
| 파일 업로드 (과제) | ✅ | ✅ | ✅ |
| 파일 다운로드 | ✅ | ✅ | ✅ |
| 공지 작성 | ✅ | ✅ | ❌ |
| 멤버 관리 | ✅ | ✅ | ❌ |
| 과제 생성/수정/삭제 | ✅ | ✅ | ❌ |
| 과제 제출 | ✅ | ✅ | ✅ |
| 과제 채점 | ✅ | ✅ | ❌ |
| 채점 결과 조회 (본인) | ✅ | ✅ | ✅ (공개된 것만) |
| 채점 결과 조회 (전체) | ✅ | ✅ | ❌ |

## 🚀 실시간 기능 (WebSocket)

### 이벤트 타입
```javascript
// Client → Server
{
  "type": "message.send",
  "data": { "channel_id": "...", "content": "..." }
}

{
  "type": "message.typing",
  "data": { "channel_id": "..." }
}

// Server → Client
{
  "type": "message.new",
  "data": { "id": "...", "content": "...", "user": {...} }
}

{
  "type": "message.update",
  "data": { "id": "...", "content": "..." }
}

{
  "type": "message.delete",
  "data": { "id": "..." }
}

{
  "type": "user.typing",
  "data": { "user_id": "...", "channel_id": "..." }
}

{
  "type": "notification.new",
  "data": { "id": "...", "title": "...", "content": "..." }
}
```

## 📦 캐싱 전략 (Redis)

### 캐시 키 패턴
```
user:profile:{user_id}             # 사용자 프로필 (TTL: 1시간)
course:{course_id}                 # 강좌 정보 (TTL: 1시간)
course:{course_id}:members         # 강좌 멤버 목록 (TTL: 30분)
channel:{channel_id}:messages      # 최근 메시지 (TTL: 10분)
notifications:{user_id}:unread     # 읽지 않은 알림 수 (TTL: 5분)
```

### 캐시 무효화 전략
- 데이터 변경 시 관련 캐시 삭제
- Pub/Sub으로 다른 인스턴스에 무효화 전파

## 🗂️ 파일 저장 구조 (MinIO)

```
bucket: course-files
├── {course_id}/
│   ├── materials/        # 강의자료
│   │   └── {file_id}/{version}/{filename}
│   ├── assignments/      # 과제
│   │   └── {file_id}/{version}/{filename}
│   ├── submissions/      # 제출물
│   │   └── {user_id}/{file_id}/{version}/{filename}
│   └── shared/           # 공유 파일
│       └── {file_id}/{version}/{filename}
```

## 🔒 보안 고려사항

1. **인증**: Supabase JWT 토큰 검증
2. **권한**: 역할 기반 접근 제어 (RBAC)
3. **파일 접근**: 서명된 URL 사용 (MinIO presigned URLs)
4. **Rate Limiting**: Redis 기반 속도 제한
5. **입력 검증**: Pydantic 스키마 검증
6. **XSS 방지**: 메시지 컨텐츠 sanitization
7. **CSRF 보호**: SameSite 쿠키 설정

## 📊 성능 최적화

1. **데이터베이스**: 적절한 인덱스 생성
2. **API**: 페이지네이션 및 커서 기반 로딩
3. **캐싱**: Redis 활용한 자주 접근하는 데이터 캐싱
4. **파일**: MinIO CDN 연동 고려
5. **WebSocket**: 채널별 룸 분리로 브로드캐스트 최적화
6. **쿼리 최적화**: N+1 문제 해결 (eager loading)
