# 📚 Documentation Index

이 디렉토리에는 프로젝트의 모든 기술 문서가 포함되어 있습니다.

## 📁 디렉토리 구조

```
claudedocs/
├── architecture/    # 시스템 아키텍처 문서
├── development/     # 개발 가이드 및 리팩토링 문서
├── reports/         # 구현 완료 리포트 및 테스트 결과
└── proposals/       # 기능 제안서
```

---

## 🏗️ Architecture (아키텍처)

시스템 구조 및 설계 문서

| 문서 | 설명 |
|------|------|
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 전체 시스템 아키텍처 개요 |
| [ARCHITECTURE_ANALYSIS.md](./architecture/ARCHITECTURE_ANALYSIS.md) | 초기 아키텍처 분석 |
| [ARCHITECTURE_ANALYSIS_V2.md](./architecture/ARCHITECTURE_ANALYSIS_V2.md) | 업데이트된 아키텍처 분석 (v2) |

**주요 내용:**
- 프론트엔드/백엔드 구조
- 데이터베이스 모델 (11개 테이블)
- API 엔드포인트 구조
- 기술 스택 및 의존성

---

## 💻 Development (개발)

개발 가이드 및 리팩토링 문서

| 문서 | 설명 |
|------|------|
| [BUILD_GUIDE.md](./development/BUILD_GUIDE.md) | 프로젝트 빌드 및 실행 가이드 |
| [FRONTEND_REFACTORING_ANALYSIS.md](./development/FRONTEND_REFACTORING_ANALYSIS.md) | 프론트엔드 리팩토링 분석 |
| [REFACTORING_STATUS.md](./development/REFACTORING_STATUS.md) | 리팩토링 진행 상태 |

**주요 내용:**
- 로컬 개발 환경 설정
- React Query 마이그레이션 가이드
- 코드 품질 개선 체크리스트
- API Factory 패턴 구현

---

## 📊 Reports (리포트)

구현 완료 보고서 및 테스트 결과

| 문서 | 설명 |
|------|------|
| [CODE_QUALITY_AUDIT_REPORT.md](./reports/CODE_QUALITY_AUDIT_REPORT.md) | 코드 품질 감사 리포트 (Priority 1-3 완료) |
| [INTEGRATION_TEST_REPORT.md](./reports/INTEGRATION_TEST_REPORT.md) | 통합 테스트 결과 (8/8 통과) |
| [PHASE_4_COMPLETION.md](./reports/PHASE_4_COMPLETION.md) | Phase 4 완료 리포트 |
| [PRIORITY_1_IMPLEMENTATION_SUMMARY.md](./reports/PRIORITY_1_IMPLEMENTATION_SUMMARY.md) | Priority 1 구현 요약 |
| [PRIORITY_1_FRONTEND_COMPLETED.md](./reports/PRIORITY_1_FRONTEND_COMPLETED.md) | Priority 1 프론트엔드 완료 |
| [PRIORITY_1_FRONTEND_100_PERCENT_COMPLETE.md](./reports/PRIORITY_1_FRONTEND_100_PERCENT_COMPLETE.md) | Priority 1 100% 완료 확인 |

**주요 성과:**
- ✅ Priority 1-3 작업 100% 완료 (14/14)
- ✅ React Query 전면 도입 (API 호출 70% 감소)
- ✅ 30+ 커스텀 hooks 구현
- ✅ 통합 테스트 8/8 통과
- ✅ 평균 응답 시간 42ms

---

## 💡 Proposals (제안)

기능 제안 및 개선 계획

| 문서 | 설명 |
|------|------|
| [FEATURE_PROPOSALS.md](./proposals/FEATURE_PROPOSALS.md) | 새로운 기능 제안서 |

**주요 내용:**
- 향후 구현 예정 기능
- 개선 아이디어
- 확장성 고려사항

---

## 🔍 빠른 참조

### 처음 시작하는 개발자
1. 📖 [BUILD_GUIDE.md](./development/BUILD_GUIDE.md) - 개발 환경 설정
2. 🏗️ [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) - 시스템 구조 이해
3. 📊 [INTEGRATION_TEST_REPORT.md](./reports/INTEGRATION_TEST_REPORT.md) - 테스트 방법

### 프론트엔드 개발자
1. 📝 [FRONTEND_REFACTORING_ANALYSIS.md](./development/FRONTEND_REFACTORING_ANALYSIS.md)
2. 📊 [CODE_QUALITY_AUDIT_REPORT.md](./reports/CODE_QUALITY_AUDIT_REPORT.md)
3. ✅ [PRIORITY_1_FRONTEND_100_PERCENT_COMPLETE.md](./reports/PRIORITY_1_FRONTEND_100_PERCENT_COMPLETE.md)

### 백엔드 개발자
1. 🏗️ [ARCHITECTURE_ANALYSIS_V2.md](./architecture/ARCHITECTURE_ANALYSIS_V2.md)
2. 📖 [BUILD_GUIDE.md](./development/BUILD_GUIDE.md)
3. 📊 [INTEGRATION_TEST_REPORT.md](./reports/INTEGRATION_TEST_REPORT.md)

### 프로젝트 매니저
1. 📊 [CODE_QUALITY_AUDIT_REPORT.md](./reports/CODE_QUALITY_AUDIT_REPORT.md) - 전체 진행 상황
2. ✅ [PHASE_4_COMPLETION.md](./reports/PHASE_4_COMPLETION.md) - 완료된 작업
3. 💡 [FEATURE_PROPOSALS.md](./proposals/FEATURE_PROPOSALS.md) - 향후 계획

---

## 📈 프로젝트 현황 (2025-11-07 기준)

### 완료된 작업
- ✅ Priority 1-3 코드 품질 개선 (14/14 tasks)
- ✅ React Query 전면 마이그레이션
- ✅ 30+ 커스텀 hooks 구현
- ✅ 프론트엔드-백엔드 통합 테스트
- ✅ 이중 캐싱 전략 구현 (React Query + Redis)

### 주요 지표
- **코드 라인**: 1,657+ lines (hooks만)
- **API 호출 감소**: ~70%
- **평균 응답 시간**: 42ms
- **테스트 통과율**: 100% (8/8)
- **패키지 수**: 1,447개 (frontend)

### 기술 스택
- **Frontend**: React 18, React Query, Axios, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Redis, MinIO
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Testing**: pytest, react-scripts

---

## 🔗 관련 링크

- [메인 README](../README.md)
- [프로젝트 루트](..)
- [테스트 도구](../test_integration.html)

---

**마지막 업데이트**: 2025-11-07
**문서 버전**: 1.0.0
