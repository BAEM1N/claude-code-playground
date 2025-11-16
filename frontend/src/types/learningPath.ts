/**
 * Types for Learning Path features
 */

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum PathItemType {
  COURSE = 'course',
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
  RESOURCE = 'resource',
}

export interface LearningPathItem {
  id: number;
  learning_path_id: number;
  item_type: PathItemType;
  item_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_required: boolean;
  estimated_hours?: number;
  prerequisites?: number[];
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: number;
  title: string;
  description?: string;
  difficulty_level: DifficultyLevel;
  estimated_hours?: number;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface LearningPathDetail extends LearningPath {
  items: LearningPathItem[];
  total_items: number;
  required_items: number;
}

export interface UserPathItemProgress {
  id: number;
  user_id: number;
  path_item_id: number;
  status: ProgressStatus;
  score?: number;
  started_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLearningProgress {
  id: number;
  user_id: number;
  learning_path_id: number;
  status: ProgressStatus;
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
  last_accessed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningPathItemWithProgress extends LearningPathItem {
  user_progress?: UserPathItemProgress;
  is_locked: boolean;
}

export interface LearningPathWithProgress extends LearningPathDetail {
  user_progress?: UserLearningProgress;
  items_with_progress: LearningPathItemWithProgress[];
}

export interface LearningPathRecommendation {
  learning_path: LearningPath;
  recommendation_score: number;
  recommendation_reason: string;
  matching_tags: string[];
  user_progress?: UserLearningProgress;
}

export interface RecommendationsResponse {
  recommendations: LearningPathRecommendation[];
  total: number;
  user_completed_paths: number;
  user_in_progress_paths: number;
}

export interface EnrollmentRequest {
  learning_path_id: number;
}

export interface EnrollmentResponse {
  success: boolean;
  message: string;
  user_progress: UserLearningProgress;
}

export interface UserLearningStats {
  total_paths_enrolled: number;
  total_paths_completed: number;
  total_paths_in_progress: number;
  total_items_completed: number;
  total_learning_hours: number;
  completion_rate: number;
  recent_activity: Array<{
    path_id: number;
    path_title: string;
    status: ProgressStatus;
    progress: number;
    last_accessed?: string;
  }>;
}

export interface LearningPathCreateRequest {
  title: string;
  description?: string;
  difficulty_level?: DifficultyLevel;
  estimated_hours?: number;
  icon?: string;
  color?: string;
  is_active?: boolean;
  tags?: string[];
  items?: Array<{
    item_type: PathItemType;
    item_id: number;
    title: string;
    description?: string;
    order_index: number;
    is_required?: boolean;
    estimated_hours?: number;
    prerequisites?: number[];
  }>;
}

export interface UserPathItemProgressUpdate {
  status: ProgressStatus;
  score?: number;
  notes?: string;
}
