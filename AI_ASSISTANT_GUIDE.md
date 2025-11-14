# AI 학습 도우미 가이드

> OpenAI, Claude, Gemini, OpenRouter를 지원하는 멀티 프로바이더 AI 어시스턴트

## 🎯 기능 개요

AI 학습 도우미는 다음 기능을 제공합니다:

1. **코드 리뷰** - 학생 코드에 대한 자동 피드백
2. **개념 설명** - 프로그래밍 개념을 쉽게 설명
3. **퀴즈 생성** - AI가 자동으로 퀴즈 문제 생성
4. **내용 요약** - 학습 자료 요약
5. **질문 답변 챗봇** - 실시간 학습 지원

## 🔑 API 키 설정

### 1. OpenAI (추천)

```bash
# .env 파일에 추가
OPENAI_API_KEY=sk-proj-...
DEFAULT_AI_PROVIDER=openai
```

**API 키 발급:**
1. https://platform.openai.com 접속
2. API keys 메뉴에서 새 키 생성
3. 결제 정보 등록 (사용량만큼 과금)

**모델:**
- `gpt-4o` - 최신 모델, 가장 강력
- `gpt-4o-mini` - 빠르고 저렴 (권장)
- `gpt-4-turbo` - 이전 최신 모델
- `gpt-3.5-turbo` - 가장 저렴

**가격 (gpt-4o-mini):**
- 입력: $0.150 / 1M tokens
- 출력: $0.600 / 1M tokens

---

### 2. Anthropic Claude

```bash
# .env 파일에 추가
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_AI_PROVIDER=claude
```

**API 키 발급:**
1. https://console.anthropic.com 접속
2. Get API keys에서 생성
3. 크레딧 구매 필요

**모델:**
- `claude-3-5-sonnet-20241022` - 최신 Sonnet (권장)
- `claude-3-5-haiku-20241022` - 빠르고 저렴
- `claude-3-opus-20240229` - 가장 강력

**가격 (Claude 3.5 Sonnet):**
- 입력: $3 / 1M tokens
- 출력: $15 / 1M tokens

---

### 3. Google Gemini

```bash
# .env 파일에 추가
GOOGLE_API_KEY=AIza...
DEFAULT_AI_PROVIDER=gemini
```

**API 키 발급:**
1. https://makersuite.google.com/app/apikey 접속
2. Create API key 클릭
3. 무료 할당량 제공 (월 60 requests/분)

**모델:**
- `gemini-1.5-pro` - 가장 강력
- `gemini-1.5-flash` - 빠르고 저렴 (권장)
- `gemini-1.0-pro` - 이전 모델

**가격 (Gemini 1.5 Flash):**
- 입력: $0.075 / 1M tokens (128k 이하)
- 출력: $0.30 / 1M tokens

---

### 4. OpenRouter (권장 - 여러 모델 접근)

```bash
# .env 파일에 추가
OPENROUTER_API_KEY=sk-or-v1-...
DEFAULT_AI_PROVIDER=openrouter
```

**API 키 발급:**
1. https://openrouter.ai 접속
2. Keys 메뉴에서 생성
3. 크레딧 충전 ($5부터)

**장점:**
- 하나의 API로 여러 모델 접근
- OpenAI, Claude, Gemini, Llama 등 통합
- 모델별 가격 경쟁

