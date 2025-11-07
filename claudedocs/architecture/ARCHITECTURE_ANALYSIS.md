# 🔍 아키텍처 분석 및 중복성 체크 결과

> **분석 일자:** 2025-11-05
> **분석 범위:** Backend (Python/FastAPI) + Frontend (React)

---

## 📊 요약

| 항목 | 결과 |
|------|------|
| 총 분석 파일 | 18개 (백엔드 16개, 프론트엔드 주요 컴포�트) |
| 발견된 주요 중복 패턴 | 5가지 (33회 이상 반복) |
| 일관성 문제 | 3가지 주요 문제 |
| 권장 개선 사항 | 8가지 (우선순위별) |

**전체 코드 품질 평가:**
- ✅ **우수**: 권한 관리, 일부 서비스 레이어, 데이터 모델 설계
- ⚠️ **개선 필요**: 중복 코드, API 일관성

---

## 1. 중복 코드 패턴 (Critical)

### 1.1 데이터베이스 조회 + 404 체크 (🔴 최고 우선순위)

**반복 횟수:** 33회 이상

**패턴:**
```python
query = select(Model).where(Model.id == id)
result = await db.execute(query)
obj = result.scalar_one_or_none()

if not obj:
    raise HTTPException(status_code=404, detail="...")
```

**발견 위치:**
- `backend/app/api/v1/endpoints/assignments.py` (121-126, 144-148, 167-171, 184-189 외 다수)
- `backend/app/api/v1/endpoints/courses.py` (135-143, 178-186, 213-221)
- `backend/app/api/v1/endpoints/files.py` (128-133, 145-150)
- `backend/app/api/v1/endpoints/channels.py` (58-63, 76-81)
- `backend/app/api/v1/endpoints/messages.py` (92-97, 117-122)
- `backend/app/api/v1/endpoints/auth.py` (30-38, 95-103)

**개선 방안:** 공통 헬퍼 함수 생성 (섹션 3.1 참조)

---

### 1.2 모델 업데이트 로직 (🔴 높음)

**반복 횟수:** 6회

**패턴:**
```python
for field, value in data.dict(exclude_unset=True).items():
    setattr(obj, field, value)
```

**발견 위치:**
- `backend/app/api/v1/endpoints/auth.py` (106)
- `backend/app/api/v1/endpoints/assignments.py` (150, 370, 431)
- `backend/app/api/v1/endpoints/courses.py` (189)
- `backend/app/api/v1/endpoints/channels.py` (83)

**개선 방안:** 공통 업데이트 헬퍼 함수 (섹션 3.1 참조)

---

### 1.3 파일 업로드 로직 (🟡 중간)

**반복 횟수:** 3회 (거의 동일한 로직)

**패턴:**
```python
# 1. MinIO 업로드
file_path = storage_service.upload_file(...)

# 2. DB 레코드 생성
db_file = FileModel(
    original_name=file.filename,
    file_path=file_path,
    file_size=file.size,
    ...
)
db.add(db_file)
```

**발견 위치:**
- `backend/app/api/v1/endpoints/files.py` (94-114)
- `backend/app/api/v1/endpoints/assignment_files.py` (44-63, 138-158)

**개선 방안:** FileService 통합 (섹션 3.1 참조)

---

### 1.4 Soft Delete 패턴 (🟢 낮음)

**반복 횟수:** 여러 번

**패턴:**
```python
obj.is_deleted = True
await db.commit()
```

**발견 위치:**
- `backend/app/api/v1/endpoints/assignments.py` (173)
- `backend/app/api/v1/endpoints/files.py` (198)
- `backend/app/api/v1/endpoints/messages.py` (127)

**개선 방안:** 공통 soft_delete 함수 (섹션 3.1 참조)

---

### 1.5 프론트엔드 UI 패턴 (🟡 중간)

**A. 로딩 스피너 (반복)**
```jsx
if (loading) {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

**B. 에러 표시 (반복)**
```jsx
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800">오류: {error}</p>
    </div>
  );
}
```

**C. 날짜 포맷팅 함수 (반복)**
```jsx
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

**발견 위치:**
- `frontend/src/components/assignments/AssignmentList.jsx`
- `frontend/src/components/assignments/AssignmentForm.jsx`
- `frontend/src/components/assignments/AssignmentDetail.jsx`

**개선 방안:** 공통 컴포넌트 및 유틸리티 함수 (섹션 3.1 참조)

