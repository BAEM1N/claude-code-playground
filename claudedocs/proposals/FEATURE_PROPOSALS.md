# 🚀 추가 기능 개발 제안서

**프로젝트**: 통합 커뮤니케이션 & 파일 관리 시스템
**작성일**: 2025년 11월
**현재 완성도**: 핵심 기능 완료 (메시징, 파일, 알림, 과제)

---

## 📊 우선순위별 제안 (총 18개 기능)

### 🔴 Priority 1: 높음 (즉시 개발 권장) - 4개

교육 운영에 필수적이며, 기존 시스템과 통합이 쉬운 기능들

#### 1.1 📅 **출석 체크 시스템**
**필요성**: ⭐⭐⭐⭐⭐ | **난이도**: 🟢 중
**구현 시간**: 1-2주

**기능 상세:**
- 강의별 출석 세션 생성 (시작/종료 시간)
- 출석 방식:
  - QR 코드 생성 (강의실 현장)
  - 비밀번호 입력 (온라인 강의)
  - 위치 기반 체크인 (GPS, 선택사항)
- 출석/지각/결석 자동 판정
- 출석률 통계 및 시각화
- 출석 알림 (학생/교수 모두)

**데이터베이스 설계:**
```python
# models/attendance.py
class AttendanceSession(Base):
    id: UUID
    course_id: FK(Course)
    title: str  # "3주차 강의"
    session_type: str  # lecture, lab, seminar
    start_time: datetime
    end_time: datetime
    qr_code: str (unique)
    password: str (optional)
    allow_late_minutes: int (기본 10분)
    location_required: bool
    created_by: FK(UserProfile)

class AttendanceRecord(Base):
    id: UUID
    session_id: FK(AttendanceSession)
    student_id: FK(UserProfile)
    checked_at: datetime
    status: str  # present, late, absent
    check_method: str  # qr, password, location
    location: JSON (lat, lng)
    ip_address: str
```

**API 엔드포인트:**
```
POST   /api/v1/attendance/sessions          # 출석 세션 생성
GET    /api/v1/attendance/sessions?course_id={id}  # 세션 목록
POST   /api/v1/attendance/sessions/{id}/checkin    # 학생 체크인
GET    /api/v1/attendance/records?student_id={id}  # 출석 기록
GET    /api/v1/attendance/stats?course_id={id}     # 출석 통계
```

**프론트엔드 컴포넌트:**
```
components/attendance/
├── AttendanceSessionForm.jsx    # 세션 생성/수정
├── AttendanceCheckin.jsx        # 학생 체크인 (QR 스캔)
├── AttendanceList.jsx           # 출석 현황 목록
├── AttendanceStats.jsx          # 출석 통계 대시보드
└── QRCodeGenerator.jsx          # QR 코드 생성기
```

**통합 포인트:**
- 알림 시스템: 출석 시작 알림, 미출석 리마인더
- 채널: 출석 시작 시 자동 메시지 발송
- 통계: 과제 제출률과 함께 출석률 표시

---

#### 1.2 📝 **퀴즈/시험 시스템**
**필요성**: ⭐⭐⭐⭐⭐ | **난이도**: 🟡 중상
**구현 시간**: 2-3주

**기능 상세:**
- 문제 유형:
  - 객관식 (단일/복수 선택)
  - 주관식 (단답형/서술형)
  - 참/거짓
  - 매칭형
  - 코드 작성형 (선택)
- 시험 설정:
  - 시작/종료 시간
  - 제한 시간 (학생별 타이머)
  - 문제 랜덤 배치
  - 답안 제출 후 수정 불가
  - 자동 채점 (객관식/단답형)
- 시험 진행:
  - 실시간 진행률 모니터링
  - 자동 제출 (시간 종료 시)
  - 브라우저 포커스 이탈 감지 (부정행위 방지)
- 결과 분석:
  - 자동 채점 및 통계
  - 문항별 정답률
  - 성적 분포 차트