**모델 예시:**
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4o`
- `google/gemini-pro-1.5`
- `meta-llama/llama-3.1-70b-instruct`

---

## 📡 API 엔드포인트

### 기본 URL
```
http://localhost:8000/api/v1/ai
```

### 1. 제공자 목록 조회

```bash
GET /api/v1/ai/providers
```

**응답:**
```json
{
  "providers": [
    {
      "provider": "openai",
      "models": ["gpt-4o", "gpt-4o-mini"],
      "is_available": true,
      "description": "OpenAI GPT models - Fast and reliable"
    }
  ],
  "default_provider": "openai"
}
```

---

### 2. 채팅 (질문 답변)

```bash
POST /api/v1/ai/chat
```

**요청 본문:**
```json
{
  "message": "Python의 데코레이터가 뭔가요?",
  "conversation_id": null,
  "provider": "openai",
  "temperature": 0.7
}
```

**응답:**
```json
{
  "conversation_id": 1,
  "message": {
    "id": 2,
    "role": "assistant",
    "content": "파이썬의 데코레이터는...",
    "tokens_used": 150,
    "created_at": "2025-01-01T10:00:00Z"
  },
  "provider": "openai",
  "model": "gpt-4o-mini",
  "tokens_used": 150
}
```

---

### 3. 코드 리뷰

```bash
POST /api/v1/ai/code-review
```

**요청 본문:**
```json
{
  "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
  "language": "python",
  "context": "재귀 함수 과제",
  "provider": "claude"
}
```

**응답:**
```json
{
  "review": "코드 분석:\n\n1. 정확성: ✅ 올바른 피보나치 구현...",
  "provider": "claude",
  "model": "claude-3-5-sonnet-20241022",
  "tokens_used": 350,
  "review_id": 1
}
```

---

### 4. 개념 설명

```bash
POST /api/v1/ai/explain
```

**요청 본문:**
```json
{
  "concept": "비동기 프로그래밍",
  "level": "beginner",
  "provider": "gemini"
}
```

**응답:**
```json
{
  "explanation": "비동기 프로그래밍은...",
  "provider": "gemini",
  "model": "gemini-1.5-flash",
  "tokens_used": 200
}
```

---

### 5. 퀴즈 생성

```bash
POST /api/v1/ai/generate-quiz
```

**요청 본문:**
```json
{
  "topic": "Python 리스트 컴프리헨션",
  "num_questions": 5,
  "difficulty": "medium",
  "question_types": ["multiple_choice", "short_answer"],
  "course_id": 1
}
```

**응답:**
```json
{
  "generation_id": 1,
  "questions": [
    {
      "type": "multiple_choice",
      "question": "다음 중 리스트 컴프리헨션의 올바른 문법은?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "...",
      "points": 1
    }
  ],
  "provider": "openai",
  "model": "gpt-4o-mini",
  "tokens_used": 500
}
```

---

### 6. 내용 요약

```bash
POST /api/v1/ai/summarize
```

**요청 본문:**
```json
{
  "content": "긴 학습 자료 텍스트...",
  "length": "medium"
}
```

**응답:**
```json
{
  "summary": "주요 내용 요약...",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "tokens_used": 100
}
```

---

### 7. 대화 내역 조회

```bash
GET /api/v1/ai/conversations
GET /api/v1/ai/conversations/{conversation_id}
```

---

### 8. 사용 통계

```bash
GET /api/v1/ai/usage/my-stats?days=30
```

**응답:**
```json
{
  "user_id": "user123",
  "total_requests": 150,
  "total_tokens": 50000,
  "requests_by_provider": {
    "openai": 100,
    "claude": 50
  },
  "requests_by_task": {
    "chat": 80,
    "code_review": 40,
    "generate_quiz": 30
  },
  "average_response_time_ms": 1250,
  "period_start": "2024-12-01T00:00:00Z",
  "period_end": "2025-01-01T00:00:00Z"
}
```

---

## 💡 사용 예시

### 예시 1: 학생이 코드 리뷰 요청

```python
import requests

# 코드 리뷰 요청
response = requests.post(
    "http://localhost:8000/api/v1/ai/code-review",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "code": """
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[0]
    left = [x for x in arr[1:] if x < pivot]
    right = [x for x in arr[1:] if x >= pivot]
    return quick_sort(left) + [pivot] + quick_sort(right)
        """,
        "language": "python",
        "context": "퀵소트 과제 제출",
        "provider": "claude"  # Claude가 코드 리뷰에 강함
    }
)

review = response.json()
print(review["review"])
```

---

### 예시 2: 강사가 퀴즈 생성

```python
# 퀴즈 자동 생성
response = requests.post(
    "http://localhost:8000/api/v1/ai/generate-quiz",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "topic": "자바스크립트 클로저",
        "num_questions": 10,
        "difficulty": "hard",
        "question_types": ["multiple_choice", "coding"],
        "course_id": 1,
        "provider": "openai"
    }
)

quiz_data = response.json()
for q in quiz_data["questions"]:
    print(f"Q: {q['question']}")
    print(f"Type: {q['type']}")
```

---

### 예시 3: 학생이 챗봇과 대화

```python
# 첫 질문
response = requests.post(
    "http://localhost:8000/api/v1/ai/chat",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "message": "React hooks에 대해 설명해주세요",
        "provider": "gemini"
    }
)

