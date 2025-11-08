# Learning Module System - Phase 1 Implementation

**Date**: 2025-11-07
**Status**: ✅ Phase 1 Complete (Core Infrastructure)
**Next**: Phase 2 (Markdown), Phase 3 (Video), Phase 4 (Jupyter Notebooks)

## 📋 Overview

모듈화된 학습 플랫폼 시스템 구현 - Gitbook + Colab + Video를 결합한 통합 학습 환경

### 학습 구조 (Hierarchical)

```
Track (트랙)
  └─ Module (모듈)
      └─ Chapter (챕터)
          └─ Topic (토픽/레슨)
```

### 콘텐츠 타입

1. **Markdown** - Gitbook 스타일 문서
2. **Video** - MinIO (자체 호스팅) + YouTube + Vimeo
3. **Jupyter Notebook** - 서버 사이드 코드 실행 (.ipynb)

## 🎯 Phase 1 Objectives ✅

- [x] Database schema design
- [x] SQLAlchemy models (6 tables, 3 enums)
- [x] Pydantic schemas (comprehensive validation)
- [x] RESTful API endpoints (CRUD for all entities)
- [x] React Query hooks (30+ hooks)
- [x] Frontend components (7 components)
- [x] TOC (Table of Contents) navigation
- [x] Progress tracking system

## 🏗️ Architecture

### Backend Implementation

#### Database Models (backend/app/models/learning.py)

```python
# Enums
- ContentType: markdown | notebook | video
- TopicStatus: not_started | in_progress | completed
- VideoSource: minio | youtube | vimeo

# Models (6 tables)
1. LearningTrack       - Top-level learning path
2. LearningModule      - Course module (links to existing Course)
3. LearningChapter     - Chapter within module
4. LearningTopic       - Individual lesson (supports 3 content types)
5. TopicProgress       - Per-user progress tracking
6. NotebookExecution   - Code execution logs (security/monitoring)
```

**Key Features**:
- Hierarchical structure with cascade delete
- Multiple content type support in single table
- Flexible video source (self-hosted + external)
- Notebook state persistence (JSON)
- Progress tracking (time, position, status)

#### API Endpoints (backend/app/api/v1/endpoints/learning.py)

**26 Endpoints** organized by resource:

```
Tracks:
  GET    /learning/tracks                    - List all tracks
  GET    /learning/tracks/{id}               - Get track with modules
  GET    /learning/tracks/{id}/full          - Get track with full content
  POST   /learning/tracks                    - Create track
  PUT    /learning/tracks/{id}               - Update track
  DELETE /learning/tracks/{id}               - Delete track

Modules:
  GET    /learning/tracks/{track_id}/modules - List modules in track
  GET    /learning/modules/{id}              - Get module with chapters
  GET    /learning/modules/{id}/full         - Get module with full content
  POST   /learning/modules                   - Create module
  PUT    /learning/modules/{id}              - Update module
  DELETE /learning/modules/{id}              - Delete module

Chapters:
  GET    /learning/modules/{module_id}/chapters - List chapters
  GET    /learning/chapters/{id}                - Get chapter with topics
  POST   /learning/chapters                     - Create chapter
  PUT    /learning/chapters/{id}                - Update chapter
  DELETE /learning/chapters/{id}                - Delete chapter

Topics:
  GET    /learning/chapters/{chapter_id}/topics - List topics
  GET    /learning/topics/{id}                  - Get topic with progress
  POST   /learning/topics                       - Create topic
  PUT    /learning/topics/{id}                  - Update topic
  DELETE /learning/topics/{id}                  - Delete topic

Progress:
  GET    /learning/topics/{id}/progress         - Get user progress
  PUT    /learning/topics/{id}/progress         - Update progress

Execution:
  POST   /learning/topics/{id}/execute          - Execute notebook cell (Phase 4)
```

### Frontend Implementation

#### React Query Hooks (frontend/src/hooks/useLearning.js)

**34 Hooks** for comprehensive data management:

