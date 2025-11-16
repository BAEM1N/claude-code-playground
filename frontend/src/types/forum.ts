export enum PostType {
  DISCUSSION = 'discussion',
  QUESTION = 'question',
}

export enum VoteType {
  UPVOTE = 'upvote',
  DOWNVOTE = 'downvote',
}

export interface Forum {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order_index: number;
  is_active: boolean;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: number;
  forum_id: number;
  user_id: number;
  title: string;
  content: string;
  post_type: PostType;
  is_pinned: boolean;
  is_locked: boolean;
  is_solved: boolean;
  view_count: number;
  vote_count: number;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  user_vote?: VoteType;
  is_bookmarked: boolean;
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface ForumReply {
  id: number;
  post_id: number;
  user_id: number;
  parent_reply_id?: number;
  content: string;
  is_best_answer: boolean;
  vote_count: number;
  created_at: string;
  updated_at: string;
  user_vote?: VoteType;
  user?: {
    id: number;
    email: string;
    role: string;
  };
  child_replies: ForumReply[];
}

export interface ForumTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  post_count: number;
  created_at: string;
}

export interface PaginatedPostsResponse {
  posts: ForumPost[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ForumStatistics {
  total_forums: number;
  total_posts: number;
  total_replies: number;
  total_users: number;
  total_questions: number;
  solved_questions: number;
  solve_rate: number;
}

export interface UserForumStats {
  posts_created: number;
  replies_created: number;
  best_answers: number;
  total_votes_received: number;
  reputation_score: number;
  bookmarks_count: number;
}

export interface CreatePostData {
  forum_id: number;
  title: string;
  content: string;
  post_type: PostType;
  tags?: string[];
}

export interface CreateReplyData {
  post_id: number;
  content: string;
  parent_reply_id?: number;
}
