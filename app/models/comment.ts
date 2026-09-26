export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface CreateCommentInput {
  postId: string;
  userId: string;
  authorName: string;
  content: string;
}

export interface CommentValidationResult {
  valid: boolean;
  error?: string;
}

export const COMMENT_MAX_LENGTH = 500;

export function validateCommentInput(content: string): CommentValidationResult {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Comment cannot be empty." };
  }

  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      valid: false,
      error: `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`,
    };
  }

  return { valid: true };
}