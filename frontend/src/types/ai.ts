/**
 * AI Assistant Types
 */

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'openrouter';
export type AITaskType =
  | 'code_review'
  | 'explain_concept'
  | 'generate_quiz'
  | 'summarize'
  | 'answer_question'
  | 'chat'
  | 'custom';

export type MessageRole = 'system' | 'user' | 'assistant';

export interface AIMessage {
  id: number;
  role: MessageRole;
  content: string;
  tokens_used?: number;
  created_at: string;
}

export interface AIConversation {
  id: number;
  user_id: string;
  course_id?: number;
  title?: string;
  task_type: AITaskType;
  provider: AIProvider;
  model: string;
  message_count: number;
  created_at: string;
  updated_at?: string;
}

export interface AIConversationDetail extends AIConversation {
  messages: AIMessage[];
}

// Chat request/response
export interface ChatRequest {
  message: string;
  conversation_id?: number;
  course_id?: number;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
}

export interface ChatResponse {
  conversation_id: number;
  message: AIMessage;
  provider: AIProvider;
  model: string;
  tokens_used?: number;
}

// Code review
export interface CodeReviewRequest {
  code: string;
  language?: string;
  context?: string;
  submission_id?: number;
  provider?: AIProvider;
  model?: string;
}

export interface CodeReviewResponse {
  review: string;
  provider: AIProvider;
  model: string;
  tokens_used?: number;
  review_id?: number;
}

export interface CodeReviewFeedback {
  review_id: number;
  was_helpful: boolean;
}

// Concept explanation
export interface ExplainConceptRequest {
  concept: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  context?: string;
  provider?: AIProvider;
  model?: string;
}

export interface ExplainConceptResponse {
  explanation: string;
  provider: AIProvider;
  model: string;
  tokens_used?: number;
}

// Quiz generation
export interface QuizGenerationRequest {
  topic: string;
  num_questions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  question_types?: ('multiple_choice' | 'short_answer' | 'true_false' | 'coding')[];
  course_id: number;
  provider?: AIProvider;
  model?: string;
}

export interface QuizQuestion {
  type: string;
  question: string;
  options?: string[];
  correct_answer?: string;
  sample_answer?: string;
  key_points?: string[];
  explanation?: string;
  points: number;
}

export interface QuizGenerationResponse {
  generation_id: number;
  questions: QuizQuestion[];
  provider: AIProvider;
  model: string;
  tokens_used?: number;
}

// Summarization
export interface SummarizeRequest {
  content: string;
  length?: 'short' | 'medium' | 'long';
  provider?: AIProvider;
  model?: string;
}

export interface SummarizeResponse {
  summary: string;
  provider: AIProvider;
  model: string;
  tokens_used?: number;
}

// Usage statistics
export interface UsageStats {
  total_requests: number;
  total_tokens: number;
  requests_by_provider: Record<string, number>;
  requests_by_task: Record<string, number>;
  average_response_time_ms?: number;
}

export interface UserUsageStats extends UsageStats {
  user_id: string;
  period_start: string;
  period_end: string;
}

export interface CourseUsageStats extends UsageStats {
  course_id: number;
  period_start: string;
  period_end: string;
}

// AI Provider info
export interface AIProviderInfo {
  provider: AIProvider;
  models: string[];
  is_available: boolean;
  description: string;
}

export interface AIProvidersListResponse {
  providers: AIProviderInfo[];
  default_provider: AIProvider;
}
