"""
Learning Module System Schemas
"""
from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from uuid import UUID


# ============================================================================
# Learning Track Schemas
# ============================================================================

class LearningTrackBase(BaseModel):
    """Base learning track schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    order: int = Field(default=0, ge=0)
    is_published: bool = False


class LearningTrackCreate(LearningTrackBase):
    """Schema for creating learning track"""
    pass


class LearningTrackUpdate(BaseModel):
    """Schema for updating learning track"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    order: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None


class LearningTrack(LearningTrackBase):
    """Schema for learning track response"""
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningTrackWithModules(LearningTrack):
    """Learning track with nested modules"""
    modules: List["LearningModuleSummary"] = []

    class Config:
        from_attributes = True


# ============================================================================
# Learning Module Schemas
# ============================================================================

class LearningModuleBase(BaseModel):
    """Base learning module schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    estimated_hours: Optional[int] = Field(None, ge=0)
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    order: int = Field(default=0, ge=0)
    is_published: bool = False


class LearningModuleCreate(LearningModuleBase):
    """Schema for creating learning module"""
    track_id: UUID
    course_id: Optional[UUID] = None  # Optional link to existing course


class LearningModuleUpdate(BaseModel):
    """Schema for updating learning module"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    estimated_hours: Optional[int] = Field(None, ge=0)
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    order: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None
    course_id: Optional[UUID] = None


class LearningModule(LearningModuleBase):
    """Schema for learning module response"""
    id: UUID
    track_id: UUID
    course_id: Optional[UUID] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningModuleSummary(BaseModel):
    """Learning module summary for lists"""
    id: UUID
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    estimated_hours: Optional[int] = None
    difficulty_level: Optional[str] = None
    order: int
    is_published: bool

    class Config:
        from_attributes = True


class LearningModuleWithChapters(LearningModule):
    """Learning module with nested chapters"""
    chapters: List["LearningChapterSummary"] = []

    class Config:
        from_attributes = True


# ============================================================================
# Learning Chapter Schemas
# ============================================================================

class LearningChapterBase(BaseModel):
    """Base learning chapter schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    order: int = Field(default=0, ge=0)
    is_published: bool = False


class LearningChapterCreate(LearningChapterBase):
    """Schema for creating learning chapter"""
    module_id: UUID


class LearningChapterUpdate(BaseModel):
    """Schema for updating learning chapter"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None


class LearningChapter(LearningChapterBase):
    """Schema for learning chapter response"""
    id: UUID
    module_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LearningChapterSummary(BaseModel):
    """Learning chapter summary for lists"""
    id: UUID
    title: str
    description: Optional[str] = None
    order: int
    is_published: bool

    class Config:
        from_attributes = True


class LearningChapterWithTopics(LearningChapter):
    """Learning chapter with nested topics"""
    topics: List["LearningTopicSummary"] = []

    class Config:
        from_attributes = True


# ============================================================================
# Learning Topic Schemas
# ============================================================================

class LearningTopicBase(BaseModel):
    """Base learning topic schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    content_type: str = Field(..., pattern="^(markdown|notebook|video)$")
    order: int = Field(default=0, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_published: bool = False
    is_required: bool = True


class LearningTopicCreate(LearningTopicBase):
    """Schema for creating learning topic"""
    chapter_id: UUID

    # Content fields (only provide relevant ones based on content_type)
    markdown_content: Optional[str] = Field(None, max_length=1000000, description="Markdown content (max 1MB)")
    markdown_file_url: Optional[str] = Field(None, max_length=500)

    notebook_data: Optional[Dict[str, Any]] = Field(None, description="Full .ipynb JSON (max 10MB)")
    notebook_kernel: Optional[str] = Field(default="python3", description="Kernel: python3, javascript, or sql")

    video_source: Optional[str] = Field(None, pattern="^(minio|youtube|vimeo)$")
    video_url: Optional[str] = Field(None, max_length=500)
    video_duration_seconds: Optional[int] = Field(None, ge=0, le=86400, description="Duration in seconds (max 24h)")
    video_thumbnail_url: Optional[str] = Field(None, max_length=500)

    attachments: Optional[List[Dict[str, str]]] = None

    @field_validator('notebook_kernel')
    @classmethod
    def validate_notebook_kernel(cls, v: Optional[str]) -> Optional[str]:
        """Validate notebook kernel type"""
        if v is None:
            return v
        allowed_kernels = {'python3', 'javascript', 'sql'}
        if v not in allowed_kernels:
            raise ValueError(f"notebook_kernel must be one of {allowed_kernels}, got '{v}'")
        return v

    @field_validator('notebook_data')
    @classmethod
    def validate_notebook_data_size(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Validate notebook data size (max 10MB)"""
        if v is None:
            return v
        import json
        data_str = json.dumps(v)
        if len(data_str) > 10 * 1024 * 1024:  # 10MB
            raise ValueError("notebook_data exceeds 10MB limit")
        return v