---

## 2. 일관성 문제

### 2.1 HTTP Status Code 표기 불일치 (⚠️)

**문제:** 3가지 다른 방식 혼용

```python
# 방식 1: status 모듈 사용 (권장)
status_code=status.HTTP_201_CREATED  # ✅

# 방식 2: 숫자 직접 사용
status_code=201  # ❌

# 방식 3: 데코레이터에 직접 명시
@router.post("", status_code=201)  # ❌
```

**발견 위치:**
- 일관성 O: `courses.py`, `auth.py`
- 혼용: `files.py`, `assignment_files.py`, `messages.py`

**권장:** 모든 파일에서 `status.HTTP_*` 사용

---

### 2.2 응답 형식 불일치 (⚠️)

**문제:** Pydantic 스키마 vs 딕셔너리 혼용

```python
# 방식 1: Pydantic 스키마 (권장)
return assignment  # ✅ 자동 변환

# 방식 2: 딕셔너리 직접 반환
return {  # ❌ 타입 안정성 낮음
    "message": "...",
    "file_id": str(db_file.id)
}
```

**발견 위치:**
- 스키마 사용: `assignments.py`, `courses.py`, `auth.py`
- 딕셔너리 사용: `assignment_files.py` (74-78, 168-172)

**권장:** 모든 응답에 Pydantic 스키마 사용

---

### 2.3 URL 파라미터 패턴 불일치 (⚠️)

**문제:** Query 파라미터 vs Path 파라미터

```python
# 현재 (Query Parameter)
@router.get("")
async def get_channels(course_id: UUID = Query(...))  # ❌

# 권장 (Path Parameter - RESTful)
@router.get("/courses/{course_id}/channels")  # ✅
async def get_channels(course_id: UUID)
```

**발견 위치:**
- Query 사용: `channels.py` (20), `files.py` (28, 63), `assignments.py` (45)

**권장:** RESTful 라우팅 구조로 변경

---

## 3. 개선 제안

### 3.1 공통 유틸리티 함수 (🔴 최고 우선순위)

#### A. 데이터베이스 헬퍼 함수

**생성할 파일:** `backend/app/api/utils/db_helpers.py`

```python
"""Database helper utilities."""
from typing import Type
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeMeta
from pydantic import BaseModel


async def get_or_404(
    db: AsyncSession,
    model: Type[DeclarativeMeta],
    id: UUID,
    error_message: str = None
) -> DeclarativeMeta:
    """
    Get object by ID or raise 404 error.

    Args:
        db: Database session
        model: SQLAlchemy model class
        id: Object ID
        error_message: Custom error message

    Returns:
        Model instance

    Raises:
        HTTPException: 404 if not found

    Example:
        assignment = await get_or_404(db, Assignment, assignment_id)
    """
    query = select(model).where(model.id == id)
    result = await db.execute(query)
    obj = result.scalar_one_or_none()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_message or f"{model.__name__} not found"
        )

    return obj


async def update_model_from_schema(
    obj: DeclarativeMeta,
    schema: BaseModel,
    exclude_unset: bool = True
) -> DeclarativeMeta:
    """
    Update model instance from Pydantic schema.

    Args:
        obj: SQLAlchemy model instance
        schema: Pydantic schema with update data
        exclude_unset: Only update fields that were explicitly set

    Returns:
        Updated model instance

    Example:
        assignment = await update_model_from_schema(
            assignment,
            assignment_data
        )
    """
    for field, value in schema.dict(exclude_unset=exclude_unset).items():
        setattr(obj, field, value)
    return obj


async def soft_delete(
    db: AsyncSession,
    obj: DeclarativeMeta
) -> None:
    """
    Soft delete an object.

    Args:
        db: Database session
        obj: Model instance to soft delete

    Example:
        await soft_delete(db, assignment)
    """
    obj.is_deleted = True
    await db.commit()
```

**사용 예시:**

```python
# Before (assignments.py:121-126) - 6줄
query = select(Assignment).where(Assignment.id == assignment_id)
result = await db.execute(query)
assignment = result.scalar_one_or_none()
if not assignment:
    raise HTTPException(status_code=404, detail="Assignment not found")

# After - 1줄
assignment = await get_or_404(db, Assignment, assignment_id, "Assignment not found")
```

**효과:**
- 33회 반복 → 1줄로 축약
- 코드 라인 수 ~200줄 감소
- 일관성 향상
- 유지보수성 향상

