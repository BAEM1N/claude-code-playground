/**
 * Types for Coding Environment
 */

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ProgrammingLanguage {
  PYTHON = 'python',
  JAVASCRIPT = 'javascript',
  JAVA = 'java',
  CPP = 'cpp',
  C = 'c',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

export enum ExecutionStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

export interface TestCase {
  id: number;
  problem_id: number;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  is_hidden: boolean;
  points: number;
  order_index: number;
  description?: string;
  created_at: string;
}

export interface CodingProblem {
  id: number;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  language: ProgrammingLanguage;
  starter_code?: string;
  time_limit: number;
  memory_limit: number;
  tags?: string[];
  hints?: string[];
  is_public: boolean;
  course_id?: number;
  assignment_id?: number;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CodingProblemDetail extends CodingProblem {
  test_cases: TestCase[];
  sample_test_cases: TestCase[];
  total_submissions: number;
  user_best_submission?: CodeSubmission;
}

export interface CodeExecutionRequest {
  code: string;
  language: ProgrammingLanguage;
  input_data?: string;
}

export interface CodeExecutionResponse {
  id: number;
  output?: string;
  error?: string;
  execution_time?: number;
  memory_used?: number;
  status: ExecutionStatus;
  executed_at: string;
}

export interface CodeSubmissionRequest {
  problem_id: number;
  code: string;
  language: ProgrammingLanguage;
}

export interface TestCaseResult {
  test_case_id: number;
  passed: boolean;
  input_data: string;
  expected_output: string;
  actual_output?: string;
  execution_time?: number;
  error?: string;
  points: number;
  earned_points: number;
}

export interface CodeSubmission {
  id: number;
  problem_id: number;
  user_id: number;
  code: string;
  language: string;
  status: SubmissionStatus;
  score?: number;
  total_test_cases?: number;
  passed_test_cases?: number;
  execution_time?: number;
  memory_used?: number;
  error_message?: string;
  output?: string;
  test_results?: any[];
  submitted_at: string;
}

export interface CodeSubmissionDetail extends CodeSubmission {
  test_case_results: TestCaseResult[];
}

export interface SavedCode {
  id: number;
  user_id: number;
  problem_id?: number;
  title: string;
  code: string;
  language: ProgrammingLanguage;
  is_favorite: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCodingStatistics {
  total_submissions: number;
  problems_solved: number;
  problems_attempted: number;
  total_execution_time: number;
  favorite_language?: string;
  difficulty_breakdown: Record<string, number>;
  recent_submissions: CodeSubmission[];
}