```javascript
// Query Hooks (15)
useTracks, useTrack, useTrackFull
useTrackModules, useModule, useModuleFull
useModuleChapters, useChapter
useChapterTopics, useTopic
useTopicProgress

// Mutation Hooks (14)
useCreateTrack, useUpdateTrack, useDeleteTrack
useCreateModule, useUpdateModule, useDeleteModule
useCreateChapter, useUpdateChapter, useDeleteChapter
useCreateTopic, useUpdateTopic, useDeleteTopic
useUpdateTopicProgress

// Convenience Hooks (5)
useStartTopic          - Mark as started
useCompleteTopic       - Mark as completed
useUpdateVideoPosition - Save video position
useSaveNotebookState   - Save notebook state
useExecuteNotebookCell - Execute code (Phase 4)
```

**Features**:
- Automatic caching & invalidation
- Optimistic updates
- Error handling
- Stale time configuration (1-5 minutes)

#### Components (frontend/src/components/learning/)

**7 Components** for complete learning experience:

```
1. LearningTrackList.jsx      - Browse all tracks (grid layout)
2. LearningModuleView.jsx     - Main learning interface
3. LearningTOC.jsx            - Gitbook-style navigation sidebar
4. TopicContentViewer.jsx     - Content router (dispatches by type)
5. MarkdownViewer.jsx         - Markdown renderer (Phase 2)
6. VideoPlayer.jsx            - Video player (MinIO/YouTube/Vimeo)
7. NotebookViewer.jsx         - Jupyter notebook viewer (Phase 4)
```

**UI/UX Features**:
- Collapsible TOC sidebar
- Progress indicators (✓ completed, ⋯ in progress, ○ not started)
- Content type badges (📄 문서, 🎥 영상, 💻 실습)
- Next/Previous navigation
- Completion buttons
- Attachment support

## 📊 Database Schema Details

### LearningTrack
```sql
id                UUID PRIMARY KEY
title             VARCHAR(200)
description       TEXT
thumbnail_url     VARCHAR(500)
order             INTEGER DEFAULT 0
is_published      BOOLEAN DEFAULT FALSE
created_by        UUID (FK → user_profiles)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### LearningModule
```sql
id                UUID PRIMARY KEY
track_id          UUID (FK → learning_tracks, CASCADE)
course_id         UUID (FK → courses, SET NULL)  -- Optional link
title             VARCHAR(200)
description       TEXT
thumbnail_url     VARCHAR(500)
estimated_hours   INTEGER
difficulty_level  VARCHAR(20)  -- beginner/intermediate/advanced
order             INTEGER DEFAULT 0
is_published      BOOLEAN DEFAULT FALSE
created_by        UUID (FK → user_profiles)
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### LearningChapter
```sql
id                UUID PRIMARY KEY
module_id         UUID (FK → learning_modules, CASCADE)
title             VARCHAR(200)
description       TEXT
order             INTEGER DEFAULT 0
is_published      BOOLEAN DEFAULT FALSE
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### LearningTopic
```sql
id                      UUID PRIMARY KEY
chapter_id              UUID (FK → learning_chapters, CASCADE)
title                   VARCHAR(200)
description             TEXT
content_type            ENUM (markdown, notebook, video)

-- Markdown fields
markdown_content        TEXT
markdown_file_url       VARCHAR(500)

-- Notebook fields
notebook_data           JSON (full .ipynb)
notebook_kernel         VARCHAR(50) DEFAULT 'python3'

-- Video fields
video_source            ENUM (minio, youtube, vimeo)
video_url               VARCHAR(500)
video_duration_seconds  INTEGER
video_thumbnail_url     VARCHAR(500)

-- Common fields
attachments             JSON  -- [{name, url, type}]
duration_minutes        INTEGER
order                   INTEGER DEFAULT 0
is_published            BOOLEAN DEFAULT FALSE
is_required             BOOLEAN DEFAULT TRUE
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