class LearningTopicUpdate(BaseModel):
    """Schema for updating learning topic"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)
    duration_minutes: Optional[int] = Field(None, ge=0)
    is_published: Optional[bool] = None
    is_required: Optional[bool] = None

    # Content updates
    markdown_content: Optional[str] = Field(None, max_length=1000000, description="Markdown content (max 1MB)")
    markdown_file_url: Optional[str] = Field(None, max_length=500)

    notebook_data: Optional[Dict[str, Any]] = Field(None, description="Full .ipynb JSON (max 10MB)")
    notebook_kernel: Optional[str] = Field(None, description="Kernel: python3, javascript, or sql")

    video_source: Optional[str] = Field(None, pattern="^(minio|youtube|vimeo)$")
    video_url: Optional[str] = Field(None, max_length=500)
    video_duration_seconds: Optional[int] = Field(None, ge=0, le=86400, description="Duration in seconds (max 24h)")
    video_thumbnail_url: Optional[str] = Field(None, max_length=500)

    attachments: Optional[List[Dict[str, str]]] = None

    @field_validator('notebook_kernel')
    @classmethod
    def validate_notebook_kernel(cls, v: Optional[str]) -> Optional[str]:
        """Validate notebook kernel type"""
        if v is None:
            return v
        allowed_kernels = {'python3', 'javascript', 'sql'}
        if v not in allowed_kernels:
            raise ValueError(f"notebook_kernel must be one of {allowed_kernels}, got '{v}'")
        return v

    @field_validator('notebook_data')
    @classmethod
    def validate_notebook_data_size(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Validate notebook data size (max 10MB)"""
        if v is None:
            return v
        import json
        data_str = json.dumps(v)
        if len(data_str) > 10 * 1024 * 1024:  # 10MB
            raise ValueError("notebook_data exceeds 10MB limit")
        return v


class LearningTopic(LearningTopicBase):
    """Schema for learning topic response"""
    id: UUID
    chapter_id: UUID
    created_at: datetime
    updated_at: datetime

    # Content fields
    markdown_content: Optional[str] = None
    markdown_file_url: Optional[str] = None

    notebook_data: Optional[Dict[str, Any]] = None
    notebook_kernel: Optional[str] = None

    video_source: Optional[str] = None
    video_url: Optional[str] = None
    video_duration_seconds: Optional[int] = None
    video_thumbnail_url: Optional[str] = None

    attachments: Optional[List[Dict[str, str]]] = None

    class Config:
        from_attributes = True


class LearningTopicSummary(BaseModel):
    """Learning topic summary for lists"""
    id: UUID
    title: str
    description: Optional[str] = None
    content_type: str
    order: int
    duration_minutes: Optional[int] = None
    is_published: bool
    is_required: bool

    class Config:
        from_attributes = True


# ============================================================================
# Topic Progress Schemas
# ============================================================================

class TopicProgressBase(BaseModel):
    """Base topic progress schema"""
    status: str = Field(default="not_started", pattern="^(not_started|in_progress|completed)$")
    time_spent_minutes: int = Field(default=0, ge=0)
    video_position_seconds: Optional[int] = Field(None, ge=0)
    notebook_state: Optional[Dict[str, Any]] = None
    notebook_last_cell_index: Optional[int] = None
    scroll_position: Optional[int] = None


class TopicProgressCreate(TopicProgressBase):
    """Schema for creating topic progress"""
    topic_id: UUID


class TopicProgressUpdate(BaseModel):
    """Schema for updating topic progress"""
    status: Optional[str] = Field(None, pattern="^(not_started|in_progress|completed)$")
    time_spent_minutes: Optional[int] = Field(None, ge=0)
    video_position_seconds: Optional[int] = Field(None, ge=0)
    notebook_state: Optional[Dict[str, Any]] = None
    notebook_last_cell_index: Optional[int] = None
    scroll_position: Optional[int] = None


class TopicProgress(TopicProgressBase):
    """Schema for topic progress response"""
    id: UUID
    topic_id: UUID
    user_id: UUID
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_accessed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Notebook Execution Schemas
# ============================================================================

class NotebookExecutionRequest(BaseModel):
    """
    Schema for executing notebook code

    Security validations:
    - Code length: 1-50,000 characters (prevents DoS)
    - Cell index: 0-999 (reasonable limit)
    - Kernel type: Only python3, javascript, sql allowed
    """
    topic_id: UUID
    cell_index: int = Field(..., ge=0, lt=1000, description="Cell index (0-999)")
    code: str = Field(
        ...,
        min_length=1,
        max_length=50000,
        description="Code to execute (max 50KB)"
    )
    kernel_type: str = Field(
        default="python3",
        description="Kernel type: python3, javascript, or sql"
    )

    @field_validator('kernel_type')
    @classmethod
    def validate_kernel_type(cls, v: str) -> str:
        """Validate kernel type is one of allowed values"""
        allowed_kernels = {'python3', 'javascript', 'sql'}
        if v not in allowed_kernels:
            raise ValueError(
                f"kernel_type must be one of {allowed_kernels}, got '{v}'"
            )
        return v


class NotebookExecutionResponse(BaseModel):
    """Schema for notebook execution result"""
    execution_id: UUID
    topic_id: UUID
    cell_index: int
    output: Optional[str] = None
    error: Optional[str] = None
    execution_status: str  # success, error, timeout
    execution_time_ms: int
    executed_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Combined/Nested Schemas
# ============================================================================

class TopicWithProgress(LearningTopic):
    """Learning topic with user progress"""
    progress: Optional[TopicProgress] = None

    class Config:
        from_attributes = True


class ChapterWithTopicsAndProgress(LearningChapter):
    """Chapter with topics and user progress"""
    topics: List[TopicWithProgress] = []

    class Config:
        from_attributes = True


class ModuleWithFullContent(LearningModule):
    """Module with full nested content and progress"""
    chapters: List[ChapterWithTopicsAndProgress] = []

    class Config:
        from_attributes = True


class TrackWithFullContent(LearningTrack):
    """Track with full nested content"""
    modules: List[ModuleWithFullContent] = []

    class Config:
        from_attributes = True


# Update forward references
LearningTrackWithModules.model_rebuild()
LearningModuleWithChapters.model_rebuild()
LearningChapterWithTopics.model_rebuild()
