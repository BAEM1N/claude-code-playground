# 학습 과정 시드 스크립트

이 폴더에는 학습 플랫폼에 초기 데이터를 생성하는 스크립트들이 있습니다.

## 📚 학습 과정 생성 (seed_learning_courses.py)

데이터 사이언스 & 머신러닝 완전한 학습 경로를 생성합니다.

### 생성되는 과정

**트랙**: 데이터 사이언스 & 머신러닝 마스터 트랙

**7개 모듈**:
1. **Python 기초** (20시간, 초급)
   - 5개 챕터: 시작하기, 기본 문법, 제어문, 자료구조, 함수
   - 19개 토픽

2. **Numpy 마스터** (15시간, 초급)
   - 4개 챕터: 시작하기, 배열 연산, 배열 조작, 고급 기능
   - 13개 토픽

3. **Pandas 데이터 분석** (25시간, 중급)
   - 5개 챕터: 시작하기, 선택/필터링, 정제, 변환, 시계열
   - 18개 토픽

4. **Matplotlib 시각화** (12시간, 초급)
   - 4개 챕터: 기초, 차트 유형, 커스터마이징, 서브플롯
   - 12개 토픽

5. **Seaborn 고급 시각화** (10시간, 중급)
   - 4개 챕터: 시작하기, 분포, 관계, 범주형
   - 13개 토픽

6. **Scikit-Learn 머신러닝** (30시간, 중급)
   - 6개 챕터: 기초, 회귀, 분류, 클러스터링, 차원 축소, 최적화
   - 22개 토픽

7. **PyTorch 딥러닝** (40시간, 고급)
   - 7개 챕터: 시작하기, 신경망, 모델 구축, CNN, RNN, 전이학습, 고급
   - 28개 토픽

**총계**: 35+ 챕터, 150+ 토픽 (비디오, 마크다운, 노트북)

### 사용 방법

1. **사용자 ID 확인**
   ```bash
   # PostgreSQL에서 instructor 사용자 ID 확인
   psql -U postgres -d your_database -c "SELECT id FROM user_profiles LIMIT 1;"
   ```

2. **스크립트 수정**
   `seed_learning_courses.py` 파일에서 user_id를 실제 사용자 ID로 변경:
   ```python
   user_id = "your-actual-user-uuid-here"
   ```

3. **스크립트 실행**
   ```bash
   cd backend
   python scripts/seed_learning_courses.py
   ```

4. **결과 확인**
   - API: `GET /api/v1/learning/tracks`
   - 프론트엔드: `/learning` 경로 접속

### 주의사항

- ⚠️ 이 스크립트는 한 번만 실행하세요 (중복 데이터 생성 방지)
- ⚠️ 실행 전에 백업 권장
- ⚠️ 실제 비디오 URL과 콘텐츠는 나중에 업데이트 필요

## 🏅 게이미피케이션 데이터 생성

### 기본 게이미피케이션 (seed_gamification.py)

배지와 일일 미션을 생성합니다.

```bash
cd backend
python scripts/seed_gamification.py
```

**생성되는 데이터**:
- 24개 배지 (브론즈, 실버, 골드, 플래티넘, 특별)
- 5개 일일 미션

### 강화 게이미피케이션 (seed_gamification_enhanced.py) ⭐ NEW

배지 컬렉션, 시리즈, 시즌별 배지, 팀 시스템을 포함한 고급 게이미피케이션 데이터를 생성합니다.

```bash
cd backend
python scripts/seed_gamification_enhanced.py
```

**생성되는 데이터**:

