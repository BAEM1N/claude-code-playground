export enum CompetitionType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
}

export enum EvaluationMetric {
  ACCURACY = 'accuracy',
  F1_SCORE = 'f1',
  RMSE = 'rmse',
  MAE = 'mae',
  AUC = 'auc',
  LOG_LOSS = 'logloss',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum MemberStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface Competition {
  id: number;
  title: string;
  description?: string;
  competition_type: CompetitionType;
  evaluation_metric: EvaluationMetric;
  start_date: string;
  end_date: string;
  max_team_size?: number;
  max_submissions_per_day: number;
  prize_description?: string;
  rules?: string;
  train_data_path: string;
  test_data_path: string;
  sample_submission_path?: string;
  public_test_percentage: number;
  is_active: boolean;
  participant_count: number;
  submission_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CompetitionTeam {
  id: number;
  competition_id: number;
  name: string;
  description?: string;
  leader_id: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  status: MemberStatus;
  role: string;
  joined_at?: string;
  created_at: string;
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface CompetitionParticipant {
  id: number;
  competition_id: number;
  user_id: number;
  team_id?: number;
  joined_at: string;
}

export interface CompetitionSubmission {
  id: number;
  competition_id: number;
  participant_id: number;
  team_id?: number;
  submission_number: number;
  file_path: string;
  public_score?: number;
  private_score?: number;
  status: SubmissionStatus;
  error_message?: string;
  submitted_at: string;
  processed_at?: string;
}

export interface CompetitionLeaderboardEntry {
  rank_public?: number;
  rank_private?: number;
  participant_id?: number;
  team_id?: number;
  user_id?: number;
  team_name?: string;
  user_email?: string;
  best_public_score: number;
  best_private_score?: number;
  submission_count: number;
  last_submission_at: string;
}

export interface CompetitionStatistics {
  total_competitions: number;
  active_competitions: number;
  total_participants: number;
  total_submissions: number;
  total_teams: number;
}

export interface CreateCompetitionData {
  title: string;
  description?: string;
  competition_type: CompetitionType;
  evaluation_metric: EvaluationMetric;
  start_date: string;
  end_date: string;
  max_team_size?: number;
  max_submissions_per_day?: number;
  prize_description?: string;
  rules?: string;
  public_test_percentage?: number;
}

export interface CreateTeamData {
  competition_id: number;
  name: string;
  description?: string;
}

export interface InviteMemberData {
  team_id: number;
  user_id: number;
}

export interface PaginatedCompetitionsResponse {
  competitions: Competition[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PaginatedSubmissionsResponse {
  submissions: CompetitionSubmission[];
  total: number;
  page: number;
  per_page: number;
}