**데이터베이스 설계:**
```python
class Quiz(Base):
    id: UUID
    course_id: FK(Course)
    title: str
    description: text
    quiz_type: str  # quiz, midterm, final
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    total_points: float
    randomize_questions: bool
    show_results_immediately: bool
    allow_review: bool
    is_published: bool

class Question(Base):
    id: UUID
    quiz_id: FK(Quiz)
    question_type: str  # multiple_choice, true_false, short_answer, essay
    question_text: text
    points: float
    order: int
    options: JSON  # [{"id": "a", "text": "답1", "is_correct": true}]
    correct_answer: str (for short_answer)
    explanation: text

class QuizAttempt(Base):
    id: UUID
    quiz_id: FK(Quiz)
    student_id: FK(UserProfile)
    started_at: datetime
    submitted_at: datetime
    score: float
    auto_graded_score: float
    manual_graded_score: float (optional)
    time_taken_seconds: int
    focus_lost_count: int  # 부정행위 감지

class Answer(Base):
    id: UUID
    attempt_id: FK(QuizAttempt)
    question_id: FK(Question)
    answer: JSON  # 답안 내용
    is_correct: bool (auto-graded)
    points_earned: float
    answered_at: datetime
```

**API 엔드포인트:**
```
POST   /api/v1/quizzes                     # 퀴즈 생성
GET    /api/v1/quizzes?course_id={id}      # 퀴즈 목록
POST   /api/v1/quizzes/{id}/start          # 시험 시작
POST   /api/v1/quizzes/{id}/submit         # 답안 제출
GET    /api/v1/quizzes/{id}/results        # 결과 조회
GET    /api/v1/quizzes/{id}/stats          # 통계
```

**프론트엔드 컴포넌트:**
```
components/quizzes/
├── QuizForm.jsx              # 퀴즈 생성/수정
├── QuestionEditor.jsx        # 문제 편집기
├── QuizTaking.jsx            # 학생 시험 응시
├── QuizTimer.jsx             # 타이머 컴포넌트
├── QuizResults.jsx           # 결과 확인
├── QuizStats.jsx             # 통계 대시보드
└── QuizReview.jsx            # 답안 리뷰
```

**특별 기능:**
- 웹소켓 활용: 실시간 진행률 모니터링
- 브라우저 이벤트: 포커스 이탈 감지
- 자동 저장: 5초마다 임시 저장

---

#### 1.3 📊 **학습 진도 추적 대시보드**
**필요성**: ⭐⭐⭐⭐ | **난이도**: 🟢 중하
**구현 시간**: 1-2주

**기능 상세:**
- 학생별 진도 현황:
  - 과제 제출률
  - 출석률
  - 퀴즈 평균 점수
  - 파일 다운로드 이력
  - 채팅 참여도
- 강의별 종합 통계:
  - 전체 학생 평균
  - 성적 분포
  - 위험군 학생 식별 (자동 알림)
- 시각화:
  - 진도율 프로그레스 바
  - 성적 추이 그래프
  - 비교 차트 (본인 vs 평균)
- 학습 마일스톤:
  - 주차별 학습 목표
  - 완료 체크리스트
  - 배지/업적 시스템 (gamification)

**데이터베이스 설계:**
```python
class LearningProgress(Base):
    id: UUID
    student_id: FK(UserProfile)
    course_id: FK(Course)
    week: int
    completed_tasks: int
    total_tasks: int
    attendance_rate: float
    quiz_avg_score: float
    assignment_avg_score: float
    participation_score: float  # 채팅 활동
    overall_progress: float  # 0-100%
    last_active: datetime
    updated_at: datetime

class Milestone(Base):
    id: UUID
    course_id: FK(Course)
    week: int
    title: str
    description: text
    tasks: JSON  # [{"type": "assignment", "id": "...", "completed": false}]

class Badge(Base):
    id: UUID
    name: str
    description: str
    icon: str
    criteria: JSON  # {"type": "attendance", "threshold": 90}

class StudentBadge(Base):
    id: UUID
    student_id: FK(UserProfile)
    badge_id: FK(Badge)
    earned_at: datetime
```