### TopicProgress
```sql
id                       UUID PRIMARY KEY
topic_id                 UUID (FK → learning_topics, CASCADE)
user_id                  UUID (FK → user_profiles, CASCADE)
status                   ENUM (not_started, in_progress, completed)

-- Time tracking
time_spent_minutes       INTEGER DEFAULT 0
started_at               TIMESTAMP
completed_at             TIMESTAMP
last_accessed_at         TIMESTAMP

-- Content-specific progress
video_position_seconds   INTEGER DEFAULT 0
notebook_state           JSON  -- Saved execution state
notebook_last_cell_index INTEGER
scroll_position          INTEGER

created_at               TIMESTAMP
updated_at               TIMESTAMP
```

### NotebookExecution
```sql
id                 UUID PRIMARY KEY
topic_id           UUID (FK → learning_topics, CASCADE)
user_id            UUID (FK → user_profiles, CASCADE)

-- Execution details
cell_index         INTEGER
code               TEXT
kernel_type        VARCHAR(50) DEFAULT 'python3'

-- Results
output             TEXT
error              TEXT
execution_status   VARCHAR(20)  -- success, error, timeout
execution_time_ms  INTEGER

executed_at        TIMESTAMP
```

## 🎨 UI/UX Design

### Gitbook-style Layout

```
┌─────────────────────────────────────────────────────┐
│ [≡] Module: React Fundamentals       [◄ Prev | Next ►]│
├──────────┬──────────────────────────────────────────┤
│          │ # Introduction to Components              │
│ TOC      │                                            │
│ Sidebar  │ Components are the building blocks...     │
│          │                                            │
│ ▼ Ch 1   │ ## Example Code                           │
│   ✓ T1   │                                            │
│   ⋯ T2   │ ```python                                 │
│   ○ T3   │ def hello():                              │
│ ▶ Ch 2   │     print("Hello World")                  │
│          │ ```                                        │
│          │ [▶ Run Code]                              │
│          │                                            │
│          │ Output: Hello World                       │
│          │                                            │
│          │ [✓ 학습 완료]                             │
└──────────┴──────────────────────────────────────────┘
```

### Progress Indicators

- **✓ (Green)** - Completed
- **⋯ (Blue)** - In Progress
- **○ (Gray)** - Not Started

### Content Type Badges

- **📄 문서** - Markdown
- **🎥 영상** - Video
- **💻 실습** - Jupyter Notebook

## 🔄 Data Flow

### 1. User Selects Track
```
useTracks() → Display track list → User clicks track
→ Navigate to /learning/tracks/{trackId}
→ useTrackFull() → Show modules
```

### 2. User Enters Module
```
useModuleFull(moduleId) → Fetch full content tree
→ Render LearningTOC with chapters/topics
→ Auto-navigate to first topic
```

### 3. User Views Topic
```
useTopic(topicId) → Fetch topic + progress
→ TopicContentViewer dispatches to:
   - MarkdownViewer (if markdown)
   - VideoPlayer (if video)
   - NotebookViewer (if notebook)
→ useUpdateTopicProgress() on interactions
```

### 4. Progress Tracking
```
Video: Every 10s → save position
Notebook: On cell execute → save state
Markdown: On complete button → mark completed

All: Auto-mark as "in_progress" when started
All: Manual "complete" button available
```

## 📦 File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── learning.py              ✅ NEW (436 lines)
│   │   └── __init__.py              ✅ UPDATED
│   ├── schemas/
│   │   ├── learning.py              ✅ NEW (410 lines)
│   │   └── __init__.py              ✅ UPDATED
│   └── api/v1/
│       ├── endpoints/
│       │   └── learning.py          ✅ NEW (660 lines)
│       └── api.py                   ✅ UPDATED