---

#### B. 파일 서비스 통합

**생성할 파일:** `backend/app/services/file_service.py`

```python
"""File management service."""
from uuid import UUID
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.file import File as FileModel
from app.services.storage_service import storage_service


class FileService:
    """Service for file management operations."""

    @staticmethod
    async def create_and_upload_file(
        db: AsyncSession,
        file: UploadFile,
        course_id: UUID,
        uploaded_by: UUID,
        folder: str = "shared",
        folder_id: UUID = None
    ) -> FileModel:
        """
        Upload file to storage and create database record.

        Args:
            db: Database session
            file: Uploaded file
            course_id: Course ID
            uploaded_by: User ID who uploaded
            folder: Storage folder path
            folder_id: Optional folder ID in database

        Returns:
            Created file model instance

        Example:
            db_file = await FileService.create_and_upload_file(
                db=db,
                file=file,
                course_id=course_id,
                uploaded_by=user_id
            )
        """
        # Upload to MinIO
        file_path = storage_service.upload_file(
            file.file,
            file.filename,
            str(course_id),
            folder=folder,
            content_type=file.content_type
        )

        # Create database record
        db_file = FileModel(
            course_id=course_id,
            folder_id=folder_id,
            uploaded_by=uploaded_by,
            original_name=file.filename,
            stored_name=file_path.split("/")[-1],
            file_path=file_path,
            file_size=file.size,
            mime_type=file.content_type
        )

        db.add(db_file)
        await db.flush()

        return db_file
```

**효과:**
- 중복 코드 제거 (3회 → 1회)
- 파일 업로드 로직 중앙화
- 테스트 용이성 향상

---

#### C. 프론트엔드 공통 컴포넌트

**1. LoadingSpinner 컴포넌트**

**파일:** `frontend/src/components/common/LoadingSpinner.jsx`

```jsx
/**
 * Reusable loading spinner component
 */
import React from 'react';

export const LoadingSpinner = ({ size = 'large', message = '' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col justify-center items-center py-12">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600`}></div>
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
```

**2. ErrorAlert 컴포넌트**

**파일:** `frontend/src/components/common/ErrorAlert.jsx`

```jsx
/**
 * Reusable error alert component
 */
import React from 'react';