**API 엔드포인트:**
```
GET    /api/v1/progress/{student_id}?course_id={id}  # 진도 조회
GET    /api/v1/progress/course/{course_id}/stats     # 강의 통계
GET    /api/v1/milestones?course_id={id}             # 마일스톤
POST   /api/v1/badges/check                          # 배지 획득 확인
```

**프론트엔드 컴포넌트:**
```
components/progress/
├── ProgressDashboard.jsx     # 전체 대시보드
├── ProgressChart.jsx         # 진도 차트
├── MilestoneTracker.jsx      # 마일스톤 체커
├── BadgeDisplay.jsx          # 배지 표시
└── ComparisonChart.jsx       # 비교 차트
```

---

#### 1.4 📆 **통합 캘린더 & 일정 관리**
**필요성**: ⭐⭐⭐⭐ | **난이도**: 🟢 중
**구현 시간**: 1-2주

**기능 상세:**
- 이벤트 유형:
  - 강의 일정 (정규/보강)
  - 과제 마감일 (자동 연동)
  - 퀴즈/시험 일정 (자동 연동)
  - 출석 세션 (자동 연동)
  - 개인 일정
- 캘린더 기능:
  - 월간/주간/일간 뷰
  - 강의별 색상 구분
  - 이벤트 알림 (D-day, 1일 전, 1시간 전)
  - 구글 캘린더 동기화 (선택)
  - iCal 내보내기
- 필터링:
  - 강의별 필터
  - 이벤트 유형별 필터
  - 개인 일정만 보기

**데이터베이스 설계:**
```python
class CalendarEvent(Base):
    id: UUID
    course_id: FK(Course)  # nullable for personal events
    event_type: str  # lecture, assignment, quiz, attendance, custom
    title: str
    description: text
    start_time: datetime
    end_time: datetime
    location: str
    color: str
    is_all_day: bool
    recurrence_rule: str  # iCal RRULE format (반복 일정)
    reminder_minutes: JSON  # [60, 1440] = 1시간 전, 1일 전
    created_by: FK(UserProfile)
    related_id: UUID  # assignment_id, quiz_id 등

class EventAttendee(Base):
    id: UUID
    event_id: FK(CalendarEvent)
    user_id: FK(UserProfile)
    status: str  # accepted, declined, tentative
```

**API 엔드포인트:**
```
GET    /api/v1/calendar/events?start={date}&end={date}  # 기간별 이벤트
POST   /api/v1/calendar/events                          # 이벤트 생성
PUT    /api/v1/calendar/events/{id}                     # 수정
DELETE /api/v1/calendar/events/{id}                     # 삭제
GET    /api/v1/calendar/export                          # iCal 내보내기
```

**프론트엔드 컴포넌트:**
```
components/calendar/
├── CalendarView.jsx          # 메인 캘린더
├── EventForm.jsx             # 이벤트 생성/수정
├── EventDetail.jsx           # 이벤트 상세
├── CalendarFilter.jsx        # 필터 옵션
└── UpcomingEvents.jsx        # 다가오는 일정
```

**라이브러리 추천:**
- `react-big-calendar`: 강력한 React 캘린더 라이브러리
- `date-fns`: 날짜 계산 (이미 사용 중)

---

### 🟡 Priority 2: 중간 (단계적 개발) - 6개

사용자 경험을 크게 향상시키지만, 핵심 기능은 아닌 것들

#### 2.1 🎥 **비디오 강의 시스템**
**필요성**: ⭐⭐⭐⭐ | **난이도**: 🔴 상
**구현 시간**: 3-4주

**기능 상세:**
- 비디오 업로드 & 인코딩:
  - MinIO에 원본 저장
  - FFmpeg로 다중 해상도 변환 (480p, 720p, 1080p)
  - HLS 스트리밍 지원
- 비디오 플레이어:
  - 재생 속도 조절 (0.5x ~ 2x)
  - 자막 지원 (SRT, VTT)
  - 화질 선택
  - 북마크 기능
  - 구간 반복
- 학습 추적:
  - 시청 진도율
  - 시청 이력
  - 평균 시청 시간 통계

