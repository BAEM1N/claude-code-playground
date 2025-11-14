# AI 어시스턴트 사용 가이드

## 📚 목차
1. [개요](#개요)
2. [시작하기](#시작하기)
3. [주요 기능](#주요-기능)
4. [사용 방법](#사용-방법)
5. [API 키 설정](#api-키-설정)
6. [비용 관리](#비용-관리)
7. [문제 해결](#문제-해결)

---

## 개요

AI 어시스턴트는 학습을 돕기 위한 강력한 도구로, 다음 4가지 주요 기능을 제공합니다:

- **💬 채팅**: AI와 자유롭게 대화하며 프로그래밍 관련 질문에 답을 얻습니다
- **🔍 코드 리뷰**: 작성한 코드를 AI가 분석하고 개선 방안을 제안합니다
- **💡 개념 설명**: 어려운 프로그래밍 개념을 난이도별로 쉽게 설명받습니다
- **📝 퀴즈 생성**: 주제에 맞는 맞춤형 퀴즈를 AI가 자동으로 생성합니다

### 지원하는 AI 모델

- **OpenAI**: GPT-4o, GPT-4o-mini (빠르고 저렴)
- **Claude**: Claude 3.5 Sonnet, Claude 3.5 Haiku
- **Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **OpenRouter**: 여러 모델을 하나의 API로 사용

---

## 시작하기

### 접속 방법

1. **전역 AI 어시스턴트**: `/ai-assistant`
2. **코스별 AI 어시스턴트**: `/courses/:courseId/ai-assistant`

### 첫 사용 시 준비사항

1. 관리자가 최소 1개 이상의 AI 제공자 API 키를 설정해야 합니다
2. `.env` 파일에서 다음 변수들을 설정합니다:
   ```bash
   DEFAULT_AI_PROVIDER=openai
   OPENAI_API_KEY=sk-proj-...
   ```

---

## 주요 기능

### 1. 💬 AI 채팅

**용도**: 프로그래밍 관련 질문, 문제 해결, 학습 지원

**특징**:
- 실시간 대화 형식
- 대화 기록 자동 저장
- 여러 대화 세션 관리
- 코스별 컨텍스트 지원

**예시 질문**:
```
- Python에서 리스트와 튜플의 차이점은 무엇인가요?
- 이 에러 메시지가 무슨 의미인가요?
- React Hook의 동작 원리를 설명해주세요
```

### 2. 🔍 코드 리뷰

**용도**: 코드 품질 개선, 버그 발견, 최적화 제안

**지원 언어**:
- Python, JavaScript, TypeScript
- Java, C++, C, Go, Rust
- Ruby, PHP

**리뷰 항목**:
- ✅ 코드 품질 및 가독성
- ✅ 잠재적 버그 및 에러
- ✅ 성능 최적화 방안
- ✅ 베스트 프랙티스 준수 여부
- ✅ 보안 이슈

**사용 예시**:
```python
# 리뷰받을 코드
def calculate_sum(numbers):
    total = 0
    for i in range(len(numbers)):
        total = total + numbers[i]
    return total

# 추가 정보: "초보자가 작성한 코드입니다. 더 나은 방법이 있나요?"
```

**피드백 기능**:
- 리뷰가 도움이 되었다면 👍 버튼을 눌러주세요
- AI가 계속 학습하고 개선하는 데 도움이 됩니다

### 3. 💡 개념 설명

**용도**: 프로그래밍 개념, 알고리즘, 디자인 패턴 학습

**난이도 선택**:
- **초급**: 기초부터 쉽게 설명 (처음 배우는 사람)
- **중급**: 개념과 활용법 설명 (기본을 아는 사람)
- **고급**: 심화 개념 및 내부 동작 설명 (깊이 이해하고 싶은 사람)

**설명 요청 예시**:
```
개념: "Python 데코레이터"
난이도: 중급
추가 맥락: "함수를 수정하지 않고 기능을 추가하고 싶습니다"
```

### 4. 📝 퀴즈 생성

**용도**: 학습 평가, 시험 준비, 복습

**문제 유형**:
- 객관식 (Multiple Choice)
- 주관식 (Short Answer)
- O/X (True/False)
- 코딩 (Coding)

**난이도 설정**:
- 🟢 쉬움: 기초 개념 확인
- 🟡 보통: 응용 문제
- 🔴 어려움: 심화 문제

**생성 예시**:
```
주제: "Python 리스트와 딕셔너리"
문제 개수: 5개
난이도: 보통
문제 유형: 객관식, 주관식
```

**생성된 퀴즈 활용**:
- 정답 및 해설 확인 가능
- 예시 답안 제공 (주관식/코딩 문제)
- 핵심 포인트 요약

---

## 사용 방법

### 채팅 사용하기

1. AI 어시스턴트 페이지에서 **채팅** 탭 선택
2. 원하는 AI 모델 선택 (우측 상단)
3. 메시지 입력 후 **전송** 버튼 클릭
4. AI 응답 확인
5. 대화 계속 이어가기

**팁**:
- Shift + Enter: 줄바꿈
- Enter: 메시지 전송
- 이전 대화를 이어가려면 대화 목록에서 선택

### 코드 리뷰 받기

1. **코드 리뷰** 탭 선택
2. 프로그래밍 언어 선택
3. 코드 입력
4. (선택) 추가 정보 입력 (코드 목적, 확인받고 싶은 부분)
5. **코드 리뷰 받기** 버튼 클릭
6. 리뷰 결과 확인
7. 도움이 되었다면 피드백 제출 (👍/👎)

### 개념 설명 받기

1. **개념 설명** 탭 선택
2. 설명받고 싶은 개념 입력
3. 난이도 선택 (초급/중급/고급)
4. (선택) 추가 맥락 입력
5. **설명 받기** 버튼 클릭
6. 설명 읽기

### 퀴즈 생성하기

1. **퀴즈 생성** 탭 선택
2. 퀴즈 주제 입력
3. 문제 개수 설정 (1-20개)
4. 난이도 선택
5. 문제 유형 선택 (복수 선택 가능)
6. **퀴즈 생성** 버튼 클릭
7. 생성된 문제 확인
8. 정답 및 해설 보기 (펼치기/접기)

---

## API 키 설정

### 관리자용 - 백엔드 설정

`backend/.env` 파일에 다음 내용 추가:

```bash
# 기본 AI 제공자 설정
DEFAULT_AI_PROVIDER=openai

# OpenAI (추천 - 가장 안정적)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# Anthropic Claude (고품질 응답)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Google Gemini (무료 티어 제공)
GOOGLE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxx

# OpenRouter (여러 모델 한 번에)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
```

### API 키 발급 방법

#### OpenAI
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 이름 입력 후 생성
4. 생성된 키 복사 (한 번만 표시됨!)

#### Claude (Anthropic)
1. https://console.anthropic.com/ 접속
2. "API Keys" 메뉴 선택
3. "Create Key" 클릭
4. 생성된 키 복사

#### Gemini (Google)
1. https://makersuite.google.com/app/apikey 접속
2. "Get API key" 클릭
3. 새 프로젝트 생성 또는 기존 프로젝트 선택
4. API 키 복사

#### OpenRouter
1. https://openrouter.ai/keys 접속
2. "Create Key" 클릭
3. 키 이름 및 한도 설정
4. 생성된 키 복사

---

## 비용 관리

### 모델별 비용 비교 (2024년 기준)

| 모델 | Input (1M tokens) | Output (1M tokens) | 속도 | 추천 용도 |
|------|------------------|-------------------|------|---------|
| GPT-4o-mini | $0.15 | $0.60 | ⚡ 빠름 | 일반 질문, 코드리뷰 |
| GPT-4o | $2.50 | $10.00 | 🐢 보통 | 복잡한 문제 |
| Claude 3.5 Haiku | $0.80 | $4.00 | ⚡⚡ 매우 빠름 | 실시간 채팅 |
| Claude 3.5 Sonnet | $3.00 | $15.00 | 🐢 느림 | 고품질 코드리뷰 |
| Gemini 1.5 Flash | $0.075 | $0.30 | ⚡⚡ 매우 빠름 | 비용 절감 |
| Gemini 1.5 Pro | $1.25 | $5.00 | 🐢 보통 | 균형잡힌 성능 |

### 비용 절감 팁

1. **적절한 모델 선택**:
   - 간단한 질문: GPT-4o-mini, Gemini Flash
   - 복잡한 문제: GPT-4o, Claude Sonnet

2. **토큰 사용 최적화**:
   - 불필요하게 긴 코드 붙여넣기 지양
   - 핵심 부분만 리뷰 요청
   - 대화 기록이 너무 길어지면 새 대화 시작

3. **사용량 모니터링**:
   - AI 어시스턴트 페이지에서 사용 통계 확인
   - 일일/주간/월간 사용량 추적
   - 한도 설정 (OpenRouter 추천)

### 사용량 확인

프론트엔드에서 제공되는 기능:
```typescript
// 내 사용 통계 (최근 30일)
GET /api/v1/ai/usage/my-stats?days=30

// 코스별 사용 통계
GET /api/v1/ai/usage/course/:courseId?days=30
```

응답 예시:
```json
{
  "total_requests": 150,
  "total_tokens": 45000,
  "requests_by_provider": {
    "openai": 100,
    "claude": 50
  },
  "requests_by_task": {
    "chat": 80,
    "code_review": 40,
    "explain_concept": 20,
    "generate_quiz": 10
  },
  "average_response_time_ms": 1500
}
```

---

## 문제 해결

### 자주 발생하는 문제

#### 1. "AI 제공자를 사용할 수 없습니다"

**원인**: API 키가 설정되지 않았거나 잘못됨

**해결**:
```bash
# backend/.env 파일 확인
OPENAI_API_KEY=sk-proj-...  # 키가 올바른지 확인
DEFAULT_AI_PROVIDER=openai  # 설정된 제공자와 일치하는지 확인
```

#### 2. "요청이 너무 많습니다 (Rate Limited)"

**원인**: API 사용량 한도 초과

**해결**:
- 잠시 기다렸다가 다시 시도
- 다른 AI 제공자로 전환
- OpenRouter 사용 (여러 모델 자동 라우팅)

#### 3. "토큰 한도 초과"

**원인**: 입력 텍스트가 너무 김

**해결**:
- 코드를 여러 부분으로 나누어 리뷰 요청
- 핵심 부분만 선택해서 전송
- 더 큰 컨텍스트를 지원하는 모델 사용 (Gemini 1.5 Pro)

#### 4. "응답이 너무 느립니다"

**원인**: 선택한 모델이 느리거나 서버 부하

**해결**:
- 빠른 모델로 전환 (GPT-4o-mini, Gemini Flash, Claude Haiku)
- 입력 텍스트 줄이기
- 네트워크 연결 확인

### 백엔드 로그 확인

```bash
# FastAPI 로그 확인
cd backend
tail -f logs/app.log

# AI 사용 로그만 필터링
tail -f logs/app.log | grep "AI"
```

### 데이터베이스 확인

```bash
# SQLite (개발 환경)
sqlite3 app.db

# 최근 AI 사용 기록 확인
SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 10;

# 사용자별 토큰 사용량
SELECT user_id, SUM(tokens_used) as total_tokens
FROM ai_usage_logs
GROUP BY user_id
ORDER BY total_tokens DESC;
```

---

## 모범 사례

### 효과적인 질문 방법

**❌ 나쁜 예**:
```
"코드가 안돼요"
```

**✅ 좋은 예**:
```
"Python에서 리스트를 정렬하려고 하는데 TypeError가 발생합니다.
코드: numbers.sort()
에러: TypeError: '<' not supported between instances of 'str' and 'int'
원인이 무엇인가요?"
```

### 코드 리뷰 요청 시

**포함할 내용**:
- 코드의 목적
- 현재 문제점 또는 의문점
- 특별히 확인받고 싶은 부분

**예시**:
```
언어: Python
코드: [여기에 코드 붙여넣기]
추가 정보: "데이터베이스에서 사용자 정보를 조회하는 함수입니다.
보안 이슈가 있는지 확인해주세요."
```

### 개념 학습 시

**단계적 학습**:
1. 초급으로 기본 개념 파악
2. 중급으로 활용법 학습
3. 고급으로 심화 내용 이해

**추가 맥락 제공**:
- 현재 수준 (초보자, 경험자 등)
- 학습 목적 (시험 준비, 프로젝트 적용 등)
- 관련 배경 지식

---

## 개발자 가이드

### 컴포넌트 재사용

```typescript
// 코드 리뷰 컴포넌트를 다른 페이지에 임베드
import { CodeReview } from '@/components/ai';

function AssignmentSubmissionPage() {
  return (
    <div>
      <h1>과제 제출</h1>
      <CodeReview
        initialCode={submissionCode}
        submissionId={123}
        onReviewComplete={(review) => {
          // 리뷰 완료 후 처리
          console.log('Review:', review);
        }}
      />
    </div>
  );
}
```

### API 직접 호출

```typescript
import { aiAPI } from '@/services/api';

// 채팅
const response = await aiAPI.chat({
  message: "Python 데코레이터 설명해주세요",
  provider: "openai",
  temperature: 0.7
});

// 코드 리뷰
const review = await aiAPI.reviewCode({
  code: "def hello(): print('world')",
  language: "python",
  context: "간단한 함수입니다"
});
```

### React Query Hook 사용

```typescript
import { useAIChat, useCodeReview } from '@/hooks/useAI';

function MyComponent() {
  const chatMutation = useAIChat();
  const reviewMutation = useCodeReview();

  const handleSendMessage = async () => {
    const response = await chatMutation.mutateAsync({
      message: "안녕하세요",
      provider: "openai"
    });
    console.log(response.message.content);
  };

  return (
    <button onClick={handleSendMessage}>
      {chatMutation.isLoading ? '전송 중...' : '메시지 보내기'}
    </button>
  );
}
```

---

## 추가 리소스

- [OpenAI API 문서](https://platform.openai.com/docs)
- [Claude API 문서](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Gemini API 문서](https://ai.google.dev/docs)
- [OpenRouter 문서](https://openrouter.ai/docs)

---

## 지원

문제가 해결되지 않으면:
1. GitHub Issues에 문제 등록
2. 관리자에게 문의
3. 로그 파일 첨부 (`logs/app.log`)