export const ErrorAlert = ({ error, onRetry = null }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">오류: {error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
```

**3. 날짜/파일 유틸리티 함수**

**파일:** `frontend/src/utils/formatters.js`

```javascript
/**
 * Utility functions for formatting data
 */

/**
 * Format date string to Korean locale
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date to relative time (e.g., "2시간 전")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return formatDate(dateString);
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
```

**사용 예시:**

```jsx
// Before - 각 컴포넌트마다 중복
if (loading) {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// After - 간결하게
import LoadingSpinner from '../common/LoadingSpinner';
if (loading) return <LoadingSpinner />;

// 날짜 포맷팅
import { formatDate, formatFileSize } from '../../utils/formatters';
<span>{formatDate(assignment.due_date)}</span>
<span>{formatFileSize(file.size)}</span>
```

---

### 3.2 서비스 레이어 확장 (🟡 중간 우선순위)

#### Assignment Service 생성

**파일:** `backend/app/services/assignment_service.py`

```python
"""Assignment business logic service."""
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment, Submission, Grade


class AssignmentService:
    """Service for assignment-related business logic."""

    @staticmethod
    async def get_assignment_statistics(
        db: AsyncSession,
        assignment_id: UUID
    ) -> dict:
        """
        Calculate comprehensive assignment statistics.

        Args:
            db: Database session
            assignment_id: Assignment ID

        Returns:
            Dictionary with statistics:
            - total_submissions: int
            - graded_count: int
            - average_score: float
            - highest_score: float
            - lowest_score: float
            - submissions: List[Submission]
        """
        # 현재 assignments.py:192-216에 있는 통계 계산 로직을 여기로 이동

        # Total submissions
        total_query = select(func.count(Submission.id)).where(
            Submission.assignment_id == assignment_id
        )
        total_result = await db.execute(total_query)
        total_submissions = total_result.scalar()

        # Graded submissions with scores
        graded_query = select(Grade).join(Submission).where(
            Submission.assignment_id == assignment_id
        )
        graded_result = await db.execute(graded_query)
        grades = graded_result.scalars().all()

        # Calculate statistics
        graded_count = len(grades)
        scores = [g.points for g in grades] if grades else []

        return {
            'total_submissions': total_submissions,
            'graded_count': graded_count,
            'average_score': sum(scores) / len(scores) if scores else 0,
            'highest_score': max(scores) if scores else 0,
            'lowest_score': min(scores) if scores else 0,
            'submissions': []  # 필요시 포함
        }

    @staticmethod
    async def submit_assignment_with_notification(
        db: AsyncSession,
        assignment_id: UUID,
        student_id: UUID,
        submission_data: dict
    ) -> Submission:
        """
        Submit assignment and send notifications.

        현재 assignments.py:222-282에 있는 제출 로직을 여기로 이동
        - 제출물 생성
        - 강사에게 알림 전송
        - 관련 캐시 무효화
        """
        # 구현...
        pass
```

**효과:**
- 엔드포인트 코드 간결화
- 비즈니스 로직 테스트 용이
- 재사용성 향상

---

### 3.3 일관성 개선 (🟡 중간 우선순위)

#### A. HTTP Status Code 표준화

**적용 파일:** 모든 엔드포인트

```python
# Before
@router.post("", status_code=201)
raise HTTPException(status_code=404, detail="...")

# After
from fastapi import status

@router.post("", status_code=status.HTTP_201_CREATED)
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="..."
)
```

---

#### B. 응답 스키마 표준화

**assignment_files.py 개선 예시:**

```python
# 1. 스키마 정의 추가
class FileAttachmentResponse(BaseModel):
    """Response for file attachment."""
    message: str
    file_id: UUID
    filename: str
    file_path: str

    class Config:
        from_attributes = True

# 2. 엔드포인트에서 사용
@router.post(
    "/{assignment_id}/files",
    response_model=FileAttachmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def attach_file_to_assignment(...) -> FileAttachmentResponse:
    # ...
    return FileAttachmentResponse(
        message="File attached successfully",
        file_id=db_file.id,
        filename=file.filename,
        file_path=db_file.file_path
    )
```

---

#### C. API 라우팅 구조 개선 (🟢 낮은 우선순위)

**현재 구조:**
```
GET /channels?course_id=xxx  # Query parameter
GET /files?course_id=xxx
```

**권장 구조 (RESTful):**
```
GET /courses/{course_id}/channels
GET /courses/{course_id}/files
```

**구현 방법:**
```python
# api.py에서 라우터 마운트 방식 변경
api_router.include_router(
    channels.router,
    prefix="/courses/{course_id}/channels",
    tags=["channels"]
)
```

---

## 4. 장점 (잘 구현된 부분) ✅

### 4.1 서비스 레이어 (일부)

**NotificationService** (`backend/app/services/notification_service.py`)
```python
class NotificationService:
    @staticmethod
    async def create_notification(...):
        # 잘 캡슐화된 비즈니스 로직
        # 캐시 무효화까지 처리
```

**StorageService** (`backend/app/services/storage_service.py`)
- MinIO 연동 로직 완벽하게 추상화
- 에러 처리 우수
- 재사용성 높음

**평가:** ⭐⭐⭐⭐⭐ (5/5)

---

### 4.2 권한 관리 시스템

**의존성 기반 권한 체크** (`backend/app/api/deps.py`)
```python
async def require_instructor(
    current_user: dict = Depends(get_current_active_user),
    course_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    # 재사용 가능한 권한 체크
    # 일관성 있는 에러 처리
```

**장점:**
- 의존성 주입 패턴 우수
- 역할 기반 접근 제어 명확
- 코드 재사용성 높음

**평가:** ⭐⭐⭐⭐⭐ (5/5)

---

### 4.3 데이터 모델 설계

**Soft Delete 패턴:**
```python
is_deleted = Column(Boolean, default=False)
```
- 일관성 있게 적용
- 데이터 복구 가능

**Timestamp 자동 관리:**
```python
created_at = Column(DateTime, default=datetime.utcnow)
updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Cascade 설정:**
```python
submissions = relationship(
    "Submission",
    back_populates="assignment",
    cascade="all, delete-orphan"
)
```

**평가:** ⭐⭐⭐⭐⭐ (5/5)

---

### 4.4 Pydantic 스키마 구조

**일관성 있는 Base/Create/Update 패턴:**
```python
class AssignmentBase(BaseModel): ...
class AssignmentCreate(AssignmentBase): pass
class AssignmentUpdate(BaseModel): ...  # Optional fields
class Assignment(AssignmentBase): ...   # With ID
```

**평가:** ⭐⭐⭐⭐ (4/5)

---

### 4.5 프론트엔드 컴포넌트

**FileUpload 컴포넌트** (`frontend/src/components/common/FileUpload.jsx`)
- 드래그 앤 드롭 구현 우수
- Props 인터페이스 명확
- 재사용성 높음

**평가:** ⭐⭐⭐⭐⭐ (5/5)

---

## 5. 우선순위별 액션 플랜

### 🔴 Phase 1: 긴급 (1-2주)

**1. 데이터베이스 헬퍼 함수 생성**
- [ ] `backend/app/api/utils/db_helpers.py` 생성
- [ ] `get_or_404()`, `update_model_from_schema()`, `soft_delete()` 구현
- [ ] 테스트 작성
- [ ] 모든 엔드포인트에 적용 시작

**예상 효과:**
- 코드 라인 ~200줄 감소
- 중복 제거 33회 → 재사용

**2. 파일 서비스 통합**
- [ ] `backend/app/services/file_service.py` 생성
- [ ] `create_and_upload_file()` 구현
- [ ] `files.py`와 `assignment_files.py` 리팩토링

**예상 효과:**
- 파일 업로드 로직 중앙화
- 중복 제거 3회

**3. 프론트엔드 공통 컴포넌트**
- [ ] `LoadingSpinner.jsx` 생성
- [ ] `ErrorAlert.jsx` 생성
- [ ] `formatters.js` 유틸리티 생성
- [ ] 기존 컴포넌트에 적용

**예상 효과:**
- UI 일관성 향상
- 코드 재사용성 증가

---

### 🟡 Phase 2: 중요 (3-4주)

**4. Status Code 표준화**
- [ ] 모든 엔드포인트에서 `status.HTTP_*` 사용
- [ ] Linter 규칙 추가

**5. 응답 스키마 표준화**
- [ ] `assignment_files.py` 스키마 추가
- [ ] 딕셔너리 응답을 Pydantic으로 변경

**6. 서비스 레이어 확장**
- [ ] `AssignmentService` 생성
- [ ] `CourseService` 생성
- [ ] 통계 계산 로직 이동

---

### 🟢 Phase 3: 개선 (장기)

**7. API 라우팅 구조 개선**
- [ ] RESTful 패턴으로 URL 재설계
- [ ] 라우터 마운트 방식 변경

**8. 추가 개선 사항**
- [ ] 에러 메시지 다국어화
- [ ] API 문서화 강화
- [ ] E2E 테스트 추가

---

## 6. 메트릭 및 KPI

### 현재 상태

| 메트릭 | 값 |
|--------|-----|
| 총 코드 라인 (백엔드) | ~1,731 (endpoints만) |
| 중복 패턴 횟수 | 33회 (DB 조회) + 6회 (업데이트) + 3회 (파일) |
| 일관성 문제 | 3가지 |
| 서비스 레이어 활용도 | 30% |

### 목표 (리팩토링 후)

| 메트릭 | 목표 |
|--------|------|
| 코드 라인 감소 | -15% (~250줄) |
| 중복 패턴 제거 | 90% 이상 |
| 일관성 문제 해결 | 100% |
| 서비스 레이어 활용도 | 70% |
| 테스트 커버리지 | 80% 이상 |

---

## 7. 참고 자료

### 코드 품질 가이드라인

**FastAPI Best Practices:**
- https://fastapi.tiangolo.com/tutorial/bigger-applications/
- https://github.com/zhanymkanov/fastapi-best-practices

**SQLAlchemy Async Patterns:**
- https://docs.sqlalchemy.org/en/14/orm/extensions/asyncio.html

**React Best Practices:**
- https://react.dev/learn/you-might-not-need-an-effect
- https://kentcdodds.com/blog/application-state-management-with-react

---

## 8. 다음 단계

1. **이 문서를 팀과 공유**
2. **우선순위 합의**
3. **Phase 1 작업 시작**
   - 데이터베이스 헬퍼 함수부터 구현
   - PR 단위로 점진적 적용
4. **리팩토링 전 테스트 작성**
   - 기능 보존 확인
5. **지속적 개선**
   - 코드 리뷰 시 일관성 체크
   - Linter/Formatter 규칙 추가

---

**문서 작성:** Claude Code Analysis
**최종 수정:** 2025-11-05