1. **배지 컬렉션 (4개 시리즈)**:
   - **Python Master** (4단계): Python 학습 진행도에 따른 배지
     - 🐍 Python 입문자 (Bronze) → ✨ Python 숙련자 (Silver) → 💎 Python 전문가 (Gold) → 👑 Python 그랜드마스터 (Platinum)

   - **Data Science Warrior** (4단계): 데이터 사이언스 마스터 과정
     - 📊 데이터 새내기 → 📈 데이터 분석가 → 🔬 데이터 사이언티스트 → 🤖 머신러닝 챔피언

   - **Streak Warrior** (4단계): 연속 학습 일수 달성
     - 🔥 3일 → 🔥🔥 7일 → 🔥🔥🔥 30일 → 🔥👑 100일 전설

   - **Level Master** (4단계): 레벨 마일스톤
     - ⭐ Lv.10 → ⭐⭐ Lv.25 → ⭐⭐⭐ Lv.50 → 💎 Lv.100

2. **특별 이벤트 배지**:
   - 🚀 얼리 어답터 (한정판 - 최초 100명)
   - ❄️ 2025 겨울 시즌 (시즌 한정)
   - 🏆 배지 수집가 (10개 이상 배지 획득)
   - 👥 팀 플레이어 (팀 활동)

3. **일일/주간 미션**: 5개
4. **샘플 팀**: 4개 (Python Ninjas, Data Science Guild, ML Warriors, Code Masters)

**새로운 기능**:
- ✅ 배지 선행 조건 시스템 (다음 배지를 획득하려면 이전 배지 필요)
- ✅ 배지 컬렉션 및 시리즈 (관련 배지를 그룹화하여 진행도 추적)
- ✅ 시즌별/한정판 배지 (기간 한정 또는 인원 제한)
- ✅ 팀/길드 시스템
- ✅ 배지 획득 진행도 추적

## 🎯 새로운 API 엔드포인트

강화된 게이미피케이션 시스템은 다음의 새로운 API 엔드포인트를 제공합니다:

### 배지 진행도 및 컬렉션
- `GET /api/v1/gamification/badges/progress` - 아직 획득하지 못한 배지의 진행도 조회
- `GET /api/v1/gamification/badges/collections` - 배지 컬렉션 목록 및 완료율 조회

### 강의별 리더보드
- `GET /api/v1/gamification/leaderboards/course/{entity_type}/{entity_id}` - 강의/모듈/챕터별 리더보드
  - `entity_type`: "track", "module", "chapter"
  - `period`: "weekly", "monthly", "all_time"

### 팀/길드 시스템
- `GET /api/v1/gamification/teams` - 모든 공개 팀 조회
- `POST /api/v1/gamification/teams` - 새 팀 생성
- `GET /api/v1/gamification/teams/{team_id}` - 팀 상세 정보 (멤버 포함)
- `POST /api/v1/gamification/teams/{team_id}/join` - 팀 가입
- `GET /api/v1/gamification/teams/leaderboard` - 팀 리더보드

### 사용 예시

```bash
# 배지 진행도 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/gamification/badges/progress

# 배지 컬렉션 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/gamification/badges/collections

# Python 모듈 리더보드 조회
curl -H "Authorization: Bearer {token}" \
  "http://localhost:8000/api/v1/gamification/leaderboards/course/module/{module_id}?period=weekly"

# 모든 팀 조회
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/v1/gamification/teams
```

## 🔧 트러블슈팅

### 에러: "No module named 'app'"
```bash
# PYTHONPATH 설정
export PYTHONPATH="${PYTHONPATH}:/path/to/backend"
python scripts/seed_learning_courses.py
```

### 에러: "Database connection failed"
- `.env` 파일에서 데이터베이스 설정 확인
- PostgreSQL 서버 실행 상태 확인

### 에러: "Foreign key constraint fails"
- user_id가 실제 존재하는 사용자인지 확인
- 먼저 사용자를 생성한 후 스크립트 실행

## 📖 추가 정보

생성된 토픽 콘텐츠는 플레이스홀더입니다. 실제 운영 시:
1. 비디오 URL을 실제 YouTube/Vimeo 링크로 변경
2. 마크다운 콘텐츠를 실제 학습 자료로 교체
3. Jupyter 노트북에 실제 코드 예제 추가

각 토픽 완료 시 자동으로 XP가 부여됩니다:
- 비디오: 50 XP
- 마크다운: 30 XP
- 노트북: 100 XP