**데이터베이스 설계:**
```python
class Video(Base):
    id: UUID
    course_id: FK(Course)
    title: str
    description: text
    original_file_path: str
    duration_seconds: int
    transcoded_files: JSON  # {"720p": "path", "1080p": "path"}
    thumbnail_path: str
    subtitle_files: JSON  # {"ko": "path", "en": "path"}
    upload_status: str  # processing, ready, failed
    uploaded_by: FK(UserProfile)

class VideoProgress(Base):
    id: UUID
    video_id: FK(Video)
    student_id: FK(UserProfile)
    watched_seconds: int
    last_position: int
    completed: bool
    bookmarks: JSON  # [{"time": 120, "note": "중요"}]
```

**기술 스택:**
- FFmpeg: 비디오 인코딩
- Video.js 또는 Plyr: 비디오 플레이어
- Celery: 비동기 인코딩 작업
- Redis: 작업 큐

---

#### 2.2 💬 **토론 포럼 시스템**
**필요성**: ⭐⭐⭐⭐ | **난이도**: 🟡 중상
**구현 시간**: 2-3주

**기능 상세:**
- 포럼 구조:
  - 강의별 포럼
  - 카테고리 (공지, 질문, 자유, 과제)
  - 태그 시스템
- 게시글 기능:
  - 마크다운 지원
  - 코드 하이라이팅
  - 파일 첨부
  - 이미지 인라인 삽입
- 상호작용:
  - 댓글 & 대댓글
  - 좋아요/싫어요
  - 베스트 답변 선택
  - 핀 고정
  - 신고 기능
- 검색:
  - 전문 검색 (Elasticsearch 또는 PostgreSQL Full-text)
  - 태그 필터
  - 작성자 필터

**데이터베이스 설계:**
```python
class ForumCategory(Base):
    id: UUID
    course_id: FK(Course)
    name: str
    description: text
    icon: str
    order: int

class ForumPost(Base):
    id: UUID
    category_id: FK(ForumCategory)
    author_id: FK(UserProfile)
    title: str
    content: text  # markdown
    tags: ARRAY(str)
    view_count: int
    like_count: int
    is_pinned: bool
    is_locked: bool
    created_at: datetime
    updated_at: datetime

class ForumComment(Base):
    id: UUID
    post_id: FK(ForumPost)
    parent_comment_id: FK(ForumComment)  # 대댓글
    author_id: FK(UserProfile)
    content: text
    is_best_answer: bool
    like_count: int

class PostLike(Base):
    id: UUID
    post_id: FK(ForumPost)
    user_id: FK(UserProfile)
    unique: (post_id, user_id)
```

---

#### 2.3 👥 **그룹 프로젝트 관리**
**필요성**: ⭐⭐⭐⭐ | **난이도**: 🟡 중상
**구현 시간**: 2-3주

**기능 상세:**
- 그룹 관리:
  - 교수가 그룹 생성 (수동/자동)
  - 그룹별 전용 채널 자동 생성
  - 그룹별 파일 공유 폴더
- 태스크 보드:
  - Kanban 보드 (To Do, In Progress, Done)
  - 태스크 할당
  - 마감일 설정
  - 진행률 추적
- 협업 도구:
  - 그룹 채팅
  - 파일 공동 편집 (선택)
  - 회의록 작성
- 평가:
  - 그룹 과제 제출
  - 팀원 간 상호 평가 (Peer Review)
  - 기여도 평가

**데이터베이스 설계:**
```python
class ProjectGroup(Base):
    id: UUID
    course_id: FK(Course)
    name: str
    description: text
    max_members: int
    channel_id: FK(Channel)  # 전용 채널
    folder_id: FK(Folder)    # 전용 폴더

class GroupMember(Base):
    id: UUID
    group_id: FK(ProjectGroup)
    user_id: FK(UserProfile)
    role: str  # leader, member
    joined_at: datetime

class Task(Base):
    id: UUID
    group_id: FK(ProjectGroup)
    title: str
    description: text
    assigned_to: FK(UserProfile)
    status: str  # todo, in_progress, done
    due_date: datetime
    order: int

class PeerReview(Base):
    id: UUID
    group_id: FK(ProjectGroup)
    reviewer_id: FK(UserProfile)
    reviewee_id: FK(UserProfile)
    rating: int  # 1-5
    comment: text
```