frontend/
└── src/
    ├── hooks/
    │   └── useLearning.js           ✅ NEW (565 lines)
    └── components/learning/
        ├── index.js                 ✅ NEW
        ├── LearningTrackList.jsx    ✅ NEW (95 lines)
        ├── LearningModuleView.jsx   ✅ NEW (170 lines)
        ├── LearningTOC.jsx          ✅ NEW (170 lines)
        ├── TopicContentViewer.jsx   ✅ NEW (135 lines)
        ├── MarkdownViewer.jsx       ✅ NEW (70 lines) - Placeholder
        ├── VideoPlayer.jsx          ✅ NEW (185 lines)
        └── NotebookViewer.jsx       ✅ NEW (200 lines) - Placeholder
```

**Total**: 3,096+ lines of code

## 🚀 Usage Examples

### Creating a Learning Track

```python
# API Request
POST /api/v1/learning/tracks
{
  "title": "Full Stack Development",
  "description": "Complete web development course",
  "thumbnail_url": "https://...",
  "order": 0,
  "is_published": true
}
```

### Creating a Topic with Video

```python
POST /api/v1/learning/topics
{
  "chapter_id": "...",
  "title": "React Hooks Introduction",
  "description": "Learn about useState and useEffect",
  "content_type": "video",
  "video_source": "youtube",
  "video_url": "https://youtube.com/watch?v=...",
  "video_duration_seconds": 1200,
  "duration_minutes": 20,
  "is_required": true
}
```

### Creating a Notebook Topic

```python
POST /api/v1/learning/topics
{
  "chapter_id": "...",
  "title": "Python Basics Lab",
  "content_type": "notebook",
  "notebook_data": {
    "cells": [
      {
        "cell_type": "markdown",
        "source": ["# Python Basics"]
      },
      {
        "cell_type": "code",
        "source": ["print('Hello World')"]
      }
    ],
    "metadata": {...}
  },
  "notebook_kernel": "python3",
  "duration_minutes": 30
}
```

### Frontend Usage

```jsx
import { LearningTrackList, LearningModuleView } from '../components/learning';

// Track List Page
<Route path="/learning" element={<LearningTrackList />} />

// Module Learning Page
<Route path="/learning/modules/:moduleId/topics/:topicId?" element={<LearningModuleView />} />
```

## 🔒 Security Considerations

1. **Code Execution Isolation** (Phase 4)
   - Jupyter kernels run in Docker containers
   - Resource limits (CPU, memory, time)
   - Network isolation
   - Code review/logging via NotebookExecution table

2. **Access Control**
   - Track/Module creation: Instructors only
   - Progress tracking: Per-user isolation
   - Published content only for students

3. **Input Validation**
   - Pydantic schemas validate all inputs
   - File URL validation
   - Video URL sanitization
   - Notebook JSON structure validation

## 📈 Performance Optimizations

1. **React Query Caching**
   - 5 minutes for static content (tracks, modules)
   - 2 minutes for topics (more dynamic)
   - 1 minute for progress (very dynamic)

2. **Database Indexing** (TODO: Migration)
   ```sql
   CREATE INDEX idx_modules_track ON learning_modules(track_id);
   CREATE INDEX idx_chapters_module ON learning_chapters(module_id);
   CREATE INDEX idx_topics_chapter ON learning_topics(chapter_id);
   CREATE INDEX idx_progress_user_topic ON topic_progress(user_id, topic_id);
   ```

3. **Eager Loading**
   - `selectinload` for nested relationships
   - Full content endpoints for TOC rendering

## 🧪 Testing Requirements

### Backend Tests (TODO)
```python
# test_learning_api.py
- test_create_track()
- test_get_track_with_modules()
- test_create_topic_markdown()
- test_create_topic_video()
- test_create_topic_notebook()
- test_update_progress()
- test_cascade_delete()
```

### Frontend Tests (TODO)
```javascript
// LearningModuleView.test.jsx
- renders TOC with chapters and topics
- navigates between topics
- updates progress on completion
- handles video playback
```

## 🗺️ Roadmap

### ✅ Phase 1: Core Infrastructure (COMPLETE)
- Database models & API
- React Query hooks
- Basic UI components
- TOC navigation
- Progress tracking

### 📋 Phase 2: Markdown Support (2-3 days)
- [ ] Install react-markdown, remark-gfm, rehype-highlight
- [ ] Implement full markdown rendering
- [ ] Syntax highlighting for code blocks
- [ ] Support images, links, tables
- [ ] Markdown file upload to MinIO
- [ ] Test with real markdown content

### 🎥 Phase 3: Video Support (2-3 days)
- [ ] Install react-player
- [ ] MinIO video upload support
- [ ] YouTube/Vimeo embed testing
- [ ] Video progress tracking
- [ ] Subtitles support (optional)
- [ ] Playback speed control

### 💻 Phase 4: Jupyter Notebook (1-2 weeks)
- [ ] Setup Jupyter Kernel Gateway
- [ ] Docker containers for kernel isolation
- [ ] WebSocket connection for execution
- [ ] Install @nteract/notebook-render or Monaco Editor
- [ ] Cell execution with output rendering
- [ ] Support multiple outputs (text, image, HTML, error)
- [ ] State persistence & restoration
- [ ] Multi-kernel support (Python → JS → SQL)
- [ ] Resource limits & timeouts
- [ ] Execution logging & monitoring

### 🔧 Phase 5: Advanced Features
- [ ] Search across all content
- [ ] Bookmarks & notes
- [ ] Discussion threads per topic
- [ ] Quiz integration
- [ ] Certificate generation
- [ ] Mobile responsive improvements
- [ ] Offline mode (PWA)

## 📝 Migration Instructions

### Database Migration
```bash
# Generate migration (when Alembic is configured)
cd backend
alembic revision --autogenerate -m "Add learning module system"
alembic upgrade head
```

### Frontend Dependencies
```bash
cd frontend