conversation_id = response.json()["conversation_id"]
print(response.json()["message"]["content"])

# 후속 질문 (같은 대화)
response = requests.post(
    "http://localhost:8000/api/v1/ai/chat",
    headers={"Authorization": "Bearer YOUR_TOKEN"},
    json={
        "message": "useState와 useEffect의 차이는?",
        "conversation_id": conversation_id
    }
)

print(response.json()["message"]["content"])
```

---

## 💰 비용 최적화 팁

### 1. 적절한 모델 선택
- **간단한 작업**: `gpt-4o-mini`, `gemini-1.5-flash`
- **복잡한 분석**: `claude-3-5-sonnet`, `gpt-4o`
- **코드 리뷰**: `claude-3-5-sonnet` (가장 우수)

### 2. Temperature 조정
- **정확한 답변 필요** (코드 리뷰, 퀴즈): `temperature=0.3`
- **창의적 설명** (개념 설명): `temperature=0.7`

### 3. 토큰 절약
```python
# 나쁜 예: 매번 전체 컨텍스트 전송
# 좋은 예: conversation_id 사용하여 서버에서 관리
```

### 4. 프로바이더 비교
```
작업별 추천 프로바이더:
- 코드 리뷰: Claude > OpenAI > Gemini
- 빠른 설명: Gemini Flash > GPT-4o-mini
- 복잡한 추론: Claude Opus > GPT-4o
- 가격: Gemini Flash < GPT-4o-mini < Claude Haiku
```

---

## 🔒 보안 고려사항

### 1. API 키 보안
```bash
# ❌ 절대 금지
git add .env

# ✅ .gitignore에 추가
echo ".env" >> .gitignore

# ✅ 환경 변수로 관리 (프로덕션)
export OPENAI_API_KEY=...
```

### 2. Rate Limiting
서버에서 자동으로 처리:
- API: 10 requests/초
- 일반: 100 requests/초

### 3. 사용량 모니터링
```python
# 자신의 사용 통계 확인
stats = requests.get(
    "http://localhost:8000/api/v1/ai/usage/my-stats?days=7",
    headers={"Authorization": "Bearer YOUR_TOKEN"}
).json()

print(f"이번 주 사용 토큰: {stats['total_tokens']}")
print(f"예상 비용: ${stats['total_tokens'] / 1000000 * 0.15:.2f}")
```

---

## 🚀 배포 시 체크리스트

- [ ] 최소 하나의 AI API 키 설정
- [ ] `DEFAULT_AI_PROVIDER` 설정
- [ ] API 키를 환경 변수로 관리
- [ ] `.env` 파일을 `.gitignore`에 추가
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 사용량 모니터링 대시보드 확인
- [ ] 비용 알람 설정 (각 프로바이더 콘솔)

---

## 📊 데이터베이스 마이그레이션

```bash
# AI 기능을 위한 테이블 생성
cd backend
source venv/bin/activate
alembic upgrade head
```

**생성되는 테이블:**
- `ai_conversations` - 대화 세션
- `ai_messages` - 메시지 내역
- `ai_code_reviews` - 코드 리뷰 기록
- `ai_quiz_generations` - 퀴즈 생성 기록
- `ai_usage_logs` - 사용량 로그 (분석/과금)

---

## 🆘 문제 해결

### API 키 오류
```
ValueError: API key not found for provider: openai
```
**해결:** `.env` 파일에 `OPENAI_API_KEY` 추가

### 타임아웃 에러
```
httpx.ReadTimeout
```
**해결:** 네트워크 확인, 또는 다른 프로바이더 시도

### 토큰 초과
```
Error: Token limit exceeded
```
**해결:** `max_tokens` 값 조정 (기본 2000)

---

## 📚 추가 리소스

- **OpenAI Docs**: https://platform.openai.com/docs
- **Claude Docs**: https://docs.anthropic.com/
- **Gemini Docs**: https://ai.google.dev/docs
- **OpenRouter Docs**: https://openrouter.ai/docs

---

**작성일:** 2025-01-01
**버전:** 1.0.0
**문의:** AI 기능 관련 문의는 GitHub Issues로 부탁드립니다.