---

#### 2.4 📱 **모바일 반응형 최적화**
**필요성**: ⭐⭐⭐⭐ | **난이도**: 🟡 중
**구현 시간**: 2-3주

**기능 상세:**
- 반응형 디자인:
  - Tailwind CSS breakpoints 활용
  - 모바일 네비게이션 (햄버거 메뉴)
  - 터치 제스처 지원
- 모바일 최적화:
  - 이미지 lazy loading
  - 무한 스크롤
  - Pull-to-refresh
  - PWA 지원 (오프라인, 홈 화면 추가)
- 푸시 알림:
  - 웹 푸시 알림 (Web Push API)
  - 서비스 워커 구현

**구현 방법:**
- TailwindCSS: `sm:`, `md:`, `lg:` breakpoints
- React: `useMediaQuery` 훅
- PWA: `manifest.json`, service worker

---

#### 2.5 🔔 **고급 알림 시스템**
**필요성**: ⭐⭐⭐ | **난이도**: 🟡 중
**구현 시간**: 1-2주

**기능 상세:**
- 알림 채널:
  - 인앱 알림 (현재 구현됨)
  - 이메일 알림
  - 웹 푸시 알림
  - SMS 알림 (선택)
- 알림 설정:
  - 알림 유형별 on/off
  - 조용한 시간 설정
  - 알림 빈도 조절 (즉시/일일 요약)
- 알림 그룹화:
  - 유사 알림 묶기
  - 우선순위 표시
  - 읽지 않은 알림 카운트

**데이터베이스 설계:**
```python
class NotificationPreference(Base):
    id: UUID
    user_id: FK(UserProfile)
    notification_type: str  # mention, assignment, quiz, etc.
    in_app: bool
    email: bool
    push: bool
    frequency: str  # immediate, daily, never

class EmailQueue(Base):
    id: UUID
    user_id: FK(UserProfile)
    subject: str
    body: text
    sent_at: datetime
    status: str  # pending, sent, failed
```

**기술:**
- SendGrid/AWS SES: 이메일 발송
- Web Push API: 브라우저 푸시
- Celery: 이메일 큐 처리

---

#### 2.6 🔍 **통합 검색 시스템**
**필요성**: ⭐⭐⭐ | **난이도**: 🟡 중상
**구현 시간**: 2주

**기능 상세:**
- 검색 대상:
  - 메시지 (채팅 히스토리)
  - 파일 (파일명, 메타데이터)
  - 과제 (제목, 설명)
  - 공지사항
  - 포럼 게시글 (구현 시)
- 고급 검색:
  - 필터 (날짜, 작성자, 강의, 파일 타입)
  - 정렬 (관련도, 최신순)
  - 자동완성
  - 검색 히스토리
- 전문 검색:
  - PostgreSQL Full-text Search
  - 또는 Elasticsearch (고급)

**API 엔드포인트:**
```
GET    /api/v1/search?q={query}&type={type}&course_id={id}
GET    /api/v1/search/suggestions?q={query}
```

---

### 🟢 Priority 3: 낮음 (향후 고려) - 8개

있으면 좋지만, 당장 필요하지 않거나 고급 기능

#### 3.1 🎓 **학생 포트폴리오 시스템**
#### 3.2 🌐 **다국어 지원 (i18n)**
#### 3.3 🤖 **AI 챗봇 (학습 도우미)**
#### 3.4 📊 **고급 학습 분석 (Learning Analytics)**
#### 3.5 🎮 **게이미피케이션 확장** (리더보드, 레벨 시스템)
#### 3.6 💰 **결제 시스템** (유료 강의)
#### 3.7 🔐 **SSO 통합** (구글, 마이크로소프트)
#### 3.8 📹 **실시간 화상 회의 통합** (Zoom, Meet)

---

## 🎯 추천 개발 로드맵