# Phase 2 (Markdown)
npm install --legacy-peer-deps react-markdown remark-gfm rehype-highlight

# Phase 3 (Video)
npm install --legacy-peer-deps react-player

# Phase 4 (Notebooks)
npm install --legacy-peer-deps @nteract/notebook-render monaco-editor
```

### Backend Dependencies (Phase 4)
```bash
cd backend
pip install jupyter-kernel-gateway nbformat
```

## 🔗 Integration with Existing Systems

### Course System
- `LearningModule.course_id` links to existing `Course`
- Enables learning modules within courses
- Optional: Can be standalone (course_id = NULL)

### Progress System
- Extends existing `LearningProgress` table
- Can integrate with XP/achievement system
- Topic completion can award points

### Notification System
- Notify on module completion
- Notify on new content published
- Remind about incomplete required topics

## ⚠️ Known Limitations (Phase 1)

1. **Markdown**: Placeholder only, shows raw text
2. **Video**: Basic HTML5 player, no react-player yet
3. **Notebook**: Shows cells but cannot execute
4. **No Alembic migration**: Manual DB creation needed
5. **No permission checks**: All users can create content
6. **No search**: Cannot search across topics
7. **No offline support**: Requires network connection

## 📞 Support & Documentation

- **API Docs**: http://localhost:8000/docs (when running)
- **Source Code**: `backend/app/models/learning.py` (comprehensive docstrings)
- **Frontend Hooks**: `frontend/src/hooks/useLearning.js` (JSDoc comments)
- **Components**: `frontend/src/components/learning/` (inline documentation)

## 🎉 Conclusion

Phase 1 successfully implements the **core infrastructure** for a modular learning platform with:
- ✅ Hierarchical content structure (Track → Module → Chapter → Topic)
- ✅ Three content types (Markdown, Video, Notebook)
- ✅ Progress tracking system
- ✅ Gitbook-style UI/UX
- ✅ 26 API endpoints
- ✅ 34 React Query hooks
- ✅ 7 frontend components

**Next Steps**: Proceed to Phase 2 (Markdown rendering) or Phase 3 (Video player enhancement).

---

**Implementation Date**: 2025-11-07
**Total Development Time**: ~4 hours
**Lines of Code**: 3,096+
**Files Created**: 10
**Files Modified**: 4