### Phase 6: 필수 교육 기능 (2-3개월)
```
Week 1-2:  출석 체크 시스템
Week 3-5:  퀴즈/시험 시스템
Week 6-7:  학습 진도 추적
Week 8-9:  통합 캘린더
```

### Phase 7: 협업 & 커뮤니티 (2개월)
```
Week 10-12: 토론 포럼 시스템
Week 13-15: 그룹 프로젝트 관리
Week 16-17: 통합 검색
```

### Phase 8: 고급 기능 (2-3개월)
```
Week 18-21: 비디오 강의 시스템
Week 22-24: 모바일 최적화 + PWA
Week 25-26: 고급 알림 시스템
```

---

## 💡 구현 우선순위 결정 기준

### 즉시 개발 (Priority 1) 선정 이유:
1. **출석 체크**: 교육 기관 필수, 구현 쉬움, ROI 높음
2. **퀴즈/시험**: 평가 시스템 완성, 과제와 시너지
3. **진도 추적**: 데이터 기반 학습 관리, 기존 데이터 활용
4. **캘린더**: 사용자 편의성, 모든 기능 통합

### 중간 우선순위 (Priority 2) 배치 이유:
- 교육적 가치는 높지만 복잡도가 높음
- 기본 기능 완성 후 추가하는 것이 효율적
- 비디오 시스템은 인프라 요구사항이 높음

### 낮은 우선순위 (Priority 3) 배치 이유:
- Nice-to-have 기능들
- 사용자 베이스가 커진 후 필요
- 외부 서비스 통합 (복잡도/비용)

---

## 🛠️ 기술적 고려사항

### 확장 필요한 인프라:
1. **Celery + Redis**: 비동기 작업 (이메일, 비디오 인코딩)
2. **Elasticsearch**: 전문 검색 (선택)
3. **WebRTC**: 실시간 화상 (선택)
4. **CDN**: 비디오 스트리밍

### 추가 라이브러리:
```python
# Backend
celery==5.3.4           # 비동기 작업
pillow==10.1.0          # 이미지 처리
qrcode==7.4.2           # QR 코드 생성
ffmpeg-python==0.2.0    # 비디오 처리
sendgrid==6.11.0        # 이메일 발송
```

```json
// Frontend
"react-big-calendar": "^1.13.5",    // 캘린더
"react-quill": "^2.0.0",            // 에디터 (포럼)
"video.js": "^8.17.4",              // 비디오 플레이어
"react-qr-code": "^2.0.15",         // QR 코드
"chart.js": "^4.4.7",               // 통계 차트
"react-chartjs-2": "^5.3.0"
```

---

## 📈 예상 효과

### 사용자 참여도:
- 출석 체크: **+40%** 학생 앱 접속
- 퀴즈 시스템: **+60%** 학습 시간
- 진도 추적: **+30%** 자기주도 학습
- 토론 포럼: **+50%** 학생 간 상호작용

### 교수자 효율성:
- 출석 관리 시간: **-70%** (자동화)
- 퀴즈 채점 시간: **-90%** (자동 채점)
- 학생 모니터링: **+80%** 효율 (대시보드)

### 플랫폼 완성도:
- 현재: **70%** (핵심 기능)
- Phase 6 후: **90%** (교육 기관 실사용 가능)
- Phase 7-8 후: **100%** (상용 LMS 수준)

---

## 🎬 결론

**최우선 추천: Priority 1의 4개 기능**

이 4개 기능만 추가해도:
- ✅ 완전한 교육 플랫폼 구축
- ✅ 실제 강의 운영 가능
- ✅ 학생/교수 모두 만족
- ✅ 상용 LMS와 경쟁 가능

**개발 순서:**
1️⃣ 출석 체크 (빠르게 가시적 효과)
2️⃣ 캘린더 (UX 대폭 개선)
3️⃣ 퀴즈 시스템 (평가 시스템 완성)
4️⃣ 진도 추적 (데이터 기반 의사결정)

**구현 시작 제안:**
원하시는 기능을 선택하시면 상세 구현을 진행하겠습니다!
